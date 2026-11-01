import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DimensionEvaluacion,
  EstadoAsistencia,
  EstadoInscripcion,
  SituacionFinalEstudiante,
  TipoAuditoria,
  TipoPeriodo,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PdfGeneratorService } from './pdf-generator.service';
import {
  QueryCourseRosterDto,
  QueryTrimesterBulletinDto,
  QuerySchoolReportCardDto,
} from './dto';

const UMBRAL_APROBACION = 51;

const TRIMESTRE_INFO: Record<TipoPeriodo, { numero: number; nombre: string }> = {
  PRIMER_TRIMESTRE: { numero: 1, nombre: '1er Trimestre' },
  SEGUNDO_TRIMESTRE: { numero: 2, nombre: '2do Trimestre' },
  TERCER_TRIMESTRE: { numero: 3, nombre: '3er Trimestre' },
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly pdfGenerator: PdfGeneratorService,
  ) {}

  /**
   * Obtiene la nómina oficial del curso y paralelo en formato JSON estructurado
   */
  async getCourseRoster(
    institucionId: string,
    query: QueryCourseRosterDto,
    userId: string,
    userRole?: string,
  ) {
    const paralelo = await this.prisma.paralelo.findFirst({
      where: { id: query.paraleloId, institucionId, activo: true },
      include: {
        curso: true,
        institucion: true,
        gestion: true,
      },
    });

    if (!paralelo) {
      throw new NotFoundException('Paralelo no encontrado');
    }

    const inscripciones = await this.prisma.inscripcion.findMany({
      where: {
        paraleloId: query.paraleloId,
        institucionId,
        estado: EstadoInscripcion.EFECTIVO,
        activo: true,
      },
      include: {
        estudiante: {
          include: {
            persona: true,
          },
        },
      },
    });

    // Ordenamiento alfabético por apellidos y nombres
    const sorted = [...inscripciones].sort((a, b) => {
      const apeA = `${a.estudiante.persona.primerApellido} ${a.estudiante.persona.segundoApellido || ''}`.trim();
      const apeB = `${b.estudiante.persona.primerApellido} ${b.estudiante.persona.segundoApellido || ''}`.trim();
      const cmp = apeA.localeCompare(apeB, 'es');
      if (cmp !== 0) return cmp;
      return a.estudiante.persona.nombres.localeCompare(b.estudiante.persona.nombres, 'es');
    });

    const estudiantes = sorted.map((ins, index) => {
      const p = ins.estudiante.persona;
      const ciConComp = p.complemento ? `${p.ci}-${p.complemento}` : p.ci;
      const apellidos = `${p.primerApellido} ${p.segundoApellido || ''}`.trim();
      return {
        numero: index + 1,
        inscripcionId: ins.id,
        rude: ins.estudiante.codigoRude,
        ci: ciConComp,
        apellidos,
        nombres: p.nombres,
        genero: p.genero,
        fechaNacimiento: p.fechaNacimiento ? p.fechaNacimiento.toISOString().split('T')[0] : '',
        tutorNombre: ins.estudiante.nombreTutor || null,
        tutorTelefono: ins.estudiante.telefonoTutor || p.telefono || null,
      };
    });

    const report = {
      institucion: {
        sie: paralelo.institucion.sie,
        nombre: paralelo.institucion.nombre,
        distrito: paralelo.institucion.distrito,
        departamento: paralelo.institucion.departamento,
      },
      academico: {
        gestion: paralelo.gestion.anio,
        nivel: paralelo.curso.nivel,
        curso: paralelo.curso.nombre,
        paralelo: paralelo.letra,
        turno: paralelo.turno,
      },
      totalEstudiantes: estudiantes.length,
      generadoEn: new Date().toISOString(),
      estudiantes,
    };

    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_UPDATE,
      accion: 'REPORT_ROSTER_GENERATED',
      detalle: {
        paraleloId: query.paraleloId,
        totalEstudiantes: estudiantes.length,
      },
    });

    return report;
  }

  async getCourseRosterPdf(
    institucionId: string,
    query: QueryCourseRosterDto,
    userId: string,
    userRole?: string,
  ) {
    const data = await this.getCourseRoster(institucionId, query, userId, userRole);
    const buffer = await this.pdfGenerator.generateCourseRosterPdf(data);
    const filename = `lista_${data.academico.curso}_${data.academico.paralelo}_${data.academico.gestion}.pdf`
      .replace(/\s+/g, '_')
      .toLowerCase();

    return { buffer, filename };
  }

  /**
   * Obtiene el boletín trimestral de calificaciones para un estudiante
   */
  async getTrimesterBulletin(
    institucionId: string,
    query: QueryTrimesterBulletinDto,
    userId: string,
    userRole?: string,
  ) {
    const inscripcion = await this.prisma.inscripcion.findFirst({
      where: { id: query.inscripcionId, institucionId, activo: true },
      include: {
        estudiante: {
          include: {
            persona: true,
          },
        },
        paralelo: {
          include: {
            curso: true,
          },
        },
        institucion: true,
        gestion: true,
      },
    });

    if (!inscripcion) {
      throw new NotFoundException('Inscripción no encontrada');
    }

    const periodo = await this.prisma.periodoEvaluacion.findFirst({
      where: { id: query.periodoId, institucionId, activo: true },
    });

    if (!periodo) {
      throw new NotFoundException('Periodo de evaluación no encontrado');
    }

    if (periodo.gestionId !== inscripcion.gestionId) {
      throw new BadRequestException('El periodo no pertenece a la gestión de la inscripción');
    }

    // Materias asignadas al paralelo
    const asignaciones = await this.prisma.asignacionAcademica.findMany({
      where: { paraleloId: inscripcion.paraleloId, institucionId, activo: true },
      include: { materia: true },
      orderBy: { materia: { nombre: 'asc' } },
    });

    const asignacionIds = asignaciones.map((a) => a.id);
    const evaluaciones = await this.prisma.evaluacion.findMany({
      where: {
        asignacionId: { in: asignacionIds },
        periodoId: query.periodoId,
        institucionId,
        activo: true,
      },
      include: {
        calificaciones: {
          where: { estudianteId: inscripcion.estudianteId },
        },
      },
    });

    const materias = asignaciones.map((asig) => {
      const evals = evaluaciones.filter((e) => e.asignacionId === asig.id);
      const dims = {
        ser: 0,
        saber: 0,
        hacer: 0,
        decidir: 0,
        autoevaluacion: 0,
      };

      let apreciacionCualitativa: string | null = null;

      evals.forEach((ev) => {
        const cal = ev.calificaciones[0];
        if (!cal) return;

        if (cal.observacion && !apreciacionCualitativa) {
          apreciacionCualitativa = cal.observacion;
        }

        switch (ev.dimension) {
          case DimensionEvaluacion.SER:
            dims.ser += cal.nota;
            break;
          case DimensionEvaluacion.SABER:
            dims.saber += cal.nota;
            break;
          case DimensionEvaluacion.HACER:
            dims.hacer += cal.nota;
            break;
          case DimensionEvaluacion.DECIDIR:
            dims.decidir += cal.nota;
            break;
          case DimensionEvaluacion.AUTOEVALUACION:
            dims.autoevaluacion += cal.nota;
            break;
        }
      });

      const notaFinal = dims.ser + dims.saber + dims.hacer + dims.decidir + dims.autoevaluacion;

      return {
        materiaId: asig.materia.id,
        codigo: asig.materia.codigo,
        nombre: asig.materia.nombre,
        dimensiones: dims,
        notaFinal,
        estado: notaFinal >= UMBRAL_APROBACION ? ('APROBADO' as const) : ('REPROBADO' as const),
        apreciacionCualitativa,
      };
    });

    // Asistencias del estudiante en el rango del periodo evaluativo
    const detallesAsistencia = await this.prisma.detalleAsistencia.findMany({
      where: {
        estudianteId: inscripcion.estudianteId,
        registroAsistencia: {
          institucionId,
          fecha: {
            gte: periodo.fechaInicio,
            lte: periodo.fechaFin,
          },
        },
      },
      include: {
        registroAsistencia: true,
      },
    });

    const resumenAsistencia = {
      presente: detallesAsistencia.filter((a) => a.estado === EstadoAsistencia.PRESENTE).length,
      falta: detallesAsistencia.filter((a) => a.estado === EstadoAsistencia.FALTA).length,
      atraso: detallesAsistencia.filter((a) => a.estado === EstadoAsistencia.ATRASO).length,
      licencia: detallesAsistencia.filter((a) => a.estado === EstadoAsistencia.LICENCIA).length,
      totalDias: detallesAsistencia.length,
    };

    const sumaNotas = materias.reduce((acc, m) => acc + m.notaFinal, 0);
    const promedioTrimestral = materias.length > 0 ? Number((sumaNotas / materias.length).toFixed(1)) : 0;
    const materiasAprobadas = materias.filter((m) => m.notaFinal >= UMBRAL_APROBACION).length;
    const materiasReprobadas = materias.filter((m) => m.notaFinal < UMBRAL_APROBACION).length;

    const pInfo = TRIMESTRE_INFO[periodo.periodo] || { numero: 1, nombre: 'Trimestre' };

    const report = {
      institucion: {
        sie: inscripcion.institucion.sie,
        nombre: inscripcion.institucion.nombre,
      },
      estudiante: {
        inscripcionId: inscripcion.id,
        rude: inscripcion.estudiante.codigoRude,
        apellidos: `${inscripcion.estudiante.persona.primerApellido} ${inscripcion.estudiante.persona.segundoApellido || ''}`.trim(),
        nombres: inscripcion.estudiante.persona.nombres,
        curso: inscripcion.paralelo.curso.nombre,
        paralelo: inscripcion.paralelo.letra,
      },
      periodo: {
        id: periodo.id,
        numero: pInfo.numero,
        nombre: pInfo.nombre,
        gestion: inscripcion.gestion.anio,
      },
      materias,
      resumenAsistencia,
      promedioTrimestral,
      materiasAprobadas,
      materiasReprobadas,
      generadoEn: new Date().toISOString(),
    };

    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_UPDATE,
      accion: 'REPORT_BULLETIN_GENERATED',
      detalle: {
        inscripcionId: query.inscripcionId,
        periodoId: query.periodoId,
        promedioTrimestral,
      },
    });

    return report;
  }

  async getTrimesterBulletinPdf(
    institucionId: string,
    query: QueryTrimesterBulletinDto,
    userId: string,
    userRole?: string,
  ) {
    const data = await this.getTrimesterBulletin(institucionId, query, userId, userRole);
    const buffer = await this.pdfGenerator.generateTrimesterBulletinPdf(data);
    const filename = `boletin_${data.estudiante.rude}_${data.periodo.nombre}.pdf`
      .replace(/\s+/g, '_')
      .toLowerCase();

    return { buffer, filename };
  }

  /**
   * Obtiene la libreta escolar anual consolidada para un estudiante
   */
  async getSchoolReportCard(
    institucionId: string,
    query: QuerySchoolReportCardDto,
    userId: string,
    userRole?: string,
  ) {
    const inscripcion = await this.prisma.inscripcion.findFirst({
      where: { id: query.inscripcionId, institucionId, activo: true },
      include: {
        estudiante: {
          include: {
            persona: true,
          },
        },
        paralelo: {
          include: {
            curso: true,
          },
        },
        institucion: true,
        gestion: true,
      },
    });

    if (!inscripcion) {
      throw new NotFoundException('Inscripción no encontrada');
    }

    // Los trimestres de la gestión escolar
    const periodos = await this.prisma.periodoEvaluacion.findMany({
      where: { gestionId: inscripcion.gestionId, institucionId, activo: true },
      orderBy: { fechaInicio: 'asc' },
    });

    // Materias del paralelo
    const asignaciones = await this.prisma.asignacionAcademica.findMany({
      where: { paraleloId: inscripcion.paraleloId, institucionId, activo: true },
      include: { materia: true },
      orderBy: { materia: { nombre: 'asc' } },
    });

    const asignacionIds = asignaciones.map((a) => a.id);
    const evaluaciones = await this.prisma.evaluacion.findMany({
      where: {
        asignacionId: { in: asignacionIds },
        institucionId,
        activo: true,
      },
      include: {
        calificaciones: {
          where: { estudianteId: inscripcion.estudianteId },
        },
      },
    });

    const p1 = periodos.find((p) => p.periodo === TipoPeriodo.PRIMER_TRIMESTRE);
    const p2 = periodos.find((p) => p.periodo === TipoPeriodo.SEGUNDO_TRIMESTRE);
    const p3 = periodos.find((p) => p.periodo === TipoPeriodo.TERCER_TRIMESTRE);

    const calcTrimesterScore = (asigId: string, periodoId?: string) => {
      if (!periodoId) return 0;
      const evs = evaluaciones.filter((e) => e.asignacionId === asigId && e.periodoId === periodoId);
      return evs.reduce((acc, ev) => {
        const cal = ev.calificaciones[0];
        return acc + (cal ? cal.nota : 0);
      }, 0);
    };

    const materias = asignaciones.map((asig) => {
      const nota1T = calcTrimesterScore(asig.id, p1?.id);
      const nota2T = calcTrimesterScore(asig.id, p2?.id);
      const nota3T = calcTrimesterScore(asig.id, p3?.id);
      const promedioAnual = Math.round((nota1T + nota2T + nota3T) / 3);

      return {
        materiaId: asig.materia.id,
        codigo: asig.materia.codigo,
        nombre: asig.materia.nombre,
        primerTrimestre: nota1T,
        segundoTrimestre: nota2T,
        tercerTrimestre: nota3T,
        promedioAnual,
        estado: promedioAnual >= UMBRAL_APROBACION ? ('APROBADO' as const) : ('REPROBADO' as const),
      };
    });

    const sumaAnual = materias.reduce((acc, m) => acc + m.promedioAnual, 0);
    const promedioGeneralAnual = materias.length > 0 ? Number((sumaAnual / materias.length).toFixed(1)) : 0;

    let situacionFinal: SituacionFinalEstudiante = SituacionFinalEstudiante.PROMOVIDO;
    if (inscripcion.situacionFinal) {
      situacionFinal = inscripcion.situacionFinal;
    } else {
      const tieneReprobadas = materias.some((m) => m.promedioAnual < UMBRAL_APROBACION);
      situacionFinal = tieneReprobadas ? SituacionFinalEstudiante.RETENIDO : SituacionFinalEstudiante.PROMOVIDO;
    }

    // Asistencia anual acumulada
    const detallesAsistencia = await this.prisma.detalleAsistencia.findMany({
      where: {
        estudianteId: inscripcion.estudianteId,
        registroAsistencia: {
          institucionId,
          paraleloId: inscripcion.paraleloId,
        },
      },
    });

    const resumenAsistenciaAnual = {
      presente: detallesAsistencia.filter((a) => a.estado === EstadoAsistencia.PRESENTE).length,
      falta: detallesAsistencia.filter((a) => a.estado === EstadoAsistencia.FALTA).length,
      atraso: detallesAsistencia.filter((a) => a.estado === EstadoAsistencia.ATRASO).length,
      licencia: detallesAsistencia.filter((a) => a.estado === EstadoAsistencia.LICENCIA).length,
      totalRegistros: detallesAsistencia.length,
    };

    const report = {
      institucion: {
        sie: inscripcion.institucion.sie,
        nombre: inscripcion.institucion.nombre,
        distrito: inscripcion.institucion.distrito,
      },
      estudiante: {
        inscripcionId: inscripcion.id,
        rude: inscripcion.estudiante.codigoRude,
        apellidos: `${inscripcion.estudiante.persona.primerApellido} ${inscripcion.estudiante.persona.segundoApellido || ''}`.trim(),
        nombres: inscripcion.estudiante.persona.nombres,
        curso: inscripcion.paralelo.curso.nombre,
        paralelo: inscripcion.paralelo.letra,
        gestion: inscripcion.gestion.anio,
      },
      materias,
      promedioGeneralAnual,
      situacionFinal,
      resumenAsistenciaAnual,
      generadoEn: new Date().toISOString(),
    };

    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_UPDATE,
      accion: 'REPORT_CARD_GENERATED',
      detalle: {
        inscripcionId: query.inscripcionId,
        promedioGeneralAnual,
        situacionFinal,
      },
    });

    return report;
  }

  async getSchoolReportCardPdf(
    institucionId: string,
    query: QuerySchoolReportCardDto,
    userId: string,
    userRole?: string,
  ) {
    const data = await this.getSchoolReportCard(institucionId, query, userId, userRole);
    const buffer = await this.pdfGenerator.generateSchoolReportCardPdf(data);
    const filename = `libreta_${data.estudiante.rude}_${data.estudiante.gestion}.pdf`
      .replace(/\s+/g, '_')
      .toLowerCase();

    return { buffer, filename };
  }
}
