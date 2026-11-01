import { IsNotEmpty, IsString, IsEmail, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoInstitucion, NivelEducativo } from '@prisma/client';

export class RegisterSchoolDto {
  // Datos del Solicitante / Director
  @ApiProperty({ example: '10023456', description: 'Cédula de Identidad del Director' })
  @IsNotEmpty({ message: 'El CI es obligatorio.' })
  @IsString()
  ci: string;

  @ApiProperty({ example: 'Ramiro', description: 'Nombres del Director' })
  @IsNotEmpty({ message: 'Los nombres son obligatorios.' })
  @IsString()
  nombres: string;

  @ApiProperty({ example: 'Vargas', description: 'Primer apellido del Director' })
  @IsNotEmpty({ message: 'El primer apellido es obligatorio.' })
  @IsString()
  primerApellido: string;

  @ApiProperty({ example: 'Condori', description: 'Segundo apellido', required: false })
  @IsOptional()
  @IsString()
  segundoApellido?: string;

  @ApiProperty({ example: 'director@colegiobolivia.edu.bo', description: 'Correo institucional' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  @IsEmail({}, { message: 'El formato de correo no es válido.' })
  email: string;

  @ApiProperty({ example: 'SeguraPass2026!', description: 'Contraseña' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;

  @ApiProperty({ example: '71512345', description: 'Número de WhatsApp o teléfono de contacto' })
  @IsOptional()
  @IsString()
  telefono?: string;

  // Datos de la Unidad Educativa
  @ApiProperty({ example: '80730099', description: 'Código SIE oficial otorgado por el SEP' })
  @IsNotEmpty({ message: 'El código SIE es obligatorio.' })
  @IsString()
  sie: string;

  @ApiProperty({ example: 'Colegio Nacional Bolivia Mar', description: 'Nombre oficial de la Unidad Educativa' })
  @IsNotEmpty({ message: 'El nombre de la unidad educativa es obligatorio.' })
  @IsString()
  nombreColegio: string;

  @ApiProperty({ example: 'La Paz', description: 'Departamento' })
  @IsNotEmpty({ message: 'El departamento es obligatorio.' })
  @IsString()
  departamento: string;

  @ApiProperty({ example: 'Murillo', description: 'Provincia' })
  @IsNotEmpty({ message: 'La provincia es obligatoria.' })
  @IsString()
  provincia: string;

  @ApiProperty({ example: 'La Paz', description: 'Municipio' })
  @IsNotEmpty({ message: 'El municipio es obligatorio.' })
  @IsString()
  municipio: string;

  @ApiProperty({ example: 'La Paz 1', description: 'Distrito Educativo' })
  @IsOptional()
  @IsString()
  distrito?: string;

  @ApiProperty({ enum: TipoInstitucion, default: TipoInstitucion.FISCAL })
  @IsOptional()
  @IsEnum(TipoInstitucion)
  tipo?: TipoInstitucion;

  @ApiProperty({ enum: NivelEducativo, default: NivelEducativo.INTEGRADO })
  @IsOptional()
  @IsEnum(NivelEducativo)
  nivel?: NivelEducativo;

  // Plan SaaS seleccionado
  @ApiProperty({ example: 'PLAN_PRO', default: 'PLAN_PRO' })
  @IsOptional()
  @IsString()
  planCodigo?: string;
}

