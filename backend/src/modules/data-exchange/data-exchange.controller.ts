import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiConsumes,
} from '@nestjs/swagger';
import { DataExchangeService } from './data-exchange.service';
import {
  QueryImportStudentsDto,
  QueryExportStudentsDto,
  QueryExportTeachersDto,
  QueryTemplateDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/tenant-context.decorator';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';

@ApiTags('Importación y Exportación Masiva')
@Controller('data-exchange')
export class DataExchangeController {
  constructor(private readonly dataExchangeService: DataExchangeService) {}

  @Post('import/students')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Carga masiva de estudiantes e inscripciones desde archivo Excel o CSV' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({ status: 201, description: 'Resumen de importación de estudiantes' })
  @ApiResponse({ status: 400, description: 'Archivo inválido o faltante' })
  async importStudents(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Query() query: QueryImportStudentsDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Debe adjuntar un archivo válido (campo: file)');
    }

    return this.dataExchangeService.importStudents(
      tenant.institutionId,
      query.paraleloId,
      file.buffer,
      userId,
    );
  }

  @Post('import/teachers')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Carga masiva de docentes y vinculaciones desde archivo Excel o CSV' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({ status: 201, description: 'Resumen de importación de docentes' })
  @ApiResponse({ status: 400, description: 'Archivo inválido o faltante' })
  async importTeachers(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Debe adjuntar un archivo válido (campo: file)');
    }

    return this.dataExchangeService.importTeachers(
      tenant.institutionId,
      file.buffer,
      userId,
    );
  }

  @Get('export/students')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Exporta la nómina de estudiantes de un paralelo en Excel o CSV' })
  async exportStudents(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Query() query: QueryExportStudentsDto,
    @Res() res: Response,
  ) {
    const { buffer, filename, mimeType } = await this.dataExchangeService.exportStudents(
      tenant.institutionId,
      query.paraleloId,
      query.format || 'xlsx',
      userId,
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get('export/teachers')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  @ApiOperation({ summary: 'Exporta la nómina de docentes vinculados en Excel o CSV' })
  async exportTeachers(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('sub') userId: string,
    @Query() query: QueryExportTeachersDto,
    @Res() res: Response,
  ) {
    const { buffer, filename, mimeType } = await this.dataExchangeService.exportTeachers(
      tenant.institutionId,
      query.format || 'xlsx',
      userId,
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get('templates/students')
  @ApiOperation({ summary: 'Descarga plantilla oficial de estudiantes en blanco' })
  async getStudentsTemplate(
    @Query() query: QueryTemplateDto,
    @Res() res: Response,
  ) {
    const { buffer, filename, mimeType } = this.dataExchangeService.getStudentsTemplate(
      query.format || 'xlsx',
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get('templates/teachers')
  @ApiOperation({ summary: 'Descarga plantilla oficial de docentes en blanco' })
  async getTeachersTemplate(
    @Query() query: QueryTemplateDto,
    @Res() res: Response,
  ) {
    const { buffer, filename, mimeType } = this.dataExchangeService.getTeachersTemplate(
      query.format || 'xlsx',
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
