import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsBoolean, IsString, MaxLength } from 'class-validator';

export class EnrollStudentDto {
  @ApiProperty({
    description: 'UUID del estudiante registrado en el sistema',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  @IsNotEmpty()
  estudianteId: string;

  @ApiProperty({
    description: 'UUID de la gestión escolar activa',
    example: 'b1ffcd88-8b1a-4fe7-aa5c-5aa8ac270b22',
  })
  @IsUUID()
  @IsNotEmpty()
  gestionId: string;

  @ApiProperty({
    description: 'UUID del paralelo institucional en el que se matricula',
    example: 'c2eedf77-7a2b-4cd6-994b-4bb7ab160c33',
  })
  @IsUUID()
  @IsNotEmpty()
  paraleloId: string;

  @ApiPropertyOptional({
    description: 'Indica si el estudiante está repitiendo el grado escolar',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  esRepitente?: boolean;

  @ApiPropertyOptional({
    description: 'Observaciones administrativas de la inscripción (ej. procedencia, traspaso)',
    example: 'Traslado por cambio de domicilio familiar',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;
}
