import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiProduces,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import {
  QueryCourseRosterDto,
  QueryTrimesterBulletinDto,
  QuerySchoolReportCardDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/tenant-context.decorator';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';

@ApiTags('Reportes')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('course-roster')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Obtiene la lista oficial de estudiantes de un curso y paralelo en formato JSON' })
  @ApiResponse({ status: 200, description: 'Nómina oficial de estudiantes del paralelo' })
  @ApiResponse({ status: 404, description: 'Paralelo no encontrado' })
  async getCourseRoster(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Query() query: QueryCourseRosterDto,
  ) {
    return this.reportsService.getCourseRoster(
      tenant.institutionId,
      query,
      userId,
      tenant.role,
    );
  }

  @Get('course-roster/pdf')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Descarga la lista oficial de estudiantes en PDF' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'Archivo PDF de la lista de curso' })
  @ApiResponse({ status: 404, description: 'Paralelo no encontrado' })
  async getCourseRosterPdf(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Query() query: QueryCourseRosterDto,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.reportsService.getCourseRosterPdf(
      tenant.institutionId,
      query,
      userId,
      tenant.role,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get('trimester-bulletin')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Obtiene el boletín trimestral de calificaciones en formato JSON' })
  @ApiResponse({ status: 200, description: 'Datos del boletín trimestral del estudiante' })
  @ApiResponse({ status: 404, description: 'Inscripción o periodo no encontrado' })
  async getTrimesterBulletin(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Query() query: QueryTrimesterBulletinDto,
  ) {
    return this.reportsService.getTrimesterBulletin(
      tenant.institutionId,
      query,
      userId,
      tenant.role,
    );
  }

  @Get('trimester-bulletin/pdf')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Descarga el boletín trimestral de calificaciones en PDF' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'Archivo PDF del boletín trimestral' })
  @ApiResponse({ status: 404, description: 'Inscripción o periodo no encontrado' })
  async getTrimesterBulletinPdf(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Query() query: QueryTrimesterBulletinDto,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.reportsService.getTrimesterBulletinPdf(
      tenant.institutionId,
      query,
      userId,
      tenant.role,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get('school-report-card')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Obtiene la libreta escolar anual consolidada en formato JSON' })
  @ApiResponse({ status: 200, description: 'Datos de la libreta escolar anual' })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  async getSchoolReportCard(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Query() query: QuerySchoolReportCardDto,
  ) {
    return this.reportsService.getSchoolReportCard(
      tenant.institutionId,
      query,
      userId,
      tenant.role,
    );
  }

  @Get('school-report-card/pdf')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Descarga la libreta escolar anual en PDF' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'Archivo PDF de la libreta escolar' })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  async getSchoolReportCardPdf(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Query() query: QuerySchoolReportCardDto,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.reportsService.getSchoolReportCardPdf(
      tenant.institutionId,
      query,
      userId,
      tenant.role,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
