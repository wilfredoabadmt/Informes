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
import { GradesService } from './grades.service';
import { RecordGradesBatchDto } from './dto/record-grades-batch.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { QueryTrimesterSheetDto } from './dto/query-trimester-sheet.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/tenant-context.decorator';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';

@ApiTags('Calificaciones')
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post('batch')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Asentar calificaciones en bloque para un instrumento de evaluación (Nivel 3)',
  })
  @ApiResponse({ status: 201, description: 'Calificaciones asentadas exitosamente' })
  @ApiResponse({ status: 400, description: 'Nota fuera de rango, periodo cerrado o alumno no matriculado' })
  @ApiResponse({ status: 403, description: 'El maestro no tiene asignación pedagógica activa' })
  @ApiResponse({ status: 404, description: 'Evaluación no encontrada' })
  async recordGradesBatch(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Body() dto: RecordGradesBatchDto,
  ) {
    return this.gradesService.recordGradesBatch(
      tenant.institutionId,
      dto,
      userId,
      tenant.role,
    );
  }

  @Get('evaluations/:evaluacionId')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Consultar planilla de notas de un instrumento de evaluación (Nivel 2 y Nivel 3)',
  })
  @ApiResponse({ status: 200, description: 'Planilla de notas de la evaluación' })
  @ApiResponse({ status: 404, description: 'Evaluación no encontrada' })
  async getGradesByEvaluation(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Param('evaluacionId', ParseUUIDPipe) evaluacionId: string,
  ) {
    return this.gradesService.getGradesByEvaluation(
      tenant.institutionId,
      evaluacionId,
      userId,
      tenant.role,
    );
  }

  @Get('sheet')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Consultar planilla trimestral consolidada de notas (Nivel 2 y Nivel 3)',
  })
  @ApiResponse({ status: 200, description: 'Planilla consolidada con dimensiones y nota final sobre 100' })
  @ApiResponse({ status: 404, description: 'Asignación o periodo no encontrado' })
  async getTrimesterGradesSheet(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Query() query: QueryTrimesterSheetDto,
  ) {
    return this.gradesService.getTrimesterGradesSheet(
      tenant.institutionId,
      query,
      userId,
      tenant.role,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Modificar la calificación individual de un estudiante (Nivel 2 y Nivel 3)',
  })
  @ApiResponse({ status: 200, description: 'Calificación modificada exitosamente' })
  @ApiResponse({ status: 400, description: 'Trimestre cerrado o nota excede el puntaje máximo' })
  @ApiResponse({ status: 403, description: 'No autorizado para modificar esta nota' })
  @ApiResponse({ status: 404, description: 'Calificación no encontrada' })
  async updateGrade(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGradeDto,
  ) {
    return this.gradesService.updateGrade(
      tenant.institutionId,
      id,
      dto,
      userId,
      tenant.role,
    );
  }
}

