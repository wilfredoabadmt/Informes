import { IsNotEmpty, IsString, IsIn, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RolInstitucional } from '@prisma/client';

export class AssignAuthorityDto {
  @ApiProperty({
    description: 'Cédula de Identidad (CI) o correo electrónico del usuario a designar',
    example: '7214589',
  })
  @IsNotEmpty({ message: 'El identificador (CI o correo) es obligatorio.' })
  @IsString()
  identifier: string;

  @ApiProperty({
    description: 'Rol institucional a asignar',
    enum: [RolInstitucional.DIRECTOR, RolInstitucional.ADMIN_INSTITUCIONAL],
    example: RolInstitucional.DIRECTOR,
  })
  @IsNotEmpty({ message: 'El rol institucional es obligatorio.' })
  @IsIn([RolInstitucional.DIRECTOR, RolInstitucional.ADMIN_INSTITUCIONAL], {
    message: 'El rol de autoridad debe ser DIRECTOR o ADMIN_INSTITUCIONAL.',
  })
  rolInstitucional: RolInstitucional;

  @ApiPropertyOptional({
    description: 'Denominación oficial del cargo en el establecimiento',
    example: 'Directora Titular Institucional',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  cargoOficial?: string;
}

