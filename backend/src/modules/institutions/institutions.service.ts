import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { QueryInstitutionsDto } from './dto/query-institutions.dto';
import { UpdateInstitutionStatusDto } from './dto/update-institution-status.dto';
import { AssignAuthorityDto } from './dto/assign-authority.dto';
import { UpdateMyInstitutionDto } from './dto/update-my-institution.dto';
import {
  EstadoVinculacion,
  RolInstitucional,
  TipoAuditoria,
  Prisma,
} from '@prisma/client';
import { DEPARTAMENTOS_BOLIVIA } from '../../common/constants/bolivia.constants';

@Injectable()
export class InstitutionsService {
  private readonly logger = new Logger(InstitutionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Registra una nueva Unidad Educativa (Nivel 1: Administración Central).
   */
  async create(dto: CreateInstitutionDto, adminUserId: string, ip?: string, userAgent?: string) {
    // 1. Validar unicidad del código SIE
    const existing = await this.prisma.unidadEducativa.findUnique({
      where: { sie: dto.sie },
    });

    if (existing) {
      throw new ConflictException(
        `El código SIE '${dto.sie}' ya se encuentra registrado por la Unidad Educativa '${existing.nombre}'.`,
      );
    }

    // 2. Validar departamento oficial
    if (!DEPARTAMENTOS_BOLIVIA.includes(dto.departamento as any)) {
      throw new BadRequestException(
        `Departamento inválido. Debe pertenecer a uno de los 9 departamentos de Bolivia.`,
      );
    }

    // 3. Crear Unidad Educativa
    const institution = await this.prisma.unidadEducativa.create({
      data: {
        sie: dto.sie,
        nombre: dto.nombre,
        departamento: dto.departamento,
        provincia: dto.provincia,
        municipio: dto.municipio,
        distrito: dto.distrito,
        direccion: dto.direccion,
        telefono: dto.telefono,
        tipo: dto.tipo,
        nivel: dto.nivel,
        activo: true,
      },
    });

    // 4. Registrar auditoría central
    await this.auditService.log({
      usuarioId: adminUserId,
      institucionId: institution.id,
      tipo: TipoAuditoria.USER_CREATE,
      accion: 'ALTA_UNIDAD_EDUCATIVA',
      detalle: {
        sie: institution.sie,
        nombre: institution.nombre,
        departamento: institution.departamento,
        tipo: institution.tipo,
      },
      ip,
      userAgent,
    });

    return institution;
  }

  /**
   * Consulta el padrón de instituciones con paginación y filtros.
   * Aplica aislamiento multi-tenant estricto: usuarios no centrales sólo ven sus colegios vinculados.
   */
  async findAll(query: QueryInstitutionsDto, userId?: string, isCentralAdmin: boolean = true) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.UnidadEducativaWhereInput = {};

    // Aislamiento Multi-Tenant: Si el usuario no es Superadmin ni Central Admin, solo ve sus instituciones
    if (!isCentralAdmin && userId) {
      where.vinculaciones = {
        some: {
          usuarioId: userId,
          estado: EstadoVinculacion.ACTIVO,
        },
      };
    }

    if (query.departamento) {
      where.departamento = { equals: query.departamento, mode: 'insensitive' };
    }

    if (query.distrito) {
      where.distrito = { contains: query.distrito, mode: 'insensitive' };
    }

    if (query.tipo) {
      where.tipo = query.tipo;
    }

    if (query.activo !== undefined) {
      where.activo = query.activo;
    }

    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { nombre: { contains: q, mode: 'insensitive' } },
        { sie: { contains: q } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.unidadEducativa.count({ where }),
      this.prisma.unidadEducativa.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nombre: 'asc' },
        include: {
          _count: {
            select: {
              vinculaciones: {
                where: { estado: EstadoVinculacion.ACTIVO },
              },
            },
          },
        },
      }),
    ]);

    const formattedData = data.map((inst) => ({
      id: inst.id,
      sie: inst.sie,
      nombre: inst.nombre,
      departamento: inst.departamento,
      provincia: inst.provincia,
      municipio: inst.municipio,
      distrito: inst.distrito,
      direccion: inst.direccion,
      telefono: inst.telefono,
      tipo: inst.tipo,
      nivel: inst.nivel,
      activo: inst.activo,
      totalMaestrosVinculados: inst._count.vinculaciones,
      createdAt: inst.createdAt,
    }));

    return {
      data: formattedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene la ficha detallada de una Unidad Educativa con sus autoridades vigentes.
   */
  async findById(id: string) {
    const inst = await this.prisma.unidadEducativa.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            vinculaciones: {
              where: { estado: EstadoVinculacion.ACTIVO },
            },
          },
        },
        vinculaciones: {
          where: {
            estado: EstadoVinculacion.ACTIVO,
            rolInstitucional: {
              in: [RolInstitucional.DIRECTOR, RolInstitucional.ADMIN_INSTITUCIONAL],
            },
          },
          include: {
            usuario: {
              include: {
                persona: true,
              },
            },
          },
        },
      },
    });

    if (!inst) {
      throw new NotFoundException('Unidad Educativa no encontrada.');
    }

    return {
      id: inst.id,
      sie: inst.sie,
      nombre: inst.nombre,
      departamento: inst.departamento,
      provincia: inst.provincia,
      municipio: inst.municipio,
      distrito: inst.distrito,
      direccion: inst.direccion,
      telefono: inst.telefono,
      tipo: inst.tipo,
      nivel: inst.nivel,
      activo: inst.activo,
      totalMaestrosVinculados: inst._count.vinculaciones,
      autoridades: inst.vinculaciones.map((v) => ({
        vinculacionId: v.id,
        rolInstitucional: v.rolInstitucional,
        cargoOficial: v.cargoOficial,
        persona: {
          ci: v.usuario.persona.ci,
          nombres: v.usuario.persona.nombres,
          primerApellido: v.usuario.persona.primerApellido,
          segundoApellido: v.usuario.persona.segundoApellido,
          email: v.usuario.email,
        },
      })),
      createdAt: inst.createdAt,
      updatedAt: inst.updatedAt,
    };
  }

  /**
   * Cambia el estado operativo (Activar / Suspender) de una institución.
   */
  async updateStatus(
    id: string,
    dto: UpdateInstitutionStatusDto,
    adminUserId: string,
    ip?: string,
    userAgent?: string,
  ) {
    const inst = await this.prisma.unidadEducativa.findUnique({ where: { id } });
    if (!inst) {
      throw new NotFoundException('Unidad Educativa no encontrada.');
    }

    const updated = await this.prisma.unidadEducativa.update({
      where: { id },
      data: { activo: dto.activo },
    });

    await this.auditService.log({
      usuarioId: adminUserId,
      institucionId: id,
      tipo: TipoAuditoria.USER_UPDATE,
      accion: dto.activo ? 'REACTIVACION_INSTITUCIONAL' : 'SUSPENSION_INSTITUCIONAL',
      detalle: {
        sie: inst.sie,
        nombre: inst.nombre,
        estadoAnterior: inst.activo,
        estadoNuevo: dto.activo,
        motivo: dto.motivo || (dto.activo ? 'Reactivación del servicio institucional' : 'Suspensión administrativa por regularización SaaS'),
      },
      ip,
      userAgent,
    });

    return updated;
  }

  /**
   * Asigna un Director o Administrador Institucional a la Unidad Educativa.
   */
  async assignAuthority(
    institutionId: string,
    dto: AssignAuthorityDto,
    adminUserId: string,
    ip?: string,
    userAgent?: string,
  ) {
    const inst = await this.prisma.unidadEducativa.findUnique({
      where: { id: institutionId },
    });
    if (!inst) {
      throw new NotFoundException('Unidad Educativa no encontrada.');
    }

    const trimmedId = dto.identifier.trim();
    const user = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { email: trimmedId.toLowerCase() },
          { persona: { ci: trimmedId } },
        ],
      },
      include: {
        persona: true,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `Usuario con identificador '${dto.identifier}' no encontrado en el sistema.`,
      );
    }

    // Verificar si el usuario cuenta con perfil de maestro (RDA)
    const maestro = await this.prisma.maestro.findUnique({
      where: { personaId: user.personaId },
    });

    const vinculacion = await this.prisma.vinculacionInstitucional.upsert({
      where: {
        institucionId_usuarioId_rolInstitucional: {
          institucionId: institutionId,
          usuarioId: user.id,
          rolInstitucional: dto.rolInstitucional,
        },
      },
      update: {
        cargoOficial: dto.cargoOficial,
        estado: EstadoVinculacion.ACTIVO,
        maestroId: maestro?.id || null,
      },
      create: {
        institucionId: institutionId,
        usuarioId: user.id,
        maestroId: maestro?.id || null,
        rolInstitucional: dto.rolInstitucional,
        cargoOficial: dto.cargoOficial,
        estado: EstadoVinculacion.ACTIVO,
      },
    });

    await this.auditService.log({
      usuarioId: adminUserId,
      institucionId: institutionId,
      tipo: TipoAuditoria.TEACHER_LINK,
      accion: 'ASIGNACION_AUTORIDAD_INSTITUCIONAL',
      detalle: {
        sie: inst.sie,
        usuarioId: user.id,
        rolInstitucional: dto.rolInstitucional,
        cargoOficial: dto.cargoOficial,
      },
      ip,
      userAgent,
    });

    return {
      message: `Autoridad '${dto.rolInstitucional}' asignada exitosamente a ${user.persona.nombres} ${user.persona.primerApellido}.`,
      vinculacionId: vinculacion.id,
      rolInstitucional: vinculacion.rolInstitucional,
    };
  }

  /**
   * Actualiza datos de contacto de la institución en sesión (Nivel 2: Director / Admin Institucional).
   */
  async updateMyInstitution(
    tenantInstitutionId: string,
    dto: UpdateMyInstitutionDto,
    userId: string,
    ip?: string,
    userAgent?: string,
  ) {
    const updated = await this.prisma.unidadEducativa.update({
      where: { id: tenantInstitutionId },
      data: {
        direccion: dto.direccion !== undefined ? dto.direccion : undefined,
        telefono: dto.telefono !== undefined ? dto.telefono : undefined,
      },
    });

    await this.auditService.log({
      usuarioId: userId,
      institucionId: tenantInstitutionId,
      tipo: TipoAuditoria.USER_UPDATE,
      accion: 'ACTUALIZACION_DATOS_CONTACTO_LOCAL',
      detalle: {
        direccion: dto.direccion,
        telefono: dto.telefono,
      },
      ip,
      userAgent,
    });

    return updated;
  }
}
