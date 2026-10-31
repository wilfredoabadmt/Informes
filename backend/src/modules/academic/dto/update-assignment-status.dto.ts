import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { EstadoAsignacion } from '@prisma/client';

export class UpdateAssignmentStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la asignación académica',
    enum: EstadoAsignacion,
    example: EstadoAsignacion.SUSPENDIDA,
  })
  @IsEnum(EstadoAsignacion)
  @IsNotEmpty()
  estado: EstadoAsignacion;

  @ApiPropertyOptional({
    description: 'Motivo o justificación del cambio de estado (ej. licencia médica, rotación)',
    example: 'Licencia médica temporal por 30 días',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;
}
