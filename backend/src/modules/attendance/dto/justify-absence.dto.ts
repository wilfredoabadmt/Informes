import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoAsistencia } from '@prisma/client';

export class JustifyAbsenceDto {
  @ApiProperty({
    description: 'Nuevo estado de asistencia',
    enum: EstadoAsistencia,
    example: EstadoAsistencia.LICENCIA,
  })
  @IsEnum(EstadoAsistencia, {
    message: `estado debe ser uno de: ${Object.values(EstadoAsistencia).join(', ')}`,
  })
  @IsNotEmpty({ message: 'estado es obligatorio' })
  estado: EstadoAsistencia;

  @ApiPropertyOptional({
    description: 'Indica si la inasistencia queda justificada documentalmente',
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'justificado debe ser un booleano' })
  justificado?: boolean = true;

  @ApiProperty({
    description: 'Motivo o justificación documentada de la modificación',
    maxLength: 255,
    example: 'Certificado médico presentado por el tutor legal',
  })
  @IsString({ message: 'observacion debe ser texto' })
  @IsNotEmpty({ message: 'observacion es obligatoria para justificar' })
  @MaxLength(255, { message: 'observacion no puede exceder 255 caracteres' })
  observacion: string;
}
