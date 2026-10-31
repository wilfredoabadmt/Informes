import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { CentralizersService } from './centralizers.service';
import { QueryTrimesterCentralizerDto } from './dto/query-trimester-centralizer.dto';
import { QueryAnnualCentralizerDto } from './dto/query-annual-centralizer.dto';
import { FinalizeCentralizerDto } from './dto/finalize-centralizer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/tenant-context.decorator';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';

@ApiTags('Centralizadores')
@Controller('centralizers')
export class CentralizersController {
  constructor(private readonly centralizersService: CentralizersService) {}

  @Get('trimester')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Centralizador trimestral de paralelo (Nivel 2 y Nivel 3)',
  })
  @ApiResponse({ status: 200, description: 'Matriz Estudiantes x Materias del trimestre' })
  @ApiResponse({ status: 404, description: 'Paralelo o periodo no encontrado' })
  async getTrimesterCentralizer(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Query() query: QueryTrimesterCentralizerDto,
  ) {
    return this.centralizersService.getTrimesterCentralizer(
      tenant.institutionId,
      query,
      userId,
      tenant.role,
    );
  }

  @Get('annual')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Centralizador anual de gestión con situación tentativa (Nivel 2 y Nivel 3)',
  })
  @ApiResponse({ status: 200, description: 'Centralizador anual con promedios 1T/2T/3T' })
  @ApiResponse({ status: 404, description: 'Paralelo no encontrado' })
  async getAnnualCentralizer(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Query() query: QueryAnnualCentralizerDto,
  ) {
    return this.centralizersService.getAnnualCentralizer(
      tenant.institutionId,
      query,
      userId,
      tenant.role,
    );
  }

  @Post('finalize')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({
    summary: 'Cierre anual oficial: persiste Situación Final (Nivel 2)',
  })
  @ApiResponse({ status: 200, description: 'Cierre anual completado con estadísticas' })
  @ApiResponse({ status: 400, description: 'Existen trimestres no cerrados o materias sin calificar' })
  @ApiResponse({ status: 403, description: 'Requiere rol directivo de Nivel 2' })
  @ApiResponse({ status: 404, description: 'Paralelo no encontrado' })
  async finalizeAnnualCentralizer(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Body() dto: FinalizeCentralizerDto,
  ) {
    return this.centralizersService.finalizeAnnualCentralizer(
      tenant.institutionId,
      dto,
      userId,
      tenant.role,
    );
  }
}
