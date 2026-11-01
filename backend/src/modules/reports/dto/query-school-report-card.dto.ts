import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QuerySchoolReportCardDto {
  @ApiProperty({ description: 'ID de la inscripción del estudiante (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID('4', { message: 'inscripcionId debe ser un UUID v4 válido' })
  inscripcionId: string;
}
