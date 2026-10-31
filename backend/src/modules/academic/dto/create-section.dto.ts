import { IsNotEmpty, IsUUID, IsString, IsEnum, IsOptional, IsInt, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Turno } from '@prisma/client';

export class CreateSectionDto {
  @ApiProperty({ description: 'UUID de la gestión escolar en la que se crea el paralelo' })
  @IsNotEmpty({ message: 'El identificador de la gestión escolar es obligatorio.' })
  @IsUUID('4', { message: 'gestionId debe ser un UUID válido.' })
  gestionId: string;

  @ApiProperty({ description: 'UUID del curso (grado) oficial al que corresponde' })
  @IsNotEmpty({ message: 'El identificador del curso es obligatorio.' })
  @IsUUID('4', { message: 'cursoId debe ser un UUID válido.' })
  cursoId: string;

  @ApiProperty({ description: 'Letra identificadora del paralelo (A, B, C, etc.)', example: 'A' })
  @IsNotEmpty({ message: 'La letra del paralelo es obligatoria.' })
  @IsString()
  @MaxLength(5)
  letra: string;

  @ApiProperty({
    description: 'Turno de funcionamiento del aula',
    enum: Turno,
    default: Turno.MANANA,
  })
  @IsNotEmpty({ message: 'El turno es obligatorio.' })
  @IsEnum(Turno, { message: 'Turno inválido. Debe ser MANANA, TARDE o NOCHE.' })
  turno: Turno;

  @ApiPropertyOptional({ description: 'Capacidad máxima de estudiantes en el aula', default: 35, example: 35 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  cupoMaximo?: number = 35;
}

