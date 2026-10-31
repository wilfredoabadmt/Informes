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
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentStatusDto } from './dto/update-assignment-status.dto';
import { QueryAssignmentsDto } from './dto/query-assignments.dto';
import {
  EstadoGestion,
  EstadoAsignacion,
  EstadoVinculacion,
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
          totalEstudiantes: 0,
        })),
      }));
    });
  }

  // -------------------------------------------------------------
  // ASIGNACIONES ACADÉMICAS DOCENTES Y CARGA HORARIA (FEATURE 005)
  // -------------------------------------------------------------

  /**
   * Crea una nueva asignación académica de materia y paralelo a un docente vinculado (Nivel 2).
   */
  async createAssignment(
    institucionId: string,
    dto: CreateAssignmentDto,
    userId: string,
    ip?: string,
    userAgent?: string,
  ) {
    // 1. Validar vinculación institucional del maestro
    const vinculacion = await this.prisma.vinculacionInstitucional.findUnique({
      where: { id: dto.vinculacionId },
      include: {
        maestro: {
          include: { persona: true },
        },
      },
    });

    if (!vinculacion) {
      throw new NotFoundException('Vinculación docente no encontrada.');
    }

    if (vinculacion.institucionId !== institucionId) {
      throw new ForbiddenException(
        'La vinculación seleccionada no pertenece a la Unidad Educativa activa.',
      );
    }

    if (vinculacion.estado !== EstadoVinculacion.ACTIVO) {
      throw new BadRequestException(
        'El maestro no cuenta con una vinculación activa en esta institución.',
      );
    }

    // 2. Validar gestión escolar
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
        'No se pueden asignar materias en una gestión escolar cerrada.',
      );
    }

    // 3. Validar paralelo y curso
    const paralelo = await this.prisma.paralelo.findUnique({
      where: { id: dto.paraleloId },
      include: { curso: true },
    });

    if (!paralelo || paralelo.institucionId !== institucionId) {
      throw new NotFoundException(
        'Paralelo institucional no encontrado en esta Unidad Educativa.',
      );
    }

    if (paralelo.gestionId !== dto.gestionId) {
      throw new BadRequestException(
        'El paralelo seleccionado no pertenece a la gestión escolar indicada.',
      );
    }

    // 4. Validar materia y coherencia curricular con el nivel del curso
    const materia = await this.prisma.materia.findUnique({
      where: { id: dto.materiaId },
    });

    if (!materia) {
      throw new NotFoundException('Materia oficial del SEP no encontrada.');
    }

    if (materia.nivel !== paralelo.curso.nivel) {
      throw new BadRequestException(
        `Incoherencia curricular: la materia ${materia.nombre} (${materia.nivel}) no corresponde al nivel ${paralelo.curso.nivel} de ${paralelo.curso.nombre}.`,
      );
    }

    // 5. Validar que el maestro no esté ya asignado a esta materia y paralelo en la gestión
    const existingSame = await this.prisma.asignacionAcademica.findUnique({
      where: {
        gestionId_paraleloId_materiaId_vinculacionId: {
          gestionId: dto.gestionId,
          paraleloId: dto.paraleloId,
          materiaId: dto.materiaId,
          vinculacionId: dto.vinculacionId,
        },
      },
    });

    if (existingSame && existingSame.activo) {
      throw new ConflictException(
        'El docente ya se encuentra asignado a esta materia y aula en la gestión escolar.',
      );
    }

    const isTitular = dto.esTitular !== false;

    // 6. Validar que no exista otro titular activo para esta materia y paralelo
    if (isTitular) {
      const existingTitular = await this.prisma.asignacionAcademica.findFirst({
        where: {
          gestionId: dto.gestionId,
          paraleloId: dto.paraleloId,
          materiaId: dto.materiaId,
          esTitular: true,
          estado: EstadoAsignacion.ACTIVA,
          activo: true,
        },
      });

      if (existingTitular) {
        throw new ConflictException(
          'Ya existe un maestro titular activo asignado a esta materia en el paralelo seleccionado.',
        );
      }
    }

    // 7. Validar tutoría / asesoría de curso única en el paralelo
    if (dto.esTutor) {
      const existingTutor = await this.prisma.asignacionAcademica.findFirst({
        where: {
          gestionId: dto.gestionId,
          paraleloId: dto.paraleloId,
          esTutor: true,
          estado: EstadoAsignacion.ACTIVA,
          activo: true,
        },
      });

      if (existingTutor) {
        throw new ConflictException(
          'El paralelo seleccionado ya cuenta con un Asesor de Curso / Tutor asignado.',
        );
      }
    }

    // 8. Crear o reactivar la asignación académica
    const asignacion = await this.prisma.asignacionAcademica.create({
      data: {
        institucionId,
        gestionId: dto.gestionId,
        vinculacionId: dto.vinculacionId,
        paraleloId: dto.paraleloId,
        materiaId: dto.materiaId,
        horasSemanales: dto.horasSemanales || 4,
        esTitular: isTitular,
        esTutor: !!dto.esTutor,
        estado: EstadoAsignacion.ACTIVA,
        activo: true,
      },
      include: {
        materia: true,
        paralelo: {
          include: { curso: true },
        },
        vinculacion: {
          include: {
            maestro: {
              include: { persona: true },
            },
          },
        },
      },
    });

    // 9. Auditoría inmutable
    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_CREATE,
      accion: 'CREACION_ASIGNACION_ACADEMICA',
      detalle: {
        asignacionId: asignacion.id,
        maestro: vinculacion.maestro?.persona
          ? `${vinculacion.maestro.persona.nombres} ${vinculacion.maestro.persona.primerApellido}`
          : 'N/A',
        materia: materia.nombre,
        curso: paralelo.curso.nombre,
        letra: paralelo.letra,
        turno: paralelo.turno,
        horasSemanales: asignacion.horasSemanales,
        esTitular: asignacion.esTitular,
        esTutor: asignacion.esTutor,
      },
      ip,
      userAgent,
    });

    return this.formatAssignmentResponse(asignacion);
  }

  /**
   * Consulta la matriz de asignaciones docentes de una gestión escolar (Nivel 2).
   */
  async getAssignments(institucionId: string, query: QueryAssignmentsDto) {
    const gestion = await this.prisma.gestionEscolar.findUnique({
      where: { id: query.gestionId },
    });

    if (!gestion || gestion.institucionId !== institucionId) {
      throw new NotFoundException('Gestión escolar no encontrada en esta institución.');
    }

    return this.prisma.withTenantContext(institucionId, async (tx) => {
      const where: any = {
        institucionId,
        gestionId: query.gestionId,
        activo: true,
      };

      if (query.paraleloId) where.paraleloId = query.paraleloId;
      if (query.maestroId) {
        where.vinculacion = { maestroId: query.maestroId };
      }

      const asignaciones = await tx.asignacionAcademica.findMany({
        where,
        include: {
          materia: true,
          paralelo: {
            include: { curso: true },
          },
          vinculacion: {
            include: {
              maestro: {
                include: { persona: true },
              },
            },
          },
        },
        orderBy: [
          { paralelo: { curso: { orden: 'asc' } } },
          { paralelo: { letra: 'asc' } },
          { materia: { orden: 'asc' } },
        ],
      });

      return asignaciones.map((a) => this.formatAssignmentResponse(a));
    });
  }

  /**
   * Consulta las asignaciones académicas vigentes del docente en sesión (Nivel 3).
   */
  async getMyAssignments(institucionId: string, userId: string, gestionId?: string) {
    // 1. Obtener la vinculación del maestro en este colegio
    const vinculacion = await this.prisma.vinculacionInstitucional.findFirst({
      where: {
        institucionId,
        usuarioId: userId,
        estado: EstadoVinculacion.ACTIVO,
      },
    });

    if (!vinculacion) {
      throw new ForbiddenException(
        'No cuenta con una vinculación docente activa en esta Unidad Educativa.',
      );
    }

    // 2. Resolver la gestión escolar
    let targetGestionId = gestionId;
    if (!targetGestionId) {
      const abierta = await this.prisma.gestionEscolar.findFirst({
        where: {
          institucionId,
          estado: EstadoGestion.ABIERTA,
        },
      });
      if (!abierta) {
        return [];
      }
      targetGestionId = abierta.id;
    }

    return this.prisma.withTenantContext(institucionId, async (tx) => {
      const asignaciones = await tx.asignacionAcademica.findMany({
        where: {
          institucionId,
          gestionId: targetGestionId,
          vinculacionId: vinculacion.id,
          activo: true,
        },
        include: {
          materia: true,
          paralelo: {
            include: { curso: true },
          },
          vinculacion: {
            include: {
              maestro: {
                include: { persona: true },
              },
            },
          },
        },
        orderBy: [
          { paralelo: { curso: { orden: 'asc' } } },
          { paralelo: { letra: 'asc' } },
          { materia: { orden: 'asc' } },
        ],
      });

      return asignaciones.map((a) => this.formatAssignmentResponse(a));
    });
  }

  /**
   * Modifica el estado de una asignación académica (ACTIVA, SUSPENDIDA, FINALIZADA).
   */
  async updateAssignmentStatus(
    institucionId: string,
    assignmentId: string,
    dto: UpdateAssignmentStatusDto,
    userId: string,
    ip?: string,
    userAgent?: string,
  ) {
    const asig = await this.prisma.asignacionAcademica.findUnique({
      where: { id: assignmentId },
      include: {
        materia: true,
        paralelo: { include: { curso: true } },
        vinculacion: {
          include: { maestro: { include: { persona: true } } },
        },
      },
    });

    if (!asig) {
      throw new NotFoundException('Asignación académica no encontrada.');
    }

    if (asig.institucionId !== institucionId) {
      throw new ForbiddenException(
        'La asignación seleccionada no pertenece a la Unidad Educativa activa.',
      );
    }

    const updated = await this.prisma.asignacionAcademica.update({
      where: { id: assignmentId },
      data: { estado: dto.estado },
      include: {
        materia: true,
        paralelo: { include: { curso: true } },
        vinculacion: {
          include: { maestro: { include: { persona: true } } },
        },
      },
    });

    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_UPDATE,
      accion: 'CAMBIO_ESTADO_ASIGNACION',
      detalle: {
        asignacionId: asig.id,
        estadoAnterior: asig.estado,
        estadoNuevo: dto.estado,
        motivo: dto.motivo,
      },
      ip,
      userAgent,
    });

    return this.formatAssignmentResponse(updated);
  }

  /**
   * Revoca o finaliza una asignación académica (Soft-delete).
   */
  async deleteAssignment(
    institucionId: string,
    assignmentId: string,
    userId: string,
    ip?: string,
    userAgent?: string,
  ) {
    const asig = await this.prisma.asignacionAcademica.findUnique({
      where: { id: assignmentId },
    });

    if (!asig) {
      throw new NotFoundException('Asignación académica no encontrada.');
    }

    if (asig.institucionId !== institucionId) {
      throw new ForbiddenException(
        'La asignación seleccionada no pertenece a la Unidad Educativa activa.',
      );
    }

    await this.prisma.asignacionAcademica.update({
      where: { id: assignmentId },
      data: {
        activo: false,
        estado: EstadoAsignacion.FINALIZADA,
      },
    });

    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_UPDATE,
      accion: 'BAJA_ASIGNACION_ACADEMICA',
      detalle: {
        asignacionId: asig.id,
      },
      ip,
      userAgent,
    });

    return {
      success: true,
      message: 'Asignación académica finalizada exitosamente.',
    };
  }

  private formatAssignmentResponse(asig: any) {
    return {
      id: asig.id,
      institucionId: asig.institucionId,
      gestionId: asig.gestionId,
      horasSemanales: asig.horasSemanales,
      esTitular: asig.esTitular,
      esTutor: asig.esTutor,
      estado: asig.estado,
      docente: {
        maestroId: asig.vinculacion?.maestroId || null,
        rda: asig.vinculacion?.maestro?.rda || 'S/RDA',
        nombreCompleto: asig.vinculacion?.maestro?.persona
          ? `${asig.vinculacion.maestro.persona.nombres} ${asig.vinculacion.maestro.persona.primerApellido} ${asig.vinculacion.maestro.persona.segundoApellido || ''}`.trim()
          : 'Docente no especificado',
      },
      curso: {
        nombre: asig.paralelo?.curso?.nombre || '',
        nivel: asig.paralelo?.curso?.nivel || '',
      },
      paralelo: {
        id: asig.paralelo?.id || asig.paraleloId,
        letra: asig.paralelo?.letra || '',
        turno: asig.paralelo?.turno || '',
      },
      materia: {
        id: asig.materia?.id || asig.materiaId,
        codigo: asig.materia?.codigo || '',
        nombre: asig.materia?.nombre || '',
        campo: asig.materia?.campo || '',
      },
    };
  }
}
