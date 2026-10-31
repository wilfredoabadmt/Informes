import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
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
import { AttendanceService } from './attendance.service';
import { RecordAttendanceDto } from './dto/record-attendance.dto';
import { JustifyAbsenceDto } from './dto/justify-absence.dto';
import { QueryAttendanceDto, QueryAttendanceStatsDto } from './dto/query-attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/tenant-context.decorator';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';

@ApiTags('Control de Asistencia')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Registrar asistencia de aula en bloque para una fecha (Nivel 2 y Nivel 3)',
  })
  @ApiResponse({ status: 201, description: 'Asistencia registrada exitosamente' })
  @ApiResponse({ status: 400, description: 'Fecha futura, paralelo inválido o estudiantes no matriculados' })
  @ApiResponse({ status: 403, description: 'El maestro no tiene asignación pedagógica en este paralelo' })
  @ApiResponse({ status: 409, description: 'Ya existe un registro de asistencia para este paralelo y fecha' })
  async recordAttendance(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Body() dto: RecordAttendanceDto,
  ) {
    return this.attendanceService.recordAttendance(
      tenant.institutionId,
      dto,
      userId,
      tenant.role,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Consultar planilla de asistencia de un paralelo por fecha (Nivel 2 y Nivel 3)',
  })
  @ApiResponse({ status: 200, description: 'Planilla de asistencia detallada' })
  @ApiResponse({ status: 404, description: 'Registro de asistencia no encontrado' })
  async getAttendanceByDate(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Query() query: QueryAttendanceDto,
  ) {
    return this.attendanceService.getAttendanceByDate(
      tenant.institutionId,
      query,
      userId,
      tenant.role,
    );
  }

  @Patch('details/:detalleId/justify')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Justificar inasistencia o modificar estado individual (Nivel 2)',
  })
  @ApiResponse({ status: 200, description: 'Inasistencia justificada exitosamente' })
  @ApiResponse({ status: 403, description: 'No autorizado para justificar inasistencias' })
  @ApiResponse({ status: 404, description: 'Detalle de asistencia no encontrado' })
  async justifyAbsence(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Param('detalleId', ParseUUIDPipe) detalleId: string,
    @Body() dto: JustifyAbsenceDto,
  ) {
    return this.attendanceService.justifyAbsence(
      tenant.institutionId,
      detalleId,
      dto,
      userId,
      tenant.role,
    );
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Consultar estadísticas consolidadas de asistencia de un paralelo (Nivel 2 y Nivel 3)',
  })
  @ApiResponse({ status: 200, description: 'Métricas y desglose de asistencia por estudiante' })
  @ApiResponse({ status: 404, description: 'Paralelo no encontrado' })
  async getAttendanceStats(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Query() query: QueryAttendanceStatsDto,
  ) {
    return this.attendanceService.getAttendanceStats(
      tenant.institutionId,
      query,
      userId,
      tenant.role,
    );
  }
}
