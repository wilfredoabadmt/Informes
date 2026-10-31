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
  DimensionEvaluacion,
  EstadoAsignacion,
  EstadoGestion,
  EstadoPeriodo,
  EstadoVinculacion,
  RolInstitucional,
  TipoAuditoria,
} from '@prisma/client';
import { CreateEvaluationPeriodDto } from './dto/create-evaluation-period.dto';
import { UpdatePeriodStatusDto } from './dto/update-period-status.dto';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { QueryEvaluationsDto } from './dto/query-evaluations.dto';

export const DIMENSION_LIMITS: Record<DimensionEvaluacion, number> = {
  [DimensionEvaluacion.SER]: 10,
  [DimensionEvaluacion.SABER]: 35,
  [DimensionEvaluacion.HACER]: 35,
  [DimensionEvaluacion.DECIDIR]: 10,
  [DimensionEvaluacion.AUTOEVALUACION]: 10,
};

@Injectable()
export class EvaluationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // -------------------------------------------------------------
  // GESTIÓN DE PERIODOS EVALUATIVOS (TRIMESTRES - NIVEL 2)
  // -------------------------------------------------------------

  /**
   * Configura un trimestre oficial en la gestión escolar de la institución.
   */
  async createEvaluationPeriod(
    institucionId: string,
    dto: CreateEvaluationPeriodDto,
    userId: string,
  ) {
    const fInicio = new Date(dto.fechaInicio);
    const fFin = new Date(dto.fechaFin);
    const fLimite = new Date(dto.fechaLimiteNotas);

    if (fInicio >= fFin) {
      throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    if (fLimite < fFin) {
      throw new BadRequestException(
        'La fecha límite de notas debe ser posterior o igual a la fecha de fin del trimestre',
      );
    }

    const gestion = await this.prisma.gestionEscolar.findFirst({
      where: { id: dto.gestionId, institucionId },
    });

    if (!gestion) {
      throw new NotFoundException('Gestión escolar no encontrada en esta institución');
    }

    if (gestion.estado === EstadoGestion.CERRADA) {
      throw new BadRequestException(
        'No se pueden configurar periodos en una gestión escolar cerrada',
      );
    }

    const existing = await this.prisma.periodoEvaluacion.findFirst({
      where: { gestionId: dto.gestionId, periodo: dto.periodo },
    });

    if (existing) {
      throw new ConflictException(
        'El trimestre ya se encuentra registrado para esta gestión escolar',
      );
    }

    const created = await this.prisma.withTenantContext(institucionId, async (tx) => {
      return tx.periodoEvaluacion.create({
        data: {
          institucionId,
          gestionId: dto.gestionId,
          periodo: dto.periodo,
          fechaInicio: fInicio,
          fechaFin: fFin,
          fechaLimiteNotas: fLimite,
          estado: EstadoPeriodo.PROGRAMADO,
        },
      });
    });

    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_CREATE,
      accion: 'CONFIGURACION_TRIMESTRE',
      detalle: {
        periodoId: created.id,
        periodo: created.periodo,
        gestionId: dto.gestionId,
      },
    });

    return created;
  }

  /**
   * Lista los periodos evaluativos registrados para una gestión escolar.
   */
  async getEvaluationPeriods(institucionId: string, gestionId: string) {
    const gestion = await this.prisma.gestionEscolar.findFirst({
      where: { id: gestionId, institucionId },
    });

    if (!gestion) {
      throw new NotFoundException('Gestión escolar no encontrada en esta institución');
    }

    return this.prisma.withTenantContext(institucionId, async (tx) => {
      return tx.periodoEvaluacion.findMany({
        where: { institucionId, gestionId, activo: true },
        orderBy: { fechaInicio: 'asc' },
      });
    });
  }

  /**
   * Conmuta el estado de un trimestre (PROGRAMADO, ABIERTO, CERRADO).
   * Solo un trimestre puede estar ABIERTO simultáneamente en la misma gestión.
   */
  async updatePeriodStatus(
    institucionId: string,
    periodId: string,
    dto: UpdatePeriodStatusDto,
    userId: string,
  ) {
    const period = await this.prisma.periodoEvaluacion.findFirst({
      where: { id: periodId, institucionId },
    });

    if (!period) {
      throw new NotFoundException('Periodo de evaluación no encontrado');
    }

    if (dto.estado === EstadoPeriodo.ABIERTO) {
      const openPeriod = await this.prisma.periodoEvaluacion.findFirst({
        where: {
          gestionId: period.gestionId,
          estado: EstadoPeriodo.ABIERTO,
          id: { not: periodId },
        },
      });

      if (openPeriod) {
        throw new BadRequestException(
          'Ya existe otro trimestre abierto en esta gestión escolar. Debe cerrarlo antes de abrir uno nuevo.',
        );
      }
    }

    const updated = await this.prisma.withTenantContext(institucionId, async (tx) => {
      return tx.periodoEvaluacion.update({
        where: { id: periodId },
        data: { estado: dto.estado },
      });
    });

    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_UPDATE,
      accion: 'CAMBIO_ESTADO_TRIMESTRE',
      detalle: {
        periodoId: periodId,
        estadoAnterior: period.estado,
        nuevoEstado: dto.estado,
      },
    });

    return updated;
  }

  // -------------------------------------------------------------
  // INSTRUMENTOS DE EVALUACIÓN DOCENTE (NIVEL 3)
  // -------------------------------------------------------------

  /**
   * Crea un instrumento de evaluación para una materia, paralelo y dimensión evaluativa SEP.
   */
  async createEvaluation(
    institucionId: string,
    dto: CreateEvaluationDto,
    userId: string,
    userRole?: string,
  ) {
    // 1. Validar asignación docente activa
    const assignment = await this.prisma.asignacionAcademica.findFirst({
      where: {
        id: dto.asignacionId,
        institucionId,
        estado: EstadoAsignacion.ACTIVA,
      },
      include: {
        vinculacion: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Asignación académica no encontrada');
    }

    if (userRole === RolInstitucional.MAESTRO) {
      if (
        assignment.vinculacion.usuarioId !== userId ||
        assignment.vinculacion.estado !== EstadoVinculacion.ACTIVO
      ) {
        throw new ForbiddenException(
          'El maestro no tiene asignación pedagógica activa para esta materia y paralelo',
        );
      }
    }

    // 2. Validar que el trimestre exista y esté ABIERTO
    const period = await this.prisma.periodoEvaluacion.findFirst({
      where: { id: dto.periodoId, institucionId, activo: true },
    });

    if (!period) {
      throw new NotFoundException('Periodo de evaluación no encontrado');
    }

    if (period.estado !== EstadoPeriodo.ABIERTO) {
      throw new BadRequestException(
        'Solo se pueden crear evaluaciones cuando el trimestre se encuentra ABIERTO',
      );
    }

    // 3. Validar rango de fechas de la evaluación
    const evalDate = new Date(dto.fechaEvaluacion);
    const pInicio = new Date(period.fechaInicio);
    const pFin = new Date(period.fechaFin);

    if (evalDate < pInicio || evalDate > pFin) {
      throw new BadRequestException(
        'La fecha de la evaluación debe estar comprendida dentro del rango del trimestre',
      );
    }

    // 4. Validar tope estatuario de la dimensión
    const maxDimension = DIMENSION_LIMITS[dto.dimension];
    if (dto.puntajeMaximo > maxDimension) {
      throw new BadRequestException(
        `El puntaje máximo para la dimensión ${dto.dimension} no puede superar ${maxDimension} puntos`,
      );
    }

    // 5. Validar que la sumatoria de instrumentos en esta dimensión no supere el tope
    const existingEvals = await this.prisma.evaluacion.findMany({
      where: {
        institucionId,
        asignacionId: dto.asignacionId,
        periodoId: dto.periodoId,
        dimension: dto.dimension,
        activo: true,
      },
    });

    const currentTotal = existingEvals.reduce((sum, e) => sum + e.puntajeMaximo, 0);
    if (currentTotal + dto.puntajeMaximo > maxDimension) {
      throw new BadRequestException(
        `La sumatoria de evaluaciones para la dimensión ${dto.dimension} (${currentTotal + dto.puntajeMaximo}) excede el tope reglamentario de ${maxDimension} puntos`,
      );
    }

    // 6. Persistir en transacción RLS
    const created = await this.prisma.withTenantContext(institucionId, async (tx) => {
      return tx.evaluacion.create({
        data: {
          institucionId,
          asignacionId: dto.asignacionId,
          periodoId: dto.periodoId,
          dimension: dto.dimension,
          nombre: dto.nombre,
          descripcion: dto.descripcion || null,
          puntajeMaximo: dto.puntajeMaximo,
          fechaEvaluacion: evalDate,
        },
      });
    });

    // 7. Auditoría
    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_CREATE,
      accion: 'CREACION_EVALUACION',
      detalle: {
        evaluacionId: created.id,
        asignacionId: dto.asignacionId,
        periodoId: dto.periodoId,
        dimension: dto.dimension,
        puntajeMaximo: dto.puntajeMaximo,
      },
    });

    return created;
  }

  /**
   * Consulta los instrumentos de evaluación programados para una asignación y trimestre.
   */
  async getEvaluations(
    institucionId: string,
    query: QueryEvaluationsDto,
    userId: string,
    userRole?: string,
  ) {
    const assignment = await this.prisma.asignacionAcademica.findFirst({
      where: { id: query.asignacionId, institucionId },
      include: { vinculacion: true },
    });

    if (!assignment) {
      throw new NotFoundException('Asignación académica no encontrada');
    }

    if (userRole === RolInstitucional.MAESTRO) {
      if (assignment.vinculacion.usuarioId !== userId) {
        throw new ForbiddenException(
          'No tiene permisos para consultar evaluaciones de una asignación ajena',
        );
      }
    }

    return this.prisma.withTenantContext(institucionId, async (tx) => {
      return tx.evaluacion.findMany({
        where: {
          institucionId,
          asignacionId: query.asignacionId,
          periodoId: query.periodoId,
          activo: true,
        },
        orderBy: [{ dimension: 'asc' }, { fechaEvaluacion: 'asc' }],
      });
    });
  }

  /**
   * Modifica un instrumento de evaluación (solo si el trimestre está ABIERTO).
   */
  async updateEvaluation(
    institucionId: string,
    id: string,
    dto: UpdateEvaluationDto,
    userId: string,
    userRole?: string,
  ) {
    const evalRecord = await this.prisma.evaluacion.findFirst({
      where: { id, institucionId, activo: true },
      include: {
        periodo: true,
        asignacion: { include: { vinculacion: true } },
      },
    });

    if (!evalRecord) {
      throw new NotFoundException('Instrumento de evaluación no encontrado');
    }

    if (evalRecord.periodo.estado !== EstadoPeriodo.ABIERTO) {
      throw new BadRequestException(
        'No se puede modificar una evaluación de un trimestre cerrado o programado',
      );
    }

    if (userRole === RolInstitucional.MAESTRO) {
      if (evalRecord.asignacion.vinculacion.usuarioId !== userId) {
        throw new ForbiddenException('No tiene permisos para modificar esta evaluación');
      }
    }

    let updatedDate: Date | undefined;
    if (dto.fechaEvaluacion) {
      updatedDate = new Date(dto.fechaEvaluacion);
      const pInicio = new Date(evalRecord.periodo.fechaInicio);
      const pFin = new Date(evalRecord.periodo.fechaFin);
      if (updatedDate < pInicio || updatedDate > pFin) {
        throw new BadRequestException(
          'La fecha de la evaluación debe estar comprendida dentro del rango del trimestre',
        );
      }
    }

    if (dto.puntajeMaximo !== undefined) {
      const maxDim = DIMENSION_LIMITS[evalRecord.dimension];
      if (dto.puntajeMaximo > maxDim) {
        throw new BadRequestException(
          `El puntaje máximo para la dimensión ${evalRecord.dimension} no puede superar ${maxDim} puntos`,
        );
      }

      // Sum of other evaluations in this dimension
      const otherEvals = await this.prisma.evaluacion.findMany({
        where: {
          institucionId,
          asignacionId: evalRecord.asignacionId,
          periodoId: evalRecord.periodoId,
          dimension: evalRecord.dimension,
          activo: true,
          id: { not: id },
        },
      });

      const otherTotal = otherEvals.reduce((sum, e) => sum + e.puntajeMaximo, 0);
      if (otherTotal + dto.puntajeMaximo > maxDim) {
        throw new BadRequestException(
          `La sumatoria de evaluaciones para la dimensión ${evalRecord.dimension} (${otherTotal + dto.puntajeMaximo}) excede el tope reglamentario de ${maxDim} puntos`,
        );
      }
    }

    const updated = await this.prisma.withTenantContext(institucionId, async (tx) => {
      return tx.evaluacion.update({
        where: { id },
        data: {
          ...(dto.nombre ? { nombre: dto.nombre } : {}),
          ...(dto.descripcion !== undefined ? { descripcion: dto.descripcion } : {}),
          ...(dto.puntajeMaximo !== undefined ? { puntajeMaximo: dto.puntajeMaximo } : {}),
          ...(updatedDate ? { fechaEvaluacion: updatedDate } : {}),
        },
      });
    });

    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_UPDATE,
      accion: 'MODIFICACION_EVALUACION',
      detalle: { evaluacionId: id, cambios: dto },
    });

    return updated;
  }

  /**
   * Desactiva (soft-delete) un instrumento de evaluación (solo si el trimestre está ABIERTO).
   */
  async deleteEvaluation(
    institucionId: string,
    id: string,
    userId: string,
    userRole?: string,
  ) {
    const evalRecord = await this.prisma.evaluacion.findFirst({
      where: { id, institucionId, activo: true },
      include: {
        periodo: true,
        asignacion: { include: { vinculacion: true } },
      },
    });

    if (!evalRecord) {
      throw new NotFoundException('Instrumento de evaluación no encontrado');
    }

    if (evalRecord.periodo.estado !== EstadoPeriodo.ABIERTO) {
      throw new BadRequestException(
        'No se puede eliminar una evaluación de un trimestre cerrado',
      );
    }

    if (userRole === RolInstitucional.MAESTRO) {
      if (evalRecord.asignacion.vinculacion.usuarioId !== userId) {
        throw new ForbiddenException('No tiene permisos para eliminar esta evaluación');
      }
    }

    await this.prisma.withTenantContext(institucionId, async (tx) => {
      await tx.evaluacion.update({
        where: { id },
        data: { activo: false },
      });
    });

    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_UPDATE,
      accion: 'ELIMINACION_EVALUACION',
      detalle: { evaluacionId: id },
    });

    return { message: 'Evaluación eliminada exitosamente' };
  }
}
