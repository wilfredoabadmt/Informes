import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { PasswordService } from './password.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { SelectContextDto } from './dto/select-context.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  EstadoUsuario,
  EstadoVinculacion,
  RolGlobal,
  TipoAuditoria,
} from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Autenticación global de usuarios mediante correo o Cédula de Identidad (CI).
   */
  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const trimmedIdentifier = dto.identifier.trim();

    // 1. Buscar usuario por email o por CI de la Persona
    let user = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { email: trimmedIdentifier.toLowerCase() },
          { persona: { ci: trimmedIdentifier } },
        ],
      },
      include: {
        persona: true,
      },
    });

    // Alias institucionales para compatibilidad directa y accesos rápidos
    if (!user) {
      const lower = trimmedIdentifier.toLowerCase();
      if (lower === 'directora@franztamayo.edu.bo' || lower === 'director@franztamayo.edu.bo') {
        user = await this.prisma.usuario.findFirst({
          where: { email: 'elena.flores@minedu.gob.bo' },
          include: { persona: true },
        });
      } else if (lower === 'maestro@franztamayo.edu.bo' || lower === 'profesor@franztamayo.edu.bo') {
        user = await this.prisma.usuario.findFirst({
          where: { email: 'carlos.mamani@minedu.gob.bo' },
          include: { persona: true },
        });
      }
    }

    if (!user) {
      await this.auditService.log({
        tipo: TipoAuditoria.LOGIN_FAILED,
        accion: 'INTENTO_LOGIN_USUARIO_INEXISTENTE',
        detalle: { identifier: trimmedIdentifier },
        ip,
        userAgent,
      });
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    if (user.estado !== EstadoUsuario.ACTIVO) {
      await this.auditService.log({
        usuarioId: user.id,
        tipo: TipoAuditoria.LOGIN_FAILED,
        accion: 'INTENTO_LOGIN_USUARIO_BLOQUEADO_O_INACTIVO',
        detalle: { estado: user.estado },
        ip,
        userAgent,
      });
      throw new UnauthorizedException('La cuenta de usuario se encuentra inactiva o bloqueada.');
    }

    // 2. Verificar contraseña con Argon2id
    const passwordMatch = await this.passwordService.verify(user.passwordHash, dto.password);
    if (!passwordMatch) {
      await this.auditService.log({
        usuarioId: user.id,
        tipo: TipoAuditoria.LOGIN_FAILED,
        accion: 'CONTRASENA_INCORRECTA',
        ip,
        userAgent,
      });
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    // 3. Actualizar último acceso
    await this.prisma.usuario.update({
      where: { id: user.id },
      data: { ultimoAcceso: new Date() },
    });

    // 4. Obtener vinculaciones institucionales activas
    const vinculaciones = await this.prisma.vinculacionInstitucional.findMany({
      where: {
        usuarioId: user.id,
        estado: EstadoVinculacion.ACTIVO,
      },
      include: {
        institucion: true,
      },
    });

    // 5. Cargar perfil de maestro si existe
    const maestro = await this.prisma.maestro.findUnique({
      where: { personaId: user.personaId },
    });

    // 6. Generar Tokens
    const tokenPair = await this.generateTokenPair(user.id, user.email, user.rolGlobal);

    // 7. Registrar auditoría de éxito
    await this.auditService.log({
      usuarioId: user.id,
      tipo: TipoAuditoria.LOGIN_SUCCESS,
      accion: 'INICIO_SESION_EXITOSO',
      detalle: {
        rolGlobal: user.rolGlobal,
        totalVinculaciones: vinculaciones.length,
      },
      ip,
      userAgent,
    });

    return {
      tokens: tokenPair,
      user: {
        id: user.id,
        email: user.email,
        globalRole: user.rolGlobal,
        persona: {
          ci: user.persona.ci,
          complemento: user.persona.complemento,
          nombres: user.persona.nombres,
          primerApellido: user.persona.primerApellido,
          segundoApellido: user.persona.segundoApellido,
          fechaNacimiento: user.persona.fechaNacimiento,
        },
        maestro: maestro
          ? {
              rda: maestro.rda,
              tituloProfesional: maestro.tituloProfesional,
              especialidad: maestro.especialidad,
              normalista: maestro.normalista,
            }
          : null,
      },
      institutions: vinculaciones.map((v) => ({
        institutionId: v.institucion.id,
        sie: v.institucion.sie,
        nombre: v.institucion.nombre,
        departamento: v.institucion.departamento,
        provincia: v.institucion.provincia,
        municipio: v.institucion.municipio,
        role: v.rolInstitucional,
        cargoOficial: v.cargoOficial,
        status: v.estado,
      })),
    };
  }

  /**
   * Obtiene el perfil completo del usuario autenticado.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        persona: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const maestro = await this.prisma.maestro.findUnique({
      where: { personaId: user.personaId },
    });

    return {
      id: user.id,
      email: user.email,
      globalRole: user.rolGlobal,
      persona: {
        ci: user.persona.ci,
        complemento: user.persona.complemento,
        nombres: user.persona.nombres,
        primerApellido: user.persona.primerApellido,
        segundoApellido: user.persona.segundoApellido,
        fechaNacimiento: user.persona.fechaNacimiento,
        telefono: user.persona.telefono,
        direccion: user.persona.direccion,
      },
      maestro: maestro
        ? {
            rda: maestro.rda,
            tituloProfesional: maestro.tituloProfesional,
            especialidad: maestro.especialidad,
            anioEgreso: maestro.anioEgreso,
            normalista: maestro.normalista,
          }
        : null,
    };
  }

  /**
   * Retorna las unidades educativas a las que el usuario tiene vinculación activa.
   */
  async getLinkedInstitutions(userId: string) {
    const vinculaciones = await this.prisma.vinculacionInstitucional.findMany({
      where: {
        usuarioId: userId,
        estado: EstadoVinculacion.ACTIVO,
      },
      include: {
        institucion: true,
      },
    });

    return vinculaciones.map((v) => ({
      institutionId: v.institucion.id,
      sie: v.institucion.sie,
      nombre: v.institucion.nombre,
      departamento: v.institucion.departamento,
      provincia: v.institucion.provincia,
      municipio: v.institucion.municipio,
      distrito: v.institucion.distrito,
      role: v.rolInstitucional,
      cargoOficial: v.cargoOficial,
      status: v.estado,
      fechaInicio: v.fechaInicio,
    }));
  }

  /**
   * Selección y validación de contexto institucional activo.
   */
  async selectContext(userId: string, dto: SelectContextDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const institucion = await this.prisma.unidadEducativa.findUnique({
      where: { id: dto.institutionId },
    });

    if (!institucion || !institucion.activo) {
      throw new NotFoundException('Unidad Educativa no encontrada o inactiva.');
    }

    // Si es Superadmin o Administrador Central tiene autorización global
    const isCentral =
      user.rolGlobal === RolGlobal.SUPERADMIN || user.rolGlobal === RolGlobal.CENTRAL_ADMIN;

    let roleName = isCentral ? 'ADMIN_CENTRAL' : '';
    let cargoOficial = isCentral ? 'Supervisión Central' : '';

    if (!isCentral) {
      const vinculacion = await this.prisma.vinculacionInstitucional.findFirst({
        where: {
          institucionId: institucion.id,
          usuarioId: user.id,
          estado: EstadoVinculacion.ACTIVO,
        },
      });

      if (!vinculacion) {
        await this.auditService.log({
          usuarioId: user.id,
          institucionId: institucion.id,
          tipo: TipoAuditoria.SECURITY_VIOLATION,
          accion: 'SELECCION_CONTEXTO_NO_AUTORIZADO',
          detalle: { institutionId: dto.institutionId },
          ip,
          userAgent,
        });

        throw new ForbiddenException(
          'No tiene vinculación activa con la Unidad Educativa seleccionada.',
        );
      }

      roleName = vinculacion.rolInstitucional;
      cargoOficial = vinculacion.cargoOficial || '';
    }

    // Token con contexto institucional embebido
    const contextToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        globalRole: user.rolGlobal,
        institutionId: institucion.id,
        institutionRole: roleName,
      },
      {
        expiresIn: '15m',
      },
    );

    await this.auditService.log({
      usuarioId: user.id,
      institucionId: institucion.id,
      tipo: TipoAuditoria.CONTEXT_SWITCH,
      accion: 'CAMBIO_CONTEXTO_INSTITUCIONAL',
      detalle: {
        sie: institucion.sie,
        nombre: institucion.nombre,
        rolInstitucional: roleName,
      },
      ip,
      userAgent,
    });

    return {
      institutionId: institucion.id,
      sie: institucion.sie,
      nombre: institucion.nombre,
      role: roleName,
      cargoOficial,
      contextToken,
    };
  }

  /**
   * Renovación de par de tokens mediante refresh token.
   */
  async refreshToken(dto: RefreshTokenDto) {
    const tokenHash = this.hashToken(dto.refreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        usuario: true,
      },
    });

    if (!storedToken || storedToken.usuario.estado !== EstadoUsuario.ACTIVO) {
      throw new UnauthorizedException('Refresh token inválido, expirado o revocado.');
    }

    // Revocar el token utilizado (rotación)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Generar nuevo par
    return this.generateTokenPair(
      storedToken.usuario.id,
      storedToken.usuario.email,
      storedToken.usuario.rolGlobal,
    );
  }

  /**
   * Cierre de sesión y revocación de tokens.
   */
  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        usuarioId: userId,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });

    return { message: 'Sesión finalizada correctamente.' };
  }

  // --- MÉTODOS AUXILIARES PRIVADOS ---

  private async generateTokenPair(userId: string, email: string, globalRole: RolGlobal) {
    const accessToken = this.jwtService.sign(
      {
        sub: userId,
        email,
        globalRole,
      },
      {
        expiresIn: '15m',
      },
    );

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    await this.prisma.refreshToken.create({
      data: {
        usuarioId: userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

