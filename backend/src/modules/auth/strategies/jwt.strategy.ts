import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { EstadoUsuario } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'maestros_dev_jwt_secret_key_bolivia_2026_super_secure_987654321'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, rolGlobal: true, estado: true },
    });

    if (!user || user.estado !== EstadoUsuario.ACTIVO) {
      throw new UnauthorizedException('Usuario inactivo, bloqueado o no encontrado.');
    }

    return {
      sub: user.id,
      email: user.email,
      globalRole: user.rolGlobal,
      institutionId: payload.institutionId,
      institutionRole: payload.institutionRole,
    };
  }
}

