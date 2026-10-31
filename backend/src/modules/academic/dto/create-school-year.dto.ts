import { IsNotEmpty, IsInt, Min, Max, IsDateString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoGestion } from '@prisma/client';

export class CreateSchoolYearDto {
  @ApiProperty({ description: 'Año lectivo de la gestión escolar', example: 2026 })
  @IsNotEmpty({ message: 'El año lectivo es obligatorio.' })
  @IsInt({ message: 'El año lectivo debe ser un número entero.' })
  @Min(2020)
  @Max(2035)
  anio: number;

  @ApiProperty({ description: 'Fecha de inicio de clases (YYYY-MM-DD)', example: '2026-02-02' })
  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria.' })
  @IsDateString({}, { message: 'La fecha de inicio debe tener formato ISO YYYY-MM-DD.' })
  fechaInicio: string;

  @ApiPropertyOptional({ description: 'Fecha de finalización de clases (YYYY-MM-DD)', example: '2026-11-30' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe tener formato ISO YYYY-MM-DD.' })
  fechaFin?: string;

  @ApiPropertyOptional({
    description: 'Estado inicial de la gestión',
    enum: [EstadoGestion.EN_PLANIFICACION, EstadoGestion.ABIERTA],
    default: EstadoGestion.ABIERTA,
  })
  @IsOptional()
  @IsIn([EstadoGestion.EN_PLANIFICACION, EstadoGestion.ABIERTA], {
    message: 'El estado inicial debe ser EN_PLANIFICACION o ABIERTA.',
  })
  estado?: EstadoGestion = EstadoGestion.ABIERTA;
}
