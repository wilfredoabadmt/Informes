import { Test, TestingModule } from '@nestjs/testing';
import { CentralizersService } from './centralizers.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  EstadoPeriodo,
  RolInstitucional,
  TipoPeriodo,
} from '@prisma/client';

describe('CentralizersService (Unit Tests)', () => {
  let service: CentralizersService;
  let prisma: any;
  let auditService: any;

  const mockInstitutionId = 'institucion-uuid-1111';
  const mockUserId = 'user-uuid-9999';
  const mockParaleloId = 'paralelo-uuid-001';
  const mockGestionId = 'gestion-uuid-001';
  const mockPeriodo1Id = 'periodo-1T-uuid';
  const mockPeriodoId = 'periodo-uuid-001';
  const mockAsigMatId = 'asig-matematicas-uuid';
  const mockStudent1Id = 'student-uuid-001';

  const mockParalelo = {
    id: mockParaleloId,
    institucionId: mockInstitutionId,
    gestionId: mockGestionId,
    letra: 'A',
    curso: { nombre: '1er Año Escolar' },
    gestion: { anio: 2026 },
  };

  const mockMateria = { id: 'materia-id', codigo: 'MAT', nombre: 'Matemática' };

  const mockAsignacion = {
    id: mockAsigMatId,
    materiaId: mockMateria.id,
    materia: mockMateria,
  };

  const mockEstudiante = {
    estudianteId: mockStudent1Id,
    estudiante: {
      codigoRude: '123-456789',
      persona: {
        nombres: 'Ana',
        primerApellido: 'Pérez',
        segundoApellido: 'López',
      },
    },
  };

  beforeEach(async () => {
    prisma = {
      paralelo: { findFirst: jest.fn() },
      periodoEvaluacion: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      asignacionAcademica: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      evaluacion: { findMany: jest.fn() },
      inscripcion: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      withTenantContext: jest.fn(async (_instId: string, callback: any) =>
        callback(prisma),
      ),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CentralizersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<CentralizersService>(CentralizersService);
  });

  describe('getTrimesterCentralizer', () => {
    const query = { paraleloId: mockParaleloId, periodoId: mockPeriodoId };

    it('debe rechazar si el paralelo no existe (NotFoundException)', async () => {
      prisma.paralelo.findFirst.mockResolvedValue(null);

      await expect(
        service.getTrimesterCentralizer(
          mockInstitutionId,
          query,
          mockUserId,
          RolInstitucional.DIRECTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar si el periodo no existe (NotFoundException)', async () => {
      prisma.paralelo.findFirst.mockResolvedValue(mockParalelo);
      prisma.periodoEvaluacion.findFirst.mockResolvedValue(null);

      await expect(
        service.getTrimesterCentralizer(
          mockInstitutionId,
          query,
          mockUserId,
          RolInstitucional.DIRECTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar maestro sin asignación en el paralelo (ForbiddenException)', async () => {
      prisma.paralelo.findFirst.mockResolvedValue(mockParalelo);
      prisma.periodoEvaluacion.findFirst.mockResolvedValue({
        id: mockPeriodoId,
        gestionId: mockGestionId,
        periodo: TipoPeriodo.PRIMER_TRIMESTRE,
      });
      prisma.asignacionAcademica.count.mockResolvedValue(0);

      await expect(
        service.getTrimesterCentralizer(
          mockInstitutionId,
          query,
          mockUserId,
          RolInstitucional.MAESTRO,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe calcular nota por materia (suma de dimensiones) y promedio del estudiante', async () => {
      prisma.paralelo.findFirst.mockResolvedValue(mockParalelo);
      prisma.periodoEvaluacion.findFirst.mockResolvedValue({
        id: mockPeriodoId,
        gestionId: mockGestionId,
        periodo: TipoPeriodo.PRIMER_TRIMESTRE,
      });
      prisma.asignacionAcademica.findMany.mockResolvedValue([mockAsignacion]);
      prisma.evaluacion.findMany.mockResolvedValue([
        {
          id: 'eval-1',
          asignacionId: mockAsigMatId,
          periodoId: mockPeriodoId,
          calificaciones: [{ estudianteId: mockStudent1Id, nota: 30 }],
        },
        {
          id: 'eval-2',
          asignacionId: mockAsigMatId,
          periodoId: mockPeriodoId,
          calificaciones: [{ estudianteId: mockStudent1Id, nota: 25 }],
        },
      ]);
      prisma.inscripcion.findMany.mockResolvedValue([mockEstudiante]);

      const result = await service.getTrimesterCentralizer(
        mockInstitutionId,
        query,
        mockUserId,
        RolInstitucional.DIRECTOR,
      );

      expect(result.curso).toBe('1er Año Escolar');
      expect(result.trimestre).toBe('1er Trimestre');
      expect(result.estudiantes[0].calificaciones[0].materiaId).toBe(mockMateria.id);
      expect(result.estudiantes[0].calificaciones[0].nota).toBe(55);
      expect(result.estudiantes[0].calificaciones[0].estado).toBe('APROBADO');
      expect(result.estudiantes[0].promedioTrimestral).toBe(55);
      expect(result.estadisticas).toEqual({
        totalEstudiantes: 1,
        aprobadosEnTodo: 1,
        conReprobadas: 0,
        promedioGeneralAula: 55,
      });
    });

    it('debe marcar REPROBADO una materia asentada con nota < 51', async () => {
      prisma.paralelo.findFirst.mockResolvedValue(mockParalelo);
      prisma.periodoEvaluacion.findFirst.mockResolvedValue({
        id: mockPeriodoId,
        gestionId: mockGestionId,
        periodo: TipoPeriodo.PRIMER_TRIMESTRE,
      });
      prisma.asignacionAcademica.findMany.mockResolvedValue([mockAsignacion]);
      prisma.evaluacion.findMany.mockResolvedValue([
        {
          id: 'eval-1',
          asignacionId: mockAsigMatId,
          periodoId: mockPeriodoId,
          calificaciones: [{ estudianteId: mockStudent1Id, nota: 40 }],
        },
      ]);
      prisma.inscripcion.findMany.mockResolvedValue([mockEstudiante]);

      const result = await service.getTrimesterCentralizer(
        mockInstitutionId,
        query,
        mockUserId,
        RolInstitucional.DIRECTOR,
      );

      expect(result.estudiantes[0].calificaciones[0].nota).toBe(40);
      expect(result.estudiantes[0].calificaciones[0].estado).toBe('REPROBADO');
      expect(result.estadisticas.conReprobadas).toBe(1);
    });
  });

  describe('getAnnualCentralizer', () => {
    const query = { paraleloId: mockParaleloId };

    it('debe rechazar si el paralelo no existe (NotFoundException)', async () => {
      prisma.paralelo.findFirst.mockResolvedValue(null);

      await expect(
        service.getAnnualCentralizer(
          mockInstitutionId,
          query,
          mockUserId,
          RolInstitucional.DIRECTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe calcular promedio anual round((1T+2T+3T)/3) y situación tentativa', async () => {
      prisma.paralelo.findFirst.mockResolvedValue(mockParalelo);
      prisma.asignacionAcademica.findMany.mockResolvedValue([mockAsignacion]);
      prisma.periodoEvaluacion.findMany.mockResolvedValue([
        { id: mockPeriodo1Id, periodo: TipoPeriodo.PRIMER_TRIMESTRE, gestionId: mockGestionId },
        { id: mockPeriodoId, periodo: TipoPeriodo.SEGUNDO_TRIMESTRE, gestionId: mockGestionId },
        { id: 'periodo-3T-uuid', periodo: TipoPeriodo.TERCER_TRIMESTRE, gestionId: mockGestionId },
      ]);
      prisma.evaluacion.findMany.mockResolvedValue([
        {
          id: 'eval-1',
          asignacionId: mockAsigMatId,
          periodoId: mockPeriodo1Id,
          calificaciones: [{ estudianteId: mockStudent1Id, nota: 60 }],
        },
        {
          id: 'eval-2',
          asignacionId: mockAsigMatId,
          periodoId: mockPeriodoId,
          calificaciones: [{ estudianteId: mockStudent1Id, nota: 61 }],
        },
        {
          id: 'eval-3',
          asignacionId: mockAsigMatId,
          periodoId: 'periodo-3T-uuid',
          calificaciones: [{ estudianteId: mockStudent1Id, nota: 61 }],
        },
      ]);
      prisma.inscripcion.findMany.mockResolvedValue([mockEstudiante]);

      const result = await service.getAnnualCentralizer(
        mockInstitutionId,
        query,
        mockUserId,
        RolInstitucional.DIRECTOR,
      );

      expect(result.gestion).toBe(2026);
      expect(result.estudiantes[0].materias[0].nota1T).toBe(60);
      expect(result.estudiantes[0].materias[0].nota2T).toBe(61);
      expect(result.estudiantes[0].materias[0].nota3T).toBe(61);
      expect(result.estudiantes[0].materias[0].promedioAnual).toBe(61);
      expect(result.estudiantes[0].situacionFinal).toBe('PROMOVIDO');
      expect(result.estadisticas).toEqual({
        totalEstudiantes: 1,
        promovidos: 1,
        retenidos: 0,
        promedioGeneralGestion: 61,
      });
    });

    it('debe marcar RETENIDO cuando alguna materia queda reprobada', async () => {
      prisma.paralelo.findFirst.mockResolvedValue(mockParalelo);
      prisma.asignacionAcademica.findMany.mockResolvedValue([mockAsignacion]);
      prisma.periodoEvaluacion.findMany.mockResolvedValue([
        { id: mockPeriodo1Id, periodo: TipoPeriodo.PRIMER_TRIMESTRE, gestionId: mockGestionId },
        { id: mockPeriodoId, periodo: TipoPeriodo.SEGUNDO_TRIMESTRE, gestionId: mockGestionId },
        { id: 'periodo-3T-uuid', periodo: TipoPeriodo.TERCER_TRIMESTRE, gestionId: mockGestionId },
      ]);
      prisma.evaluacion.findMany.mockResolvedValue([]);
      prisma.inscripcion.findMany.mockResolvedValue([mockEstudiante]);

      const result = await service.getAnnualCentralizer(
        mockInstitutionId,
        query,
        mockUserId,
        RolInstitucional.DIRECTOR,
      );

      expect(result.estudiantes[0].materias[0].promedioAnual).toBe(0);
      expect(result.estudiantes[0].situacionFinal).toBe('RETENIDO');
      expect(result.estadisticas.retenidos).toBe(1);
    });
  });

  describe('finalizeAnnualCentralizer', () => {
    const dto = { paraleloId: mockParaleloId };

    it('debe rechazar maestro de Nivel 3 (ForbiddenException)', async () => {
      await expect(
        service.finalizeAnnualCentralizer(
          mockInstitutionId,
          dto,
          mockUserId,
          RolInstitucional.MAESTRO,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.paralelo.findFirst).not.toHaveBeenCalled();
    });

    it('debe rechazar si hay trimestres no cerrados (BadRequestException)', async () => {
      prisma.paralelo.findFirst.mockResolvedValue(mockParalelo);
      prisma.periodoEvaluacion.findMany.mockResolvedValue([
        { id: mockPeriodo1Id, periodo: TipoPeriodo.PRIMER_TRIMESTRE, estado: EstadoPeriodo.CERRADO },
        { id: mockPeriodoId, periodo: TipoPeriodo.SEGUNDO_TRIMESTRE, estado: EstadoPeriodo.ABIERTO },
        { id: 'periodo-3T-uuid', periodo: TipoPeriodo.TERCER_TRIMESTRE, estado: EstadoPeriodo.CERRADO },
      ]);

      await expect(
        service.finalizeAnnualCentralizer(
          mockInstitutionId,
          dto,
          mockUserId,
          RolInstitucional.DIRECTOR,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar si hay materias sin calificar (BadRequestException)', async () => {
      prisma.paralelo.findFirst.mockResolvedValue(mockParalelo);
      prisma.periodoEvaluacion.findMany.mockResolvedValue([
        { id: mockPeriodo1Id, periodo: TipoPeriodo.PRIMER_TRIMESTRE, estado: EstadoPeriodo.CERRADO },
        { id: mockPeriodoId, periodo: TipoPeriodo.SEGUNDO_TRIMESTRE, estado: EstadoPeriodo.CERRADO },
        { id: 'periodo-3T-uuid', periodo: TipoPeriodo.TERCER_TRIMESTRE, estado: EstadoPeriodo.CERRADO },
      ]);
      prisma.asignacionAcademica.findMany.mockResolvedValue([mockAsignacion]);
      prisma.evaluacion.findMany.mockResolvedValue([]);
      prisma.inscripcion.findMany.mockResolvedValue([mockEstudiante]);

      await expect(
        service.finalizeAnnualCentralizer(
          mockInstitutionId,
          dto,
          mockUserId,
          RolInstitucional.DIRECTOR,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe persistir situación final con RLS y registrar auditoría (200)', async () => {
      prisma.paralelo.findFirst.mockResolvedValue(mockParalelo);
      prisma.periodoEvaluacion.findMany.mockResolvedValue([
        { id: mockPeriodo1Id, periodo: TipoPeriodo.PRIMER_TRIMESTRE, estado: EstadoPeriodo.CERRADO },
        { id: mockPeriodoId, periodo: TipoPeriodo.SEGUNDO_TRIMESTRE, estado: EstadoPeriodo.CERRADO },
        { id: 'periodo-3T-uuid', periodo: TipoPeriodo.TERCER_TRIMESTRE, estado: EstadoPeriodo.CERRADO },
      ]);
      prisma.asignacionAcademica.findMany.mockResolvedValue([mockAsignacion]);
      prisma.evaluacion.findMany.mockResolvedValue([
        {
          id: 'eval-1',
          asignacionId: mockAsigMatId,
          periodoId: mockPeriodo1Id,
          calificaciones: [{ estudianteId: mockStudent1Id, nota: 60 }],
        },
        {
          id: 'eval-2',
          asignacionId: mockAsigMatId,
          periodoId: mockPeriodoId,
          calificaciones: [{ estudianteId: mockStudent1Id, nota: 61 }],
        },
        {
          id: 'eval-3',
          asignacionId: mockAsigMatId,
          periodoId: 'periodo-3T-uuid',
          calificaciones: [{ estudianteId: mockStudent1Id, nota: 61 }],
        },
      ]);
      prisma.inscripcion.findMany.mockResolvedValue([mockEstudiante]);
      prisma.inscripcion.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.finalizeAnnualCentralizer(
        mockInstitutionId,
        dto,
        mockUserId,
        RolInstitucional.DIRECTOR,
      );

      expect(prisma.withTenantContext).toHaveBeenCalledWith(
        mockInstitutionId,
        expect.any(Function),
      );
      expect(prisma.inscripcion.updateMany).toHaveBeenCalledTimes(1);
      expect(prisma.inscripcion.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            institucionId: mockInstitutionId,
            estudianteId: mockStudent1Id,
          }),
          data: expect.objectContaining({
            promedioAnual: 61,
            situacionFinal: 'PROMOVIDO',
          }),
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'CIERRE_ANUAL_PARALELO',
          tipo: 'USER_UPDATE',
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          paraleloId: mockParaleloId,
          totalProcesados: 1,
          promovidos: 1,
          retenidos: 0,
        }),
      );
    });
  });
});
