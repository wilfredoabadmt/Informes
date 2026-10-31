import { Test, TestingModule } from '@nestjs/testing';
import { AcademicService } from './academic.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  EstadoGestion,
  EstadoAsignacion,
  EstadoVinculacion,
  NivelEducativo,
  Turno,
  CampoSaberes,
  TipoAuditoria,
} from '@prisma/client';

describe('AcademicService (Unit Tests)', () => {
  let service: AcademicService;
  let prisma: any;
  let auditService: any;

  const mockInstitutionId = 'institucion-uuid-1111';
  const mockUserId = 'user-uuid-9999';

  beforeEach(async () => {
    prisma = {
      vinculacionInstitucional: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      gestionEscolar: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      curso: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      materia: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      paralelo: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      asignacionAcademica: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      withTenantContext: jest.fn(),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AcademicService>(AcademicService);
  });

  // -------------------------------------------------------------
  // GESTIONES ESCOLARES
  // -------------------------------------------------------------
  describe('createSchoolYear', () => {
    it('debe rechazar la creación si el año lectivo ya existe en el colegio con ConflictException', async () => {
      prisma.gestionEscolar.findUnique.mockResolvedValue({
        id: 'gestion-1',
        anio: 2026,
        institucionId: mockInstitutionId,
      });

      await expect(
        service.createSchoolYear(
          mockInstitutionId,
          {
            anio: 2026,
            fechaInicio: '2026-02-01',
            fechaFin: '2026-11-30',
            estado: EstadoGestion.ABIERTA,
          },
          mockUserId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('debe cerrar gestiones previas abiertas si la nueva se apertura directamente', async () => {
      prisma.gestionEscolar.findUnique.mockResolvedValue(null);
      prisma.gestionEscolar.updateMany.mockResolvedValue({ count: 1 });
      prisma.gestionEscolar.create.mockResolvedValue({
        id: 'new-gestion-id',
        institucionId: mockInstitutionId,
        anio: 2026,
        fechaInicio: new Date('2026-02-01'),
        fechaFin: new Date('2026-11-30'),
        estado: EstadoGestion.ABIERTA,
        activo: true,
      });

      const result = await service.createSchoolYear(
        mockInstitutionId,
        {
          anio: 2026,
          fechaInicio: '2026-02-01',
          fechaFin: '2026-11-30',
          estado: EstadoGestion.ABIERTA,
        },
        mockUserId,
      );

      expect(prisma.gestionEscolar.updateMany).toHaveBeenCalledWith({
        where: {
          institucionId: mockInstitutionId,
          estado: EstadoGestion.ABIERTA,
        },
        data: {
          estado: EstadoGestion.CERRADA,
        },
      });
      expect(result.anio).toBe(2026);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'APERTURA_GESTION_ESCOLAR',
          institucionId: mockInstitutionId,
        }),
      );
    });
  });

  describe('updateSchoolYearStatus', () => {
    it('debe arrojar NotFoundException si la gestión escolar no existe', async () => {
      prisma.gestionEscolar.findUnique.mockResolvedValue(null);

      await expect(
        service.updateSchoolYearStatus(
          mockInstitutionId,
          'non-existent-id',
          { estado: EstadoGestion.CERRADA },
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe arrojar ForbiddenException si la gestión pertenece a otra institución', async () => {
      prisma.gestionEscolar.findUnique.mockResolvedValue({
        id: 'gestion-other-school',
        institucionId: 'other-school-uuid',
        anio: 2025,
      });

      await expect(
        service.updateSchoolYearStatus(
          mockInstitutionId,
          'gestion-other-school',
          { estado: EstadoGestion.CERRADA },
          mockUserId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe actualizar el estado a CERRADA y registrar auditoría', async () => {
      prisma.gestionEscolar.findUnique.mockResolvedValue({
        id: 'gestion-own',
        institucionId: mockInstitutionId,
        anio: 2026,
        estado: EstadoGestion.ABIERTA,
      });
      prisma.gestionEscolar.update.mockResolvedValue({
        id: 'gestion-own',
        institucionId: mockInstitutionId,
        anio: 2026,
        estado: EstadoGestion.CERRADA,
      });

      const res = await service.updateSchoolYearStatus(
        mockInstitutionId,
        'gestion-own',
        { estado: EstadoGestion.CERRADA },
        mockUserId,
      );

      expect(res.estado).toBe(EstadoGestion.CERRADA);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'CAMBIO_ESTADO_GESTION_ESCOLAR',
        }),
      );
    });
  });

  // -------------------------------------------------------------
  // PARALELOS Y AULAS INSTITUCIONALES
  // -------------------------------------------------------------
  describe('createSection', () => {
    it('debe rechazar la creación si la gestión escolar no existe en el colegio', async () => {
      prisma.gestionEscolar.findUnique.mockResolvedValue(null);

      await expect(
        service.createSection(
          mockInstitutionId,
          {
            gestionId: 'bad-gestion-id',
            cursoId: 'curso-id',
            letra: 'A',
            turno: Turno.MANANA,
          },
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar la creación de paralelo si la gestión escolar está CERRADA', async () => {
      prisma.gestionEscolar.findUnique.mockResolvedValue({
        id: 'gestion-cerrada',
        institucionId: mockInstitutionId,
        anio: 2024,
        estado: EstadoGestion.CERRADA,
      });

      await expect(
        service.createSection(
          mockInstitutionId,
          {
            gestionId: 'gestion-cerrada',
            cursoId: 'curso-id',
            letra: 'A',
            turno: Turno.MANANA,
          },
          mockUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar con ConflictException si el paralelo ya existe en el mismo curso y turno', async () => {
      prisma.gestionEscolar.findUnique.mockResolvedValue({
        id: 'gestion-abierta',
        institucionId: mockInstitutionId,
        anio: 2026,
        estado: EstadoGestion.ABIERTA,
      });
      prisma.curso.findUnique.mockResolvedValue({
        id: 'curso-1-sec',
        nombre: '1º de Secundaria Comunitaria Productiva',
      });
      prisma.paralelo.findUnique.mockResolvedValue({
        id: 'existing-paralelo',
        letra: 'A',
        turno: Turno.MANANA,
      });

      await expect(
        service.createSection(
          mockInstitutionId,
          {
            gestionId: 'gestion-abierta',
            cursoId: 'curso-1-sec',
            letra: 'A',
            turno: Turno.MANANA,
          },
          mockUserId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('debe crear el paralelo exitosamente en mayúsculas y registrar auditoría', async () => {
      prisma.gestionEscolar.findUnique.mockResolvedValue({
        id: 'gestion-abierta',
        institucionId: mockInstitutionId,
        anio: 2026,
        estado: EstadoGestion.ABIERTA,
      });
      prisma.curso.findUnique.mockResolvedValue({
        id: 'curso-1-sec',
        nombre: '1º de Secundaria Comunitaria Productiva',
      });
      prisma.paralelo.findUnique.mockResolvedValue(null);
      prisma.paralelo.create.mockResolvedValue({
        id: 'new-paralelo-id',
        institucionId: mockInstitutionId,
        gestionId: 'gestion-abierta',
        cursoId: 'curso-1-sec',
        letra: 'B',
        turno: Turno.TARDE,
        cupoMaximo: 35,
        activo: true,
        curso: {
          nombre: '1º de Secundaria Comunitaria Productiva',
        },
      });

      const section = await service.createSection(
        mockInstitutionId,
        {
          gestionId: 'gestion-abierta',
          cursoId: 'curso-1-sec',
          letra: 'b ', // debe limpiarse y normalizarse a 'B'
          turno: Turno.TARDE,
        },
        mockUserId,
      );

      expect(prisma.paralelo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            letra: 'B',
            turno: Turno.TARDE,
          }),
        }),
      );
      expect(section.letra).toBe('B');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'CREACION_PARALELO_AULA',
        }),
      );
    });
  });

  // -------------------------------------------------------------
  // ÁRBOL ACADÉMICO JERÁRQUICO
  // -------------------------------------------------------------
  describe('getAcademicTree', () => {
    it('debe arrojar NotFoundException si la gestión escolar no pertenece a la institución', async () => {
      prisma.gestionEscolar.findUnique.mockResolvedValue({
        id: 'gestion-other',
        institucionId: 'different-school-id',
      });

      await expect(
        service.getAcademicTree(mockInstitutionId, 'gestion-other'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe devolver la jerarquía de cursos con sus paralelos bajo withTenantContext', async () => {
      prisma.gestionEscolar.findUnique.mockResolvedValue({
        id: 'gestion-tree',
        institucionId: mockInstitutionId,
      });

      const mockCursos = [
        {
          id: 'curso-1',
          nombre: '1º de Primaria Comunitaria Vocacional',
          nivel: NivelEducativo.PRIMARIA,
          grado: 1,
          paralelos: [
            {
              id: 'p-1',
              letra: 'A',
              turno: Turno.MANANA,
              cupoMaximo: 30,
            },
          ],
        },
      ];

      prisma.withTenantContext.mockImplementation(async (tenantId, cb) => {
        const tx = {
          curso: {
            findMany: jest.fn().mockResolvedValue(mockCursos),
          },
        };
        return cb(tx);
      });

      const tree = await service.getAcademicTree(mockInstitutionId, 'gestion-tree');

      expect(tree).toHaveLength(1);
      expect(tree[0].nombreCurso).toBe('1º de Primaria Comunitaria Vocacional');
      expect(tree[0].paralelos).toHaveLength(1);
      expect(tree[0].paralelos[0].letra).toBe('A');
    });
  });

  // -------------------------------------------------------------
  // CATÁLOGOS NACIONALES DEL SEP
  // -------------------------------------------------------------
  describe('getCourses and getSubjects', () => {
    it('debe consultar cursos ordenados ascendentemente', async () => {
      prisma.curso.findMany.mockResolvedValue([
        { id: 'c1', nombre: '1º de Primaria', orden: 1 },
      ]);

      const courses = await service.getCourses(NivelEducativo.PRIMARIA);
      expect(prisma.curso.findMany).toHaveBeenCalledWith({
        where: { nivel: NivelEducativo.PRIMARIA },
        orderBy: { orden: 'asc' },
      });
      expect(courses).toHaveLength(1);
    });

    it('debe filtrar materias por nivel y campo de saberes', async () => {
      prisma.materia.findMany.mockResolvedValue([
        {
          id: 'm1',
          nombre: 'Matemática',
          campo: CampoSaberes.CIENCIA_TECNOLOGIA_PRODUCCION,
        },
      ]);

      const subjects = await service.getSubjects({
        nivel: NivelEducativo.SECUNDARIA,
        campo: CampoSaberes.CIENCIA_TECNOLOGIA_PRODUCCION,
      });

      expect(prisma.materia.findMany).toHaveBeenCalledWith({
        where: {
          nivel: NivelEducativo.SECUNDARIA,
          campo: CampoSaberes.CIENCIA_TECNOLOGIA_PRODUCCION,
        },
        orderBy: [{ nivel: 'asc' }, { orden: 'asc' }],
      });
      expect(subjects).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------
  // ASIGNACIONES ACADÉMICAS Y CARGA HORARIA (FEATURE 005)
  // -------------------------------------------------------------
  describe('createAssignment', () => {
    const validDto = {
      gestionId: 'gestion-1',
      vinculacionId: 'vinc-1',
      paraleloId: 'paralelo-1',
      materiaId: 'materia-1',
      horasSemanales: 6,
      esTitular: true,
      esTutor: false,
    };

    it('debe arrojar NotFoundException si la vinculación docente no existe', async () => {
      prisma.vinculacionInstitucional.findUnique.mockResolvedValue(null);

      await expect(
        service.createAssignment(mockInstitutionId, validDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe arrojar ForbiddenException si la vinculación pertenece a otro colegio', async () => {
      prisma.vinculacionInstitucional.findUnique.mockResolvedValue({
        id: 'vinc-1',
        institucionId: 'other-school-id',
        estado: EstadoVinculacion.ACTIVO,
      });

      await expect(
        service.createAssignment(mockInstitutionId, validDto, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe arrojar BadRequestException si la vinculación no está ACTIVA', async () => {
      prisma.vinculacionInstitucional.findUnique.mockResolvedValue({
        id: 'vinc-1',
        institucionId: mockInstitutionId,
        estado: EstadoVinculacion.INACTIVO,
      });

      await expect(
        service.createAssignment(mockInstitutionId, validDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe arrojar BadRequestException si la gestión escolar está CERRADA', async () => {
      prisma.vinculacionInstitucional.findUnique.mockResolvedValue({
        id: 'vinc-1',
        institucionId: mockInstitutionId,
        estado: EstadoVinculacion.ACTIVO,
      });
      prisma.gestionEscolar.findUnique.mockResolvedValue({
        id: 'gestion-1',
        institucionId: mockInstitutionId,
        estado: EstadoGestion.CERRADA,
      });

      await expect(
        service.createAssignment(mockInstitutionId, validDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe arrojar BadRequestException si el paralelo no pertenece a la gestión indicada', async () => {
      prisma.vinculacionInstitucional.findUnique.mockResolvedValue({
        id: 'vinc-1',
        institucionId: mockInstitutionId,
        estado: EstadoVinculacion.ACTIVO,
      });
      prisma.gestionEscolar.findUnique.mockResolvedValue({
        id: 'gestion-1',
        institucionId: mockInstitutionId,
        estado: EstadoGestion.ABIERTA,
      });
      prisma.paralelo.findUnique.mockResolvedValue({
        id: 'paralelo-1',
        institucionId: mockInstitutionId,
        gestionId: 'other-gestion-id',
        curso: { nivel: NivelEducativo.SECUNDARIA },
      });

      await expect(
        service.createAssignment(mockInstitutionId, validDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe arrojar BadRequestException por incoherencia curricular (materia Primaria en Secundaria)', async () => {
      prisma.vinculacionInstitucional.findUnique.mockResolvedValue({
        id: 'vinc-1',
        institucionId: mockInstitutionId,
        estado: EstadoVinculacion.ACTIVO,
      });
      prisma.gestionEscolar.findUnique.mockResolvedValue({
        id: 'gestion-1',
        institucionId: mockInstitutionId,
        estado: EstadoGestion.ABIERTA,
      });
      prisma.paralelo.findUnique.mockResolvedValue({
        id: 'paralelo-1',
        institucionId: mockInstitutionId,
        gestionId: 'gestion-1',
        curso: {
          nivel: NivelEducativo.SECUNDARIA,
          nombre: '1º de Secundaria',
        },
      });
      prisma.materia.findUnique.mockResolvedValue({
        id: 'materia-1',
        nombre: 'Lenguaje Primaria',
        nivel: NivelEducativo.PRIMARIA,
      });

      await expect(
        service.createAssignment(mockInstitutionId, validDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe arrojar ConflictException si el docente ya está asignado a esa materia y paralelo', async () => {
      prisma.vinculacionInstitucional.findUnique.mockResolvedValue({
        id: 'vinc-1',
        institucionId: mockInstitutionId,
        estado: EstadoVinculacion.ACTIVO,
      });
      prisma.gestionEscolar.findUnique.mockResolvedValue({
        id: 'gestion-1',
        institucionId: mockInstitutionId,
        estado: EstadoGestion.ABIERTA,
      });
      prisma.paralelo.findUnique.mockResolvedValue({
        id: 'paralelo-1',
        institucionId: mockInstitutionId,
        gestionId: 'gestion-1',
        curso: {
          nivel: NivelEducativo.SECUNDARIA,
          nombre: '1º de Secundaria',
        },
      });
      prisma.materia.findUnique.mockResolvedValue({
        id: 'materia-1',
        nombre: 'Biología',
        nivel: NivelEducativo.SECUNDARIA,
      });
      prisma.asignacionAcademica.findUnique.mockResolvedValue({
        id: 'asig-existing',
        activo: true,
      });

      await expect(
        service.createAssignment(mockInstitutionId, validDto, mockUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('debe arrojar ConflictException si ya existe un titular activo para esa materia y paralelo', async () => {
      prisma.vinculacionInstitucional.findUnique.mockResolvedValue({
        id: 'vinc-1',
        institucionId: mockInstitutionId,
        estado: EstadoVinculacion.ACTIVO,
      });
      prisma.gestionEscolar.findUnique.mockResolvedValue({
        id: 'gestion-1',
        institucionId: mockInstitutionId,
        estado: EstadoGestion.ABIERTA,
      });
      prisma.paralelo.findUnique.mockResolvedValue({
        id: 'paralelo-1',
        institucionId: mockInstitutionId,
        gestionId: 'gestion-1',
        curso: {
          nivel: NivelEducativo.SECUNDARIA,
          nombre: '1º de Secundaria',
        },
      });
      prisma.materia.findUnique.mockResolvedValue({
        id: 'materia-1',
        nombre: 'Biología',
        nivel: NivelEducativo.SECUNDARIA,
      });
      prisma.asignacionAcademica.findUnique.mockResolvedValue(null);
      prisma.asignacionAcademica.findFirst.mockResolvedValue({
        id: 'other-titular',
        esTitular: true,
      });

      await expect(
        service.createAssignment(mockInstitutionId, validDto, mockUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('debe arrojar ConflictException si ya existe un Asesor de Curso / Tutor asignado', async () => {
      prisma.vinculacionInstitucional.findUnique.mockResolvedValue({
        id: 'vinc-1',
        institucionId: mockInstitutionId,
        estado: EstadoVinculacion.ACTIVO,
      });
      prisma.gestionEscolar.findUnique.mockResolvedValue({
        id: 'gestion-1',
        institucionId: mockInstitutionId,
        estado: EstadoGestion.ABIERTA,
      });
      prisma.paralelo.findUnique.mockResolvedValue({
        id: 'paralelo-1',
        institucionId: mockInstitutionId,
        gestionId: 'gestion-1',
        curso: {
          nivel: NivelEducativo.SECUNDARIA,
          nombre: '1º de Secundaria',
        },
      });
      prisma.materia.findUnique.mockResolvedValue({
        id: 'materia-1',
        nombre: 'Biología',
        nivel: NivelEducativo.SECUNDARIA,
      });
      prisma.asignacionAcademica.findUnique.mockResolvedValue(null);
      // Sin colisión de titular, pero sí de tutor
      prisma.asignacionAcademica.findFirst
        .mockResolvedValueOnce(null) // para titular
        .mockResolvedValueOnce({ id: 'existing-tutor', esTutor: true }); // para tutor

      await expect(
        service.createAssignment(
          mockInstitutionId,
          { ...validDto, esTutor: true },
          mockUserId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('debe crear la asignación académica exitosamente y registrar auditoría', async () => {
      prisma.vinculacionInstitucional.findUnique.mockResolvedValue({
        id: 'vinc-1',
        institucionId: mockInstitutionId,
        estado: EstadoVinculacion.ACTIVO,
        maestro: {
          persona: {
            nombres: 'Raúl',
            primerApellido: 'Condori',
          },
        },
      });
      prisma.gestionEscolar.findUnique.mockResolvedValue({
        id: 'gestion-1',
        institucionId: mockInstitutionId,
        estado: EstadoGestion.ABIERTA,
      });
      prisma.paralelo.findUnique.mockResolvedValue({
        id: 'paralelo-1',
        institucionId: mockInstitutionId,
        gestionId: 'gestion-1',
        letra: 'A',
        turno: Turno.MANANA,
        curso: {
          nivel: NivelEducativo.SECUNDARIA,
          nombre: '1º de Secundaria Comunitaria Productiva',
        },
      });
      prisma.materia.findUnique.mockResolvedValue({
        id: 'materia-1',
        nombre: 'Biología y Geografía',
        nivel: NivelEducativo.SECUNDARIA,
      });
      prisma.asignacionAcademica.findUnique.mockResolvedValue(null);
      prisma.asignacionAcademica.findFirst.mockResolvedValue(null);

      prisma.asignacionAcademica.create.mockResolvedValue({
        id: 'new-asig-id',
        institucionId: mockInstitutionId,
        gestionId: 'gestion-1',
        horasSemanales: 6,
        esTitular: true,
        esTutor: false,
        estado: EstadoAsignacion.ACTIVA,
        materia: {
          id: 'materia-1',
          codigo: 'BIO-1',
          nombre: 'Biología y Geografía',
          campo: CampoSaberes.VIDA_TIERRA_TERRITORIO,
        },
        paralelo: {
          id: 'paralelo-1',
          letra: 'A',
          turno: Turno.MANANA,
          curso: {
            nombre: '1º de Secundaria Comunitaria Productiva',
            nivel: NivelEducativo.SECUNDARIA,
          },
        },
        vinculacion: {
          maestroId: 'maestro-raul',
          maestro: {
            rda: 'RDA-55667',
            persona: {
              nombres: 'Raúl',
              primerApellido: 'Condori',
              segundoApellido: 'Apaza',
            },
          },
        },
      });

      const res = await service.createAssignment(
        mockInstitutionId,
        validDto,
        mockUserId,
      );

      expect(res.id).toBe('new-asig-id');
      expect(res.docente.rda).toBe('RDA-55667');
      expect(res.docente.nombreCompleto).toContain('Raúl Condori');
      expect(res.materia.nombre).toBe('Biología y Geografía');
      expect(res.horasSemanales).toBe(6);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'CREACION_ASIGNACION_ACADEMICA',
        }),
      );
    });
  });

  describe('getAssignments and getMyAssignments', () => {
    it('getAssignments debe arrojar NotFoundException si la gestión no existe en este colegio', async () => {
      prisma.gestionEscolar.findUnique.mockResolvedValue(null);

      await expect(
        service.getAssignments(mockInstitutionId, {
          gestionId: 'non-existent-gestion',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('getMyAssignments debe arrojar ForbiddenException si el usuario no tiene vinculación activa', async () => {
      prisma.vinculacionInstitucional.findFirst.mockResolvedValue(null);

      await expect(
        service.getMyAssignments(mockInstitutionId, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateAssignmentStatus and deleteAssignment', () => {
    it('updateAssignmentStatus debe arrojar NotFoundException si no existe', async () => {
      prisma.asignacionAcademica.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAssignmentStatus(
          mockInstitutionId,
          'non-existent-id',
          { estado: EstadoAsignacion.SUSPENDIDA },
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('updateAssignmentStatus debe actualizar y registrar auditoría', async () => {
      prisma.asignacionAcademica.findUnique.mockResolvedValue({
        id: 'asig-1',
        institucionId: mockInstitutionId,
        estado: EstadoAsignacion.ACTIVA,
      });
      prisma.asignacionAcademica.update.mockResolvedValue({
        id: 'asig-1',
        institucionId: mockInstitutionId,
        estado: EstadoAsignacion.SUSPENDIDA,
        materia: { id: 'm1', nombre: 'Biología' },
        paralelo: { letra: 'A', curso: { nombre: '1º Sec' } },
        vinculacion: { maestro: { persona: { nombres: 'Raúl' } } },
      });

      const res = await service.updateAssignmentStatus(
        mockInstitutionId,
        'asig-1',
        { estado: EstadoAsignacion.SUSPENDIDA, motivo: 'Licencia médica' },
        mockUserId,
      );

      expect(res.estado).toBe(EstadoAsignacion.SUSPENDIDA);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'CAMBIO_ESTADO_ASIGNACION',
        }),
      );
    });

    it('deleteAssignment debe realizar borrado lógico y registrar auditoría', async () => {
      prisma.asignacionAcademica.findUnique.mockResolvedValue({
        id: 'asig-1',
        institucionId: mockInstitutionId,
      });
      prisma.asignacionAcademica.update.mockResolvedValue({
        id: 'asig-1',
        activo: false,
        estado: EstadoAsignacion.FINALIZADA,
      });

      const res = await service.deleteAssignment(
        mockInstitutionId,
        'asig-1',
        mockUserId,
      );

      expect(res.success).toBe(true);
      expect(prisma.asignacionAcademica.update).toHaveBeenCalledWith({
        where: { id: 'asig-1' },
        data: {
          activo: false,
          estado: EstadoAsignacion.FINALIZADA,
        },
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'BAJA_ASIGNACION_ACADEMICA',
        }),
      );
    });
  });
});
