import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationsService } from './evaluations.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  DimensionEvaluacion,
  EstadoAsignacion,
  EstadoGestion,
  EstadoPeriodo,
  EstadoVinculacion,
  RolInstitucional,
  TipoPeriodo,
} from '@prisma/client';

describe('EvaluationsService (Unit Tests)', () => {
  let service: EvaluationsService;
  let prisma: any;
  let auditService: any;

  const mockInstitutionId = 'institucion-uuid-1111';
  const mockUserId = 'user-uuid-9999';
  const mockGestionId = 'gestion-uuid-2026';
  const mockPeriodId = 'period-uuid-1';
  const mockAsignacionId = 'asignacion-uuid-10';

  beforeEach(async () => {
    prisma = {
      gestionEscolar: {
        findFirst: jest.fn(),
      },
      periodoEvaluacion: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      asignacionAcademica: {
        findFirst: jest.fn(),
      },
      evaluacion: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      withTenantContext: jest.fn(async (instId, callback) => callback(prisma)),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<EvaluationsService>(EvaluationsService);
  });

  describe('createEvaluationPeriod', () => {
    const validDto = {
      gestionId: mockGestionId,
      periodo: TipoPeriodo.PRIMER_TRIMESTRE,
      fechaInicio: '2026-02-02',
      fechaFin: '2026-05-08',
      fechaLimiteNotas: '2026-05-15',
    };

    it('debe rechazar si fechaInicio >= fechaFin (BadRequestException)', async () => {
      const invalidDto = { ...validDto, fechaInicio: '2026-06-01' };
      await expect(
        service.createEvaluationPeriod(mockInstitutionId, invalidDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar si fechaLimiteNotas < fechaFin (BadRequestException)', async () => {
      const invalidDto = { ...validDto, fechaLimiteNotas: '2026-05-01' };
      await expect(
        service.createEvaluationPeriod(mockInstitutionId, invalidDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar si la gestión escolar está CERRADA (BadRequestException)', async () => {
      prisma.gestionEscolar.findFirst.mockResolvedValue({
        id: mockGestionId,
        estado: EstadoGestion.CERRADA,
      });

      await expect(
        service.createEvaluationPeriod(mockInstitutionId, validDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar duplicación del mismo trimestre en la gestión (ConflictException)', async () => {
      prisma.gestionEscolar.findFirst.mockResolvedValue({
        id: mockGestionId,
        estado: EstadoGestion.ABIERTA,
      });
      prisma.periodoEvaluacion.findFirst.mockResolvedValue({ id: 'existing-period-id' });

      await expect(
        service.createEvaluationPeriod(mockInstitutionId, validDto, mockUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('debe crear el trimestre exitosamente en estado PROGRAMADO y auditar', async () => {
      prisma.gestionEscolar.findFirst.mockResolvedValue({
        id: mockGestionId,
        estado: EstadoGestion.ABIERTA,
      });
      prisma.periodoEvaluacion.findFirst.mockResolvedValue(null);

      const mockCreated = { id: mockPeriodId, ...validDto, estado: EstadoPeriodo.PROGRAMADO };
      prisma.periodoEvaluacion.create.mockResolvedValue(mockCreated);

      const result = await service.createEvaluationPeriod(mockInstitutionId, validDto, mockUserId);

      expect(result).toBeDefined();
      expect(result.estado).toBe(EstadoPeriodo.PROGRAMADO);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ accion: 'CONFIGURACION_TRIMESTRE' }),
      );
    });
  });

  describe('updatePeriodStatus', () => {
    it('debe rechazar abrir un trimestre si otro ya está ABIERTO en la gestión (BadRequestException)', async () => {
      prisma.periodoEvaluacion.findFirst
        .mockResolvedValueOnce({ id: mockPeriodId, gestionId: mockGestionId, estado: EstadoPeriodo.PROGRAMADO })
        .mockResolvedValueOnce({ id: 'other-period-uuid', estado: EstadoPeriodo.ABIERTO });

      await expect(
        service.updatePeriodStatus(
          mockInstitutionId,
          mockPeriodId,
          { estado: EstadoPeriodo.ABIERTO },
          mockUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe permitir abrir el trimestre si no hay otro abierto', async () => {
      prisma.periodoEvaluacion.findFirst
        .mockResolvedValueOnce({ id: mockPeriodId, gestionId: mockGestionId, estado: EstadoPeriodo.PROGRAMADO })
        .mockResolvedValueOnce(null);

      prisma.periodoEvaluacion.update.mockResolvedValue({
        id: mockPeriodId,
        estado: EstadoPeriodo.ABIERTO,
      });

      const result = await service.updatePeriodStatus(
        mockInstitutionId,
        mockPeriodId,
        { estado: EstadoPeriodo.ABIERTO },
        mockUserId,
      );

      expect(result.estado).toBe(EstadoPeriodo.ABIERTO);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ accion: 'CAMBIO_ESTADO_TRIMESTRE' }),
      );
    });
  });

  describe('createEvaluation', () => {
    const validEvalDto = {
      asignacionId: mockAsignacionId,
      periodoId: mockPeriodId,
      dimension: DimensionEvaluacion.SABER,
      nombre: 'Examen de Álgebra',
      puntajeMaximo: 35,
      fechaEvaluacion: '2026-03-15',
    };

    it('debe rechazar si el maestro no es titular de la asignación (ForbiddenException)', async () => {
      prisma.asignacionAcademica.findFirst.mockResolvedValue({
        id: mockAsignacionId,
        vinculacion: { usuarioId: 'other-teacher-uuid', estado: EstadoVinculacion.ACTIVO },
      });

      await expect(
        service.createEvaluation(mockInstitutionId, validEvalDto, mockUserId, RolInstitucional.MAESTRO),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe rechazar si el periodo no se encuentra ABIERTO (BadRequestException)', async () => {
      prisma.asignacionAcademica.findFirst.mockResolvedValue({
        id: mockAsignacionId,
        vinculacion: { usuarioId: mockUserId, estado: EstadoVinculacion.ACTIVO },
      });
      prisma.periodoEvaluacion.findFirst.mockResolvedValue({
        id: mockPeriodId,
        estado: EstadoPeriodo.PROGRAMADO, // No abierto
      });

      await expect(
        service.createEvaluation(mockInstitutionId, validEvalDto, mockUserId, RolInstitucional.MAESTRO),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar si la fecha está fuera del rango del trimestre (BadRequestException)', async () => {
      prisma.asignacionAcademica.findFirst.mockResolvedValue({
        id: mockAsignacionId,
        vinculacion: { usuarioId: mockUserId, estado: EstadoVinculacion.ACTIVO },
      });
      prisma.periodoEvaluacion.findFirst.mockResolvedValue({
        id: mockPeriodId,
        estado: EstadoPeriodo.ABIERTO,
        fechaInicio: new Date('2026-02-02'),
        fechaFin: new Date('2026-05-08'),
      });

      const outOfRangeDto = { ...validEvalDto, fechaEvaluacion: '2026-06-01' };

      await expect(
        service.createEvaluation(mockInstitutionId, outOfRangeDto, mockUserId, RolInstitucional.MAESTRO),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar si el puntaje supera el tope de la dimensión (ej. SER > 10) (BadRequestException)', async () => {
      prisma.asignacionAcademica.findFirst.mockResolvedValue({
        id: mockAsignacionId,
        vinculacion: { usuarioId: mockUserId, estado: EstadoVinculacion.ACTIVO },
      });
      prisma.periodoEvaluacion.findFirst.mockResolvedValue({
        id: mockPeriodId,
        estado: EstadoPeriodo.ABIERTO,
        fechaInicio: new Date('2026-02-02'),
        fechaFin: new Date('2026-05-08'),
      });

      const invalidSerDto = {
        ...validEvalDto,
        dimension: DimensionEvaluacion.SER,
        puntajeMaximo: 20, // Tope es 10
      };

      await expect(
        service.createEvaluation(mockInstitutionId, invalidSerDto, mockUserId, RolInstitucional.MAESTRO),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar si la sumatoria de evaluaciones supera el tope reglamentario (BadRequestException)', async () => {
      prisma.asignacionAcademica.findFirst.mockResolvedValue({
        id: mockAsignacionId,
        vinculacion: { usuarioId: mockUserId, estado: EstadoVinculacion.ACTIVO },
      });
      prisma.periodoEvaluacion.findFirst.mockResolvedValue({
        id: mockPeriodId,
        estado: EstadoPeriodo.ABIERTO,
        fechaInicio: new Date('2026-02-02'),
        fechaFin: new Date('2026-05-08'),
      });

      // Ya existe una evaluación de SABER con 25 puntos
      prisma.evaluacion.findMany.mockResolvedValue([{ puntajeMaximo: 25 }]);

      // Intentamos agregar otra de 15 puntos (25 + 15 = 40 > 35)
      const overflowDto = { ...validEvalDto, puntajeMaximo: 15 };

      await expect(
        service.createEvaluation(mockInstitutionId, overflowDto, mockUserId, RolInstitucional.MAESTRO),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe crear el instrumento de evaluación exitosamente y auditar', async () => {
      prisma.asignacionAcademica.findFirst.mockResolvedValue({
        id: mockAsignacionId,
        vinculacion: { usuarioId: mockUserId, estado: EstadoVinculacion.ACTIVO },
      });
      prisma.periodoEvaluacion.findFirst.mockResolvedValue({
        id: mockPeriodId,
        estado: EstadoPeriodo.ABIERTO,
        fechaInicio: new Date('2026-02-02'),
        fechaFin: new Date('2026-05-08'),
      });
      prisma.evaluacion.findMany.mockResolvedValue([]); // Ninguna previa

      const mockCreated = { id: 'eval-uuid-100', ...validEvalDto, activo: true };
      prisma.evaluacion.create.mockResolvedValue(mockCreated);

      const result = await service.createEvaluation(
        mockInstitutionId,
        validEvalDto,
        mockUserId,
        RolInstitucional.MAESTRO,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('eval-uuid-100');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ accion: 'CREACION_EVALUACION' }),
      );
    });
  });

  describe('updateEvaluation and deleteEvaluation', () => {
    it('debe rechazar modificación si el trimestre está CERRADO (BadRequestException)', async () => {
      prisma.evaluacion.findFirst.mockResolvedValue({
        id: 'eval-1',
        periodo: { estado: EstadoPeriodo.CERRADO },
        asignacion: { vinculacion: { usuarioId: mockUserId } },
      });

      await expect(
        service.updateEvaluation(
          mockInstitutionId,
          'eval-1',
          { nombre: 'Nuevo nombre' },
          mockUserId,
          RolInstitucional.MAESTRO,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar eliminación si el trimestre está CERRADO (BadRequestException)', async () => {
      prisma.evaluacion.findFirst.mockResolvedValue({
        id: 'eval-1',
        periodo: { estado: EstadoPeriodo.CERRADO },
        asignacion: { vinculacion: { usuarioId: mockUserId } },
      });

      await expect(
        service.deleteEvaluation(mockInstitutionId, 'eval-1', mockUserId, RolInstitucional.MAESTRO),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
