import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';

describe('PasswordService (Argon2id)', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe generar un hash Argon2id válido para una contraseña', async () => {
    const rawPassword = 'BoliviaSegura2026!';
    const hash = await service.hash(rawPassword);

    expect(hash).toBeDefined();
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('debe validar exitosamente la contraseña correcta', async () => {
    const rawPassword = 'BoliviaSegura2026!';
    const hash = await service.hash(rawPassword);

    const isValid = await service.verify(hash, rawPassword);
    expect(isValid).toBe(true);
  });

  it('debe rechazar una contraseña incorrecta', async () => {
    const rawPassword = 'BoliviaSegura2026!';
    const hash = await service.hash(rawPassword);

    const isValid = await service.verify(hash, 'PasswordErroneo!');
    expect(isValid).toBe(false);
  });
});
