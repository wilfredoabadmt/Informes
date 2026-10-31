import { Test, TestingModule } from '@nestjs/testing';
import { TenantContextGuard } from './tenant-context.guard';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../modules/audit/audit.service';
import { ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { RolGlobal, RolInstitucional, EstadoVinculacion, TipoAuditoria } from '@prisma/client';

describe('TenantContextGuard', () => {
  let guard: TenantContextGuard;
  let prisma: Partial<PrismaService>;
  let auditService: Partial<AuditService>;

  beforeEach(async () => {
    prisma = {
      unidadEducativa: {
        findUnique: jest.fn(),
      } as any,
      vinculacionInstitucional: {
        findFirst: jest.fn(),
      } as any,
    };

    auditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantContextGuard,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    guard = module.get<TenantContextGuard>(TenantContextGuard);
  });

  const createMockContext = (headers: Record<string, string>, user: any, body?: any): ExecutionContext => {
    const request = {
      headers,
      user,
      body,
      ip: '127.0.0.1',
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('debe arrojar BadRequestException si falta la cabecera X-Institution-Id', async () => {
    const context = createMockContext({}, { sub: 'user-1', globalRole: RolGlobal.INSTITUTIONAL_USER });
    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
  });

  it('debe arrojar ForbiddenException si la Unidad Educativa no existe', async () => {
    (prisma.unidadEducativa.findUnique as jest.Mock).mockResolvedValue(null);

    const context = createMockContext(
      { 'x-institution-id': 'col-inexistente' },
      { sub: 'user-1', globalRole: RolGlobal.INSTITUTIONAL_USER },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('debe permitir acceso directo a Superadmin e inyectar contexto central', async () => {
    (prisma.unidadEducativa.findUnique as jest.Mock).mockResolvedValue({
      id: 'col-1',
      sie: '80730045',
      nombre: 'U.E. Franz Tamayo',
      activo: true,
    });

    const context = createMockContext(
      { 'x-institution-id': 'col-1' },
      { sub: 'admin-1', globalRole: RolGlobal.SUPERADMIN },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);

    const req = context.switchToHttp().getRequest();
    expect(req.tenant).toBeDefined();
    expect(req.tenant.role).toBe('ADMIN_CENTRAL');
  });

  it('debe arrojar ForbiddenException y registrar violación si el maestro no está vinculado', async () => {
    (prisma.unidadEducativa.findUnique as jest.Mock).mockResolvedValue({
      id: 'col-mariscal',
      sie: '80730046',
      nombre: 'U.E. Mariscal Sucre',
      activo: true,
    });
    (prisma.vinculacionInstitucional.findFirst as jest.Mock).mockResolvedValue(null);

    const context = createMockContext(
      { 'x-institution-id': 'col-mariscal' },
      { sub: 'docente-sin-vinculo', email: 'docente@minedu.gob.bo', globalRole: RolGlobal.INSTITUTIONAL_USER },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: TipoAuditoria.SECURITY_VIOLATION,
        accion: 'INTENTO_ACCESO_NO_AUTORIZADO_INSTITUCION',
      }),
    );
  });

  it('debe permitir acceso al maestro si tiene vinculación activa', async () => {
    (prisma.unidadEducativa.findUnique as jest.Mock).mockResolvedValue({
      id: 'col-franz',
      sie: '80730045',
      nombre: 'U.E. Franz Tamayo',
      activo: true,
    });
    (prisma.vinculacionInstitucional.findFirst as jest.Mock).mockResolvedValue({
      id: 'vinc-1',
      institucionId: 'col-franz',
      usuarioId: 'docente-carlos',
      rolInstitucional: RolInstitucional.MAESTRO,
      cargoOficial: 'Profesor de Matemáticas',
      estado: EstadoVinculacion.ACTIVO,
      maestroId: 'maestro-carlos',
    });

    const context = createMockContext(
      { 'x-institution-id': 'col-franz' },
      { sub: 'docente-carlos', globalRole: RolGlobal.INSTITUTIONAL_USER },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);

    const req = context.switchToHttp().getRequest();
    expect(req.tenant.role).toBe(RolInstitucional.MAESTRO);
    expect(req.tenant.sie).toBe('80730045');
  });
});

