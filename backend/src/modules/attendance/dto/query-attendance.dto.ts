import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAttendanceDto {
  @ApiProperty({ description: 'ID del paralelo escolar', format: 'uuid' })
  @IsUUID('4', { message: 'paraleloId debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'paraleloId es obligatorio' })
  paraleloId: string;

  @ApiProperty({
    description: 'Fecha de la sesión de asistencia (YYYY-MM-DD)',
    example: '2026-03-02',
  })
  @IsDateString({}, { message: 'fecha debe ser una fecha válida (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'fecha es obligatoria' })
  fecha: string;

  @ApiPropertyOptional({
    description: 'ID de la asignación académica pedagógica (opcional)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'asignacionId debe ser un UUID v4 válido' })
  asignacionId?: string;
}

export class QueryAttendanceStatsDto {
  @ApiProperty({ description: 'ID del paralelo escolar', format: 'uuid' })
  @IsUUID('4', { message: 'paraleloId debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'paraleloId es obligatorio' })
  paraleloId: string;

  @ApiProperty({
    description: 'Fecha de inicio del rango de análisis (YYYY-MM-DD)',
    example: '2026-03-01',
  })
  @IsDateString({}, { message: 'fechaInicio debe ser una fecha válida (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'fechaInicio es obligatoria' })
  fechaInicio: string;

  @ApiProperty({
    description: 'Fecha de fin del rango de análisis (YYYY-MM-DD)',
    example: '2026-03-31',
  })
  @IsDateString({}, { message: 'fechaFin debe ser una fecha válida (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'fechaFin es obligatoria' })
  fechaFin: string;
}
