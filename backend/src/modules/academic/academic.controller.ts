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
import { AcademicService } from './academic.service';
import { CreateSchoolYearDto } from './dto/create-school-year.dto';
import { UpdateSchoolYearStatusDto } from './dto/update-school-year-status.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { QuerySubjectsDto } from './dto/query-subjects.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/tenant-context.decorator';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { NivelEducativo } from '@prisma/client';
import { Request } from 'express';

@ApiTags('Estructura Académica Institucional')
@Controller('academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  // -------------------------------------------------------------
  // CATÁLOGOS CURRICULARES NACIONALES DEL SEP
  // -------------------------------------------------------------

  @Get('subjects')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar catálogo oficial de materias del SEP' })
  @ApiResponse({ status: 200, description: 'Lista de materias curriculares' })
  async getSubjects(@Query() query: QuerySubjectsDto) {
    return this.academicService.getSubjects(query);
  }

  @Get('courses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar catálogo oficial de cursos y grados del SEP' })
  @ApiResponse({ status: 200, description: 'Lista de cursos oficiales' })
  async getCourses(@Query('nivel') nivel?: NivelEducativo) {
    return this.academicService.getCourses(nivel);
  }

  // -------------------------------------------------------------
  // GESTIONES ESCOLARES INSTITUCIONALES (NIVEL 2)
  // -------------------------------------------------------------

  @Post('school-years')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Aperturar una nueva gestión escolar anual (Nivel 2)' })
  @ApiResponse({ status: 201, description: 'Gestión escolar creada' })
  @ApiResponse({ status: 409, description: 'El año lectivo ya se encuentra registrado' })
  async createSchoolYear(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateSchoolYearDto,
    @Req() req: Request,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.academicService.createSchoolYear(
      tenant.institutionId,
      dto,
      userId,
      ip,
      userAgent,
    );
  }

  @Get('school-years')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Listar gestiones escolares del colegio en sesión (Nivel 2)' })
  @ApiResponse({ status: 200, description: 'Lista de gestiones escolares' })
  async getSchoolYears(@CurrentTenant() tenant: TenantContext) {
    return this.academicService.getSchoolYears(tenant.institutionId);
  }

  @Patch('school-years/:id/status')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Cambiar estado de la gestión escolar (Nivel 2)' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 403, description: 'La gestión no pertenece a este colegio' })
  async updateSchoolYearStatus(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateSchoolYearStatusDto,
    @Req() req: Request,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.academicService.updateSchoolYearStatus(
      tenant.institutionId,
      id,
      dto,
      userId,
      ip,
      userAgent,
    );
  }

  // -------------------------------------------------------------
  // PARALELOS Y AULAS INSTITUCIONALES (NIVEL 2)
  // -------------------------------------------------------------

  @Post('sections')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Crear paralelo institucional (aula) en la gestión (Nivel 2)' })
  @ApiResponse({ status: 201, description: 'Paralelo creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Gestión escolar cerrada' })
  @ApiResponse({ status: 409, description: 'El paralelo ya existe en ese curso y turno' })
  async createSection(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateSectionDto,
    @Req() req: Request,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.academicService.createSection(
      tenant.institutionId,
      dto,
      userId,
      ip,
      userAgent,
    );
  }

  @Get('sections/tree')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Consultar árbol académico jerárquico del colegio (Nivel 2)' })
  @ApiResponse({ status: 200, description: 'Árbol académico jerárquico' })
  async getAcademicTree(
    @CurrentTenant() tenant: TenantContext,
    @Query('gestionId', ParseUUIDPipe) gestionId: string,
  ) {
    return this.academicService.getAcademicTree(tenant.institutionId, gestionId);
  }
}
