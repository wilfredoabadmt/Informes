import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryCourseRosterDto {
  @ApiProperty({ description: 'ID del paralelo escolar (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID('4', { message: 'paraleloId debe ser un UUID v4 válido' })
  paraleloId: string;
}
