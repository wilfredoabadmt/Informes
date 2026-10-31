import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional } from 'class-validator';

export class QueryAssignmentsDto {
  @ApiProperty({
    description: 'UUID de la gestión escolar para consultar asignaciones',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  gestionId: string;

  @ApiPropertyOptional({
    description: 'Filtrar por paralelo institucional',
    example: 'c2eedf77-7a2b-4cd6-994b-4bb7ab160c33',
  })
  @IsOptional()
  @IsUUID()
  paraleloId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por maestro (UUID de la tabla maestros)',
    example: 'd3ddce66-693c-4bc5-883a-3aa6ba050d44',
  })
  @IsOptional()
  @IsUUID()
  maestroId?: string;
}

