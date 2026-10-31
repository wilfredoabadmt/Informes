import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeacherDto {
  @ApiProperty({ description: 'Cédula de Identidad (CI)', example: '6849302' })
  @IsNotEmpty({ message: 'La Cédula de Identidad (CI) es obligatoria.' })
  @IsString()
  @MaxLength(20)
  ci: string;

  @ApiPropertyOptional({ description: 'Complemento de CI (ej: 1B, 1A)', example: '1B' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  complemento?: string;

  @ApiProperty({ description: 'Nombres del docente', example: 'Carlos' })
  @IsNotEmpty({ message: 'Los nombres son obligatorios.' })
  @IsString()
  @MaxLength(100)
  nombres: string;

  @ApiProperty({ description: 'Primer apellido', example: 'Mamani' })
  @IsNotEmpty({ message: 'El primer apellido es obligatorio.' })
  @IsString()
  @MaxLength(100)
  primerApellido: string;

  @ApiPropertyOptional({ description: 'Segundo apellido', example: 'Condori' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  segundoApellido?: string;

  @ApiProperty({ description: 'Correo electrónico institucional o personal', example: 'carlos.mamani@minedu.gob.bo' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  @IsEmail({}, { message: 'El formato de correo electrónico no es válido.' })
  email: string;

  @ApiPropertyOptional({ description: 'Teléfono celular', example: '71542389' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @ApiProperty({ description: 'Código oficial de Registro Docente Administrativo (RDA)', example: 'RDA-98321' })
  @IsNotEmpty({ message: 'El código RDA es obligatorio.' })
  @IsString()
  @MinLength(4, { message: 'El código RDA debe tener al menos 4 caracteres.' })
  @MaxLength(50)
  rda: string;

  @ApiPropertyOptional({ description: 'Título profesional o de licenciatura', example: 'Licenciado en Ciencias de la Educación' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tituloProfesional?: string;

  @ApiPropertyOptional({ description: 'Especialidad pedagógica', example: 'Matemática y Ciencias Naturales' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  especialidad?: string;

  @ApiPropertyOptional({ description: 'Año de egreso de formación docente', example: 2015 })
  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2030)
  anioEgreso?: number;

  @ApiPropertyOptional({ description: '¿Egresado de Escuela Superior de Formación de Maestros (ESFM)?', default: true })
  @IsOptional()
  @IsBoolean()
  normalista?: boolean = true;

  @ApiPropertyOptional({ description: 'Contraseña inicial de acceso (opcional)', example: 'Bolivia2026!' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña inicial debe tener al menos 6 caracteres.' })
  passwordInicial?: string;
}

