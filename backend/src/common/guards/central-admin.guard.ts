import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { RolGlobal } from '@prisma/client';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class CentralAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado.');
    }

    if (
      user.globalRole !== RolGlobal.SUPERADMIN &&
      user.globalRole !== RolGlobal.CENTRAL_ADMIN
    ) {
      throw new ForbiddenException(
        'Acceso restringido: esta operación requiere privilegios de Administración Central (Nivel 1).',
      );
    }

    return true;
  }
}
