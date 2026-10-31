import { Test, TestingModule } from '@nestjs/testing';
import { InstitutionsService } from './institutions.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { TipoInstitucion, NivelEducativo, RolInstitucional, EstadoVinculacion, TipoAuditoria } from '@prisma/client';

describe('InstitutionsService (Unit Tests)', () => {
  let service: InstitutionsService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      unidadEducativa: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      usuario: {
        findFirst: jest.fn(),
      },
      maestro: {
        findUnique: jest.fn(),
      },
      vinculacionInstitucional: {
        upsert: jest.fn(),
      },
    };

    auditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstitutionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<InstitutionsService>(InstitutionsService);
  });

  describe('create', () => {
    it('debe rechazar la creación si el código SIE ya existe con ConflictException', async () => {
      prisma.unidadEducativa.findUnique.mockResolvedValue({
        id: 'existing-id',
        sie: '80730045',
        nombre: 'U.E. Existente',
      });

      await expect(
        service.create(
          {
            sie: '80730045',
            nombre: 'Nueva Escuela',
            departamento: 'La Paz',
            provincia: 'Murillo',
            municipio: 'La Paz',
            tipo: TipoInstitucion.FISCAL,
            nivel: NivelEducativo.INTEGRADO,
          },
          'admin-id',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('debe rechazar la creación si el departamento no es uno de los 9 oficiales de Bolivia', async () => {
      prisma.unidadEducativa.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          {
            sie: '80730099',
            nombre: 'Colegio Inválido',
            departamento: 'Buenos Aires' as any,
            provincia: 'Prov',
            municipio: 'Mun',
            tipo: TipoInstitucion.FISCAL,
            nivel: NivelEducativo.INTEGRADO,
          },
          'admin-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe crear la institución y registrar auditoría central', async () => {
      prisma.unidadEducativa.findUnique.mockResolvedValue(null);
      prisma.unidadEducativa.create.mockResolvedValue({
        id: 'new-id',
        sie: '80730099',
        nombre: 'U.E. Eduardo Avaroa',
        departamento: 'La Paz',
        activo: true,
      });

      const result = await service.create(
        {
          sie: '80730099',
          nombre: 'U.E. Eduardo Avaroa',
          departamento: 'La Paz',
          provincia: 'Murillo',
          municipio: 'La Paz',
          tipo: TipoInstitucion.FISCAL,
          nivel: NivelEducativo.INTEGRADO,
        },
        'admin-id',
      );

      expect(result.sie).toBe('80730099');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: TipoAuditoria.USER_CREATE,
          accion: 'ALTA_UNIDAD_EDUCATIVA',
        }),
      );
    });
  });

  describe('assignAuthority', () => {
    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      prisma.unidadEducativa.findUnique.mockResolvedValue({ id: 'inst-1', sie: '80730045' });
      prisma.usuario.findFirst.mockResolvedValue(null);

      await expect(
        service.assignAuthority(
          'inst-1',
          {
            identifier: 'no-existe@minedu.gob.bo',
            rolInstitucional: RolInstitucional.DIRECTOR,
          },
          'admin-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe vincular al usuario como Director y asociar maestroId si posee RDA', async () => {
      prisma.unidadEducativa.findUnique.mockResolvedValue({ id: 'inst-1', sie: '80730045' });
      prisma.usuario.findFirst.mockResolvedValue({
        id: 'user-elena',
        personaId: 'persona-elena',
        persona: { nombres: 'Elena', primerApellido: 'Flores' },
      });
      prisma.maestro.findUnique.mockResolvedValue({
        id: 'maestro-elena',
        rda: 'RDA-45120',
      });
      prisma.vinculacionInstitucional.upsert.mockResolvedValue({
        id: 'vinc-123',
        rolInstitucional: RolInstitucional.DIRECTOR,
        estado: EstadoVinculacion.ACTIVO,
      });

      const res = await service.assignAuthority(
        'inst-1',
        {
          identifier: 'elena.flores@minedu.gob.bo',
          rolInstitucional: RolInstitucional.DIRECTOR,
          cargoOficial: 'Directora General',
        },
        'admin-id',
      );

      expect(res.vinculacionId).toBe('vinc-123');
      expect(res.rolInstitucional).toBe(RolInstitucional.DIRECTOR);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: TipoAuditoria.TEACHER_LINK,
          accion: 'ASIGNACION_AUTORIDAD_INSTITUCIONAL',
        }),
      );
    });
  });
});

