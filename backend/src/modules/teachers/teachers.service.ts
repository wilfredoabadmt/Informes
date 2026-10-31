import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PasswordService } from '../auth/password.service';
import { AuditService } from '../audit/audit.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { LinkTeacherDto } from './dto/link-teacher.dto';
import { UpdateLinkStatusDto } from './dto/update-link-status.dto';
import { QueryInstitutionTeachersDto } from './dto/query-institution-teachers.dto';
import {
  RolGlobal,
  RolInstitucional,
  EstadoUsuario,
  EstadoVinculacion,
  TipoAuditoria,
} from '@prisma/client';

@Injectable()
export class TeachersService {
  private readonly logger = new Logger(TeachersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Alta de maestro en el Padrón Nacional (Nivel 1: Administración Central).
   */
  async createTeacher(
    dto: CreateTeacherDto,
    adminUserId: string,
    ip?: string,
    userAgent?: string,
  ) {
    const trimmedRda = dto.rda.trim();
    const trimmedCi = dto.ci.trim();
    const trimmedEmail = dto.email.trim().toLowerCase();

    // 1. Validar unicidad del RDA
    const existingRda = await this.prisma.maestro.findUnique({
      where: { rda: trimmedRda },
    });
    if (existingRda) {
      throw new ConflictException(
        `El código RDA '${trimmedRda}' ya se encuentra registrado por otro docente en el sistema.`,
      );
    }

    // 2. Gestionar Persona (Reutilizar si ya existe por CI)
    let persona = await this.prisma.persona.findUnique({
      where: { ci: trimmedCi },
    });

    if (!persona) {
      persona = await this.prisma.persona.create({
        data: {
          ci: trimmedCi,
          complemento: dto.complemento?.trim() || null,
          nombres: dto.nombres.trim(),
          primerApellido: dto.primerApellido.trim(),
          segundoApellido: dto.segundoApellido?.trim() || null,
          telefono: dto.telefono?.trim() || null,
        },
      });
    }

    // 3. Gestionar Usuario de acceso
    let usuario = await this.prisma.usuario.findUnique({
      where: { personaId: persona.id },
    });

    if (!usuario) {
      const emailInUse = await this.prisma.usuario.findUnique({
        where: { email: trimmedEmail },
      });
      if (emailInUse) {
        throw new ConflictException(
          `El correo '${trimmedEmail}' ya se encuentra asociado a otra cuenta de usuario.`,
        );
      }

      const passwordHash = await this.passwordService.hash(
        dto.passwordInicial || 'Bolivia2026!',
      );

      usuario = await this.prisma.usuario.create({
        data: {
          personaId: persona.id,
          email: trimmedEmail,
          passwordHash,
          rolGlobal: RolGlobal.INSTITUTIONAL_USER,
          estado: EstadoUsuario.ACTIVO,
        },
      });
    }

    // 4. Crear expediente de Maestro
    const maestro = await this.prisma.maestro.create({
      data: {
        personaId: persona.id,
        rda: trimmedRda,
        tituloProfesional: dto.tituloProfesional?.trim() || null,
        especialidad: dto.especialidad?.trim() || null,
        anioEgreso: dto.anioEgreso || null,
        normalista: dto.normalista !== undefined ? dto.normalista : true,
      },
    });

    // 5. Auditoría
    await this.auditService.log({
      usuarioId: adminUserId,
      tipo: TipoAuditoria.USER_CREATE,
      accion: 'ALTA_MAESTRO_PADRON_NACIONAL',
      detalle: {
        maestroId: maestro.id,
        rda: maestro.rda,
        ci: persona.ci,
        nombreCompleto: `${persona.nombres} ${persona.primerApellido}`,
      },
      ip,
      userAgent,
    });

    return {
      id: maestro.id,
      rda: maestro.rda,
      persona: {
        ci: persona.ci,
        nombres: persona.nombres,
        primerApellido: persona.primerApellido,
        segundoApellido: persona.segundoApellido,
      },
      email: usuario.email,
    };
  }

  /**
   * Búsqueda ágil de docentes registrados por CI o RDA para directores (Niveles 1 y 2).
   */
  async searchTeachers(query: string) {
    const q = (query || '').trim();
    if (q.length < 2) {
      return [];
    }

    const maestros = await this.prisma.maestro.findMany({
      where: {
        OR: [
          { rda: { contains: q, mode: 'insensitive' } },
          { persona: { ci: { contains: q } } },
          { persona: { nombres: { contains: q, mode: 'insensitive' } } },
          { persona: { primerApellido: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: {
        persona: true,
      },
      take: 20,
    });

    return maestros.map((m) => ({
      id: m.id,
      rda: m.rda,
      ci: m.persona.ci,
      nombreCompleto: `${m.persona.nombres} ${m.persona.primerApellido} ${m.persona.segundoApellido || ''}`.trim(),
      especialidad: m.especialidad,
      tituloProfesional: m.tituloProfesional,
      normalista: m.normalista,
    }));
  }

  /**
   * Vinculación de un maestro a la institución en sesión (Nivel 2: Director / Admin Institucional).
   */
  async linkTeacherToInstitution(
    institutionId: string,
    dto: LinkTeacherDto,
    directorUserId: string,
    ip?: string,
    userAgent?: string,
  ) {
    const trimmedId = dto.identifier.trim();

    // 1. Localizar maestro por RDA o CI
    const maestro = await this.prisma.maestro.findFirst({
      where: {
        OR: [
          { rda: trimmedId },
          { persona: { ci: trimmedId } },
        ],
      },
      include: {
        persona: {
          include: {
            usuario: true,
          },
        },
      },
    });

    if (!maestro || !maestro.persona.usuario) {
      throw new NotFoundException(
        `No se encontró ningún maestro registrado con el identificador '${dto.identifier}'.`,
      );
    }

    const usuarioId = maestro.persona.usuario.id;

    // 2. Verificar si ya existe vinculación con ese rol
    const existingLink = await this.prisma.vinculacionInstitucional.findUnique({
      where: {
        institucionId_usuarioId_rolInstitucional: {
          institucionId: institutionId,
          usuarioId,
          rolInstitucional: dto.rolInstitucional,
        },
      },
    });

    if (existingLink && existingLink.estado === EstadoVinculacion.ACTIVO) {
      throw new ConflictException(
        `El docente ya se encuentra activamente vinculado a esta Unidad Educativa con el rol '${dto.rolInstitucional}'.`,
      );
    }

    // 3. Crear o reactivar vinculación
    const fechaInicio = dto.fechaInicio ? new Date(dto.fechaInicio) : new Date();

    const vinculacion = await this.prisma.vinculacionInstitucional.upsert({
      where: {
        institucionId_usuarioId_rolInstitucional: {
          institucionId: institutionId,
          usuarioId,
          rolInstitucional: dto.rolInstitucional,
        },
      },
      update: {
        maestroId: maestro.id,
        cargoOficial: dto.cargoOficial?.trim() || null,
        fechaInicio,
        fechaFin: null,
        estado: EstadoVinculacion.ACTIVO,
      },
      create: {
        institucionId: institutionId,
        usuarioId,
        maestroId: maestro.id,
        rolInstitucional: dto.rolInstitucional,
        cargoOficial: dto.cargoOficial?.trim() || null,
        fechaInicio,
        estado: EstadoVinculacion.ACTIVO,
      },
    });

    // 4. Auditoría
    await this.auditService.log({
      usuarioId: directorUserId,
      institucionId: institutionId,
      tipo: TipoAuditoria.TEACHER_LINK,
      accion: 'VINCULACION_DOCENTE_INSTITUCIONAL',
      detalle: {
        maestroRda: maestro.rda,
        usuarioId,
        rolInstitucional: dto.rolInstitucional,
        cargoOficial: dto.cargoOficial,
      },
      ip,
      userAgent,
    });

    return {
      message: `Maestro ${maestro.persona.nombres} ${maestro.persona.primerApellido} vinculado exitosamente.`,
      vinculacionId: vinculacion.id,
      estado: vinculacion.estado,
      rolInstitucional: vinculacion.rolInstitucional,
    };
  }

  /**
   * Retorna la plantilla docente de la institución activa (Nivel 2).
   */
  async getInstitutionTeachers(
    institutionId: string,
    query: QueryInstitutionTeachersDto,
  ) {
    // Usar el contexto tenant con RLS
    return this.prisma.withTenantContext(institutionId, async (tx) => {
      const where: any = {
        institucionId: institutionId,
        rolInstitucional: {
          in: [RolInstitucional.MAESTRO, RolInstitucional.COMISION_PEDAGOGICA],
        },
      };

      if (query.estado) {
        where.estado = query.estado;
      }

      if (query.q) {
        const q = query.q.trim();
        where.OR = [
          { maestro: { rda: { contains: q, mode: 'insensitive' } } },
          { usuario: { persona: { ci: { contains: q } } } },
          { usuario: { persona: { nombres: { contains: q, mode: 'insensitive' } } } },
          { usuario: { persona: { primerApellido: { contains: q, mode: 'insensitive' } } } },
        ];
      }

      const vinculaciones = await tx.vinculacionInstitucional.findMany({
        where,
        include: {
          maestro: true,
          usuario: {
            include: {
              persona: true,
            },
          },
        },
        orderBy: {
          usuario: {
            persona: {
              primerApellido: 'asc',
            },
          },
        },
      });

      return vinculaciones.map((v) => ({
        vinculacionId: v.id,
        maestroId: v.maestroId,
        rda: v.maestro?.rda || 'S/RDA',
        ci: v.usuario.persona.ci,
        nombres: v.usuario.persona.nombres,
        primerApellido: v.usuario.persona.primerApellido,
        segundoApellido: v.usuario.persona.segundoApellido,
        email: v.usuario.email,
        especialidad: v.maestro?.especialidad || null,
        tituloProfesional: v.maestro?.tituloProfesional || null,
        cargoOficial: v.cargoOficial,
        rolInstitucional: v.rolInstitucional,
        estado: v.estado,
        fechaInicio: v.fechaInicio,
        fechaFin: v.fechaFin,
      }));
    });
  }

  /**
   * Modifica el estado laboral de una vinculación docente (Nivel 2: Director).
   */
  async updateLinkStatus(
    institutionId: string,
    vinculacionId: string,
    dto: UpdateLinkStatusDto,
    directorUserId: string,
    ip?: string,
    userAgent?: string,
  ) {
    const vinculacion = await this.prisma.vinculacionInstitucional.findUnique({
      where: { id: vinculacionId },
      include: { maestro: true },
    });

    if (!vinculacion) {
      throw new NotFoundException('Vinculación docente no encontrada.');
    }

    if (vinculacion.institucionId !== institutionId) {
      throw new ForbiddenException(
        'La vinculación seleccionada no pertenece a la Unidad Educativa activa.',
      );
    }

    const fechaFin = dto.fechaFin ? new Date(dto.fechaFin) : new Date();

    const updated = await this.prisma.vinculacionInstitucional.update({
      where: { id: vinculacionId },
      data: {
        estado: dto.estado,
        fechaFin: dto.estado === EstadoVinculacion.ACTIVO ? null : fechaFin,
      },
    });

    await this.auditService.log({
      usuarioId: directorUserId,
      institucionId: institutionId,
      tipo: TipoAuditoria.TEACHER_UNLINK,
      accion: 'CAMBIO_ESTADO_VINCULACION_DOCENTE',
      detalle: {
        vinculacionId,
        maestroRda: vinculacion.maestro?.rda,
        nuevoEstado: dto.estado,
        motivo: dto.motivo,
      },
      ip,
      userAgent,
    });

    return {
      message: `Estado de vinculación actualizado a '${dto.estado}'.`,
      vinculacionId: updated.id,
      estado: updated.estado,
      rolInstitucional: updated.rolInstitucional,
    };
  }

  /**
   * Obtiene el expediente profesional completo con el historial institucional (Niveles 1 y 3).
   */
  async getTeacherDossier(userId?: string, maestroId?: string) {
    let maestro;

    if (maestroId) {
      maestro = await this.prisma.maestro.findUnique({
        where: { id: maestroId },
        include: {
          persona: {
            include: {
              usuario: true,
            },
          },
          vinculaciones: {
            include: {
              institucion: true,
            },
            orderBy: {
              fechaInicio: 'desc',
            },
          },
        },
      });
    } else if (userId) {
      const user = await this.prisma.usuario.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException('Usuario no encontrado.');
      }

      maestro = await this.prisma.maestro.findUnique({
        where: { personaId: user.personaId },
        include: {
          persona: {
            include: {
              usuario: true,
            },
          },
          vinculaciones: {
            include: {
              institucion: true,
            },
            orderBy: {
              fechaInicio: 'desc',
            },
          },
        },
      });
    }

    if (!maestro) {
      throw new NotFoundException('No se encontró expediente de maestro registrado.');
    }

    return {
      maestroId: maestro.id,
      rda: maestro.rda,
      tituloProfesional: maestro.tituloProfesional,
      especialidad: maestro.especialidad,
      anioEgreso: maestro.anioEgreso,
      normalista: maestro.normalista,
      persona: {
        ci: maestro.persona.ci,
        complemento: maestro.persona.complemento,
        nombres: maestro.persona.nombres,
        primerApellido: maestro.persona.primerApellido,
        segundoApellido: maestro.persona.segundoApellido,
        email: maestro.persona.usuario?.email,
        telefono: maestro.persona.telefono,
      },
      historialVinculaciones: maestro.vinculaciones.map((v) => ({
        vinculacionId: v.id,
        institucionId: v.institucionId,
        sie: v.institucion.sie,
        nombreInstitucion: v.institucion.nombre,
        departamento: v.institucion.departamento,
        rolInstitucional: v.rolInstitucional,
        cargoOficial: v.cargoOficial,
        estado: v.estado,
        fechaInicio: v.fechaInicio,
        fechaFin: v.fechaFin,
      })),
    };
  }
}
