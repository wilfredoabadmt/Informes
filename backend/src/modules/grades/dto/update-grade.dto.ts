import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGradeDto {
  @ApiProperty({
    description: 'Nueva calificación numérica (>= 0 y <= puntajeMaximo)',
    minimum: 0,
    example: 35,
  })
  @IsInt({ message: 'nota debe ser un número entero' })
  @Min(0, { message: 'nota no puede ser negativa' })
  @IsNotEmpty({ message: 'nota es obligatoria' })
  nota: number;

  @ApiPropertyOptional({
    description: 'Apreciación cualitativa actualizada',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'observacion debe ser texto' })
  @MaxLength(255, { message: 'observacion no puede exceder 255 caracteres' })
  observacion?: string;

  @ApiPropertyOptional({
    description: 'Motivo o justificativo formal de la rectificación de nota',
    maxLength: 255,
    example: 'Recalificación autorizada tras revisión de cuaderno',
  })
  @IsOptional()
  @IsString({ message: 'motivoRectificacion debe ser texto' })
  @MaxLength(255, { message: 'motivoRectificacion no puede exceder 255 caracteres' })
  motivoRectificacion?: string;
}

