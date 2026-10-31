import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { EstadoInscripcion } from '@prisma/client';

export class UpdateEnrollmentStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la matrícula escolar',
    enum: EstadoInscripcion,
    example: EstadoInscripcion.RETIRADO_TRASLADO,
  })
  @IsEnum(EstadoInscripcion)
  @IsNotEmpty()
  estado: EstadoInscripcion;

  @ApiPropertyOptional({
    description: 'Motivo o justificativo del cambio de estado o traslado',
    example: 'Traslado a otra unidad educativa en Cochabamba',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;
}
