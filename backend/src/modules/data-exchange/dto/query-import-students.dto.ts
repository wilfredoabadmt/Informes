import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryImportStudentsDto {
  @ApiProperty({ description: 'ID del paralelo escolar al que se inscribirán los estudiantes (UUID)' })
  @IsUUID('4', { message: 'paraleloId debe ser un UUID v4 válido' })
  paraleloId: string;
}
