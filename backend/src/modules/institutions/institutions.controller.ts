import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { InstitutionsService } from './institutions.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { QueryInstitutionsDto } from './dto/query-institutions.dto';
import { UpdateInstitutionStatusDto } from './dto/update-institution-status.dto';
import { AssignAuthorityDto } from './dto/assign-authority.dto';
import { UpdateMyInstitutionDto } from './dto/update-my-institution.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CentralAdminGuard } from '../../common/guards/central-admin.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/tenant-context.decorator';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { Request } from 'express';

@ApiTags('Gestión de Unidades Educativas')
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  // -------------------------------------------------------------
  // NIVEL 2: ADMINISTRACIÓN INSTITUCIONAL DESCENTRALIZADA
  // (Declarado antes de :id para evitar colisiones de ruta)
  // -------------------------------------------------------------

  @Get('my-institution/profile')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Consultar ficha de la Unidad Educativa activa en sesión' })
  @ApiResponse({ status: 200, description: 'Datos de la institución propia' })
  async getMyInstitutionProfile(@CurrentTenant() tenant: TenantContext) {
    return this.institutionsService.findById(tenant.institutionId);
  }

  @Patch('my-institution')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Actualizar datos de contacto de la institución activa' })
  @ApiResponse({ status: 200, description: 'Datos actualizados exitosamente' })
  async updateMyInstitution(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateMyInstitutionDto,
    @Req() req: Request,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.institutionsService.updateMyInstitution(
      tenant.institutionId,
      dto,
      userId,
      ip,
      userAgent,
    );
  }

  // -------------------------------------------------------------
  // NIVEL 1: ADMINISTRACIÓN CENTRAL (SUPERADMIN Y CENTRAL_ADMIN)
  // -------------------------------------------------------------

  @Post()
  @UseGuards(JwtAuthGuard, CentralAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar una nueva Unidad Educativa (Nivel 1)' })
  @ApiResponse({ status: 201, description: 'Unidad Educativa creada' })
  @ApiResponse({ status: 409, description: 'Código SIE ya registrado' })
  async create(
    @CurrentUser('sub') adminUserId: string,
    @Body() dto: CreateInstitutionDto,
    @Req() req: Request,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.institutionsService.create(dto, adminUserId, ip, userAgent);
  }

  @Get()
  @UseGuards(JwtAuthGuard, CentralAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar Unidades Educativas con filtros y paginación (Nivel 1)' })
  @ApiResponse({ status: 200, description: 'Listado de instituciones' })
  async findAll(@Query() query: QueryInstitutionsDto) {
    return this.institutionsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, CentralAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener detalle de una Unidad Educativa por ID (Nivel 1)' })
  @ApiResponse({ status: 200, description: 'Detalle de la institución' })
  @ApiResponse({ status: 404, description: 'Institución no encontrada' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.institutionsService.findById(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, CentralAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activar o suspender una Unidad Educativa (Nivel 1)' })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') adminUserId: string,
    @Body() dto: UpdateInstitutionStatusDto,
    @Req() req: Request,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.institutionsService.updateStatus(id, dto, adminUserId, ip, userAgent);
  }

  @Post(':id/authorities')
  @UseGuards(JwtAuthGuard, CentralAdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Asignar Director o Administrador Institucional (Nivel 1)' })
  @ApiResponse({ status: 201, description: 'Autoridad asignada exitosamente' })
  async assignAuthority(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') adminUserId: string,
    @Body() dto: AssignAuthorityDto,
    @Req() req: Request,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.institutionsService.assignAuthority(id, dto, adminUserId, ip, userAgent);
  }
}

