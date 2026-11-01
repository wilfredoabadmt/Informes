import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAuditStatsDto {
  @ApiPropertyOptional({ description: 'UUID de la institución (solo Nivel 1)' })
  @IsOptional()
  @IsUUID('4')
  institucionId?: string;

  @ApiPropertyOptional({ description: 'Fecha de inicio del rango (ISO Date)' })
  @IsOptional()
  @IsString()
  fechaDesde?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin del rango (ISO Date)' })
  @IsOptional()
  @IsString()
  fechaHasta?: string;
}
