import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEvaluationDto {
  @ApiPropertyOptional({
    description: 'Nombre o título descriptivo del instrumento de evaluación',
    maxLength: 150,
  })
  @IsOptional()
  @IsString({ message: 'nombre debe ser texto' })
  @MaxLength(150, { message: 'nombre no puede exceder 150 caracteres' })
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada o criterios de la evaluación',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'descripcion debe ser texto' })
  @MaxLength(255, { message: 'descripcion no puede exceder 255 caracteres' })
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Puntaje máximo asignado a este instrumento',
    minimum: 1,
    maximum: 35,
  })
  @IsOptional()
  @IsInt({ message: 'puntajeMaximo debe ser un número entero' })
  @Min(1, { message: 'puntajeMaximo debe ser al menos 1 punto' })
  @Max(35, { message: 'puntajeMaximo no puede exceder 35 puntos' })
  puntajeMaximo?: number;

  @ApiPropertyOptional({
    description: 'Fecha programada de la evaluación (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'fechaEvaluacion debe ser una fecha válida (YYYY-MM-DD)' })
  fechaEvaluacion?: string;
}
