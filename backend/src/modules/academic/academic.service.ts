import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSchoolYearDto } from './dto/create-school-year.dto';
import { UpdateSchoolYearStatusDto } from './dto/update-school-year-status.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { QuerySubjectsDto } from './dto/query-subjects.dto';
import {
  EstadoGestion,
  NivelEducativo,
  TipoAuditoria,
} from '@prisma/client';

@Injectable()
export class AcademicService {
  private readonly logger = new Logger(AcademicService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Apertura de una nueva Gestión Escolar en la institución (Nivel 2).
   */
  async createSchoolYear(
    institucionId: string,
    dto: CreateSchoolYearDto,
    userId: string,
    ip?: string,
    userAgent?: string,
  ) {
    // 1. Validar que no exista la gestión del mismo año en el colegio
    const existing = await this.prisma.gestionEscolar.findUnique({
      where: {
        institucionId_anio: {
          institucionId,
          anio: dto.anio,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `La gestión escolar ${dto.anio} ya se encuentra registrada en esta Unidad Educativa.`,
      );
    }

    const estadoInicial = dto.estado || EstadoGestion.ABIERTA;

    // 2. Si se apertura directamente, cerrar otras gestiones abiertas
    if (estadoInicial === EstadoGestion.ABIERTA) {
      await this.prisma.gestionEscolar.updateMany({
        where: {
          institucionId,
          estado: EstadoGestion.ABIERTA,
        },
        data: {
          estado: EstadoGestion.CERRADA,
        },
      });
    }

    // 3. Crear gestión
    const gestion = await this.prisma.gestionEscolar.create({
      data: {
        institucionId,
        anio: dto.anio,
        fechaInicio: new Date(dto.fechaInicio),
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
        estado: estadoInicial,
        activo: true,
      },
    });

    // 4. Auditoría
    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_CREATE,
      accion: 'APERTURA_GESTION_ESCOLAR',
      detalle: {
        anio: gestion.anio,
        estado: gestion.estado,
        fechaInicio: dto.fechaInicio,
      },
      ip,
      userAgent,
    });

    return gestion;
  }

  /**
   * Lista las gestiones escolares del colegio en orden descendente.
   */
  async getSchoolYears(institucionId: string) {
    return this.prisma.withTenantContext(institucionId, async (tx) => {
      return tx.gestionEscolar.findMany({
        where: { institucionId },
        orderBy: { anio: 'desc' },
      });
    });
  }

  /**
   * Modifica el estado de la gestión escolar (EN_PLANIFICACION, ABIERTA, CERRADA).
   */
  async updateSchoolYearStatus(
    institucionId: string,
    gestionId: string,
    dto: UpdateSchoolYearStatusDto,
    userId: string,
    ip?: string,
    userAgent?: string,
  ) {
    const gestion = await this.prisma.gestionEscolar.findUnique({
      where: { id: gestionId },
    });

    if (!gestion) {
      throw new NotFoundException('Gestión escolar no encontrada.');
    }

    if (gestion.institucionId !== institucionId) {
      throw new ForbiddenException(
        'La gestión escolar seleccionada no pertenece a la Unidad Educativa activa.',
      );
    }

    // Si se pasa a ABIERTA, cerrar otras que estén abiertas en este colegio
    if (dto.estado === EstadoGestion.ABIERTA) {
      await this.prisma.gestionEscolar.updateMany({
        where: {
          institucionId,
          id: { not: gestionId },
          estado: EstadoGestion.ABIERTA,
        },
        data: {
          estado: EstadoGestion.CERRADA,
        },
      });
    }

    const updated = await this.prisma.gestionEscolar.update({
      where: { id: gestionId },
      data: { estado: dto.estado },
    });

    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_UPDATE,
      accion: 'CAMBIO_ESTADO_GESTION_ESCOLAR',
      detalle: {
        anio: gestion.anio,
        estadoAnterior: gestion.estado,
        estadoNuevo: dto.estado,
      },
      ip,
      userAgent,
    });

    return updated;
  }

  /**
   * Catálogo unificado nacional de materias oficiales del SEP.
   */
  async getSubjects(query: QuerySubjectsDto) {
    const where: any = {};
    if (query.nivel) where.nivel = query.nivel;
    if (query.campo) where.campo = query.campo;

    return this.prisma.materia.findMany({
      where,
      orderBy: [{ nivel: 'asc' }, { orden: 'asc' }],
    });
  }

  /**
   * Catálogo oficial de cursos / grados del Sistema Educativo Plurinacional.
   */
  async getCourses(nivel?: NivelEducativo) {
    const where: any = {};
    if (nivel) where.nivel = nivel;

    return this.prisma.curso.findMany({
      where,
      orderBy: { orden: 'asc' },
    });
  }

  /**
   * Crea un paralelo institucional (Nivel 2: Director / Admin Institucional).
   */
  async createSection(
    institucionId: string,
    dto: CreateSectionDto,
    userId: string,
    ip?: string,
    userAgent?: string,
  ) {
    // 1. Validar gestión escolar
    const gestion = await this.prisma.gestionEscolar.findUnique({
      where: { id: dto.gestionId },
    });

    if (!gestion || gestion.institucionId !== institucionId) {
      throw new NotFoundException(
        'Gestión escolar no encontrada en esta Unidad Educativa.',
      );
    }

    if (gestion.estado === EstadoGestion.CERRADA) {
      throw new BadRequestException(
        'No se pueden crear ni modificar paralelos en una gestión escolar cerrada.',
      );
    }

    // 2. Validar curso base
    const curso = await this.prisma.curso.findUnique({
      where: { id: dto.cursoId },
    });
    if (!curso) {
      throw new NotFoundException('Curso oficial no encontrado.');
    }

    const letraNorm = dto.letra.trim().toUpperCase();

    // 3. Validar no duplicidad de paralelo en el curso y turno
    const existingSection = await this.prisma.paralelo.findUnique({
      where: {
        gestionId_cursoId_letra_turno: {
          gestionId: dto.gestionId,
          cursoId: dto.cursoId,
          letra: letraNorm,
          turno: dto.turno,
        },
      },
    });

    if (existingSection) {
      throw new ConflictException(
        `El paralelo '${letraNorm}' (Turno ${dto.turno}) ya existe en ${curso.nombre} para la gestión ${gestion.anio}.`,
      );
    }

    // 4. Crear paralelo
    const paralelo = await this.prisma.paralelo.create({
      data: {
        institucionId,
        gestionId: dto.gestionId,
        cursoId: dto.cursoId,
        letra: letraNorm,
        turno: dto.turno,
        cupoMaximo: dto.cupoMaximo || 35,
        activo: true,
      },
      include: {
        curso: true,
      },
    });

    // 5. Auditoría
    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_CREATE,
      accion: 'CREACION_PARALELO_AULA',
      detalle: {
        paraleloId: paralelo.id,
        curso: curso.nombre,
        letra: paralelo.letra,
        turno: paralelo.turno,
        gestion: gestion.anio,
      },
      ip,
      userAgent,
    });

    return paralelo;
  }

  /**
   * Retorna el árbol académico jerárquico de la institución para una gestión escolar.
   */
  async getAcademicTree(institucionId: string, gestionId: string) {
    const gestion = await this.prisma.gestionEscolar.findUnique({
      where: { id: gestionId },
    });

    if (!gestion || gestion.institucionId !== institucionId) {
      throw new NotFoundException('Gestión escolar no encontrada en esta institución.');
    }

    return this.prisma.withTenantContext(institucionId, async (tx) => {
      const cursos = await tx.curso.findMany({
        orderBy: { orden: 'asc' },
        include: {
          paralelos: {
            where: {
              institucionId,
              gestionId,
              activo: true,
            },
            orderBy: [{ turno: 'asc' }, { letra: 'asc' }],
          },
        },
      });

      return cursos.map((c) => ({
        cursoId: c.id,
        nombreCurso: c.nombre,
        nivel: c.nivel,
        grado: c.grado,
        paralelos: c.paralelos.map((p) => ({
          paraleloId: p.id,
          letra: p.letra,
          turno: p.turno,
          cupoMaximo: p.cupoMaximo,
          totalEstudiantes: 0, // En espera de Feature 005 (Estudiantes e Inscripciones)
        })),
      }));
    });
  }
}
