import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoPeriodo } from '@prisma/client';

export class UpdatePeriodStatusDto {
  @ApiProperty({
    description: 'Nuevo estado del periodo evaluativo',
    enum: EstadoPeriodo,
    example: EstadoPeriodo.ABIERTO,
  })
  @IsEnum(EstadoPeriodo, {
    message: `estado debe ser uno de: ${Object.values(EstadoPeriodo).join(', ')}`,
  })
  @IsNotEmpty({ message: 'estado es obligatorio' })
  estado: EstadoPeriodo;
}
