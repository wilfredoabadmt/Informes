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
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationPeriodDto } from './dto/create-evaluation-period.dto';
import { UpdatePeriodStatusDto } from './dto/update-period-status.dto';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { QueryEvaluationsDto } from './dto/query-evaluations.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/tenant-context.decorator';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';

@ApiTags('Periodos e Instrumentos de Evaluación')
@Controller()
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  // -------------------------------------------------------------
  // PERIODOS EVALUATIVOS (TRIMESTRES - NIVEL 2)
  // -------------------------------------------------------------

  @Post('evaluation-periods')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Registrar un periodo evaluativo (trimestre) para una gestión escolar (Nivel 2)',
  })
  @ApiResponse({ status: 201, description: 'Periodo creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Rango de fechas inválido o gestión escolar cerrada' })
  @ApiResponse({ status: 409, description: 'El trimestre ya se encuentra registrado para esta gestión' })
  async createEvaluationPeriod(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateEvaluationPeriodDto,
  ) {
    return this.evaluationsService.createEvaluationPeriod(
      tenant.institutionId,
      dto,
      userId,
    );
  }

  @Get('evaluation-periods')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Listar los periodos evaluativos de una gestión escolar (Nivel 2 y Nivel 3)',
  })
  @ApiResponse({ status: 200, description: 'Lista de trimestres de la gestión escolar' })
  async getEvaluationPeriods(
    @CurrentTenant() tenant: TenantContext,
    @Query('gestionId', ParseUUIDPipe) gestionId: string,
  ) {
    return this.evaluationsService.getEvaluationPeriods(
      tenant.institutionId,
      gestionId,
    );
  }

  @Patch('evaluation-periods/:id/status')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Conmutar el estado del trimestre (PROGRAMADO, ABIERTO, CERRADO) (Nivel 2)',
  })
  @ApiResponse({ status: 200, description: 'Estado del trimestre actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Ya existe otro trimestre abierto en la gestión' })
  @ApiResponse({ status: 404, description: 'Periodo no encontrado' })
  async updatePeriodStatus(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePeriodStatusDto,
  ) {
    return this.evaluationsService.updatePeriodStatus(
      tenant.institutionId,
      id,
      dto,
      userId,
    );
  }

  // -------------------------------------------------------------
  // INSTRUMENTOS DE EVALUACIÓN DOCENTE (NIVEL 3)
  // -------------------------------------------------------------

  @Post('evaluations')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Crear un instrumento de evaluación para una materia y dimensión (Nivel 3)',
  })
  @ApiResponse({ status: 201, description: 'Instrumento de evaluación creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Periodo cerrado, fecha fuera de rango o puntaje excede el límite' })
  @ApiResponse({ status: 403, description: 'El maestro no tiene asignación pedagógica activa' })
  async createEvaluation(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateEvaluationDto,
  ) {
    return this.evaluationsService.createEvaluation(
      tenant.institutionId,
      dto,
      userId,
      tenant.role,
    );
  }

  @Get('evaluations')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Listar instrumentos de evaluación de una asignación y periodo (Nivel 2 y Nivel 3)',
  })
  @ApiResponse({ status: 200, description: 'Lista de evaluaciones programadas' })
  async getEvaluations(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Query() query: QueryEvaluationsDto,
  ) {
    return this.evaluationsService.getEvaluations(
      tenant.institutionId,
      query,
      userId,
      tenant.role,
    );
  }

  @Patch('evaluations/:id')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Modificar un instrumento de evaluación (Nivel 3)',
  })
  @ApiResponse({ status: 200, description: 'Evaluación actualizada exitosamente' })
  @ApiResponse({ status: 400, description: 'El periodo está cerrado o puntaje inválido' })
  @ApiResponse({ status: 403, description: 'No autorizado para modificar este instrumento' })
  @ApiResponse({ status: 404, description: 'Evaluación no encontrada' })
  async updateEvaluation(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEvaluationDto,
  ) {
    return this.evaluationsService.updateEvaluation(
      tenant.institutionId,
      id,
      dto,
      userId,
      tenant.role,
    );
  }

  @Delete('evaluations/:id')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Desactivar/eliminar un instrumento de evaluación (Nivel 3)',
  })
  @ApiResponse({ status: 200, description: 'Evaluación eliminada exitosamente' })
  @ApiResponse({ status: 400, description: 'El periodo está cerrado' })
  @ApiResponse({ status: 403, description: 'No autorizado para eliminar este instrumento' })
  @ApiResponse({ status: 404, description: 'Evaluación no encontrada' })
  async deleteEvaluation(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.evaluationsService.deleteEvaluation(
      tenant.institutionId,
      id,
      userId,
      tenant.role,
    );
  }
}
