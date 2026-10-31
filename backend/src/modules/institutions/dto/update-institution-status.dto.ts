import { IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInstitutionStatusDto {
  @ApiProperty({
    description: 'Estado operativo de la Unidad Educativa (true: activa, false: suspendida)',
    example: false,
  })
  @IsNotEmpty({ message: 'El estado activo es obligatorio.' })
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano.' })
  activo: boolean;
}
