import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RolGlobal, RolInstitucional, TipoAuditoria } from '@prisma/client';
import { AuditService } from './audit.service';
import { PrismaService } from '../../database/prisma.service';

describe('AuditService (Unit Tests)', () => {
  let service: AuditService;
  let prisma: any;

  const mockInstitucionId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '99999999-9999-9999-9999-999999999999';

  beforeEach(async () => {
    prisma = {
      registroAuditoria: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
        count: jest.fn().mockResolvedValue(10),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'log-1',
            tipo: TipoAuditoria.USER_UPDATE,
            accion: 'RECTIFICACION_CALIFICACION',
            institucionId: mockInstitucionId,
            timestamp: new Date(),
          },
        ]),
        findUnique: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('findLogs', () => {
    it('debe permitir a un Director (Nivel 2) consultar logs restringidos a su institución', async () => {
      const actor = {
        userId: mockUserId,
        globalRole: RolGlobal.INSTITUTIONAL_USER,
        institutionId: mockInstitucionId,
        userRole: RolInstitucional.DIRECTOR,
      };

      const result = await service.findLogs({ page: 1, limit: 10 }, actor);

      expect(prisma.registroAuditoria.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ institucionId: mockInstitucionId }),
        }),
      );
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(10);
      expect(result.meta.page).toBe(1);
    });

    it('debe denegar el acceso si un Maestro intenta consultar logs (ForbiddenException)', async () => {
      const actor = {
        userId: mockUserId,
        globalRole: RolGlobal.INSTITUTIONAL_USER,
        institutionId: mockInstitucionId,
        userRole: RolInstitucional.MAESTRO,
      };

      await expect(service.findLogs({}, actor)).rejects.toThrow(ForbiddenException);
    });

    it('debe registrar GLOBAL_AUDIT_INSPECTED (Principio 7) cuando un Superadmin realiza consulta transversal', async () => {
      const actor = {
        userId: mockUserId,
        globalRole: RolGlobal.SUPERADMIN,
      };

      await service.findLogs({ page: 1, limit: 20 }, actor);

      expect(prisma.registroAuditoria.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accion: 'GLOBAL_AUDIT_INSPECTED',
            tipo: TipoAuditoria.SECURITY_VIOLATION,
          }),
        }),
      );
    });
  });

  describe('findLogById', () => {
    it('debe retornar el detalle de un log si pertenece a la institución del Director', async () => {
      const actor = {
        userId: mockUserId,
        globalRole: RolGlobal.INSTITUTIONAL_USER,
        institutionId: mockInstitucionId,
        userRole: RolInstitucional.DIRECTOR,
      };

      prisma.registroAuditoria.findUnique.mockResolvedValue({
        id: 'log-100',
        institucionId: mockInstitucionId,
        tipo: TipoAuditoria.USER_UPDATE,
        accion: 'NOTA_ASENTADA',
      });

      const log = await service.findLogById('log-100', actor);
      expect(log.id).toBe('log-100');
    });

    it('debe lanzar NotFoundException si el Director intenta consultar un log de otra institución', async () => {
      const actor = {
        userId: mockUserId,
        globalRole: RolGlobal.INSTITUTIONAL_USER,
        institutionId: mockInstitucionId,
        userRole: RolInstitucional.DIRECTOR,
      };

      prisma.registroAuditoria.findUnique.mockResolvedValue({
        id: 'log-200',
        institucionId: '22222222-2222-2222-2222-222222222222', // Otra institución
        tipo: TipoAuditoria.USER_UPDATE,
      });

      await expect(service.findLogById('log-200', actor)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('debe calcular métricas agrupadas por tipo y top de acciones', async () => {
      const actor = {
        userId: mockUserId,
        globalRole: RolGlobal.INSTITUTIONAL_USER,
        institutionId: mockInstitucionId,
        userRole: RolInstitucional.DIRECTOR,
      };

      prisma.registroAuditoria.count.mockResolvedValue(50);
      prisma.registroAuditoria.groupBy
        .mockResolvedValueOnce([
          { tipo: TipoAuditoria.LOGIN_SUCCESS, _count: { tipo: 30 } },
          { tipo: TipoAuditoria.USER_UPDATE, _count: { tipo: 20 } },
        ])
        .mockResolvedValueOnce([
          { accion: 'LOGIN', _count: { accion: 30 } },
          { accion: 'CALIFICACION_REGISTRADA', _count: { accion: 20 } },
        ]);

      const stats = await service.getStats({}, actor);

      expect(stats.totalEventos).toBe(50);
      expect(stats.porTipo[TipoAuditoria.LOGIN_SUCCESS]).toBe(30);
      expect(stats.porTipo[TipoAuditoria.USER_UPDATE]).toBe(20);
      expect(stats.topAcciones.length).toBe(2);
      expect(stats.topAcciones[0].accion).toBe('LOGIN');
      expect(stats.topAcciones[0].cantidad).toBe(30);
    });
  });
});
