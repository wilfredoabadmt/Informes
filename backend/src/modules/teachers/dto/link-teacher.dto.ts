import { IsNotEmpty, IsString, IsIn, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RolInstitucional } from '@prisma/client';

export class LinkTeacherDto {
  @ApiProperty({
    description: 'Cédula de Identidad (CI) o código RDA del maestro a vincular',
    example: 'RDA-98321',
  })
  @IsNotEmpty({ message: 'El identificador (CI o RDA) es obligatorio.' })
  @IsString()
  identifier: string;

  @ApiProperty({
    description: 'Rol institucional a ejercer en el establecimiento',
    enum: [RolInstitucional.MAESTRO, RolInstitucional.COMISION_PEDAGOGICA],
    default: RolInstitucional.MAESTRO,
  })
  @IsNotEmpty({ message: 'El rol institucional es obligatorio.' })
  @IsIn([RolInstitucional.MAESTRO, RolInstitucional.COMISION_PEDAGOGICA], {
    message: 'El rol de vinculación docente debe ser MAESTRO o COMISION_PEDAGOGICA.',
  })
  rolInstitucional: RolInstitucional;

  @ApiPropertyOptional({
    description: 'Cargo oficial o asignación en el establecimiento',
    example: 'Profesor de Matemáticas y Física de Secundaria',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  cargoOficial?: string;

  @ApiPropertyOptional({
    description: 'Fecha de inicio de la vinculación (YYYY-MM-DD)',
    example: '2026-02-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe tener formato ISO YYYY-MM-DD.' })
  fechaInicio?: string;
}

