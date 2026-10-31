import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico o Cédula de Identidad (CI) del usuario',
    example: 'carlos.mamani@minedu.gob.bo',
  })
  @IsNotEmpty({ message: 'El identificador (correo o CI) es obligatorio.' })
  @IsString()
  identifier: string;

  @ApiProperty({
    description: 'Contraseña en texto plano para verificar con Argon2id',
    example: 'Bolivia2026!',
  })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;
}
