import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NivelEducativo, CampoSaberes } from '@prisma/client';

export class QuerySubjectsDto {
  @ApiPropertyOptional({ enum: NivelEducativo })
  @IsOptional()
  @IsEnum(NivelEducativo)
  nivel?: NivelEducativo;

  @ApiPropertyOptional({ enum: CampoSaberes })
  @IsOptional()
  @IsEnum(CampoSaberes)
  campo?: CampoSaberes;
}
