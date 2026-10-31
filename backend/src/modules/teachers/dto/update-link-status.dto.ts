import { IsNotEmpty, IsIn, IsOptional, IsDateString, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoVinculacion } from '@prisma/client';

export class UpdateLinkStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la vinculación laboral en el establecimiento',
    enum: [
      EstadoVinculacion.ACTIVO,
      EstadoVinculacion.LICENCIA,
      EstadoVinculacion.TRASLADADO,
      EstadoVinculacion.INACTIVO,
    ],
    example: EstadoVinculacion.LICENCIA,
  })
  @IsNotEmpty({ message: 'El estado de la vinculación es obligatorio.' })
  @IsIn(
    [
      EstadoVinculacion.ACTIVO,
      EstadoVinculacion.LICENCIA,
      EstadoVinculacion.TRASLADADO,
      EstadoVinculacion.INACTIVO,
    ],
    { message: 'Estado inválido. Debe ser ACTIVO, LICENCIA, TRASLADADO o INACTIVO.' },
  )
  estado: EstadoVinculacion;

  @ApiPropertyOptional({
    description: 'Fecha de conclusión de la vinculación laboral (YYYY-MM-DD)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe tener formato ISO YYYY-MM-DD.' })
  fechaFin?: string;

  @ApiPropertyOptional({
    description: 'Motivo o justificación del cambio de estado',
    example: 'Licencia temporal por motivos académicos/salud',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;
}

