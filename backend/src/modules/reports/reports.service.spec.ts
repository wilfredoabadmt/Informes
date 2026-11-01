import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  DimensionEvaluacion,
  EstadoAsistencia,
  EstadoInscripcion,
  SituacionFinalEstudiante,
  TipoPeriodo,
} from '@prisma/client';
import { ReportsService } from './reports.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ReportsService (Unit Tests)', () => {
  let service: ReportsService;
  let prisma: any;
  let auditService: any;
  let pdfGenerator: PdfGeneratorService;

  const mockInstitucionId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '99999999-9999-9999-9999-999999999999';

  beforeEach(async () => {
    prisma = {
      paralelo: { findFirst: jest.fn() },
      inscripcion: { findFirst: jest.fn(), findMany: jest.fn() },
      periodoEvaluacion: { findFirst: jest.fn(), findMany: jest.fn() },
      asignacionAcademica: { findMany: jest.fn() },
      evaluacion: { findMany: jest.fn() },
      detalleAsistencia: { findMany: jest.fn() },
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        PdfGeneratorService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    pdfGenerator = module.get<PdfGeneratorService>(PdfGeneratorService);
  });

  describe('getCourseRoster', () => {
    it('debe retornar la lista oficial ordenada alfabéticamente por apellidos', async () => {
      prisma.paralelo.findFirst.mockResolvedValue({
        id: 'par-1',
        letra: 'A',
        turno: 'MANANA',
        curso: { nombre: '1ro Primaria', nivel: 'PRIMARIA' },
        institucion: {
          sie: '80710001',
          nombre: 'Colegio Simón Bolívar',
          distrito: 'La Paz 1',
          departamento: 'La Paz',
        },
        gestion: { anio: 2026 },
      });

      prisma.inscripcion.findMany.mockResolvedValue([
        {
          id: 'ins-2',
          estudiante: {
            codigoRude: 'RUDE-222',
            nombreTutor: 'Carlos Perez',
            telefonoTutor: '70000002',
            persona: {
              primerApellido: 'Zeballos',
              segundoApellido: 'Perez',
              nombres: 'Lucia',
              ci: '22222',
              complemento: null,
              genero: 'F',
              fechaNacimiento: new Date('2015-05-10'),
              telefono: '70000002',
            },
          },
        },
        {
          id: 'ins-1',
          estudiante: {
            codigoRude: 'RUDE-111',
            nombreTutor: 'Juan Arce',
            telefonoTutor: '70000001',
            persona: {
              primerApellido: 'Arce',
              segundoApellido: 'Mendoza',
              nombres: 'Mateo',
              ci: '11111',
              complemento: '1A',
              genero: 'M',
              fechaNacimiento: new Date('2015-01-15'),
              telefono: '70000001',
            },
          },
        },
      ]);

      const result = await service.getCourseRoster(
        mockInstitucionId,
        { paraleloId: 'par-1' },
        mockUserId,
      );

      expect(result.totalEstudiantes).toBe(2);
      expect(result.estudiantes[0].apellidos).toBe('Arce Mendoza');
      expect(result.estudiantes[0].numero).toBe(1);
      expect(result.estudiantes[0].ci).toBe('11111-1A');
      expect(result.estudiantes[1].apellidos).toBe('Zeballos Perez');
      expect(result.estudiantes[1].numero).toBe(2);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'REPORT_ROSTER_GENERATED',
        }),
      );
    });

    it('debe lanzar NotFoundException si el paralelo no existe en el tenant', async () => {
      prisma.paralelo.findFirst.mockResolvedValue(null);

      await expect(
        service.getCourseRoster(mockInstitucionId, { paraleloId: 'par-999' }, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTrimesterBulletin', () => {
    it('debe calcular correctamente las notas por dimensión y el promedio trimestral', async () => {
      prisma.inscripcion.findFirst.mockResolvedValue({
        id: 'ins-1',
        estudianteId: 'est-1',
        gestionId: 'gest-1',
        paraleloId: 'par-1',
        institucion: { sie: '80710001', nombre: 'Colegio Simón Bolívar' },
        estudiante: {
          codigoRude: 'RUDE-111',
          persona: { primerApellido: 'Arce', segundoApellido: 'M', nombres: 'Mateo' },
        },
        paralelo: { letra: 'A', curso: { nombre: '1ro Primaria' } },
        gestion: { anio: 2026 },
      });

      prisma.periodoEvaluacion.findFirst.mockResolvedValue({
        id: 'per-1',
        gestionId: 'gest-1',
        periodo: TipoPeriodo.PRIMER_TRIMESTRE,
        fechaInicio: new Date('2026-02-01'),
        fechaFin: new Date('2026-05-15'),
      });

      prisma.asignacionAcademica.findMany.mockResolvedValue([
        { id: 'asig-1', materia: { id: 'mat-1', codigo: 'MAT-101', nombre: 'Matemática' } },
      ]);

      prisma.evaluacion.findMany.mockResolvedValue([
        {
          id: 'ev-ser',
          asignacionId: 'asig-1',
          periodoId: 'per-1',
          dimension: DimensionEvaluacion.SER,
          calificaciones: [{ estudianteId: 'est-1', nota: 10, observacion: null }],
        },
        {
          id: 'ev-saber',
          asignacionId: 'asig-1',
          periodoId: 'per-1',
          dimension: DimensionEvaluacion.SABER,
          calificaciones: [{ estudianteId: 'est-1', nota: 30, observacion: 'Excelente razonamiento' }],
        },
        {
          id: 'ev-hacer',
          asignacionId: 'asig-1',
          periodoId: 'per-1',
          dimension: DimensionEvaluacion.HACER,
          calificaciones: [{ estudianteId: 'est-1', nota: 30, observacion: null }],
        },
        {
          id: 'ev-decidir',
          asignacionId: 'asig-1',
          periodoId: 'per-1',
          dimension: DimensionEvaluacion.DECIDIR,
          calificaciones: [{ estudianteId: 'est-1', nota: 10, observacion: null }],
        },
        {
          id: 'ev-auto',
          asignacionId: 'asig-1',
          periodoId: 'per-1',
          dimension: DimensionEvaluacion.AUTOEVALUACION,
          calificaciones: [{ estudianteId: 'est-1', nota: 5, observacion: null }],
        },
      ]);

      prisma.detalleAsistencia.findMany.mockResolvedValue([
        { estado: EstadoAsistencia.PRESENTE },
        { estado: EstadoAsistencia.PRESENTE },
        { estado: EstadoAsistencia.ATRASO },
        { estado: EstadoAsistencia.FALTA },
      ]);

      const result = await service.getTrimesterBulletin(
        mockInstitucionId,
        { inscripcionId: 'ins-1', periodoId: 'per-1' },
        mockUserId,
      );

      expect(result.materias.length).toBe(1);
      const mat = result.materias[0];
      expect(mat.dimensiones.ser).toBe(10);
      expect(mat.dimensiones.saber).toBe(30);
      expect(mat.dimensiones.hacer).toBe(30);
      expect(mat.dimensiones.decidir).toBe(10);
      expect(mat.dimensiones.autoevaluacion).toBe(5);
      expect(mat.notaFinal).toBe(85);
      expect(mat.estado).toBe('APROBADO');
      expect(mat.apreciacionCualitativa).toBe('Excelente razonamiento');

      expect(result.resumenAsistencia.presente).toBe(2);
      expect(result.resumenAsistencia.atraso).toBe(1);
      expect(result.resumenAsistencia.falta).toBe(1);
      expect(result.promedioTrimestral).toBe(85);
      expect(result.materiasAprobadas).toBe(1);
      expect(result.materiasReprobadas).toBe(0);
    });

    it('debe lanzar BadRequestException si el periodo no pertenece a la gestión de la inscripción', async () => {
      prisma.inscripcion.findFirst.mockResolvedValue({
        id: 'ins-1',
        gestionId: 'gest-2026',
      });

      prisma.periodoEvaluacion.findFirst.mockResolvedValue({
        id: 'per-1',
        gestionId: 'gest-2025',
      });

      await expect(
        service.getTrimesterBulletin(
          mockInstitucionId,
          { inscripcionId: 'ins-1', periodoId: 'per-1' },
          mockUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSchoolReportCard', () => {
    it('debe promediar 3 trimestres y determinar situación final PROMOVIDO', async () => {
      prisma.inscripcion.findFirst.mockResolvedValue({
        id: 'ins-1',
        estudianteId: 'est-1',
        gestionId: 'gest-1',
        paraleloId: 'par-1',
        situacionFinal: null,
        institucion: { sie: '80710001', nombre: 'Colegio Simón Bolívar', distrito: 'La Paz 1' },
        estudiante: {
          codigoRude: 'RUDE-111',
          persona: { primerApellido: 'Arce', segundoApellido: 'M', nombres: 'Mateo' },
        },
        paralelo: { letra: 'A', curso: { nombre: '1ro Primaria' } },
        gestion: { anio: 2026 },
      });

      prisma.periodoEvaluacion.findMany.mockResolvedValue([
        { id: 'per-1', periodo: TipoPeriodo.PRIMER_TRIMESTRE },
        { id: 'per-2', periodo: TipoPeriodo.SEGUNDO_TRIMESTRE },
        { id: 'per-3', periodo: TipoPeriodo.TERCER_TRIMESTRE },
      ]);

      prisma.asignacionAcademica.findMany.mockResolvedValue([
        { id: 'asig-1', materia: { id: 'mat-1', codigo: 'MAT-101', nombre: 'Matemática' } },
      ]);

      prisma.evaluacion.findMany.mockResolvedValue([
        {
          id: 'ev-1',
          asignacionId: 'asig-1',
          periodoId: 'per-1',
          calificaciones: [{ estudianteId: 'est-1', nota: 70 }],
        },
        {
          id: 'ev-2',
          asignacionId: 'asig-1',
          periodoId: 'per-2',
          calificaciones: [{ estudianteId: 'est-1', nota: 80 }],
        },
        {
          id: 'ev-3',
          asignacionId: 'asig-1',
          periodoId: 'per-3',
          calificaciones: [{ estudianteId: 'est-1', nota: 90 }],
        },
      ]);

      prisma.detalleAsistencia.findMany.mockResolvedValue([
        { estado: EstadoAsistencia.PRESENTE },
        { estado: EstadoAsistencia.PRESENTE },
      ]);

      const result = await service.getSchoolReportCard(
        mockInstitucionId,
        { inscripcionId: 'ins-1' },
        mockUserId,
      );

      // (70 + 80 + 90) / 3 = 80
      expect(result.materias[0].promedioAnual).toBe(80);
      expect(result.materias[0].estado).toBe('APROBADO');
      expect(result.promedioGeneralAnual).toBe(80);
      expect(result.situacionFinal).toBe(SituacionFinalEstudiante.PROMOVIDO);
    });

    it('debe determinar RETENIDO si reprueba una materia con nota < 51', async () => {
      prisma.inscripcion.findFirst.mockResolvedValue({
        id: 'ins-2',
        estudianteId: 'est-2',
        gestionId: 'gest-1',
        paraleloId: 'par-1',
        situacionFinal: null,
        institucion: { sie: '80710001', nombre: 'Colegio Simón Bolívar', distrito: 'La Paz 1' },
        estudiante: {
          codigoRude: 'RUDE-222',
          persona: { primerApellido: 'Zeballos', segundoApellido: '', nombres: 'Lucia' },
        },
        paralelo: { letra: 'A', curso: { nombre: '1ro Primaria' } },
        gestion: { anio: 2026 },
      });

      prisma.periodoEvaluacion.findMany.mockResolvedValue([
        { id: 'per-1', periodo: TipoPeriodo.PRIMER_TRIMESTRE },
        { id: 'per-2', periodo: TipoPeriodo.SEGUNDO_TRIMESTRE },
        { id: 'per-3', periodo: TipoPeriodo.TERCER_TRIMESTRE },
      ]);

      prisma.asignacionAcademica.findMany.mockResolvedValue([
        { id: 'asig-1', materia: { id: 'mat-1', codigo: 'BIO-101', nombre: 'Biología' } },
      ]);

      prisma.evaluacion.findMany.mockResolvedValue([
        {
          id: 'ev-1',
          asignacionId: 'asig-1',
          periodoId: 'per-1',
          calificaciones: [{ estudianteId: 'est-2', nota: 40 }],
        },
        {
          id: 'ev-2',
          asignacionId: 'asig-1',
          periodoId: 'per-2',
          calificaciones: [{ estudianteId: 'est-2', nota: 45 }],
        },
        {
          id: 'ev-3',
          asignacionId: 'asig-1',
          periodoId: 'per-3',
          calificaciones: [{ estudianteId: 'est-2', nota: 50 }],
        },
      ]);

      prisma.detalleAsistencia.findMany.mockResolvedValue([]);

      const result = await service.getSchoolReportCard(
        mockInstitucionId,
        { inscripcionId: 'ins-2' },
        mockUserId,
      );

      // (40 + 45 + 50) / 3 = 45
      expect(result.materias[0].promedioAnual).toBe(45);
      expect(result.materias[0].estado).toBe('REPROBADO');
      expect(result.situacionFinal).toBe(SituacionFinalEstudiante.RETENIDO);
    });
  });

  describe('Generación de archivos PDF', () => {
    it('debe generar un buffer PDF binario válido para la lista de curso', async () => {
      prisma.paralelo.findFirst.mockResolvedValue({
        id: 'par-1',
        letra: 'A',
        turno: 'MANANA',
        curso: { nombre: '1ro Primaria', nivel: 'PRIMARIA' },
        institucion: { sie: '80710001', nombre: 'Colegio Simón Bolívar', distrito: 'La Paz 1', departamento: 'La Paz' },
        gestion: { anio: 2026 },
      });

      prisma.inscripcion.findMany.mockResolvedValue([
        {
          id: 'ins-1',
          estudiante: {
            codigoRude: 'RUDE-111',
            nombreTutor: 'Juan Arce',
            telefonoTutor: '70000001',
            persona: {
              primerApellido: 'Arce',
              segundoApellido: 'Mendoza',
              nombres: 'Mateo',
              ci: '11111',
              complemento: null,
              genero: 'M',
              fechaNacimiento: new Date('2015-01-15'),
              telefono: '70000001',
            },
          },
        },
      ]);

      const result = await service.getCourseRosterPdf(
        mockInstitucionId,
        { paraleloId: 'par-1' },
        mockUserId,
      );

      expect(Buffer.isBuffer(result.buffer)).toBe(true);
      expect(result.buffer.toString('utf-8', 0, 4)).toBe('%PDF');
      expect(result.filename).toContain('lista_');
      expect(result.filename.endsWith('.pdf')).toBe(true);
    });
  });
});
