import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
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
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentStatusDto } from './dto/update-assignment-status.dto';
import { QueryAssignmentsDto } from './dto/query-assignments.dto';
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

  // -------------------------------------------------------------
  // ASIGNACIONES ACADÉMICAS Y CARGA HORARIA (FEATURE 005)
  // -------------------------------------------------------------

  @Post('assignments')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Asignar materia, curso y carga horaria a un maestro vinculado (Nivel 2)',
  })
  @ApiResponse({ status: 201, description: 'Asignación académica creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Gestión cerrada o incoherencia de nivel curricular' })
  @ApiResponse({ status: 404, description: 'Docente, materia, gestión o aula no encontrada' })
  @ApiResponse({ status: 409, description: 'Docente ya asignado o titular ya registrado' })
  async createAssignment(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateAssignmentDto,
    @Req() req: Request,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.academicService.createAssignment(
      tenant.institutionId,
      dto,
      userId,
      ip,
      userAgent,
    );
  }

  @Get('assignments')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Consultar matriz de asignaciones académicas por gestión escolar (Nivel 2)',
  })
  @ApiResponse({ status: 200, description: 'Matriz de asignaciones docentes' })
  async getAssignments(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: QueryAssignmentsDto,
  ) {
    return this.academicService.getAssignments(tenant.institutionId, query);
  }

  @Get('assignments/my-assignments')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Consultar asignaciones académicas del maestro en sesión en el colegio activo (Nivel 3)',
  })
  @ApiResponse({ status: 200, description: 'Asignaciones académicas del docente' })
  async getMyAssignments(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Query('gestionId') gestionId?: string,
  ) {
    return this.academicService.getMyAssignments(
      tenant.institutionId,
      userId,
      gestionId,
    );
  }

  @Patch('assignments/:id/status')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Modificar estado de una asignación docente (Nivel 2)' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 404, description: 'Asignación no encontrada' })
  async updateAssignmentStatus(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateAssignmentStatusDto,
    @Req() req: Request,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.academicService.updateAssignmentStatus(
      tenant.institutionId,
      id,
      dto,
      userId,
      ip,
      userAgent,
    );
  }

  @Delete('assignments/:id')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Revocar o finalizar asignación académica (Nivel 2)' })
  @ApiResponse({ status: 200, description: 'Asignación dada de baja' })
  async deleteAssignment(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.academicService.deleteAssignment(
      tenant.institutionId,
      id,
      userId,
      ip,
      userAgent,
    );
  }
}
