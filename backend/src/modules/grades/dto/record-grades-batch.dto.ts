import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GradeInputItemDto {
  @ApiProperty({ description: 'ID del estudiante (UUID)', format: 'uuid' })
  @IsUUID('4', { message: 'estudianteId debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'estudianteId es obligatorio' })
  estudianteId: string;

  @ApiProperty({
    description: 'Calificación numérica asignada al estudiante (>= 0 y <= puntajeMaximo)',
    minimum: 0,
    example: 32,
  })
  @IsInt({ message: 'nota debe ser un número entero' })
  @Min(0, { message: 'nota no puede ser negativa' })
  @IsNotEmpty({ message: 'nota es obligatoria' })
  nota: number;

  @ApiPropertyOptional({
    description: 'Apreciación cualitativa pedagógica del estudiante en la evaluación',
    maxLength: 255,
    example: 'Excelente resolución de ejercicios prácticos',
  })
  @IsOptional()
  @IsString({ message: 'observacion debe ser texto' })
  @MaxLength(255, { message: 'observacion no puede exceder 255 caracteres' })
  observacion?: string;
}

export class RecordGradesBatchDto {
  @ApiProperty({ description: 'ID del instrumento de evaluación (UUID)', format: 'uuid' })
  @IsUUID('4', { message: 'evaluacionId debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'evaluacionId es obligatorio' })
  evaluacionId: string;

  @ApiProperty({
    description: 'Lista de calificaciones por estudiante',
    type: [GradeInputItemDto],
  })
  @IsArray({ message: 'calificaciones debe ser un array' })
  @ArrayNotEmpty({ message: 'calificaciones no puede estar vacío' })
  @ValidateNested({ each: true })
  @Type(() => GradeInputItemDto)
  calificaciones: GradeInputItemDto[];
}

