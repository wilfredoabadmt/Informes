import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../modules/audit/audit.service';
import { RolGlobal, EstadoVinculacion, TipoAuditoria } from '@prisma/client';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado.');
    }

    // 1. Extraer identificador de institución (Header prioritario: X-Institution-Id)
    const institutionIdHeader = request.headers['x-institution-id'] as string;
    const institutionId = institutionIdHeader || request.params?.institutionId || request.body?.institutionId;

    if (!institutionId) {
      throw new BadRequestException('Cabecera X-Institution-Id requerida para operaciones con alcance institucional.');
    }

    // 2. Verificar existencia de la Unidad Educativa
    const institucion = await this.prisma.unidadEducativa.findUnique({
      where: { id: institutionId },
    });

    if (!institucion || !institucion.activo) {
      throw new ForbiddenException('La Unidad Educativa solicitada no existe o no se encuentra activa.');
    }

    // 3. Si el usuario es Superadmin o Administrador Central, se concede acceso de supervisión
    if (user.globalRole === RolGlobal.SUPERADMIN || user.globalRole === RolGlobal.CENTRAL_ADMIN) {
      request.tenant = {
        institutionId: institucion.id,
        sie: institucion.sie,
        nombre: institucion.nombre,
        role: 'ADMIN_CENTRAL',
        cargoOficial: 'Supervisión Central',
      };
      return true;
    }

    // 4. Validar vinculación activa para usuarios institucionales / maestros
    const vinculacion = await this.prisma.vinculacionInstitucional.findFirst({
      where: {
        institucionId: institucion.id,
        usuarioId: user.sub,
        estado: EstadoVinculacion.ACTIVO,
      },
      include: {
        maestro: true,
      },
    });

    if (!vinculacion) {
      // Registrar violación de aislamiento multi-tenant en auditoría
      await this.auditService.log({
        usuarioId: user.sub,
        institucionId: institucion.id,
        tipo: TipoAuditoria.SECURITY_VIOLATION,
        accion: 'INTENTO_ACCESO_NO_AUTORIZADO_INSTITUCION',
        detalle: {
          motivo: 'El usuario intentó operar bajo una institución sin vinculación activa.',
          solicitadoInstitutionId: institutionId,
          userEmail: user.email,
        },
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });

      throw new ForbiddenException(
        'Acceso denegado: el usuario no posee una vinculación activa con la Unidad Educativa solicitada.',
      );
    }

    // 5. Asignar contexto institucional verificado al objeto Request
    request.tenant = {
      institutionId: institucion.id,
      sie: institucion.sie,
      nombre: institucion.nombre,
      role: vinculacion.rolInstitucional,
      cargoOficial: vinculacion.cargoOficial,
      maestroId: vinculacion.maestroId,
    };

    return true;
  }
}

