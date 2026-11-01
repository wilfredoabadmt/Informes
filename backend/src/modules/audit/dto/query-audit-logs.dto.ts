import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoAuditoria } from '@prisma/client';

export class QueryAuditLogsDto {
  @ApiPropertyOptional({ description: 'Número de página', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Cantidad de registros por página', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Tipo de evento de auditoría', enum: TipoAuditoria })
  @IsOptional()
  @IsEnum(TipoAuditoria)
  tipo?: TipoAuditoria;

  @ApiPropertyOptional({ description: 'Búsqueda parcial en la acción registrada' })
  @IsOptional()
  @IsString()
  accion?: string;

  @ApiPropertyOptional({ description: 'UUID del usuario autor del evento' })
  @IsOptional()
  @IsUUID('4')
  usuarioId?: string;

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
