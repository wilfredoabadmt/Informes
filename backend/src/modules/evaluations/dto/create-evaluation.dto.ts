import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DimensionEvaluacion } from '@prisma/client';

export class CreateEvaluationDto {
  @ApiProperty({ description: 'ID de la asignación académica (UUID)', format: 'uuid' })
  @IsUUID('4', { message: 'asignacionId debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'asignacionId es obligatorio' })
  asignacionId: string;

  @ApiProperty({ description: 'ID del periodo evaluativo/trimestre (UUID)', format: 'uuid' })
  @IsUUID('4', { message: 'periodoId debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'periodoId es obligatorio' })
  periodoId: string;

  @ApiProperty({
    description: 'Dimensión evaluativa del modelo sociocomunitario productivo',
    enum: DimensionEvaluacion,
    example: DimensionEvaluacion.SABER,
  })
  @IsEnum(DimensionEvaluacion, {
    message: `dimension debe ser una de: ${Object.values(DimensionEvaluacion).join(', ')}`,
  })
  @IsNotEmpty({ message: 'dimension es obligatoria' })
  dimension: DimensionEvaluacion;

  @ApiProperty({
    description: 'Nombre o título descriptivo del instrumento de evaluación',
    maxLength: 150,
    example: 'Examen de Álgebra y Funciones',
  })
  @IsString({ message: 'nombre debe ser texto' })
  @IsNotEmpty({ message: 'nombre es obligatorio' })
  @MaxLength(150, { message: 'nombre no puede exceder 150 caracteres' })
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada o criterios de la evaluación',
    maxLength: 255,
    example: 'Evaluación individual escrita con 5 ejercicios de desarrollo',
  })
  @IsOptional()
  @IsString({ message: 'descripcion debe ser texto' })
  @MaxLength(255, { message: 'descripcion no puede exceder 255 caracteres' })
  descripcion?: string;

  @ApiProperty({
    description: 'Puntaje máximo asignado a este instrumento (entre 1 y 35 según la dimensión)',
    minimum: 1,
    maximum: 35,
    example: 35,
  })
  @IsInt({ message: 'puntajeMaximo debe ser un número entero' })
  @Min(1, { message: 'puntajeMaximo debe ser al menos 1 punto' })
  @Max(35, { message: 'puntajeMaximo no puede exceder 35 puntos' })
  @IsNotEmpty({ message: 'puntajeMaximo es obligatorio' })
  puntajeMaximo: number;

  @ApiProperty({
    description: 'Fecha programada de la evaluación (YYYY-MM-DD)',
    example: '2026-04-10',
  })
  @IsDateString({}, { message: 'fechaEvaluacion debe ser una fecha válida (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'fechaEvaluacion es obligatoria' })
  fechaEvaluacion: string;
}
