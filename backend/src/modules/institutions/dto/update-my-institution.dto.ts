import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMyInstitutionDto {
  @ApiPropertyOptional({
    description: 'Dirección física o ubicación actualizada',
    example: 'Zona Central, Calle Ayacucho #580',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @ApiPropertyOptional({
    description: 'Teléfono o celular de contacto institucional',
    example: '22145566',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;
}
