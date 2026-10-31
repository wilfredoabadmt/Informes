import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  DimensionEvaluacion,
  EstadoInscripcion,
  EstadoPeriodo,
  RolInstitucional,
  TipoAuditoria,
} from '@prisma/client';
import { RecordGradesBatchDto } from './dto/record-grades-batch.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { QueryTrimesterSheetDto } from './dto/query-trimester-sheet.dto';

@Injectable()
export class GradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Asienta calificaciones en bloque para un instrumento de evaluación (Nivel 3).
   */
  async recordGradesBatch(
    institucionId: string,
    dto: RecordGradesBatchDto,
    userId: string,
    userRole?: string,
  ) {
    // 1. Validar que la evaluación exista y pertenezca al tenant
    const evaluacion = await this.prisma.evaluacion.findFirst({
      where: { id: dto.evaluacionId, institucionId, activo: true },
      include: {
        periodo: true,
        asignacion: { include: { vinculacion: true } },
      },
    });

    if (!evaluacion) {
      throw new NotFoundException('Evaluación no encontrada');
    }

    // 2. Validar titularidad docente si el usuario es MAESTRO
    if (userRole === RolInstitucional.MAESTRO) {
      if (evaluacion.asignacion.vinculacion.usuarioId !== userId) {
        throw new ForbiddenException(
          'El maestro no tiene asignación pedagógica activa para esta evaluación',
        );
      }
    }

    // 3. Validar que el trimestre asociado esté ABIERTO
    if (evaluacion.periodo.estado !== EstadoPeriodo.ABIERTO) {
      throw new BadRequestException(
        'Solo se pueden registrar calificaciones cuando el trimestre se encuentra ABIERTO',
      );
    }

    // 4. Validar rango numérico de cada calificación
    for (const item of dto.calificaciones) {
      if (item.nota < 0 || item.nota > evaluacion.puntajeMaximo) {
        throw new BadRequestException(
          `La calificación de ${item.nota} excede el rango permitido (0 a ${evaluacion.puntajeMaximo})`,
        );
      }
    }

    // 5. Validar que todos los estudiantes pertenezcan al paralelo con matrícula EFECTIVO
    const enrollments = await this.prisma.inscripcion.findMany({
      where: {
        paraleloId: evaluacion.asignacion.paraleloId,
        institucionId,
        estado: EstadoInscripcion.EFECTIVO,
        activo: true,
      },
      select: { estudianteId: true },
    });

    const enrolledIds = new Set(enrollments.map((e) => e.estudianteId));

    for (const item of dto.calificaciones) {
      if (!enrolledIds.has(item.estudianteId)) {
        throw new BadRequestException(
          `El estudiante con ID ${item.estudianteId} no tiene una matrícula efectiva en este paralelo`,
        );
      }
    }

    // 6. Transacción interactiva atómica con upsert bajo contexto RLS
    await this.prisma.withTenantContext(institucionId, async (tx) => {
      for (const item of dto.calificaciones) {
        await tx.calificacion.upsert({
          where: {
            evaluacionId_estudianteId: {
              evaluacionId: dto.evaluacionId,
              estudianteId: item.estudianteId,
            },
          },
          update: {
            nota: item.nota,
            observacion: item.observacion || null,
          },
          create: {
            institucionId,
            evaluacionId: dto.evaluacionId,
            estudianteId: item.estudianteId,
            nota: item.nota,
            observacion: item.observacion || null,
          },
        });
      }
    });

    // 7. Auditoría inmutable
    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_CREATE,
      accion: 'ASENTAMIENTO_CALIFICACIONES',
      detalle: {
        evaluacionId: dto.evaluacionId,
        totalCalificados: dto.calificaciones.length,
      },
    });

    const totalNotas = dto.calificaciones.reduce((sum, c) => sum + c.nota, 0);
    const promedioGrupo =
      dto.calificaciones.length > 0
        ? Number((totalNotas / dto.calificaciones.length).toFixed(1))
        : 0;

    return {
      evaluacionId: dto.evaluacionId,
      totalCalificados: dto.calificaciones.length,
      puntajeMaximo: evaluacion.puntajeMaximo,
      promedioGrupo,
    };
  }

  /**
   * Consulta la planilla de notas de una evaluación específica.
   */
  async getGradesByEvaluation(
    institucionId: string,
    evaluacionId: string,
    userId: string,
    userRole?: string,
  ) {
    const evaluacion = await this.prisma.evaluacion.findFirst({
      where: { id: evaluacionId, institucionId, activo: true },
      include: { asignacion: { include: { vinculacion: true } } },
    });

    if (!evaluacion) {
      throw new NotFoundException('Evaluación no encontrada');
    }

    if (userRole === RolInstitucional.MAESTRO) {
      if (evaluacion.asignacion.vinculacion.usuarioId !== userId) {
        throw new ForbiddenException(
          'No tiene permisos para ver las notas de esta evaluación',
        );
      }
    }

    const calificaciones = await this.prisma.withTenantContext(institucionId, async (tx) => {
      return tx.calificacion.findMany({
        where: { institucionId, evaluacionId },
        include: {
          estudiante: { include: { persona: true } },
        },
      });
    });

    const sortedCalificaciones = [...calificaciones].sort((a, b) => {
      const pA = a.estudiante.persona;
      const pB = b.estudiante.persona;
      const apeA = `${pA.primerApellido} ${pA.segundoApellido || ''}`.trim().toLowerCase();
      const apeB = `${pB.primerApellido} ${pB.segundoApellido || ''}`.trim().toLowerCase();
      if (apeA !== apeB) return apeA.localeCompare(apeB);
      return pA.nombres.toLowerCase().localeCompare(pB.nombres.toLowerCase());
    });

    return {
      evaluacion: {
        id: evaluacion.id,
        nombre: evaluacion.nombre,
        dimension: evaluacion.dimension,
        puntajeMaximo: evaluacion.puntajeMaximo,
      },
      calificaciones: sortedCalificaciones.map((c) => ({
        id: c.id,
        evaluacionId: c.evaluacionId,
        estudianteId: c.estudianteId,
        codigoRude: c.estudiante.codigoRude,
        nombreCompleto: [
          c.estudiante.persona.primerApellido,
          c.estudiante.persona.segundoApellido,
          c.estudiante.persona.nombres,
        ]
          .filter(Boolean)
          .join(' '),
        nota: c.nota,
        observacion: c.observacion,
      })),
    };
  }

  /**
   * Consulta la planilla trimestral consolidada de notas con subtotales por dimensión y nota final (0-100).
   */
  async getTrimesterGradesSheet(
    institucionId: string,
    query: QueryTrimesterSheetDto,
    userId: string,
    userRole?: string,
  ) {
    const asignacion = await this.prisma.asignacionAcademica.findFirst({
      where: { id: query.asignacionId, institucionId, activo: true },
      include: {
        materia: true,
        paralelo: { include: { curso: true } },
        vinculacion: true,
      },
    });

    if (!asignacion) {
      throw new NotFoundException('Asignación académica no encontrada');
    }

    if (userRole === RolInstitucional.MAESTRO) {
      if (asignacion.vinculacion.usuarioId !== userId) {
        throw new ForbiddenException(
          'No tiene permisos para ver la planilla de esta asignación',
        );
      }
    }

    const periodo = await this.prisma.periodoEvaluacion.findFirst({
      where: { id: query.periodoId, institucionId, activo: true },
    });

    if (!periodo) {
      throw new NotFoundException('Periodo de evaluación no encontrado');
    }

    // Estudiantes con matrícula EFECTIVO en el paralelo
    const enrollments = await this.prisma.inscripcion.findMany({
      where: {
        paraleloId: asignacion.paraleloId,
        institucionId,
        estado: EstadoInscripcion.EFECTIVO,
        activo: true,
      },
      include: {
        estudiante: { include: { persona: true } },
      },
    });

    // Evaluaciones del trimestre con sus notas
    const evaluaciones = await this.prisma.evaluacion.findMany({
      where: {
        institucionId,
        asignacionId: query.asignacionId,
        periodoId: query.periodoId,
        activo: true,
      },
      include: {
        calificaciones: true,
      },
    });

    const estudiantesSummary = enrollments.map((enr) => {
      const eId = enr.estudianteId;
      let subtotalSer = 0;
      let subtotalSaber = 0;
      let subtotalHacer = 0;
      let subtotalDecidir = 0;
      let subtotalAutoevaluacion = 0;

      for (const ev of evaluaciones) {
        const cal = ev.calificaciones.find((c) => c.estudianteId === eId);
        if (cal) {
          if (ev.dimension === DimensionEvaluacion.SER) subtotalSer += cal.nota;
          else if (ev.dimension === DimensionEvaluacion.SABER) subtotalSaber += cal.nota;
          else if (ev.dimension === DimensionEvaluacion.HACER) subtotalHacer += cal.nota;
          else if (ev.dimension === DimensionEvaluacion.DECIDIR) subtotalDecidir += cal.nota;
          else if (ev.dimension === DimensionEvaluacion.AUTOEVALUACION)
            subtotalAutoevaluacion += cal.nota;
        }
      }

      const notaFinal =
        subtotalSer +
        subtotalSaber +
        subtotalHacer +
        subtotalDecidir +
        subtotalAutoevaluacion;

      const estadoAprobacion = notaFinal >= 51 ? 'APROBADO' : 'EN_DESARROLLO';

      const p = enr.estudiante.persona;
      const nombreCompleto = [p.primerApellido, p.segundoApellido, p.nombres]
        .filter(Boolean)
        .join(' ');

      return {
        estudianteId: eId,
        codigoRude: enr.estudiante.codigoRude,
        nombreCompleto,
        subtotalSer,
        subtotalSaber,
        subtotalHacer,
        subtotalDecidir,
        subtotalAutoevaluacion,
        notaFinal,
        estadoAprobacion,
      };
    });

    estudiantesSummary.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));

    return {
      asignacionId: asignacion.id,
      periodoId: periodo.id,
      materia: asignacion.materia.nombre,
      paralelo: `${asignacion.paralelo.curso.nombre} "${asignacion.paralelo.letra}"`,
      estudiantes: estudiantesSummary,
    };
  }

  /**
   * Modifica individualmente una calificación con justificación y auditoría (Nivel 2 y Nivel 3).
   */
  async updateGrade(
    institucionId: string,
    id: string,
    dto: UpdateGradeDto,
    userId: string,
    userRole?: string,
  ) {
    const calificacion = await this.prisma.calificacion.findFirst({
      where: { id, institucionId },
      include: {
        evaluacion: {
          include: {
            periodo: true,
            asignacion: { include: { vinculacion: true } },
          },
        },
        estudiante: { include: { persona: true } },
      },
    });

    if (!calificacion) {
      throw new NotFoundException('Calificación no encontrada');
    }

    if (calificacion.evaluacion.periodo.estado !== EstadoPeriodo.ABIERTO) {
      throw new BadRequestException(
        'No se puede modificar calificaciones en un trimestre cerrado o programado',
      );
    }

    if (userRole === RolInstitucional.MAESTRO) {
      if (calificacion.evaluacion.asignacion.vinculacion.usuarioId !== userId) {
        throw new ForbiddenException(
          'No tiene permisos para modificar esta calificación',
        );
      }
    }

    if (dto.nota < 0 || dto.nota > calificacion.evaluacion.puntajeMaximo) {
      throw new BadRequestException(
        `La calificación de ${dto.nota} excede el rango permitido (0 a ${calificacion.evaluacion.puntajeMaximo})`,
      );
    }

    const updated = await this.prisma.withTenantContext(institucionId, async (tx) => {
      return tx.calificacion.update({
        where: { id },
        data: {
          nota: dto.nota,
          ...(dto.observacion !== undefined ? { observacion: dto.observacion } : {}),
        },
        include: {
          estudiante: { include: { persona: true } },
        },
      });
    });

    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_UPDATE,
      accion: 'RECTIFICACION_CALIFICACION',
      detalle: {
        calificacionId: id,
        evaluacionId: calificacion.evaluacionId,
        estudianteId: calificacion.estudianteId,
        notaAnterior: calificacion.nota,
        nuevaNota: dto.nota,
        motivo: dto.motivoRectificacion || null,
      },
    });

    return {
      id: updated.id,
      evaluacionId: updated.evaluacionId,
      estudianteId: updated.estudianteId,
      codigoRude: updated.estudiante.codigoRude,
      nombreCompleto: [
        updated.estudiante.persona.primerApellido,
        updated.estudiante.persona.segundoApellido,
        updated.estudiante.persona.nombres,
      ]
        .filter(Boolean)
        .join(' '),
      nota: updated.nota,
      observacion: updated.observacion,
    };
  }
}

