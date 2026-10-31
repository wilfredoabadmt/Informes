import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  EstadoAsistencia,
  EstadoAsignacion,
  EstadoInscripcion,
  EstadoVinculacion,
  RolInstitucional,
} from '@prisma/client';

describe('AttendanceService (Unit Tests)', () => {
  let service: AttendanceService;
  let prisma: any;
  let auditService: any;

  const mockInstitutionId = 'institucion-uuid-1111';
  const mockUserId = 'user-uuid-9999';
  const mockParaleloId = 'paralelo-uuid-2222';
  const mockStudent1Id = 'student-uuid-0001';
  const mockStudent2Id = 'student-uuid-0002';

  beforeEach(async () => {
    prisma = {
      paralelo: {
        findFirst: jest.fn(),
      },
      asignacionAcademica: {
        findFirst: jest.fn(),
      },
      registroAsistencia: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      detalleAsistencia: {
        findFirst: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
      },
      inscripcion: {
        findMany: jest.fn(),
      },
      withTenantContext: jest.fn(async (instId, callback) => callback(prisma)),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  describe('recordAttendance', () => {
    const validDto = {
      paraleloId: mockParaleloId,
      fecha: '2026-03-02',
      observaciones: 'Toma regular',
      asistencia: [
        { estudianteId: mockStudent1Id, estado: EstadoAsistencia.PRESENTE },
        { estudianteId: mockStudent2Id, estado: EstadoAsistencia.FALTA },
      ],
    };

    it('debe rechazar el registro con fecha futura (BadRequestException)', async () => {
      const futureDateDto = {
        ...validDto,
        fecha: '2099-12-31',
      };

      await expect(
        service.recordAttendance(mockInstitutionId, futureDateDto, mockUserId, RolInstitucional.DIRECTOR),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar NotFoundException si el paralelo no existe en la institución', async () => {
      prisma.paralelo.findFirst.mockResolvedValue(null);

      await expect(
        service.recordAttendance(mockInstitutionId, validDto, mockUserId, RolInstitucional.DIRECTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ForbiddenException si un maestro no tiene asignación pedagógica en el paralelo', async () => {
      prisma.paralelo.findFirst.mockResolvedValue({ id: mockParaleloId, institucionId: mockInstitutionId });
      prisma.asignacionAcademica.findFirst.mockResolvedValue(null);

      await expect(
        service.recordAttendance(mockInstitutionId, validDto, mockUserId, RolInstitucional.MAESTRO),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe rechazar registro duplicado para el mismo paralelo y fecha (ConflictException)', async () => {
      prisma.paralelo.findFirst.mockResolvedValue({ id: mockParaleloId, institucionId: mockInstitutionId });
      prisma.registroAsistencia.findFirst.mockResolvedValue({ id: 'existing-reg-id' });

      await expect(
        service.recordAttendance(mockInstitutionId, validDto, mockUserId, RolInstitucional.DIRECTOR),
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar BadRequestException si un estudiante del bloque no está matriculado como EFECTIVO', async () => {
      prisma.paralelo.findFirst.mockResolvedValue({ id: mockParaleloId, institucionId: mockInstitutionId });
      prisma.registroAsistencia.findFirst.mockResolvedValue(null);
      // Solo mockStudent1Id tiene matrícula
      prisma.inscripcion.findMany.mockResolvedValue([{ estudianteId: mockStudent1Id }]);

      await expect(
        service.recordAttendance(mockInstitutionId, validDto, mockUserId, RolInstitucional.DIRECTOR),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe registrar la asistencia en bloque atómicamente y auditar', async () => {
      prisma.paralelo.findFirst.mockResolvedValue({ id: mockParaleloId, institucionId: mockInstitutionId });
      prisma.registroAsistencia.findFirst.mockResolvedValue(null);
      prisma.inscripcion.findMany.mockResolvedValue([
        { estudianteId: mockStudent1Id },
        { estudianteId: mockStudent2Id },
      ]);

      const mockCreatedHeader = { id: 'reg-uuid-1234', paraleloId: mockParaleloId };
      prisma.registroAsistencia.create.mockResolvedValue(mockCreatedHeader);
      prisma.detalleAsistencia.createMany.mockResolvedValue({ count: 2 });

      const result = await service.recordAttendance(
        mockInstitutionId,
        validDto,
        mockUserId,
        RolInstitucional.DIRECTOR,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('reg-uuid-1234');
      expect(result.totalEstudiantes).toBe(2);
      expect(result.presentes).toBe(1);
      expect(result.faltas).toBe(1);
      expect(prisma.withTenantContext).toHaveBeenCalledWith(mockInstitutionId, expect.any(Function));
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'REGISTRO_ASISTENCIA',
          institucionId: mockInstitutionId,
        }),
      );
    });
  });

  describe('getAttendanceByDate', () => {
    it('debe retornar la planilla ordenada alfabéticamente por estudiante', async () => {
      prisma.paralelo.findFirst.mockResolvedValue({
        id: mockParaleloId,
        institucionId: mockInstitutionId,
        letra: 'A',
        turno: 'MANANA',
        curso: { nombre: 'Primero de Primaria', grado: 1 },
      });

      prisma.registroAsistencia.findFirst.mockResolvedValue({
        id: 'reg-uuid-1',
        paralelo: {
          id: mockParaleloId,
          letra: 'A',
          turno: 'MANANA',
          curso: { nombre: 'Primero de Primaria', grado: 1 },
        },
        detalles: [
          {
            id: 'det-2',
            estudianteId: mockStudent2Id,
            estado: EstadoAsistencia.FALTA,
            justificado: false,
            observacion: null,
            estudiante: {
              codigoRude: 'RUDE-002',
              persona: { ci: '2222', primerApellido: 'Zeballos', segundoApellido: 'A', nombres: 'Carlos' },
            },
          },
          {
            id: 'det-1',
            estudianteId: mockStudent1Id,
            estado: EstadoAsistencia.PRESENTE,
            justificado: false,
            observacion: null,
            estudiante: {
              codigoRude: 'RUDE-001',
              persona: { ci: '1111', primerApellido: 'Alvarez', segundoApellido: 'B', nombres: 'Ana' },
            },
          },
        ],
      });

      const result = await service.getAttendanceByDate(
        mockInstitutionId,
        { paraleloId: mockParaleloId, fecha: '2026-03-02' },
        mockUserId,
        RolInstitucional.DIRECTOR,
      );

      expect(result.detalles[0].nombreCompleto).toContain('Alvarez');
      expect(result.detalles[1].nombreCompleto).toContain('Zeballos');
    });

    it('debe lanzar NotFoundException si no existe planilla para la fecha', async () => {
      prisma.paralelo.findFirst.mockResolvedValue({ id: mockParaleloId, institucionId: mockInstitutionId });
      prisma.registroAsistencia.findFirst.mockResolvedValue(null);

      await expect(
        service.getAttendanceByDate(
          mockInstitutionId,
          { paraleloId: mockParaleloId, fecha: '2026-03-02' },
          mockUserId,
          RolInstitucional.DIRECTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('justifyAbsence', () => {
    it('debe permitir a un Director conmutar FALTA a LICENCIA', async () => {
      prisma.detalleAsistencia.findFirst.mockResolvedValue({
        id: 'det-uuid-1',
        estudianteId: mockStudent1Id,
        estado: EstadoAsistencia.FALTA,
        registroAsistencia: { paraleloId: mockParaleloId, institucionId: mockInstitutionId },
        estudiante: {
          codigoRude: 'RUDE-001',
          persona: { ci: '1111', primerApellido: 'Pérez', segundoApellido: 'Gómez', nombres: 'Juan' },
        },
      });

      prisma.detalleAsistencia.update.mockResolvedValue({
        id: 'det-uuid-1',
        estudianteId: mockStudent1Id,
        estado: EstadoAsistencia.LICENCIA,
        justificado: true,
        observacion: 'Reposo médico 48h',
        estudiante: {
          codigoRude: 'RUDE-001',
          persona: { ci: '1111', primerApellido: 'Pérez', segundoApellido: 'Gómez', nombres: 'Juan' },
        },
      });

      const result = await service.justifyAbsence(
        mockInstitutionId,
        'det-uuid-1',
        { estado: EstadoAsistencia.LICENCIA, justificado: true, observacion: 'Reposo médico 48h' },
        mockUserId,
        RolInstitucional.DIRECTOR,
      );

      expect(result.estado).toBe(EstadoAsistencia.LICENCIA);
      expect(result.justificado).toBe(true);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ accion: 'JUSTIFICACION_ASISTENCIA' }),
      );
    });

    it('debe denegar justificación si un maestro NO es tutor del paralelo', async () => {
      prisma.detalleAsistencia.findFirst.mockResolvedValue({
        id: 'det-uuid-1',
        registroAsistencia: { paraleloId: mockParaleloId, institucionId: mockInstitutionId },
      });
      // No es tutor
      prisma.asignacionAcademica.findFirst.mockResolvedValue(null);

      await expect(
        service.justifyAbsence(
          mockInstitutionId,
          'det-uuid-1',
          { estado: EstadoAsistencia.LICENCIA, observacion: 'Permiso' },
          mockUserId,
          RolInstitucional.MAESTRO,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAttendanceStats', () => {
    it('debe calcular métricas consolidadas del paralelo y por estudiante', async () => {
      prisma.paralelo.findFirst.mockResolvedValue({ id: mockParaleloId, institucionId: mockInstitutionId });

      prisma.registroAsistencia.findMany.mockResolvedValue([
        {
          id: 'sesion-1',
          fecha: new Date('2026-03-01'),
          detalles: [
            {
              estudianteId: mockStudent1Id,
              estado: EstadoAsistencia.PRESENTE,
              estudiante: { persona: { primerApellido: 'Alvarez', segundoApellido: '', nombres: 'Ana' } },
            },
            {
              estudianteId: mockStudent2Id,
              estado: EstadoAsistencia.FALTA,
              estudiante: { persona: { primerApellido: 'Zeballos', segundoApellido: '', nombres: 'Carlos' } },
            },
          ],
        },
        {
          id: 'sesion-2',
          fecha: new Date('2026-03-02'),
          detalles: [
            {
              estudianteId: mockStudent1Id,
              estado: EstadoAsistencia.PRESENTE,
              estudiante: { persona: { primerApellido: 'Alvarez', segundoApellido: '', nombres: 'Ana' } },
            },
            {
              estudianteId: mockStudent2Id,
              estado: EstadoAsistencia.ATRASO,
              estudiante: { persona: { primerApellido: 'Zeballos', segundoApellido: '', nombres: 'Carlos' } },
            },
          ],
        },
      ]);

      const stats = await service.getAttendanceStats(
        mockInstitutionId,
        { paraleloId: mockParaleloId, fechaInicio: '2026-03-01', fechaFin: '2026-03-31' },
        mockUserId,
        RolInstitucional.DIRECTOR,
      );

      expect(stats.totalSesiones).toBe(2);
      expect(stats.estudiantes).toHaveLength(2);
      // Student 1: 2 presentes de 2 -> 100%
      const ana = stats.estudiantes.find((e) => e.estudianteId === mockStudent1Id);
      expect(ana?.presentes).toBe(2);
      expect(ana?.porcentajeAsistencia).toBe(100);

      // Student 2: 1 falta, 1 atraso de 2 -> (0 + 1) / 2 = 50%
      const carlos = stats.estudiantes.find((e) => e.estudianteId === mockStudent2Id);
      expect(carlos?.faltas).toBe(1);
      expect(carlos?.atrasos).toBe(1);
      expect(carlos?.porcentajeAsistencia).toBe(50);

      // Global: 3 asistencias (2 + 1) de 4 oportunidades -> 75%
      expect(stats.porcentajeGlobal).toBe(75);
    });
  });
});
