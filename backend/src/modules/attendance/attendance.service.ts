import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  EstadoAsistencia,
  EstadoAsignacion,
  EstadoInscripcion,
  EstadoVinculacion,
  RolInstitucional,
  TipoAuditoria,
} from '@prisma/client';
import { RecordAttendanceDto } from './dto/record-attendance.dto';
import { JustifyAbsenceDto } from './dto/justify-absence.dto';
import { QueryAttendanceDto, QueryAttendanceStatsDto } from './dto/query-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Registra la asistencia en bloque para un aula y fecha (Nivel 2 y Nivel 3).
   */
  async recordAttendance(
    institucionId: string,
    dto: RecordAttendanceDto,
    userId: string,
    userRole?: string,
  ) {
    // 1. Validar que la fecha no sea futura
    const inputDate = new Date(dto.fecha);
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (inputDate.getTime() > todayEnd.getTime()) {
      throw new BadRequestException('La fecha de asistencia no puede ser posterior a la fecha actual');
    }

    // 2. Validar pertenencia del paralelo a la institución
    const paralelo = await this.prisma.paralelo.findFirst({
      where: {
        id: dto.paraleloId,
        institucionId,
        activo: true,
      },
    });

    if (!paralelo) {
      throw new NotFoundException('Paralelo no encontrado en esta institución');
    }

    // 3. Validar permisos si el usuario es MAESTRO
    if (userRole === RolInstitucional.MAESTRO) {
      const activeAssignment = await this.prisma.asignacionAcademica.findFirst({
        where: {
          paraleloId: dto.paraleloId,
          institucionId,
          estado: EstadoAsignacion.ACTIVA,
          vinculacion: {
            usuarioId: userId,
            institucionId,
            estado: EstadoVinculacion.ACTIVO,
          },
        },
      });

      if (!activeAssignment) {
        throw new ForbiddenException('El maestro no tiene asignación pedagógica activa en este paralelo');
      }

      if (dto.asignacionId && activeAssignment.id !== dto.asignacionId) {
        const specificAssignment = await this.prisma.asignacionAcademica.findFirst({
          where: {
            id: dto.asignacionId,
            paraleloId: dto.paraleloId,
            institucionId,
            estado: EstadoAsignacion.ACTIVA,
            vinculacion: {
              usuarioId: userId,
              institucionId,
              estado: EstadoVinculacion.ACTIVO,
            },
          },
        });
        if (!specificAssignment) {
          throw new ForbiddenException('La asignación especificada no corresponde al maestro');
        }
      }
    }

    // 4. Validar que no exista registro previo para paraleloId, fecha y asignacionId
    const existing = await this.prisma.registroAsistencia.findFirst({
      where: {
        institucionId,
        paraleloId: dto.paraleloId,
        fecha: new Date(dto.fecha),
        asignacionId: dto.asignacionId || null,
      },
    });

    if (existing) {
      throw new ConflictException('Ya existe un registro de asistencia para este paralelo, fecha y asignatura');
    }

    // 5. Validar que todos los estudiantes pertenezcan al paralelo con matrícula EFECTIVO
    const activeEnrollments = await this.prisma.inscripcion.findMany({
      where: {
        paraleloId: dto.paraleloId,
        institucionId,
        estado: EstadoInscripcion.EFECTIVO,
        activo: true,
      },
      select: { estudianteId: true },
    });

    const enrolledStudentIds = new Set(activeEnrollments.map((e) => e.estudianteId));

    for (const item of dto.asistencia) {
      if (!enrolledStudentIds.has(item.estudianteId)) {
        throw new BadRequestException(
          `El estudiante con ID ${item.estudianteId} no tiene una matrícula efectiva en este paralelo`,
        );
      }
    }

    // 6. Transacción interactiva atómica bajo contexto RLS
    const registro = await this.prisma.withTenantContext(institucionId, async (tx) => {
      const header = await tx.registroAsistencia.create({
        data: {
          institucionId,
          paraleloId: dto.paraleloId,
          asignacionId: dto.asignacionId || null,
          registradoPorId: userId,
          fecha: new Date(dto.fecha),
          observaciones: dto.observaciones || null,
        },
      });

      await tx.detalleAsistencia.createMany({
        data: dto.asistencia.map((item) => ({
          registroAsistenciaId: header.id,
          estudianteId: item.estudianteId,
          estado: item.estado,
          justificado: item.estado === EstadoAsistencia.LICENCIA,
          observacion: item.observacion || null,
        })),
      });

      return header;
    });

    // 7. Auditoría
    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_CREATE,
      accion: 'REGISTRO_ASISTENCIA',
      detalle: {
        registroId: registro.id,
        paraleloId: dto.paraleloId,
        fecha: dto.fecha,
        totalEstudiantes: dto.asistencia.length,
      },
    });

    // 8. Totales de resumen
    const presentes = dto.asistencia.filter((a) => a.estado === EstadoAsistencia.PRESENTE).length;
    const faltas = dto.asistencia.filter((a) => a.estado === EstadoAsistencia.FALTA).length;
    const licencias = dto.asistencia.filter((a) => a.estado === EstadoAsistencia.LICENCIA).length;
    const atrasos = dto.asistencia.filter((a) => a.estado === EstadoAsistencia.ATRASO).length;

    return {
      id: registro.id,
      institucionId,
      paraleloId: dto.paraleloId,
      fecha: dto.fecha,
      totalEstudiantes: dto.asistencia.length,
      presentes,
      faltas,
      licencias,
      atrasos,
    };
  }

  /**
   * Consulta la planilla de asistencia detallada por fecha y paralelo.
   */
  async getAttendanceByDate(
    institucionId: string,
    query: QueryAttendanceDto,
    userId: string,
    userRole?: string,
  ) {
    const paralelo = await this.prisma.paralelo.findFirst({
      where: { id: query.paraleloId, institucionId },
      include: { curso: true },
    });

    if (!paralelo) {
      throw new NotFoundException('Paralelo no encontrado en esta institución');
    }

    if (userRole === RolInstitucional.MAESTRO) {
      const activeAssignment = await this.prisma.asignacionAcademica.findFirst({
        where: {
          paraleloId: query.paraleloId,
          institucionId,
          estado: EstadoAsignacion.ACTIVA,
          vinculacion: {
            usuarioId: userId,
            institucionId,
            estado: EstadoVinculacion.ACTIVO,
          },
        },
      });

      if (!activeAssignment) {
        throw new ForbiddenException('El maestro no tiene asignación pedagógica activa en este paralelo');
      }
    }

    const registro = await this.prisma.withTenantContext(institucionId, async (tx) => {
      return tx.registroAsistencia.findFirst({
        where: {
          institucionId,
          paraleloId: query.paraleloId,
          fecha: new Date(query.fecha),
          ...(query.asignacionId ? { asignacionId: query.asignacionId } : {}),
        },
        include: {
          paralelo: {
            include: {
              curso: true,
            },
          },
          detalles: {
            include: {
              estudiante: {
                include: {
                  persona: true,
                },
              },
            },
          },
        },
      });
    });

    if (!registro) {
      throw new NotFoundException('Planilla de asistencia no encontrada para los parámetros especificados');
    }

    const sortedDetails = [...registro.detalles].sort((a, b) => {
      const pA = a.estudiante.persona;
      const pB = b.estudiante.persona;
      const apeA = `${pA.primerApellido} ${pA.segundoApellido || ''}`.trim().toLowerCase();
      const apeB = `${pB.primerApellido} ${pB.segundoApellido || ''}`.trim().toLowerCase();
      if (apeA !== apeB) return apeA.localeCompare(apeB);
      return pA.nombres.toLowerCase().localeCompare(pB.nombres.toLowerCase());
    });

    return {
      id: registro.id,
      fecha: query.fecha,
      paralelo: {
        id: registro.paralelo.id,
        curso: registro.paralelo.curso.nombre,
        grado: registro.paralelo.curso.grado,
        letra: registro.paralelo.letra,
        turno: registro.paralelo.turno,
      },
      detalles: sortedDetails.map((d) => ({
        id: d.id,
        estudianteId: d.estudianteId,
        codigoRude: d.estudiante.codigoRude,
        ci: d.estudiante.persona.ci,
        nombreCompleto: [
          d.estudiante.persona.primerApellido,
          d.estudiante.persona.segundoApellido,
          d.estudiante.persona.nombres,
        ]
          .filter(Boolean)
          .join(' '),
        estado: d.estado,
        justificado: d.justificado,
        observacion: d.observacion,
      })),
    };
  }

  /**
   * Justifica una inasistencia o modifica el estado de asistencia de un estudiante (Nivel 2).
   */
  async justifyAbsence(
    institucionId: string,
    detalleId: string,
    dto: JustifyAbsenceDto,
    userId: string,
    userRole?: string,
  ) {
    const detalle = await this.prisma.withTenantContext(institucionId, async (tx) => {
      return tx.detalleAsistencia.findFirst({
        where: {
          id: detalleId,
          registroAsistencia: {
            institucionId,
          },
        },
        include: {
          estudiante: {
            include: {
              persona: true,
            },
          },
          registroAsistencia: true,
        },
      });
    });

    if (!detalle) {
      throw new NotFoundException('Detalle de asistencia no encontrado');
    }

    if (userRole === RolInstitucional.MAESTRO) {
      const isTutor = await this.prisma.asignacionAcademica.findFirst({
        where: {
          paraleloId: detalle.registroAsistencia.paraleloId,
          institucionId,
          esTutor: true,
          estado: EstadoAsignacion.ACTIVA,
          vinculacion: {
            usuarioId: userId,
            institucionId,
            estado: EstadoVinculacion.ACTIVO,
          },
        },
      });

      if (!isTutor) {
        throw new ForbiddenException(
          'Solo el personal directivo, administrativo o el tutor del paralelo puede justificar inasistencias',
        );
      }
    }

    const updated = await this.prisma.withTenantContext(institucionId, async (tx) => {
      return tx.detalleAsistencia.update({
        where: { id: detalleId },
        data: {
          estado: dto.estado,
          justificado: dto.justificado !== undefined ? dto.justificado : true,
          observacion: dto.observacion,
        },
        include: {
          estudiante: {
            include: {
              persona: true,
            },
          },
        },
      });
    });

    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_UPDATE,
      accion: 'JUSTIFICACION_ASISTENCIA',
      detalle: {
        detalleId,
        estudianteId: detalle.estudianteId,
        estadoAnterior: detalle.estado,
        nuevoEstado: dto.estado,
        justificado: updated.justificado,
        motivo: dto.observacion,
      },
    });

    return {
      id: updated.id,
      estudianteId: updated.estudianteId,
      codigoRude: updated.estudiante.codigoRude,
      ci: updated.estudiante.persona.ci,
      nombreCompleto: [
        updated.estudiante.persona.primerApellido,
        updated.estudiante.persona.segundoApellido,
        updated.estudiante.persona.nombres,
      ]
        .filter(Boolean)
        .join(' '),
      estado: updated.estado,
      justificado: updated.justificado,
      observacion: updated.observacion,
    };
  }

  /**
   * Genera estadísticas consolidadas de asistencia por paralelo para un rango de fechas.
   */
  async getAttendanceStats(
    institucionId: string,
    query: QueryAttendanceStatsDto,
    userId: string,
    userRole?: string,
  ) {
    const paralelo = await this.prisma.paralelo.findFirst({
      where: { id: query.paraleloId, institucionId },
    });

    if (!paralelo) {
      throw new NotFoundException('Paralelo no encontrado en esta institución');
    }

    if (userRole === RolInstitucional.MAESTRO) {
      const activeAssignment = await this.prisma.asignacionAcademica.findFirst({
        where: {
          paraleloId: query.paraleloId,
          institucionId,
          estado: EstadoAsignacion.ACTIVA,
          vinculacion: {
            usuarioId: userId,
            institucionId,
            estado: EstadoVinculacion.ACTIVO,
          },
        },
      });

      if (!activeAssignment) {
        throw new ForbiddenException('El maestro no tiene asignación pedagógica activa en este paralelo');
      }
    }

    const registros = await this.prisma.withTenantContext(institucionId, async (tx) => {
      return tx.registroAsistencia.findMany({
        where: {
          institucionId,
          paraleloId: query.paraleloId,
          fecha: {
            gte: new Date(query.fechaInicio),
            lte: new Date(query.fechaFin),
          },
        },
        include: {
          detalles: {
            include: {
              estudiante: {
                include: {
                  persona: true,
                },
              },
            },
          },
        },
        orderBy: { fecha: 'asc' },
      });
    });

    const totalSesiones = registros.length;

    const studentMap = new Map<
      string,
      {
        estudianteId: string;
        nombreCompleto: string;
        presentes: number;
        faltas: number;
        licencias: number;
        atrasos: number;
        totalDetalles: number;
      }
    >();

    for (const reg of registros) {
      for (const d of reg.detalles) {
        let stat = studentMap.get(d.estudianteId);
        if (!stat) {
          const nombreCompleto = [
            d.estudiante.persona.primerApellido,
            d.estudiante.persona.segundoApellido,
            d.estudiante.persona.nombres,
          ]
            .filter(Boolean)
            .join(' ');

          stat = {
            estudianteId: d.estudianteId,
            nombreCompleto,
            presentes: 0,
            faltas: 0,
            licencias: 0,
            atrasos: 0,
            totalDetalles: 0,
          };
          studentMap.set(d.estudianteId, stat);
        }

        stat.totalDetalles++;
        if (d.estado === EstadoAsistencia.PRESENTE) stat.presentes++;
        else if (d.estado === EstadoAsistencia.FALTA) stat.faltas++;
        else if (d.estado === EstadoAsistencia.LICENCIA) stat.licencias++;
        else if (d.estado === EstadoAsistencia.ATRASO) stat.atrasos++;
      }
    }

    let globalPresentes = 0;
    let globalTotal = 0;

    const estudiantesResult = Array.from(studentMap.values()).map((s) => {
      const asistidos = s.presentes + s.atrasos;
      const porcentajeAsistencia =
        s.totalDetalles > 0
          ? Number(((asistidos / s.totalDetalles) * 100).toFixed(1))
          : 100.0;

      globalPresentes += asistidos;
      globalTotal += s.totalDetalles;

      return {
        estudianteId: s.estudianteId,
        nombreCompleto: s.nombreCompleto,
        presentes: s.presentes,
        faltas: s.faltas,
        licencias: s.licencias,
        atrasos: s.atrasos,
        porcentajeAsistencia,
      };
    });

    estudiantesResult.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));

    const porcentajeGlobal =
      globalTotal > 0
        ? Number(((globalPresentes / globalTotal) * 100).toFixed(1))
        : 100.0;

    return {
      totalSesiones,
      porcentajeGlobal,
      estudiantes: estudiantesResult,
    };
  }
}
