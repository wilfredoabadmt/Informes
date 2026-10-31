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
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/tenant-context.decorator';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { Request } from 'express';

@ApiTags('Estudiantes y Matrícula Escolar')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // -------------------------------------------------------------
  // EMPADRONAMIENTO Y BÚSQUEDA NACIONAL DE ESTUDIANTES
  // -------------------------------------------------------------

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Empadronar a un nuevo estudiante con código RUDE (Nivel 1 y 2)' })
  @ApiResponse({ status: 201, description: 'Estudiante empadronado exitosamente' })
  @ApiResponse({ status: 409, description: 'RUDE o Cédula de Identidad ya registrada' })
  async createStudent(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateStudentDto,
    @Req() req: Request,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.studentsService.createStudent(dto, userId, ip, userAgent);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar estudiantes en el padrón nacional por RUDE, CI o nombres' })
  @ApiResponse({ status: 200, description: 'Lista de estudiantes encontrados' })
  async searchStudents(@Query('q') q: string) {
    return this.studentsService.searchStudents(q || '');
  }

  // -------------------------------------------------------------
  // MATRICULACIÓN ESCOLAR (NIVEL 2)
  // -------------------------------------------------------------

  @Post('enroll')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Matricular a un estudiante en un paralelo y gestión (Nivel 2)' })
  @ApiResponse({ status: 201, description: 'Estudiante matriculado exitosamente' })
  @ApiResponse({ status: 400, description: 'Gestión cerrada o cupo del paralelo agotado' })
  @ApiResponse({ status: 409, description: 'El estudiante ya cuenta con matrícula activa' })
  async enrollStudent(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Body() dto: EnrollStudentDto,
    @Req() req: Request,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.studentsService.enrollStudent(
      tenant.institutionId,
      dto,
      userId,
      ip,
      userAgent,
    );
  }

  // -------------------------------------------------------------
  // ROSTER DE AULA Y CONSULTA DE ESTUDIANTES (NIVEL 2 Y NIVEL 3)
  // -------------------------------------------------------------

  @Get('sections/:paraleloId/roster')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Consultar nómina oficial de estudiantes de un paralelo (Nivel 2 y Nivel 3)',
  })
  @ApiResponse({ status: 200, description: 'Nómina oficial ordenada alfabéticamente' })
  @ApiResponse({ status: 403, description: 'El docente no tiene asignación pedagógica en este paralelo' })
  async getSectionRoster(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @CurrentUser('globalRole') rolGlobal: string,
    @Param('paraleloId', ParseUUIDPipe) paraleloId: string,
  ) {
    return this.studentsService.getSectionRoster(
      tenant.institutionId,
      paraleloId,
      userId,
      rolGlobal,
    );
  }

  @Patch('enrollments/:id/status')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Modificar estado de matrícula (Traspaso o Retiro) (Nivel 2)' })
  @ApiResponse({ status: 200, description: 'Estado de matrícula actualizado' })
  async updateEnrollmentStatus(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateEnrollmentStatusDto,
    @Req() req: Request,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.studentsService.updateEnrollmentStatus(
      tenant.institutionId,
      id,
      dto,
      userId,
      ip,
      userAgent,
    );
  }

  // Debe ir después de las rutas literales
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar ficha biográfica del estudiante con historial' })
  @ApiResponse({ status: 200, description: 'Ficha completa del estudiante' })
  @ApiResponse({ status: 404, description: 'Estudiante no encontrado' })
  async getStudentById(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getStudentProfile(id);
  }
}
