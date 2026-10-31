import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EstadoInscripcion,
  EstadoPeriodo,
  RolInstitucional,
  SituacionFinalEstudiante,
  TipoAuditoria,
  TipoPeriodo,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { QueryAnnualCentralizerDto } from './dto/query-annual-centralizer.dto';
import { QueryTrimesterCentralizerDto } from './dto/query-trimester-centralizer.dto';
import { FinalizeCentralizerDto } from './dto/finalize-centralizer.dto';

const UMBRAL_APROBACION = 51;

const ROLES_DIRECTIVOS: RolInstitucional[] = [
  RolInstitucional.ADMIN_INSTITUCIONAL,
  RolInstitucional.DIRECTOR,
  RolInstitucional.SECRETARIO,
  RolInstitucional.COMISION_PEDAGOGICA,
];

const TRIMESTRE_LABELS: Record<TipoPeriodo, string> = {
  PRIMER_TRIMESTRE: '1er Trimestre',
  SEGUNDO_TRIMESTRE: '2do Trimestre',
  TERCER_TRIMESTRE: '3er Trimestre',
};

export interface SubjectMeta {
  materiaId: string;
  codigo: string;
  nombre: string;
}

@Injectable()
export class CentralizersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Centralizador trimestral de paralelo: matriz Estudiantes x Materias con nota
   * final de cada asignatura en la escala 1-100 y estadísticas del aula.
   */
  async getTrimesterCentralizer(
    institucionId: string,
    query: QueryTrimesterCentralizerDto,
    userId: string,
    userRole?: string,
  ) {
    const paralelo = await this.prisma.paralelo.findFirst({
      where: { id: query.paraleloId, institucionId, activo: true },
      include: { curso: true },
    });

    if (!paralelo) {
      throw new NotFoundException('Paralelo no encontrado');
    }

    const periodo = await this.prisma.periodoEvaluacion.findFirst({
      where: { id: query.periodoId, institucionId, activo: true },
    });

    if (!periodo) {
      throw new NotFoundException('Periodo de evaluación no encontrado');
    }

    if (periodo.gestionId !== paralelo.gestionId) {
      throw new BadRequestException(
        'El trimestre consultado no corresponde a la gestión académica del paralelo',
      );
    }

    if (userRole === RolInstitucional.MAESTRO) {
      await this.assertMaestroAsignadoParalelo(
        institucionId,
        paralelo.id,
        paralelo.gestionId,
        userId,
      );
    }

    const materias = await this.getMateriasDelParalelo(
      institucionId,
      paralelo.id,
      paralelo.gestionId,
    );

    const asignacionIds = await this.prisma.asignacionAcademica
      .findMany({
        where: {
          paraleloId: paralelo.id,
          gestionId: paralelo.gestionId,
          institucionId,
          activo: true,
        },
        select: { id: true, materiaId: true },
      })
      .then((rows) => rows.map((r) => ({ id: r.id, materiaId: r.materiaId })));

    const evaluaciones = asignacionIds.length
      ? await this.prisma.evaluacion.findMany({
          where: {
            institucionId,
            asignacionId: { in: asignacionIds.map((a) => a.id) },
            periodoId: periodo.id,
            activo: true,
          },
          include: { calificaciones: true },
        })
      : [];

    // Nota final (0-100) por estudiante y materia: suma de las 5 dimensiones
    const notasPorEstudianteMateria = new Map<string, number>();

    const materiaPorAsignacion = new Map(
      asignacionIds.map((a) => [a.id, a.materiaId]),
    );

    for (const ev of evaluaciones) {
      const materiaId = materiaPorAsignacion.get(ev.asignacionId);
      if (!materiaId) continue;
      for (const cal of ev.calificaciones) {
        const key = `${cal.estudianteId}|${materiaId}`;
        notasPorEstudianteMateria.set(
          key,
          (notasPorEstudianteMateria.get(key) ?? 0) + cal.nota,
        );
      }
    }

    const inscripciones = await this.prisma.inscripcion.findMany({
      where: {
        paraleloId: paralelo.id,
        institucionId,
        estado: EstadoInscripcion.EFECTIVO,
        activo: true,
      },
      include: { estudiante: { include: { persona: true } } },
    });

    const estudiantes = inscripciones.map((ins) => {
      const row = this.mapEstudianteRow(ins);
      let sumaNotas = 0;
      let reprobadas = 0;

      const calificaciones = materias.map((m) => {
        const nota = notasPorEstudianteMateria.get(`${row.estudianteId}|${m.materiaId}`) ?? 0;
        sumaNotas += nota;
        if (nota < UMBRAL_APROBACION) reprobadas += 1;
        return {
          materiaId: m.materiaId,
          codigo: m.codigo,
          nombre: m.nombre,
          nota,
          estado: nota >= UMBRAL_APROBACION ? 'APROBADO' : 'REPROBADO',
        };
      });

      return {
        ...row,
        calificaciones,
        promedioTrimestral:
          materias.length > 0
            ? Number((sumaNotas / materias.length).toFixed(1))
            : 0,
        materiasReprobadas: reprobadas,
      };
    });

    estudiantes.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));

    const aprobadosEnTodo = estudiantes.filter((e) => e.materiasReprobadas === 0).length;
    const promedioGeneralAula =
      estudiantes.length > 0
        ? Number(
            (
              estudiantes.reduce((sum, e) => sum + e.promedioTrimestral, 0) /
              estudiantes.length
            ).toFixed(1),
          )
        : 0;

    return {
      paraleloId: paralelo.id,
      curso: paralelo.curso.nombre,
      paralelo: paralelo.letra,
      periodoId: periodo.id,
      trimestre: TRIMESTRE_LABELS[periodo.periodo],
      materias,
      estudiantes: estudiantes.map((e) => ({
        estudianteId: e.estudianteId,
        codigoRude: e.codigoRude,
        nombreCompleto: e.nombreCompleto,
        calificaciones: e.calificaciones,
        promedioTrimestral: e.promedioTrimestral,
        materiasReprobadas: e.materiasReprobadas,
      })),
      estadisticas: {
        totalEstudiantes: estudiantes.length,
        aprobadosEnTodo,
        conReprobadas: estudiantes.length - aprobadosEnTodo,
        promedioGeneralAula,
      },
    };
  }

  /**
   * Centralizador anual de gestión: promedia las notas de 1T, 2T y 3T por
   * asignatura y determina la situación final tentativa (PROMOVIDO/RETENIDO)
   * sin persistirla hasta el cierre oficial.
   */
  async getAnnualCentralizer(
    institucionId: string,
    query: QueryAnnualCentralizerDto,
    userId: string,
    userRole?: string,
  ) {
    const paralelo = await this.prisma.paralelo.findFirst({
      where: { id: query.paraleloId, institucionId, activo: true },
      include: { curso: true, gestion: true },
    });

    if (!paralelo) {
      throw new NotFoundException('Paralelo no encontrado');
    }

    if (userRole === RolInstitucional.MAESTRO) {
      await this.assertMaestroAsignadoParalelo(
        institucionId,
        paralelo.id,
        paralelo.gestionId,
        userId,
      );
    }

    const data = await this.computeAnnualCentralizer(institucionId, paralelo);

    return {
      paraleloId: paralelo.id,
      curso: paralelo.curso.nombre,
      paralelo: paralelo.letra,
      gestion: paralelo.gestion.anio,
      materias: data.materias,
      estudiantes: data.estudiantes,
      estadisticas: data.estadisticas,
    };
  }

  /**
   * Cierre anual oficial (Nivel 2): valida trimestres concluidos y materias con
   * notas, calcula promedios finales y persiste la Situación Final Oficial en
   * cada matrícula bajo contexto RLS con auditoría inmutable.
   */
  async finalizeAnnualCentralizer(
    institucionId: string,
    dto: FinalizeCentralizerDto,
    userId: string,
    userRole?: string,
  ) {
    if (!userRole || !ROLES_DIRECTIVOS.includes(userRole as RolInstitucional)) {
      throw new ForbiddenException(
        'Requiere rol directivo de Nivel 2 (Director, Secretaría, Administrador o Comisión Pedagógica)',
      );
    }

    const paralelo = await this.prisma.paralelo.findFirst({
      where: { id: dto.paraleloId, institucionId, activo: true },
      include: { curso: true, gestion: true },
    });

    if (!paralelo) {
      throw new NotFoundException('Paralelo no encontrado');
    }

    // Validar que los 3 trimestres estén concluidos
    const periodos = await this.prisma.periodoEvaluacion.findMany({
      where: { gestionId: paralelo.gestionId, institucionId, activo: true },
    });

    const trimestresEsperados = Object.values(TipoPeriodo);
    const periodosCerrados = periodos.filter(
      (p) => p.estado === EstadoPeriodo.CERRADO,
    );
    const cubreTresTrimestres = trimestresEsperados.every((t) =>
      periodosCerrados.some((p) => p.periodo === t),
    );

    if (!cubreTresTrimestres) {
      throw new BadRequestException(
        'Existen trimestres no cerrados o incompletos para efecto del cierre anual',
      );
    }

    const data = await this.computeAnnualCentralizer(institucionId, paralelo);

    // No se permite el cierre con materias sin calificar
    for (const estudiante of data.estudiantes) {
      for (const notaMateria of estudiante.materias) {
        const totalNotas = notaMateria.nota1T + notaMateria.nota2T + notaMateria.nota3T;
        if (totalNotas === 0) {
          throw new BadRequestException(
            `Existen materias sin calificar en la gestión ${paralelo.gestion.anio}. No se permite el cierre anual`,
          );
        }
      }
    }

    await this.prisma.withTenantContext(institucionId, async (tx) => {
      for (const estudiante of data.estudiantes) {
        await tx.inscripcion.updateMany({
          where: {
            institucionId,
            gestionId: paralelo.gestionId,
            paraleloId: paralelo.id,
            estudianteId: estudiante.estudianteId,
            estado: EstadoInscripcion.EFECTIVO,
          },
          data: {
            promedioAnual: estudiante.promedioGeneralAnual,
            situacionFinal: estudiante.situacionFinal,
          },
        });
      }
    });

    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_UPDATE,
      accion: 'CIERRE_ANUAL_PARALELO',
      detalle: {
        paraleloId: paralelo.id,
        gestion: paralelo.gestion.anio,
        totalProcesados: data.estadisticas.totalEstudiantes,
        promovidos: data.estadisticas.promovidos,
        retenidos: data.estadisticas.retenidos,
      },
    });

    return {
      paraleloId: paralelo.id,
      totalProcesados: data.estadisticas.totalEstudiantes,
      promovidos: data.estadisticas.promovidos,
      retenidos: data.estadisticas.retenidos,
      mensaje: `Cierre anual de gestión ${paralelo.gestion.anio} completado. Situaciones finales oficiales registradas`,
    };
  }

  /**
   * Cálculo compartido del centralizador anual (consulta y cierre).
   */
  private async computeAnnualCentralizer(
    institucionId: string,
    paralelo: { id: string; gestionId: string },
  ) {
    const materias = await this.getMateriasDelParalelo(
      institucionId,
      paralelo.id,
      paralelo.gestionId,
    );

    const asignacionIds = await this.prisma.asignacionAcademica
      .findMany({
        where: {
          paraleloId: paralelo.id,
          gestionId: paralelo.gestionId,
          institucionId,
          activo: true,
        },
        select: { id: true, materiaId: true },
      })
      .then((rows) => rows.map((r) => ({ id: r.id, materiaId: r.materiaId })));

    const periodos = await this.prisma.periodoEvaluacion.findMany({
      where: { gestionId: paralelo.gestionId, institucionId, activo: true },
    });

    const evaluaciones = asignacionIds.length
      ? await this.prisma.evaluacion.findMany({
          where: {
            institucionId,
            asignacionId: { in: asignacionIds.map((a) => a.id) },
            activo: true,
          },
          include: { calificaciones: true },
        })
      : [];

    const materiaPorAsignacion = new Map(
      asignacionIds.map((a) => [a.id, a.materiaId]),
    );

    // Nota trimestral (0-100) por estudiante x materia x trimestre
    const notas = new Map<string, number>();

    for (const ev of evaluaciones) {
      const materiaId = materiaPorAsignacion.get(ev.asignacionId);
      if (!materiaId) continue;
      const periodo = periodos.find((p) => p.id === ev.periodoId);
      if (!periodo) continue;

      for (const cal of ev.calificaciones) {
        const key = `${cal.estudianteId}|${materiaId}|${periodo.periodo}`;
        notas.set(key, (notas.get(key) ?? 0) + cal.nota);
      }
    }

    const inscripciones = await this.prisma.inscripcion.findMany({
      where: {
        paraleloId: paralelo.id,
        institucionId,
        estado: EstadoInscripcion.EFECTIVO,
        activo: true,
      },
      include: { estudiante: { include: { persona: true } } },
    });

    const estudiantes = inscripciones.map((ins) => {
      const row = this.mapEstudianteRow(ins);
      let sumaPromedios = 0;
      let reprobadas = 0;

      const materiasConPromedio = materias.map((m) => {
        const nota1T = notas.get(`${row.estudianteId}|${m.materiaId}|PRIMER_TRIMESTRE`) ?? 0;
        const nota2T = notas.get(`${row.estudianteId}|${m.materiaId}|SEGUNDO_TRIMESTRE`) ?? 0;
        const nota3T = notas.get(`${row.estudianteId}|${m.materiaId}|TERCER_TRIMESTRE`) ?? 0;

        const promedioAnual = Math.round((nota1T + nota2T + nota3T) / 3);
        sumaPromedios += promedioAnual;
        if (promedioAnual < UMBRAL_APROBACION) reprobadas += 1;

        return {
          materiaId: m.materiaId,
          nombre: m.nombre,
          nota1T,
          nota2T,
          nota3T,
          promedioAnual,
          estado: promedioAnual >= UMBRAL_APROBACION ? 'APROBADO' : 'REPROBADO',
        };
      });

      const situacionFinal: SituacionFinalEstudiante =
        reprobadas === 0 ? 'PROMOVIDO' : 'RETENIDO';

      return {
        ...row,
        materias: materiasConPromedio,
        promedioGeneralAnual:
          materias.length > 0
            ? Number((sumaPromedios / materias.length).toFixed(1))
            : 0,
        situacionFinal,
      };
    });

    estudiantes.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));

    const promovidos = estudiantes.filter((e) => e.situacionFinal === 'PROMOVIDO').length;
    const promedioGeneralGestion =
      estudiantes.length > 0
        ? Number(
            (
              estudiantes.reduce((sum, e) => sum + e.promedioGeneralAnual, 0) /
              estudiantes.length
            ).toFixed(1),
          )
        : 0;

    return {
      materias,
      estudiantes,
      estadisticas: {
        totalEstudiantes: estudiantes.length,
        promovidos,
        retenidos: estudiantes.length - promovidos,
        promedioGeneralGestion,
      },
    };
  }

  /**
   * Lista de materias de la malla curricular del paralelo, ordenada por la
   * malla curricular (orden de la materia) y sin duplicados.
   */
  private async getMateriasDelParalelo(
    institucionId: string,
    paraleloId: string,
    gestionId: string,
  ): Promise<SubjectMeta[]> {
    const asignaciones = await this.prisma.asignacionAcademica.findMany({
      where: { paraleloId, gestionId, institucionId, activo: true },
      include: { materia: true },
    });

    const porMateria = new Map<string, SubjectMeta>();
    for (const asig of asignaciones) {
      if (!porMateria.has(asig.materiaId)) {
        porMateria.set(asig.materiaId, {
          materiaId: asig.materiaId,
          codigo: asig.materia.codigo,
          nombre: asig.materia.nombre,
        });
      }
    }

    return [...porMateria.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  /**
   * Un maestro sólo consulta centralizadores de paralelos con asignación activa.
   */
  private async assertMaestroAsignadoParalelo(
    institucionId: string,
    paraleloId: string,
    gestionId: string,
    userId: string,
  ): Promise<void> {
    const count = await this.prisma.asignacionAcademica.count({
      where: {
        paraleloId,
        gestionId,
        institucionId,
        activo: true,
        vinculacion: { usuarioId: userId },
      },
    });

    if (count === 0) {
      throw new ForbiddenException(
        'El maestro no tiene asignación pedagógica activa en este paralelo',
      );
    }
  }

  private mapEstudianteRow(ins: {
    estudianteId: string;
    estudiante: {
      codigoRude: string;
      persona: {
        nombres: string;
        primerApellido: string;
        segundoApellido: string | null;
      };
    };
  }) {
    const p = ins.estudiante.persona;
    return {
      estudianteId: ins.estudianteId,
      codigoRude: ins.estudiante.codigoRude,
      nombreCompleto: [p.primerApellido, p.segundoApellido, p.nombres]
        .filter(Boolean)
        .join(' '),
    };
  }
}
