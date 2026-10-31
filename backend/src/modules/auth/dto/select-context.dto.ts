import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SelectContextDto {
  @ApiProperty({
    description: 'UUID de la Unidad Educativa seleccionada para operar',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsNotEmpty({ message: 'El identificador de la institución es obligatorio.' })
  @IsUUID('4', { message: 'El identificador de la institución debe ser un UUID válido.' })
  institutionId: string;
}

