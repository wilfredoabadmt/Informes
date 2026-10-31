import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryEvaluationsDto {
  @ApiProperty({ description: 'ID de la asignación académica', format: 'uuid' })
  @IsUUID('4', { message: 'asignacionId debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'asignacionId es obligatorio' })
  asignacionId: string;

  @ApiProperty({ description: 'ID del periodo evaluativo (trimestre)', format: 'uuid' })
  @IsUUID('4', { message: 'periodoId debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'periodoId es obligatorio' })
  periodoId: string;
}
