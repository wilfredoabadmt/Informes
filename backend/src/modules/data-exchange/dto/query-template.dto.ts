import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryTemplateDto {
  @ApiPropertyOptional({ description: 'Formato de plantilla', enum: ['xlsx', 'csv'], default: 'xlsx' })
  @IsOptional()
  @IsEnum(['xlsx', 'csv'], { message: 'format debe ser xlsx o csv' })
  format?: 'xlsx' | 'csv' = 'xlsx';
}
