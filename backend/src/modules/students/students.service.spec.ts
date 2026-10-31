import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  EstadoInscripcion,
  EstadoGestion,
  EstadoVinculacion,
  EstadoAsignacion,
  RolInstitucional,
  RolGlobal,
  ParentescoTutor,
} from '@prisma/client';

describe('StudentsService (Unit Tests)', () => {
  let service: StudentsService;
  let prisma: any;
  let auditService: any;

  const mockInstitutionId = 'institucion-uuid-1111';
  const mockUserId = 'user-uuid-9999';

  beforeEach(async () => {
    prisma = {
      estudiante: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      persona: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      gestionEscolar: {
        findUnique: jest.fn(),
      },
      paralelo: {
        findUnique: jest.fn(),
      },
      inscripcion: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      vinculacionInstitucional: {
        findFirst: jest.fn(),
      },
      asignacionAcademica: {
        findFirst: jest.fn(),
      },
      withTenantContext: jest.fn(),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  // -------------------------------------------------------------
  // EMPADRONAMIENTO CON CÓDIGO RUDE
  // -------------------------------------------------------------
  describe('createStudent', () => {
    const validDto = {
      codigoRude: '8073004520261A',
      ci: '12345678',
      nombres: 'Mateo',
      primerApellido: 'Mamani',
      segundoApellido: 'Quispe',
      fechaNacimiento: '2012-05-14',
      genero: 'M',
      nombreTutor: 'Lucía Quispe',
      parentescoTutor: ParentescoTutor.MADRE,
    };

    it('debe arrojar ConflictException si el código RUDE ya existe', async () => {
      prisma.estudiante.findUnique.mockResolvedValue({
        id: 'existing-student',
        codigoRude: '8073004520261A',
      });

      await expect(service.createStudent(validDto, mockUserId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe arrojar ConflictException si la Cédula de Identidad ya pertenece a otro estudiante', async () => {
      prisma.estudiante.findUnique.mockResolvedValue(null);
      prisma.persona.findUnique.mockResolvedValue({
        id: 'persona-1',
        ci: '12345678',
        estudiante: { id: 'other-student' },
      });

      await expect(service.createStudent(validDto, mockUserId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe empadronar al estudiante exitosamente y registrar auditoría', async () => {
      prisma.estudiante.findUnique.mockResolvedValue(null);
      prisma.persona.findUnique.mockResolvedValue(null);
      prisma.persona.create.mockResolvedValue({
        id: 'new-persona-id',
        ci: '12345678',
        nombres: 'Mateo',
        primerApellido: 'Mamani',
        segundoApellido: 'Quispe',
        fechaNacimiento: new Date('2012-05-14'),
        genero: 'M',
      });
      prisma.estudiante.create.mockResolvedValue({
        id: 'new-student-id',
        personaId: 'new-persona-id',
        codigoRude: '8073004520261A',
        nombreTutor: 'Lucía Quispe',
        parentescoTutor: ParentescoTutor.MADRE,
        persona: {
          ci: '12345678',
          nombres: 'Mateo',
          primerApellido: 'Mamani',
          segundoApellido: 'Quispe',
          fechaNacimiento: new Date('2012-05-14'),
          genero: 'M',
        },
      });

      const res = await service.createStudent(validDto, mockUserId);

      expect(res.id).toBe('new-student-id');
      expect(res.codigoRude).toBe('8073004520261A');
      expect(res.nombreCompleto).toContain('Mateo Mamani');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'ALTA_ESTUDIANTE_RUDE',
        }),
      );
    });
  });

  // -------------------------------------------------------------
  // MATRICULACIÓN ESCOLAR
  // -------------------------------------------------------------
  describe('enrollStudent', () => {
    const enrollDto = {
      estudianteId: 'student-uuid-1',
      gestionId: 'gestion-uuid-1',
      paraleloId: 'paralelo-uuid-1',
      esRepitente: false,
    };

    it('debe arrojar NotFoundException si el estudiante no existe', async () => {
      prisma.estudiante.findUnique.mockResolvedValue(null);

      await expect(
        service.enrollStudent(mockInstitutionId, enrollDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe arrojar BadRequestException si la gestión escolar está CERRADA', async () => {
      prisma.estudiante.findUnique.mockResolvedValue({ id: 'student-uuid-1' });
      prisma.gestionEscolar.findUnique.mockResolvedValue({
        id: 'gestion-uuid-1',
        institucionId: mockInstitutionId,
        estado: EstadoGestion.CERRADA,
      });

      await expect(
        service.enrollStudent(mockInstitutionId, enrollDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe arrojar ConflictException si el estudiante ya cuenta con matrícula activa EFECTIVO en el año', async () => {
      prisma.estudiante.findUnique.mockResolvedValue({ id: 'student-uuid-1' });
      prisma.gestionEscolar.findUnique.mockResolvedValue({
        id: 'gestion-uuid-1',
        institucionId: mockInstitutionId,
        estado: EstadoGestion.ABIERTA,
        anio: 2026,
      });
      prisma.paralelo.findUnique.mockResolvedValue({
        id: 'paralelo-uuid-1',
        institucionId: mockInstitutionId,
        gestionId: 'gestion-uuid-1',
        curso: { nombre: '1º de Secundaria' },
        letra: 'A',
      });
      prisma.inscripcion.findFirst.mockResolvedValue({
        id: 'existing-enrollment',
        institucion: { nombre: 'U.E. Franz Tamayo' },
      });

      await expect(
        service.enrollStudent(mockInstitutionId, enrollDto, mockUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('debe arrojar BadRequestException si el aula ha superado el cupo máximo', async () => {
      prisma.estudiante.findUnique.mockResolvedValue({ id: 'student-uuid-1' });
      prisma.gestionEscolar.findUnique.mockResolvedValue({
        id: 'gestion-uuid-1',
        institucionId: mockInstitutionId,
        estado: EstadoGestion.ABIERTA,
        anio: 2026,
      });
      prisma.paralelo.findUnique.mockResolvedValue({
        id: 'paralelo-uuid-1',
        institucionId: mockInstitutionId,
        gestionId: 'gestion-uuid-1',
        cupoMaximo: 35,
        curso: { nombre: '1º de Secundaria' },
        letra: 'A',
      });
      prisma.inscripcion.findFirst.mockResolvedValue(null);
      prisma.inscripcion.count.mockResolvedValue(35); // cupo lleno

      await expect(
        service.enrollStudent(mockInstitutionId, enrollDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe matricular al estudiante exitosamente y registrar auditoría', async () => {
      prisma.estudiante.findUnique.mockResolvedValue({
        id: 'student-uuid-1',
        codigoRude: '8073004520261A',
        persona: { nombres: 'Mateo', primerApellido: 'Mamani' },
      });
      prisma.gestionEscolar.findUnique.mockResolvedValue({
        id: 'gestion-uuid-1',
        institucionId: mockInstitutionId,
        estado: EstadoGestion.ABIERTA,
        anio: 2026,
      });
      prisma.paralelo.findUnique.mockResolvedValue({
        id: 'paralelo-uuid-1',
        institucionId: mockInstitutionId,
        gestionId: 'gestion-uuid-1',
        cupoMaximo: 35,
        letra: 'A',
        curso: { nombre: '1º de Secundaria' },
      });
      prisma.inscripcion.findFirst.mockResolvedValue(null);
      prisma.inscripcion.count.mockResolvedValue(10); // hay cupo disponible

      prisma.inscripcion.create.mockResolvedValue({
        id: 'new-inscripcion-id',
        institucionId: mockInstitutionId,
        estudianteId: 'student-uuid-1',
        gestionId: 'gestion-uuid-1',
        paraleloId: 'paralelo-uuid-1',
        estado: EstadoInscripcion.EFECTIVO,
        esRepitente: false,
        fechaInscripcion: new Date(),
        estudiante: {
          codigoRude: '8073004520261A',
          persona: { nombres: 'Mateo', primerApellido: 'Mamani' },
        },
        paralelo: { letra: 'A', curso: { nombre: '1º de Secundaria' } },
        gestion: { anio: 2026 },
      });

      const res = await service.enrollStudent(mockInstitutionId, enrollDto, mockUserId);

      expect(res.id).toBe('new-inscripcion-id');
      expect(res.estado).toBe(EstadoInscripcion.EFECTIVO);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'MATRICULACION_ESTUDIANTE',
        }),
      );
    });
  });

  // -------------------------------------------------------------
  // ROSTER DE AULA Y AUTORIZACIÓN PEDAGÓGICA
  // -------------------------------------------------------------
  describe('getSectionRoster', () => {
    it('debe arrojar ForbiddenException si un maestro no tiene asignación docente en ese aula', async () => {
      prisma.paralelo.findUnique.mockResolvedValue({
        id: 'paralelo-1',
        institucionId: mockInstitutionId,
      });
      prisma.vinculacionInstitucional.findFirst.mockResolvedValue({
        id: 'vinc-maestro',
        rolInstitucional: RolInstitucional.MAESTRO,
      });
      prisma.asignacionAcademica.findFirst.mockResolvedValue(null); // Sin asignación en el aula

      await expect(
        service.getSectionRoster(
          mockInstitutionId,
          'paralelo-1',
          mockUserId,
          RolGlobal.INSTITUTIONAL_USER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe permitir consultar el roster a un maestro con asignación pedagógica activa', async () => {
      prisma.paralelo.findUnique.mockResolvedValue({
        id: 'paralelo-1',
        institucionId: mockInstitutionId,
      });
      prisma.vinculacionInstitucional.findFirst.mockResolvedValue({
        id: 'vinc-maestro',
        rolInstitucional: RolInstitucional.MAESTRO,
      });
      prisma.asignacionAcademica.findFirst.mockResolvedValue({
        id: 'asig-activa',
        estado: EstadoAsignacion.ACTIVA,
      });

      prisma.withTenantContext.mockImplementation(async (tenantId, cb) => {
        const tx = {
          inscripcion: {
            findMany: jest.fn().mockResolvedValue([
              {
                id: 'ins-1',
                estado: EstadoInscripcion.EFECTIVO,
                esRepitente: false,
                estudiante: {
                  id: 'est-1',
                  codigoRude: '8073004520261A',
                  nombreTutor: 'Lucía Quispe',
                  persona: {
                    ci: '12345678',
                    nombres: 'Mateo',
                    primerApellido: 'Mamani',
                    segundoApellido: 'Quispe',
                    genero: 'M',
                  },
                },
              },
            ]),
          },
        };
        return cb(tx);
      });

      const roster = await service.getSectionRoster(
        mockInstitutionId,
        'paralelo-1',
        mockUserId,
        RolGlobal.INSTITUTIONAL_USER,
      );

      expect(roster).toHaveLength(1);
      expect(roster[0].codigoRude).toBe('8073004520261A');
      expect(roster[0].nombreCompleto).toContain('Mamani');
    });
  });

  // -------------------------------------------------------------
  // MODIFICACIÓN DE ESTADO Y TRASPASO ESCOLAR
  // -------------------------------------------------------------
  describe('updateEnrollmentStatus', () => {
    it('debe actualizar el estado a RETIRADO_TRASLADO y registrar auditoría', async () => {
      prisma.inscripcion.findUnique.mockResolvedValue({
        id: 'ins-1',
        institucionId: mockInstitutionId,
        estado: EstadoInscripcion.EFECTIVO,
        estudiante: {
          codigoRude: '8073004520261A',
          persona: { nombres: 'Mateo', primerApellido: 'Mamani' },
        },
      });
      prisma.inscripcion.update.mockResolvedValue({
        id: 'ins-1',
        institucionId: mockInstitutionId,
        estudianteId: 'est-1',
        gestionId: 'gestion-1',
        paraleloId: 'paralelo-1',
        estado: EstadoInscripcion.RETIRADO_TRASLADO,
        esRepitente: false,
        fechaInscripcion: new Date(),
      });

      const res = await service.updateEnrollmentStatus(
        mockInstitutionId,
        'ins-1',
        {
          estado: EstadoInscripcion.RETIRADO_TRASLADO,
          motivo: 'Cambio de domicilio interprovincial',
        },
        mockUserId,
      );

      expect(res.estado).toBe(EstadoInscripcion.RETIRADO_TRASLADO);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'CAMBIO_ESTADO_MATRICULA',
        }),
      );
    });
  });
});
