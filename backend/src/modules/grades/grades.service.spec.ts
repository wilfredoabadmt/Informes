import { Test, TestingModule } from '@nestjs/testing';
import { GradesService } from './grades.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  DimensionEvaluacion,
  EstadoInscripcion,
  EstadoPeriodo,
  RolInstitucional,
} from '@prisma/client';

describe('GradesService (Unit Tests)', () => {
  let service: GradesService;
  let prisma: any;
  let auditService: any;

  const mockInstitutionId = 'institucion-uuid-1111';
  const mockUserId = 'user-uuid-9999';
  const mockEvaluacionId = 'eval-uuid-001';
  const mockAsignacionId = 'asig-uuid-001';
  const mockPeriodoId = 'period-uuid-001';
  const mockStudent1Id = 'student-uuid-001';
  const mockStudent2Id = 'student-uuid-002';

  beforeEach(async () => {
    prisma = {
      evaluacion: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      asignacionAcademica: {
        findFirst: jest.fn(),
      },
      periodoEvaluacion: {
        findFirst: jest.fn(),
      },
      inscripcion: {
        findMany: jest.fn(),
      },
      calificacion: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      withTenantContext: jest.fn(async (instId, callback) => callback(prisma)),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
  });

  describe('recordGradesBatch', () => {
    const validDto = {
      evaluacionId: mockEvaluacionId,
      calificaciones: [
        { estudianteId: mockStudent1Id, nota: 30, observacion: 'Excelente' },
        { estudianteId: mockStudent2Id, nota: 20 },
      ],
    };

    it('debe rechazar si el maestro no es titular de la asignación (ForbiddenException)', async () => {
      prisma.evaluacion.findFirst.mockResolvedValue({
        id: mockEvaluacionId,
        puntajeMaximo: 35,
        periodo: { estado: EstadoPeriodo.ABIERTO },
        asignacion: {
          paraleloId: 'paralelo-1',
          vinculacion: { usuarioId: 'other-teacher-uuid' },
        },
      });

      await expect(
        service.recordGradesBatch(
          mockInstitutionId,
          validDto,
          mockUserId,
          RolInstitucional.MAESTRO,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe rechazar si el trimestre no está ABIERTO (BadRequestException)', async () => {
      prisma.evaluacion.findFirst.mockResolvedValue({
        id: mockEvaluacionId,
        puntajeMaximo: 35,
        periodo: { estado: EstadoPeriodo.CERRADO },
        asignacion: {
          paraleloId: 'paralelo-1',
          vinculacion: { usuarioId: mockUserId },
        },
      });

      await expect(
        service.recordGradesBatch(
          mockInstitutionId,
          validDto,
          mockUserId,
          RolInstitucional.MAESTRO,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar si alguna nota excede el puntaje máximo del instrumento (BadRequestException)', async () => {
      prisma.evaluacion.findFirst.mockResolvedValue({
        id: mockEvaluacionId,
        puntajeMaximo: 20, // Máximo 20, pero dto envía 30 para student 1
        periodo: { estado: EstadoPeriodo.ABIERTO },
        asignacion: {
          paraleloId: 'paralelo-1',
          vinculacion: { usuarioId: mockUserId },
        },
      });

      await expect(
        service.recordGradesBatch(
          mockInstitutionId,
          validDto,
          mockUserId,
          RolInstitucional.MAESTRO,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar si un estudiante no está matriculado como EFECTIVO en el paralelo (BadRequestException)', async () => {
      prisma.evaluacion.findFirst.mockResolvedValue({
        id: mockEvaluacionId,
        puntajeMaximo: 35,
        periodo: { estado: EstadoPeriodo.ABIERTO },
        asignacion: {
          paraleloId: 'paralelo-1',
          vinculacion: { usuarioId: mockUserId },
        },
      });

      // Solo mockStudent1Id tiene matrícula
      prisma.inscripcion.findMany.mockResolvedValue([{ estudianteId: mockStudent1Id }]);

      await expect(
        service.recordGradesBatch(
          mockInstitutionId,
          validDto,
          mockUserId,
          RolInstitucional.MAESTRO,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe asentar las calificaciones en bloque atómicamente y auditar', async () => {
      prisma.evaluacion.findFirst.mockResolvedValue({
        id: mockEvaluacionId,
        puntajeMaximo: 35,
        periodo: { estado: EstadoPeriodo.ABIERTO },
        asignacion: {
          paraleloId: 'paralelo-1',
          vinculacion: { usuarioId: mockUserId },
        },
      });

      prisma.inscripcion.findMany.mockResolvedValue([
        { estudianteId: mockStudent1Id },
        { estudianteId: mockStudent2Id },
      ]);

      prisma.calificacion.upsert.mockResolvedValue({});

      const result = await service.recordGradesBatch(
        mockInstitutionId,
        validDto,
        mockUserId,
        RolInstitucional.MAESTRO,
      );

      expect(result).toBeDefined();
      expect(result.evaluacionId).toBe(mockEvaluacionId);
      expect(result.totalCalificados).toBe(2);
      expect(result.promedioGrupo).toBe(25); // (30 + 20) / 2 = 25.0
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ accion: 'ASENTAMIENTO_CALIFICACIONES' }),
      );
    });
  });

  describe('getTrimesterGradesSheet', () => {
    it('debe agregar correctamente las dimensiones SEP y calcular nota final sobre 100 y estado de aprobación', async () => {
      prisma.asignacionAcademica.findFirst.mockResolvedValue({
        id: mockAsignacionId,
        paraleloId: 'paralelo-1',
        materia: { nombre: 'Matemática' },
        paralelo: { letra: 'A', curso: { nombre: 'Primero de Secundaria' } },
        vinculacion: { usuarioId: mockUserId },
      });

      prisma.periodoEvaluacion.findFirst.mockResolvedValue({
        id: mockPeriodoId,
      });

      prisma.inscripcion.findMany.mockResolvedValue([
        {
          estudianteId: mockStudent1Id,
          estudiante: {
            codigoRude: 'RUDE-001',
            persona: { primerApellido: 'Alvarez', segundoApellido: '', nombres: 'Mateo' },
          },
        },
        {
          estudianteId: mockStudent2Id,
          estudiante: {
            codigoRude: 'RUDE-002',
            persona: { primerApellido: 'Blanco', segundoApellido: '', nombres: 'Lucia' },
          },
        },
      ]);

      // Evaluaciones en distintas dimensiones con notas
      prisma.evaluacion.findMany.mockResolvedValue([
        {
          id: 'ev-saber-1',
          dimension: DimensionEvaluacion.SABER,
          calificaciones: [
            { estudianteId: mockStudent1Id, nota: 30 },
            { estudianteId: mockStudent2Id, nota: 10 },
          ],
        },
        {
          id: 'ev-hacer-1',
          dimension: DimensionEvaluacion.HACER,
          calificaciones: [
            { estudianteId: mockStudent1Id, nota: 30 },
            { estudianteId: mockStudent2Id, nota: 15 },
          ],
        },
        {
          id: 'ev-ser-1',
          dimension: DimensionEvaluacion.SER,
          calificaciones: [
            { estudianteId: mockStudent1Id, nota: 10 },
            { estudianteId: mockStudent2Id, nota: 8 },
          ],
        },
        {
          id: 'ev-decidir-1',
          dimension: DimensionEvaluacion.DECIDIR,
          calificaciones: [
            { estudianteId: mockStudent1Id, nota: 10 },
            { estudianteId: mockStudent2Id, nota: 7 },
          ],
        },
        {
          id: 'ev-auto-1',
          dimension: DimensionEvaluacion.AUTOEVALUACION,
          calificaciones: [
            { estudianteId: mockStudent1Id, nota: 9 },
            { estudianteId: mockStudent2Id, nota: 5 },
          ],
        },
      ]);

      const result = await service.getTrimesterGradesSheet(
        mockInstitutionId,
        { asignacionId: mockAsignacionId, periodoId: mockPeriodoId },
        mockUserId,
        RolInstitucional.MAESTRO,
      );

      expect(result.estudiantes).toHaveLength(2);

      // Student 1 (Mateo): 30 + 30 + 10 + 10 + 9 = 89 -> APROBADO
      const mateo = result.estudiantes.find((e) => e.estudianteId === mockStudent1Id);
      expect(mateo?.subtotalSaber).toBe(30);
      expect(mateo?.subtotalHacer).toBe(30);
      expect(mateo?.subtotalSer).toBe(10);
      expect(mateo?.subtotalDecidir).toBe(10);
      expect(mateo?.subtotalAutoevaluacion).toBe(9);
      expect(mateo?.notaFinal).toBe(89);
      expect(mateo?.estadoAprobacion).toBe('APROBADO');

      // Student 2 (Lucia): 10 + 15 + 8 + 7 + 5 = 45 -> EN_DESARROLLO
      const lucia = result.estudiantes.find((e) => e.estudianteId === mockStudent2Id);
      expect(lucia?.notaFinal).toBe(45);
      expect(lucia?.estadoAprobacion).toBe('EN_DESARROLLO');
    });
  });

  describe('updateGrade', () => {
    it('debe rechazar modificación si el trimestre está CERRADO (BadRequestException)', async () => {
      prisma.calificacion.findFirst.mockResolvedValue({
        id: 'cal-1',
        evaluacion: {
          puntajeMaximo: 35,
          periodo: { estado: EstadoPeriodo.CERRADO },
          asignacion: { vinculacion: { usuarioId: mockUserId } },
        },
      });

      await expect(
        service.updateGrade(
          mockInstitutionId,
          'cal-1',
          { nota: 25 },
          mockUserId,
          RolInstitucional.MAESTRO,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar si la nueva nota excede el puntaje máximo (BadRequestException)', async () => {
      prisma.calificacion.findFirst.mockResolvedValue({
        id: 'cal-1',
        evaluacion: {
          puntajeMaximo: 20,
          periodo: { estado: EstadoPeriodo.ABIERTO },
          asignacion: { vinculacion: { usuarioId: mockUserId } },
        },
      });

      await expect(
        service.updateGrade(
          mockInstitutionId,
          'cal-1',
          { nota: 25 }, // Máximo es 20
          mockUserId,
          RolInstitucional.MAESTRO,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe actualizar la calificación y registrar auditoría con la traza previa', async () => {
      prisma.calificacion.findFirst.mockResolvedValue({
        id: 'cal-1',
        nota: 15,
        evaluacionId: mockEvaluacionId,
        estudianteId: mockStudent1Id,
        evaluacion: {
          puntajeMaximo: 20,
          periodo: { estado: EstadoPeriodo.ABIERTO },
          asignacion: { vinculacion: { usuarioId: mockUserId } },
        },
        estudiante: {
          codigoRude: 'RUDE-001',
          persona: { primerApellido: 'Alvarez', segundoApellido: '', nombres: 'Mateo' },
        },
      });

      prisma.calificacion.update.mockResolvedValue({
        id: 'cal-1',
        nota: 18,
        observacion: 'Recalificado',
        evaluacionId: mockEvaluacionId,
        estudianteId: mockStudent1Id,
        estudiante: {
          codigoRude: 'RUDE-001',
          persona: { primerApellido: 'Alvarez', segundoApellido: '', nombres: 'Mateo' },
        },
      });

      const result = await service.updateGrade(
        mockInstitutionId,
        'cal-1',
        { nota: 18, observacion: 'Recalificado', motivoRectificacion: 'Revisión formal' },
        mockUserId,
        RolInstitucional.MAESTRO,
      );

      expect(result.nota).toBe(18);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'RECTIFICACION_CALIFICACION',
          detalle: expect.objectContaining({
            notaAnterior: 15,
            nuevaNota: 18,
          }),
        }),
      );
    });
  });
});
