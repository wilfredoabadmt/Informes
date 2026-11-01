import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueryExportStudentsDto {
  @ApiProperty({ description: 'ID del paralelo escolar a exportar (UUID)' })
  @IsUUID('4', { message: 'paraleloId debe ser un UUID v4 válido' })
  paraleloId: string;

  @ApiPropertyOptional({ description: 'Formato de exportación', enum: ['xlsx', 'csv'], default: 'xlsx' })
  @IsOptional()
  @IsEnum(['xlsx', 'csv'], { message: 'format debe ser xlsx o csv' })
  format?: 'xlsx' | 'csv' = 'xlsx';
}
