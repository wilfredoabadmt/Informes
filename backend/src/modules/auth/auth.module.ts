import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TenantTestController } from './tenant-test.controller';
import { PasswordService } from './password.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_SECRET',
          'maestros_dev_jwt_secret_key_bolivia_2026_super_secure_987654321',
        ),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, TenantTestController],
  providers: [AuthService, PasswordService, JwtStrategy, TenantContextGuard],
  exports: [AuthService, PasswordService, JwtStrategy, TenantContextGuard, JwtModule],
})
export class AuthModule {}
