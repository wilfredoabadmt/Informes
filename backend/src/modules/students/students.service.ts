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
import { CreateStudentDto } from './dto/create-student.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import {
  EstadoInscripcion,
  EstadoGestion,
  EstadoVinculacion,
  EstadoAsignacion,
  RolInstitucional,
  RolGlobal,
  TipoAuditoria,
} from '@prisma/client';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Empadrona a un nuevo estudiante en el Padrón Nacional con código RUDE (Nivel 1 y Nivel 2).
   */
  async createStudent(
    dto: CreateStudentDto,
    userId: string,
    ip?: string,
    userAgent?: string,
  ) {
    // 1. Validar unicidad del código RUDE
    const rudeNorm = dto.codigoRude.trim().toUpperCase();
    const existingRude = await this.prisma.estudiante.findUnique({
      where: { codigoRude: rudeNorm },
    });

    if (existingRude) {
      throw new ConflictException(
        `El código RUDE '${rudeNorm}' ya se encuentra registrado en el padrón nacional.`,
      );
    }

    // 2. Resolver o validar Cédula de Identidad si se proporciona
    let personaId: string;

    if (dto.ci) {
      const existingPersona = await this.prisma.persona.findUnique({
        where: { ci: dto.ci.trim() },
        include: { estudiante: true },
      });

      if (existingPersona) {
        if (existingPersona.estudiante) {
          throw new ConflictException(
            `Ya existe un estudiante registrado con la Cédula de Identidad ${dto.ci}.`,
          );
        }
        personaId = existingPersona.id;
      } else {
        const nuevaPersona = await this.prisma.persona.create({
          data: {
            ci: dto.ci.trim(),
            complemento: dto.complemento ? dto.complemento.trim().toUpperCase() : null,
            nombres: dto.nombres.trim(),
            primerApellido: dto.primerApellido.trim(),
            segundoApellido: dto.segundoApellido ? dto.segundoApellido.trim() : null,
            fechaNacimiento: new Date(dto.fechaNacimiento),
            genero: dto.genero || null,
            direccion: dto.direccion ? dto.direccion.trim() : null,
          },
        });
        personaId = nuevaPersona.id;
      }
    } else {
      // Generar persona sin CI (común en educación inicial / primaria en Bolivia)
      const ciProvisorio = `RUDE-${rudeNorm}`;
      const nuevaPersona = await this.prisma.persona.create({
        data: {
          ci: ciProvisorio,
          nombres: dto.nombres.trim(),
          primerApellido: dto.primerApellido.trim(),
          segundoApellido: dto.segundoApellido ? dto.segundoApellido.trim() : null,
          fechaNacimiento: new Date(dto.fechaNacimiento),
          genero: dto.genero || null,
          direccion: dto.direccion ? dto.direccion.trim() : null,
        },
      });
      personaId = nuevaPersona.id;
    }

    // 3. Crear el registro del estudiante con datos del tutor
    const estudiante = await this.prisma.estudiante.create({
      data: {
        personaId,
        codigoRude: rudeNorm,
        nombreTutor: dto.nombreTutor ? dto.nombreTutor.trim() : null,
        ciTutor: dto.ciTutor ? dto.ciTutor.trim() : null,
        parentescoTutor: dto.parentescoTutor || null,
        telefonoTutor: dto.telefonoTutor ? dto.telefonoTutor.trim() : null,
      },
      include: {
        persona: true,
      },
    });

    // 4. Auditoría inmutable
    await this.auditService.log({
      usuarioId: userId,
      tipo: TipoAuditoria.USER_CREATE,
      accion: 'ALTA_ESTUDIANTE_RUDE',
      detalle: {
        estudianteId: estudiante.id,
        codigoRude: estudiante.codigoRude,
        nombreCompleto: `${estudiante.persona.nombres} ${estudiante.persona.primerApellido}`,
      },
      ip,
      userAgent,
    });

    return this.formatStudentResponse(estudiante);
  }

  /**
   * Búsqueda de estudiantes en el padrón nacional por RUDE, CI o nombres.
   */
  async searchStudents(q: string) {
    const term = q.trim();
    if (!term) return [];

    const estudiantes = await this.prisma.estudiante.findMany({
      where: {
        OR: [
          { codigoRude: { contains: term, mode: 'insensitive' } },
          { persona: { ci: { contains: term, mode: 'insensitive' } } },
          { persona: { nombres: { contains: term, mode: 'insensitive' } } },
          { persona: { primerApellido: { contains: term, mode: 'insensitive' } } },
          { persona: { segundoApellido: { contains: term, mode: 'insensitive' } } },
        ],
      },
      include: {
        persona: true,
      },
      take: 25,
      orderBy: [
        { persona: { primerApellido: 'asc' } },
        { persona: { nombres: 'asc' } },
      ],
    });

    return estudiantes.map((e) => this.formatStudentResponse(e));
  }

  /**
   * Consulta ficha biográfica del estudiante con su historial de escolaridad y matrículas.
   */
  async getStudentProfile(id: string) {
    const estudiante = await this.prisma.estudiante.findUnique({
      where: { id },
      include: {
        persona: true,
        inscripciones: {
          include: {
            institucion: true,
            gestion: true,
            paralelo: {
              include: { curso: true },
            },
          },
          orderBy: { gestion: { anio: 'desc' } },
        },
      },
    });

    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado en el padrón.');
    }

    return {
      id: estudiante.id,
      codigoRude: estudiante.codigoRude,
      persona: {
        id: estudiante.persona.id,
        ci: estudiante.persona.ci,
        complemento: estudiante.persona.complemento,
        nombres: estudiante.persona.nombres,
        primerApellido: estudiante.persona.primerApellido,
        segundoApellido: estudiante.persona.segundoApellido,
        nombreCompleto: `${estudiante.persona.nombres} ${estudiante.persona.primerApellido} ${estudiante.persona.segundoApellido || ''}`.trim(),
        fechaNacimiento: estudiante.persona.fechaNacimiento,
        genero: estudiante.persona.genero,
        direccion: estudiante.persona.direccion,
      },
      tutor: {
        nombre: estudiante.nombreTutor,
        ci: estudiante.ciTutor,
        parentesco: estudiante.parentescoTutor,
        telefono: estudiante.telefonoTutor,
      },
      historialMatriculas: estudiante.inscripciones.map((ins) => ({
        inscripcionId: ins.id,
        anio: ins.gestion.anio,
        unidadEducativa: {
          id: ins.institucion.id,
          sie: ins.institucion.sie,
          nombre: ins.institucion.nombre,
        },
        curso: ins.paralelo.curso.nombre,
        paralelo: ins.paralelo.letra,
        turno: ins.paralelo.turno,
        estado: ins.estado,
        esRepitente: ins.esRepitente,
        fechaInscripcion: ins.fechaInscripcion,
      })),
    };
  }

  /**
   * Matricula a un estudiante en un paralelo institucional para una gestión escolar (Nivel 2).
   */
  async enrollStudent(
    institucionId: string,
    dto: EnrollStudentDto,
    userId: string,
    ip?: string,
    userAgent?: string,
  ) {
    // 1. Validar que el estudiante exista
    const estudiante = await this.prisma.estudiante.findUnique({
      where: { id: dto.estudianteId },
      include: { persona: true },
    });

    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado en el padrón.');
    }

    // 2. Validar que la gestión escolar pertenezca al colegio y no esté cerrada
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
        'No se pueden matricular estudiantes en una gestión escolar cerrada.',
      );
    }

    // 3. Validar paralelo
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

    // 4. Regla de Negocio Nacional: El estudiante solo puede tener UNA matrícula EFECTIVA en la gestión (año)
    const existingEnrollment = await this.prisma.inscripcion.findFirst({
      where: {
        estudianteId: dto.estudianteId,
        gestion: { anio: gestion.anio },
        estado: EstadoInscripcion.EFECTIVO,
        activo: true,
      },
      include: {
        institucion: true,
      },
    });

    if (existingEnrollment) {
      throw new ConflictException(
        `El estudiante ya cuenta con matrícula activa (EFECTIVO) para la gestión ${gestion.anio} en la Unidad Educativa '${existingEnrollment.institucion.nombre}'. Debe procesarse un traspaso formal.`,
      );
    }

    // 5. Validar cupo máximo del paralelo
    const totalInscritos = await this.prisma.inscripcion.count({
      where: {
        paraleloId: dto.paraleloId,
        estado: EstadoInscripcion.EFECTIVO,
        activo: true,
      },
    });

    if (totalInscritos >= paralelo.cupoMaximo) {
      throw new BadRequestException(
        `El paralelo ${paralelo.curso.nombre} '${paralelo.letra}' ha alcanzado el cupo máximo permitido (${paralelo.cupoMaximo} estudiantes).`,
      );
    }

    // 6. Crear la inscripción
    const inscripcion = await this.prisma.inscripcion.create({
      data: {
        institucionId,
        estudianteId: dto.estudianteId,
        gestionId: dto.gestionId,
        paraleloId: dto.paraleloId,
        estado: EstadoInscripcion.EFECTIVO,
        esRepitente: !!dto.esRepitente,
        observaciones: dto.observaciones ? dto.observaciones.trim() : null,
        activo: true,
      },
      include: {
        estudiante: {
          include: { persona: true },
        },
        paralelo: {
          include: { curso: true },
        },
        gestion: true,
      },
    });

    // 7. Auditoría
    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_CREATE,
      accion: 'MATRICULACION_ESTUDIANTE',
      detalle: {
        inscripcionId: inscripcion.id,
        estudiante: `${estudiante.persona.nombres} ${estudiante.persona.primerApellido}`,
        rude: estudiante.codigoRude,
        curso: paralelo.curso.nombre,
        paralelo: paralelo.letra,
        gestion: gestion.anio,
      },
      ip,
      userAgent,
    });

    return {
      id: inscripcion.id,
      estudianteId: inscripcion.estudianteId,
      institucionId: inscripcion.institucionId,
      gestionId: inscripcion.gestionId,
      paraleloId: inscripcion.paraleloId,
      estado: inscripcion.estado,
      esRepitente: inscripcion.esRepitente,
      fechaInscripcion: inscripcion.fechaInscripcion,
    };
  }

  /**
   * Consulta la nómina oficial de estudiantes de un aula / paralelo (Nivel 2 y Nivel 3).
   * Los maestros solo pueden consultar aulas donde tienen AsignacionAcademica activa.
   */
  async getSectionRoster(
    institucionId: string,
    paraleloId: string,
    userId: string,
    userRolGlobal: string,
  ) {
    const paralelo = await this.prisma.paralelo.findUnique({
      where: { id: paraleloId },
      include: { curso: true, gestion: true },
    });

    if (!paralelo || paralelo.institucionId !== institucionId) {
      throw new NotFoundException(
        'Paralelo no encontrado en esta Unidad Educativa.',
      );
    }

    // Validación de autorización: Superadmin o Autoridades Institucionales pasan directo
    if (userRolGlobal !== RolGlobal.SUPERADMIN && userRolGlobal !== RolGlobal.CENTRAL_ADMIN) {
      const vinculacion = await this.prisma.vinculacionInstitucional.findFirst({
        where: {
          institucionId,
          usuarioId: userId,
          estado: EstadoVinculacion.ACTIVO,
        },
      });

      if (!vinculacion) {
        throw new ForbiddenException(
          'No cuenta con una vinculación institucional activa en este colegio.',
        );
      }

      const esAutoridad =
        vinculacion.rolInstitucional === RolInstitucional.DIRECTOR ||
        vinculacion.rolInstitucional === RolInstitucional.SECRETARIO ||
        vinculacion.rolInstitucional === RolInstitucional.ADMIN_INSTITUCIONAL;

      if (!esAutoridad) {
        // Es MAESTRO: debe verificar si tiene asignación académica activa en este paralelo
        const asignacion = await this.prisma.asignacionAcademica.findFirst({
          where: {
            institucionId,
            paraleloId,
            vinculacionId: vinculacion.id,
            estado: EstadoAsignacion.ACTIVA,
            activo: true,
          },
        });

        if (!asignacion) {
          throw new ForbiddenException(
            'Acceso denegado: No tiene una asignación docente activa en este paralelo.',
          );
        }
      }
    }

    // Consulta de inscripciones bajo RLS
    return this.prisma.withTenantContext(institucionId, async (tx) => {
      const inscripciones = await tx.inscripcion.findMany({
        where: {
          institucionId,
          paraleloId,
          activo: true,
        },
        include: {
          estudiante: {
            include: { persona: true },
          },
        },
        orderBy: [
          { estudiante: { persona: { primerApellido: 'asc' } } },
          { estudiante: { persona: { segundoApellido: 'asc' } } },
          { estudiante: { persona: { nombres: 'asc' } } },
        ],
      });

      return inscripciones.map((ins) => ({
        inscripcionId: ins.id,
        estudianteId: ins.estudiante.id,
        codigoRude: ins.estudiante.codigoRude,
        ci: ins.estudiante.persona.ci,
        nombreCompleto: `${ins.estudiante.persona.primerApellido} ${ins.estudiante.persona.segundoApellido || ''} ${ins.estudiante.persona.nombres}`.trim(),
        primerApellido: ins.estudiante.persona.primerApellido,
        segundoApellido: ins.estudiante.persona.segundoApellido,
        nombres: ins.estudiante.persona.nombres,
        genero: ins.estudiante.persona.genero,
        esRepitente: ins.esRepitente,
        estadoInscripcion: ins.estado,
        tutor: {
          nombre: ins.estudiante.nombreTutor,
          parentesco: ins.estudiante.parentescoTutor,
          telefono: ins.estudiante.telefonoTutor,
        },
      }));
    });
  }

  /**
   * Modifica el estado de la matrícula de un estudiante (ej. RETIRADO_TRASLADO) (Nivel 2).
   */
  async updateEnrollmentStatus(
    institucionId: string,
    inscripcionId: string,
    dto: UpdateEnrollmentStatusDto,
    userId: string,
    ip?: string,
    userAgent?: string,
  ) {
    const ins = await this.prisma.inscripcion.findUnique({
      where: { id: inscripcionId },
      include: {
        estudiante: { include: { persona: true } },
        paralelo: { include: { curso: true } },
      },
    });

    if (!ins) {
      throw new NotFoundException('Inscripción no encontrada.');
    }

    if (ins.institucionId !== institucionId) {
      throw new ForbiddenException(
        'La inscripción seleccionada no pertenece a la Unidad Educativa activa.',
      );
    }

    const updated = await this.prisma.inscripcion.update({
      where: { id: inscripcionId },
      data: { estado: dto.estado },
    });

    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_UPDATE,
      accion: 'CAMBIO_ESTADO_MATRICULA',
      detalle: {
        inscripcionId: ins.id,
        rude: ins.estudiante.codigoRude,
        estudiante: `${ins.estudiante.persona.nombres} ${ins.estudiante.persona.primerApellido}`,
        estadoAnterior: ins.estado,
        estadoNuevo: dto.estado,
        motivo: dto.motivo,
      },
      ip,
      userAgent,
    });

    return {
      id: updated.id,
      estudianteId: updated.estudianteId,
      institucionId: updated.institucionId,
      gestionId: updated.gestionId,
      paraleloId: updated.paraleloId,
      estado: updated.estado,
      esRepitente: updated.esRepitente,
      fechaInscripcion: updated.fechaInscripcion,
    };
  }

  private formatStudentResponse(est: any) {
    return {
      id: est.id,
      codigoRude: est.codigoRude,
      ci: est.persona?.ci,
      nombreCompleto: est.persona
        ? `${est.persona.nombres} ${est.persona.primerApellido} ${est.persona.segundoApellido || ''}`.trim()
        : 'Estudiante',
      fechaNacimiento: est.persona?.fechaNacimiento,
      genero: est.persona?.genero,
      tutor: {
        nombre: est.nombreTutor,
        ci: est.ciTutor,
        parentesco: est.parentescoTutor,
        telefono: est.telefonoTutor,
      },
    };
  }
}
