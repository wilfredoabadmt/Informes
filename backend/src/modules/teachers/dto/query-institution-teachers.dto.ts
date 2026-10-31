import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoVinculacion } from '@prisma/client';

export class QueryInstitutionTeachersDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado de la vinculación',
    enum: EstadoVinculacion,
  })
  @IsOptional()
  @IsEnum(EstadoVinculacion)
  estado?: EstadoVinculacion;

  @ApiPropertyOptional({
    description: 'Búsqueda por nombres, apellidos o RDA',
    example: 'Carlos',
  })
  @IsOptional()
  @IsString()
  q?: string;
}
