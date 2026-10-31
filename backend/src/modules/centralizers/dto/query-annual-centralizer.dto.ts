import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryAnnualCentralizerDto {
  @ApiProperty({ description: 'ID del paralelo (UUID)', format: 'uuid' })
  @IsUUID('4', { message: 'paraleloId debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'paraleloId es obligatorio' })
  paraleloId: string;
}
