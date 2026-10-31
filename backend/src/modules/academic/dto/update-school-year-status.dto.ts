import { IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoGestion } from '@prisma/client';

export class UpdateSchoolYearStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la gestión escolar',
    enum: [EstadoGestion.EN_PLANIFICACION, EstadoGestion.ABIERTA, EstadoGestion.CERRADA],
    example: EstadoGestion.CERRADA,
  })
  @IsNotEmpty({ message: 'El estado es obligatorio.' })
  @IsIn([EstadoGestion.EN_PLANIFICACION, EstadoGestion.ABIERTA, EstadoGestion.CERRADA], {
    message: 'El estado debe ser EN_PLANIFICACION, ABIERTA o CERRADA.',
  })
  estado: EstadoGestion;
}

