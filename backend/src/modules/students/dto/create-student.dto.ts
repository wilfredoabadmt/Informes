import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  MaxLength,
  Matches,
} from 'class-validator';
import { ParentescoTutor } from '@prisma/client';

export class CreateStudentDto {
  @ApiProperty({
    description: 'Código RUDE único oficial del estudiante (alfanumérico)',
    example: '8073004520261A',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  codigoRude: string;

  @ApiPropertyOptional({
    description: 'Cédula de Identidad del estudiante (si posee)',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  ci?: string;

  @ApiPropertyOptional({
    description: 'Complemento de Cédula de Identidad (ej. 1A)',
    example: '1A',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  complemento?: string;

  @ApiProperty({
    description: 'Nombres del estudiante',
    example: 'Mateo',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombres: string;

  @ApiProperty({
    description: 'Primer apellido del estudiante',
    example: 'Mamani',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  primerApellido: string;

  @ApiPropertyOptional({
    description: 'Segundo apellido del estudiante',
    example: 'Quispe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  segundoApellido?: string;

  @ApiProperty({
    description: 'Fecha de nacimiento en formato YYYY-MM-DD',
    example: '2012-05-14',
  })
  @IsDateString()
  @IsNotEmpty()
  fechaNacimiento: string;

  @ApiPropertyOptional({
    description: 'Género biológico (M o F)',
    example: 'M',
    enum: ['M', 'F'],
  })
  @IsOptional()
  @IsString()
  @Matches(/^[MF]$/, { message: 'El género debe ser M o F' })
  genero?: string;

  @ApiPropertyOptional({
    description: 'Dirección de domicilio del estudiante',
    example: 'Av. Juan Pablo II #450, El Alto',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @ApiPropertyOptional({
    description: 'Nombre completo del apoderado o tutor legal',
    example: 'Lucía Quispe de Mamani',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombreTutor?: string;

  @ApiPropertyOptional({
    description: 'Cédula de Identidad del tutor legal',
    example: '4567890',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  ciTutor?: string;

  @ApiPropertyOptional({
    description: 'Parentesco del tutor legal',
    enum: ParentescoTutor,
    example: ParentescoTutor.MADRE,
    default: ParentescoTutor.PADRE,
  })
  @IsOptional()
  @IsEnum(ParentescoTutor)
  parentescoTutor?: ParentescoTutor;

  @ApiPropertyOptional({
    description: 'Teléfono o celular de contacto del apoderado',
    example: '78912345',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefonoTutor?: string;
}
