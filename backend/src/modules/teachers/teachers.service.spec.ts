import { Test, TestingModule } from '@nestjs/testing';
import { TeachersService } from './teachers.service';
import { PrismaService } from '../../database/prisma.service';
import { PasswordService } from '../auth/password.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { RolInstitucional, EstadoVinculacion, TipoAuditoria } from '@prisma/client';

describe('TeachersService (Unit Tests)', () => {
  let service: TeachersService;
  let prisma: any;
  let passwordService: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      maestro: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      persona: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      usuario: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      vinculacionInstitucional: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      withTenantContext: jest.fn(),
    };

    passwordService = {
      hash: jest.fn().mockResolvedValue('argon2id_mock_hash'),
      verify: jest.fn().mockResolvedValue(true),
    };

    auditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeachersService,
        { provide: PrismaService, useValue: prisma },
        { provide: PasswordService, useValue: passwordService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<TeachersService>(TeachersService);
  });

  describe('createTeacher', () => {
    it('debe rechazar la creación si el código RDA ya existe con ConflictException', async () => {
      prisma.maestro.findUnique.mockResolvedValue({
        id: 'existing-maestro',
        rda: 'RDA-98321',
      });

      await expect(
        service.createTeacher(
          {
            ci: '6849302',
            nombres: 'Carlos',
            primerApellido: 'Mamani',
            email: 'carlos.mamani@minedu.gob.bo',
            rda: 'RDA-98321',
          },
          'admin-id',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('debe crear un nuevo maestro exitosamente y registrar auditoría', async () => {
      prisma.maestro.findUnique.mockResolvedValue(null);
      prisma.persona.findUnique.mockResolvedValue(null);
      prisma.persona.create.mockResolvedValue({
        id: 'new-persona-id',
        ci: '7788990',
        nombres: 'Mateo',
        primerApellido: 'Quisbert',
      });
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.usuario.create.mockResolvedValue({
        id: 'new-usuario-id',
        email: 'mateo.quisbert@minedu.gob.bo',
      });
      prisma.maestro.create.mockResolvedValue({
        id: 'new-maestro-id',
        rda: 'RDA-11223',
        personaId: 'new-persona-id',
      });

      const res = await service.createTeacher(
        {
          ci: '7788990',
          nombres: 'Mateo',
          primerApellido: 'Quisbert',
          email: 'mateo.quisbert@minedu.gob.bo',
          rda: 'RDA-11223',
          especialidad: 'Física y Química',
        },
        'admin-id',
      );

      expect(res.rda).toBe('RDA-11223');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: TipoAuditoria.USER_CREATE,
          accion: 'ALTA_MAESTRO_PADRON_NACIONAL',
        }),
      );
    });
  });

  describe('linkTeacherToInstitution', () => {
    it('debe arrojar NotFoundException si no existe el maestro especificado', async () => {
      prisma.maestro.findFirst.mockResolvedValue(null);

      await expect(
        service.linkTeacherToInstitution(
          'school-1',
          {
            identifier: 'RDA-INEXISTENTE',
            rolInstitucional: RolInstitucional.MAESTRO,
          },
          'director-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar con ConflictException si ya está activamente vinculado con ese rol', async () => {
      prisma.maestro.findFirst.mockResolvedValue({
        id: 'maestro-1',
        rda: 'RDA-98321',
        persona: {
          nombres: 'Carlos',
          primerApellido: 'Mamani',
          usuario: { id: 'user-carlos' },
        },
      });
      prisma.vinculacionInstitucional.findUnique.mockResolvedValue({
        id: 'existing-link',
        estado: EstadoVinculacion.ACTIVO,
      });

      await expect(
        service.linkTeacherToInstitution(
          'school-1',
          {
            identifier: 'RDA-98321',
            rolInstitucional: RolInstitucional.MAESTRO,
          },
          'director-id',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('debe vincular exitosamente y registrar auditoría si no estaba vinculado', async () => {
      prisma.maestro.findFirst.mockResolvedValue({
        id: 'maestro-1',
        rda: 'RDA-98321',
        persona: {
          nombres: 'Carlos',
          primerApellido: 'Mamani',
          usuario: { id: 'user-carlos' },
        },
      });
      prisma.vinculacionInstitucional.findUnique.mockResolvedValue(null);
      prisma.vinculacionInstitucional.upsert.mockResolvedValue({
        id: 'new-vinc-id',
        estado: EstadoVinculacion.ACTIVO,
        rolInstitucional: RolInstitucional.MAESTRO,
      });

      const res = await service.linkTeacherToInstitution(
        'school-1',
        {
          identifier: 'RDA-98321',
          rolInstitucional: RolInstitucional.MAESTRO,
          cargoOficial: 'Profesor de Matemáticas',
        },
        'director-id',
      );

      expect(res.vinculacionId).toBe('new-vinc-id');
      expect(res.estado).toBe(EstadoVinculacion.ACTIVO);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: TipoAuditoria.TEACHER_LINK,
          accion: 'VINCULACION_DOCENTE_INSTITUCIONAL',
        }),
      );
    });
  });

  describe('updateLinkStatus', () => {
    it('debe denegar con ForbiddenException si la vinculación pertenece a otro colegio', async () => {
      prisma.vinculacionInstitucional.findUnique.mockResolvedValue({
        id: 'vinc-col-2',
        institucionId: 'school-2',
      });

      await expect(
        service.updateLinkStatus(
          'school-1',
          'vinc-col-2',
          { estado: EstadoVinculacion.LICENCIA },
          'director-id',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
