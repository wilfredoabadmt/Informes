import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateAssignmentDto {
  @ApiProperty({
    description: 'UUID de la gestión escolar activa',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  @IsNotEmpty()
  gestionId: string;

  @ApiProperty({
    description: 'UUID de la vinculación institucional del maestro en la Unidad Educativa',
    example: 'b1ffcd88-8b1a-4fe7-aa5c-5aa8ac270b22',
  })
  @IsUUID()
  @IsNotEmpty()
  vinculacionId: string;

  @ApiProperty({
    description: 'UUID del paralelo institucional asignado',
    example: 'c2eedf77-7a2b-4cd6-994b-4bb7ab160c33',
  })
  @IsUUID()
  @IsNotEmpty()
  paraleloId: string;

  @ApiProperty({
    description: 'UUID de la materia oficial del SEP asignada',
    example: 'd3ddce66-693c-4bc5-883a-3aa6ba050d44',
  })
  @IsUUID()
  @IsNotEmpty()
  materiaId: string;

  @ApiPropertyOptional({
    description: 'Carga horaria en horas pedagógicas semanales (1 a 20)',
    example: 6,
    default: 4,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  horasSemanales?: number;

  @ApiPropertyOptional({
    description: 'Indica si es el maestro titular principal de la materia en el paralelo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  esTitular?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si el maestro asume la función de Asesor de Curso / Tutor de Aula',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  esTutor?: boolean;
}
