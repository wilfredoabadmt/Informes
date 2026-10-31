import { IsDateString, IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoPeriodo } from '@prisma/client';

export class CreateEvaluationPeriodDto {
  @ApiProperty({ description: 'ID de la gestión escolar (UUID)', format: 'uuid' })
  @IsUUID('4', { message: 'gestionId debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'gestionId es obligatorio' })
  gestionId: string;

  @ApiProperty({
    description: 'Trimestre oficial SEP',
    enum: TipoPeriodo,
    example: TipoPeriodo.PRIMER_TRIMESTRE,
  })
  @IsEnum(TipoPeriodo, {
    message: `periodo debe ser uno de: ${Object.values(TipoPeriodo).join(', ')}`,
  })
  @IsNotEmpty({ message: 'periodo es obligatorio' })
  periodo: TipoPeriodo;

  @ApiProperty({
    description: 'Fecha de inicio del trimestre (YYYY-MM-DD)',
    example: '2026-02-02',
  })
  @IsDateString({}, { message: 'fechaInicio debe ser una fecha válida (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'fechaInicio es obligatoria' })
  fechaInicio: string;

  @ApiProperty({
    description: 'Fecha de fin del trimestre (YYYY-MM-DD)',
    example: '2026-05-08',
  })
  @IsDateString({}, { message: 'fechaFin debe ser una fecha válida (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'fechaFin es obligatoria' })
  fechaFin: string;

  @ApiProperty({
    description: 'Fecha límite de entrega y cierre de notas del trimestre (YYYY-MM-DD)',
    example: '2026-05-15',
  })
  @IsDateString({}, { message: 'fechaLimiteNotas debe ser una fecha válida (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'fechaLimiteNotas es obligatoria' })
  fechaLimiteNotas: string;
}
