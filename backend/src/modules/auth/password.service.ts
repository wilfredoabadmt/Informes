import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  private readonly options: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: parseInt(process.env.ARGON2_MEMORY_COST || '65536', 10),
    timeCost: parseInt(process.env.ARGON2_TIME_COST || '3', 10),
    parallelism: parseInt(process.env.ARGON2_PARALLELISM || '4', 10),
  };

  /**
   * Genera un hash seguro de la contraseña usando el algoritmo Argon2id.
   *
   * @param password Contraseña en texto plano
   * @returns Hash generado compatible con verificación posterior
   */
  async hash(password: string): Promise<string> {
    return argon2.hash(password, this.options);
  }

  /**
   * Verifica si una contraseña en texto plano coincide con el hash almacenado.
   *
   * @param hash Hash almacenado en la base de datos
   * @param password Contraseña ingresada por el usuario
   * @returns true si coincide, false de lo contrario
   */
  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
}

