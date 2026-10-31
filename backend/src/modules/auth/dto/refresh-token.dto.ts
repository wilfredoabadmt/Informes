import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token emitido en el login',
    example: 'd9b7f5e1-0c4a-4d6b-9c2f-1a3b5c7d9e0f...',
  })
  @IsNotEmpty({ message: 'El refresh token es obligatorio.' })
  @IsString()
  refreshToken: string;
}
