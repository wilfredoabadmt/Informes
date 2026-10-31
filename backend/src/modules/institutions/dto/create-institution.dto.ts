import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsIn,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoInstitucion, NivelEducativo } from '@prisma/client';
import { DEPARTAMENTOS_BOLIVIA, DepartamentoBolivia } from '../../../common/constants/bolivia.constants';

export class CreateInstitutionDto {
  @ApiProperty({
    description: 'Código SIE único de 6 a 10 dígitos',
    example: '80730047',
  })
  @IsNotEmpty({ message: 'El código SIE es obligatorio.' })
  @IsString()
  @Matches(/^\d{6,10}$/, {
    message: 'El código SIE debe contener entre 6 y 10 dígitos numéricos.',
  })
  sie: string;

  @ApiProperty({
    description: 'Nombre oficial de la Unidad Educativa',
    example: 'Unidad Educativa Avaroa',
  })
  @IsNotEmpty({ message: 'El nombre de la Unidad Educativa es obligatorio.' })
  @IsString()
  @MaxLength(255)
  nombre: string;

  @ApiProperty({
    description: 'Departamento de Bolivia',
    enum: DEPARTAMENTOS_BOLIVIA,
    example: 'La Paz',
  })
  @IsNotEmpty({ message: 'El departamento es obligatorio.' })
  @IsIn(DEPARTAMENTOS_BOLIVIA as unknown as string[], {
    message: `El departamento debe ser uno de los 9 oficiales: ${DEPARTAMENTOS_BOLIVIA.join(', ')}.`,
  })
  departamento: DepartamentoBolivia;

  @ApiProperty({
    description: 'Provincia',
    example: 'Murillo',
  })
  @IsNotEmpty({ message: 'La provincia es obligatoria.' })
  @IsString()
  @MaxLength(100)
  provincia: string;

  @ApiProperty({
    description: 'Municipio',
    example: 'La Paz',
  })
  @IsNotEmpty({ message: 'El municipio es obligatorio.' })
  @IsString()
  @MaxLength(100)
  municipio: string;

  @ApiPropertyOptional({
    description: 'Distrito educativo correspondiente',
    example: 'La Paz 2',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  distrito?: string;

  @ApiPropertyOptional({
    description: 'Dirección o ubicación física',
    example: 'Zona San Pedro, Calle Colombia #220',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto institucional',
    example: '22498765',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @ApiProperty({
    description: 'Tipo de dependencia institucional',
    enum: TipoInstitucion,
    default: TipoInstitucion.FISCAL,
  })
  @IsNotEmpty({ message: 'El tipo de institución es obligatorio.' })
  @IsEnum(TipoInstitucion)
  tipo: TipoInstitucion;

  @ApiProperty({
    description: 'Nivel educativo ofertado',
    enum: NivelEducativo,
    default: NivelEducativo.INTEGRADO,
  })
  @IsNotEmpty({ message: 'El nivel educativo es obligatorio.' })
  @IsEnum(NivelEducativo)
  nivel: NivelEducativo;
}

