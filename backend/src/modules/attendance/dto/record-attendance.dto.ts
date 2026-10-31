import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
  ArrayNotEmpty,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoAsistencia } from '@prisma/client';

export class RecordAttendanceItemDto {
  @ApiProperty({ description: 'ID del estudiante (UUID)', format: 'uuid' })
  @IsUUID('4', { message: 'estudianteId debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'estudianteId es obligatorio' })
  estudianteId: string;

  @ApiProperty({
    description: 'Estado de asistencia del estudiante',
    enum: EstadoAsistencia,
    example: EstadoAsistencia.PRESENTE,
  })
  @IsEnum(EstadoAsistencia, {
    message: `estado debe ser uno de: ${Object.values(EstadoAsistencia).join(', ')}`,
  })
  @IsNotEmpty({ message: 'estado es obligatorio' })
  estado: EstadoAsistencia;

  @ApiPropertyOptional({
    description: 'Observación individual del estudiante en la sesión',
    maxLength: 255,
    example: 'Llegó con 10 min de atraso',
  })
  @IsOptional()
  @IsString({ message: 'observacion debe ser texto' })
  @MaxLength(255, { message: 'observacion no puede exceder 255 caracteres' })
  observacion?: string;
}

export class RecordAttendanceDto {
  @ApiProperty({ description: 'ID del paralelo escolar (UUID)', format: 'uuid' })
  @IsUUID('4', { message: 'paraleloId debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'paraleloId es obligatorio' })
  paraleloId: string;

  @ApiPropertyOptional({
    description: 'ID de la asignación académica pedagógica (opcional si es asistencia general de aula)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'asignacionId debe ser un UUID v4 válido' })
  asignacionId?: string;

  @ApiProperty({
    description: 'Fecha de la sesión de clase (YYYY-MM-DD)',
    example: '2026-03-02',
  })
  @IsDateString({}, { message: 'fecha debe ser una fecha válida (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'fecha es obligatoria' })
  fecha: string;

  @ApiPropertyOptional({
    description: 'Observaciones generales del registro de asistencia',
    maxLength: 255,
    example: 'Toma de asistencia del primer periodo',
  })
  @IsOptional()
  @IsString({ message: 'observaciones debe ser texto' })
  @MaxLength(255, { message: 'observaciones no puede exceder 255 caracteres' })
  observaciones?: string;

  @ApiProperty({
    description: 'Lista de estados de asistencia por estudiante',
    type: [RecordAttendanceItemDto],
  })
  @IsArray({ message: 'asistencia debe ser un array' })
  @ArrayNotEmpty({ message: 'asistencia no puede estar vacía' })
  @ValidateNested({ each: true })
  @Type(() => RecordAttendanceItemDto)
  asistencia: RecordAttendanceItemDto[];
}
