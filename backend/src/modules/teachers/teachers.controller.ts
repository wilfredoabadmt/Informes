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
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { LinkTeacherDto } from './dto/link-teacher.dto';
import { UpdateLinkStatusDto } from './dto/update-link-status.dto';
import { QueryInstitutionTeachersDto } from './dto/query-institution-teachers.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CentralAdminGuard } from '../../common/guards/central-admin.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/tenant-context.decorator';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { Request } from 'express';

@ApiTags('Expediente y Gestión de Maestros')
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  // -------------------------------------------------------------
  // NIVEL 3: EXPEDIENTE DOCENTE PERSONAL
  // -------------------------------------------------------------

  @Get('me/dossier')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar el propio expediente profesional e historial institucional (Nivel 3)' })
  @ApiResponse({ status: 200, description: 'Expediente profesional completo' })
  @ApiResponse({ status: 404, description: 'No se encontró expediente de maestro para este usuario' })
  async getMyDossier(@CurrentUser('sub') userId: string) {
    return this.teachersService.getTeacherDossier(userId);
  }

  // -------------------------------------------------------------
  // BÚSQUEDA Y VINCULACIÓN INSTITUCIONAL (NIVELES 1 Y 2)
  // -------------------------------------------------------------

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar maestros por CI o RDA para vinculación institucional' })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda' })
  async searchTeachers(@Query('q') query: string) {
    return this.teachersService.searchTeachers(query);
  }

  @Post('link')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Vincular un maestro a la Unidad Educativa en sesión (Nivel 2)' })
  @ApiResponse({ status: 201, description: 'Maestro vinculado exitosamente' })
  @ApiResponse({ status: 409, description: 'El maestro ya está activamente vinculado con ese rol' })
  async linkTeacher(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') directorUserId: string,
    @Body() dto: LinkTeacherDto,
    @Req() req: Request,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.teachersService.linkTeacherToInstitution(
      tenant.institutionId,
      dto,
      directorUserId,
      ip,
      userAgent,
    );
  }

  @Get('my-institution')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Consultar nómina docente de la Unidad Educativa en sesión (Nivel 2)' })
  @ApiResponse({ status: 200, description: 'Lista de maestros del colegio' })
  async getMyInstitutionTeachers(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: QueryInstitutionTeachersDto,
  ) {
    return this.teachersService.getInstitutionTeachers(tenant.institutionId, query);
  }

  @Patch('link/:vinculacionId/status')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Modificar estado laboral de vinculación (Licencia/Baja) (Nivel 2)' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 403, description: 'La vinculación no pertenece a este colegio' })
  async updateLinkStatus(
    @CurrentTenant() tenant: TenantContext,
    @Param('vinculacionId', ParseUUIDPipe) vinculacionId: string,
    @CurrentUser('sub') directorUserId: string,
    @Body() dto: UpdateLinkStatusDto,
    @Req() req: Request,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.teachersService.updateLinkStatus(
      tenant.institutionId,
      vinculacionId,
      dto,
      directorUserId,
      ip,
      userAgent,
    );
  }

  // -------------------------------------------------------------
  // NIVEL 1: ADMINISTRACIÓN CENTRAL (PADRÓN NACIONAL)
  // -------------------------------------------------------------

  @Post()
  @UseGuards(JwtAuthGuard, CentralAdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alta de maestro en el Padrón Nacional (Nivel 1)' })
  @ApiResponse({ status: 201, description: 'Maestro creado exitosamente' })
  @ApiResponse({ status: 409, description: 'RDA ya registrado' })
  async createTeacher(
    @CurrentUser('sub') adminUserId: string,
    @Body() dto: CreateTeacherDto,
    @Req() req: Request,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.teachersService.createTeacher(dto, adminUserId, ip, userAgent);
  }

  @Get(':id/dossier')
  @UseGuards(JwtAuthGuard, CentralAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar expediente completo de cualquier maestro por ID (Nivel 1)' })
  @ApiResponse({ status: 200, description: 'Expediente profesional del maestro' })
  @ApiResponse({ status: 404, description: 'Maestro no encontrado' })
  async getTeacherDossierById(@Param('id', ParseUUIDPipe) maestroId: string) {
    return this.teachersService.getTeacherDossier(undefined, maestroId);
  }
}

