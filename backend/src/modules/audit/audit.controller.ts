import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuditService } from './audit.service';
import { QueryAuditLogsDto, QueryAuditStatsDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { EstadoVinculacion, RolGlobal, RolInstitucional } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Auditoría del Sistema')
@Controller('audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('logs')
  @ApiOperation({
    summary: 'Consulta paginada de registros de auditoría (Nivel 1 Global / Nivel 2 Institucional)',
  })
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa (obligatorio para Nivel 2, opcional para Nivel 1)',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Registros paginados de auditoría' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async getLogs(
    @CurrentUser() user: JwtPayload,
    @Headers('x-institution-id') institutionHeader: string,
    @Query() query: QueryAuditLogsDto,
  ) {
    const actor = await this.resolveActorContext(user, institutionHeader);
    return this.auditService.findLogs(query, actor);
  }

  @Get('logs/:id')
  @ApiOperation({ summary: 'Detalle de un evento de auditoría por ID' })
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa (obligatorio para Nivel 2, opcional para Nivel 1)',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Detalle del evento de auditoría' })
  @ApiResponse({ status: 404, description: 'Evento no encontrado o inaccesible' })
  async getLogById(
    @CurrentUser() user: JwtPayload,
    @Headers('x-institution-id') institutionHeader: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const actor = await this.resolveActorContext(user, institutionHeader);
    return this.auditService.findLogById(id, actor);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas agregadas de eventos de auditoría' })
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa (obligatorio para Nivel 2, opcional para Nivel 1)',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Métricas de auditoría' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async getStats(
    @CurrentUser() user: JwtPayload,
    @Headers('x-institution-id') institutionHeader: string,
    @Query() query: QueryAuditStatsDto,
  ) {
    const actor = await this.resolveActorContext(user, institutionHeader);
    return this.auditService.getStats(query, actor);
  }

  private async resolveActorContext(
    user: JwtPayload,
    institutionHeader?: string,
  ) {
    if (
      user.globalRole === RolGlobal.SUPERADMIN ||
      user.globalRole === RolGlobal.CENTRAL_ADMIN
    ) {
      return {
        userId: user.sub,
        globalRole: user.globalRole,
        institutionId: institutionHeader || undefined,
      };
    }

    if (!institutionHeader) {
      throw new BadRequestException(
        'Cabecera X-Institution-Id requerida para consultar auditoría institucional.',
      );
    }

    // Buscar vinculación institucional activa del usuario
    const vinculacion = await this.prisma.vinculacionInstitucional.findFirst({
      where: {
        usuarioId: user.sub,
        institucionId: institutionHeader,
        estado: EstadoVinculacion.ACTIVO,
      },
    });

    if (!vinculacion) {
      throw new ForbiddenException(
        'No cuenta con vinculación activa en la institución indicada.',
      );
    }

    if (
      vinculacion.rolInstitucional !== RolInstitucional.DIRECTOR &&
      vinculacion.rolInstitucional !== RolInstitucional.ADMIN_INSTITUCIONAL
    ) {
      throw new ForbiddenException(
        'Permiso denegado: solo personal directivo puede consultar la bitácora de auditoría.',
      );
    }

    return {
      userId: user.sub,
      globalRole: user.globalRole,
      institutionId: institutionHeader,
      userRole: vinculacion.rolInstitucional,
    };
  }
}
