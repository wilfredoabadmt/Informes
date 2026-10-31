import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TipoAuditoria } from '@prisma/client';

describe('Feature 001: Autenticación e Integración Multi-Tenant con PostgreSQL RLS (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let colFranzTamayoId: string;
  let colMariscalSucreId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // Obtener los IDs de las dos instituciones creadas en el seed
    const colFranz = await prisma.unidadEducativa.findUnique({ where: { sie: '80730045' } });
    const colMariscal = await prisma.unidadEducativa.findUnique({ where: { sie: '80730046' } });

    colFranzTamayoId = colFranz!.id;
    colMariscalSucreId = colMariscal!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('US-001: Inicio de Sesión Global y Resolución Multi-Institucional', () => {
    it('debe autenticar al maestro Carlos Mamani por correo y retornar vinculaciones a ambas instituciones', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: 'carlos.mamani@minedu.gob.bo',
          password: 'Bolivia2026!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('tokens');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');

      // Comprobar identidad
      expect(response.body.user.persona.ci).toBe('6849302');
      expect(response.body.user.persona.nombres).toBe('Carlos');
      expect(response.body.user.maestro.rda).toBe('RDA-98321');

      // Comprobar multi-institucionalidad
      expect(response.body.institutions).toHaveLength(2);
      const sies = response.body.institutions.map((i: any) => i.sie);
      expect(sies).toContain('80730045');
      expect(sies).toContain('80730046');
    });

    it('debe permitir autenticar al maestro utilizando su CI como identificador', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: '6849302',
          password: 'Bolivia2026!',
        })
        .expect(200);

      expect(response.body.user.email).toBe('carlos.mamani@minedu.gob.bo');
    });

    it('debe rechazar contraseña incorrecta con 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: 'carlos.mamani@minedu.gob.bo',
          password: 'PasswordInvalido!',
        })
        .expect(401);
    });
  });

  describe('US-002: Consulta de Perfil e Identidad Única Centralizada', () => {
    it('debe retornar perfil del maestro autenticado', async () => {
      // 1. Login
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: 'carlos.mamani@minedu.gob.bo',
          password: 'Bolivia2026!',
        });
      const token = loginRes.body.tokens.accessToken;

      // 2. GET /me
      const meRes = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meRes.body.persona.ci).toBe('6849302');
      expect(meRes.body.persona.primerApellido).toBe('Mamani');
      expect(meRes.body.maestro.rda).toBe('RDA-98321');
    });
  });

  describe('US-003 & US-004: Contexto Institucional y Aislamiento Estricto', () => {
    let carlosToken: string;
    let elenaToken: string;

    beforeAll(async () => {
      // Login Carlos (vinculado a Franz Tamayo y Mariscal Sucre)
      const resCarlos = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: 'carlos.mamani@minedu.gob.bo',
          password: 'Bolivia2026!',
        });
      carlosToken = resCarlos.body.tokens.accessToken;

      // Login Elena (vinculada ÚNICAMENTE a Franz Tamayo)
      const resElena = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: 'elena.flores@minedu.gob.bo',
          password: 'Bolivia2026!',
        });
      elenaToken = resElena.body.tokens.accessToken;
    });

    it('debe permitir a Carlos operar tanto en Franz Tamayo como en Mariscal Sucre', async () => {
      // Acceso en Franz Tamayo
      const resFranz = await request(app.getHttpServer())
        .get('/api/v1/tenant-test/isolated-data')
        .set('Authorization', `Bearer ${carlosToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(resFranz.body.tenant.sie).toBe('80730045');

      // Acceso en Mariscal Sucre
      const resMariscal = await request(app.getHttpServer())
        .get('/api/v1/tenant-test/isolated-data')
        .set('Authorization', `Bearer ${carlosToken}`)
        .set('X-Institution-Id', colMariscalSucreId)
        .expect(200);

      expect(resMariscal.body.tenant.sie).toBe('80730046');
    });

    it('debe PERMITIR a Elena acceder a Franz Tamayo pero BLOQUEAR con 403 su acceso a Mariscal Sucre', async () => {
      // 1. Acceso legítimo a Franz Tamayo
      await request(app.getHttpServer())
        .get('/api/v1/tenant-test/isolated-data')
        .set('Authorization', `Bearer ${elenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      // 2. Intento de acceso ilegítimo a Mariscal Sucre
      const forbiddenRes = await request(app.getHttpServer())
        .get('/api/v1/tenant-test/isolated-data')
        .set('Authorization', `Bearer ${elenaToken}`)
        .set('X-Institution-Id', colMariscalSucreId)
        .expect(403);

      expect(forbiddenRes.body.message).toContain('no posee una vinculación activa');

      // 3. Verificar que se grabó la violación en RegistroAuditoria
      const auditLog = await prisma.registroAuditoria.findFirst({
        where: {
          tipo: TipoAuditoria.SECURITY_VIOLATION,
          institucionId: colMariscalSucreId,
        },
        orderBy: { timestamp: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog!.accion).toBe('INTENTO_ACCESO_NO_AUTORIZADO_INSTITUCION');
    });
  });

  describe('PostgreSQL Row-Level Security (RLS) - Verificación en Base de Datos', () => {
    it('debe aislar estrictamente las consultas SQL mediante RLS interactivo', async () => {
      // Consulta bajo contexto de Franz Tamayo
      const datosFranz = await prisma.withTenantContext(colFranzTamayoId, async (tx) => {
        return tx.vinculacionInstitucional.findMany();
      });

      // Todos los registros retornados deben ser exclusivamente de Franz Tamayo
      expect(datosFranz.length).toBeGreaterThan(0);
      for (const item of datosFranz) {
        expect(item.institucionId).toBe(colFranzTamayoId);
      }

      // Consulta bajo contexto de Mariscal Sucre
      const datosMariscal = await prisma.withTenantContext(colMariscalSucreId, async (tx) => {
        return tx.vinculacionInstitucional.findMany();
      });

      // Todos los registros retornados deben ser exclusivamente de Mariscal Sucre
      expect(datosMariscal.length).toBeGreaterThan(0);
      for (const item of datosMariscal) {
        expect(item.institucionId).toBe(colMariscalSucreId);
      }
    });
  });

  describe('US-005: Renovación de Tokens y Cierre de Sesión', () => {
    it('debe renovar access token con refresh token válido', async () => {
      // 1. Login
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: 'carlos.mamani@minedu.gob.bo',
          password: 'Bolivia2026!',
        });
      const refreshToken = loginRes.body.tokens.refreshToken;

      // 2. Refresh
      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshRes.body).toHaveProperty('accessToken');
      expect(refreshRes.body).toHaveProperty('refreshToken');
    });

    it('debe cerrar sesión y revocar tokens', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: 'carlos.mamani@minedu.gob.bo',
          password: 'Bolivia2026!',
        });
      const { accessToken, refreshToken } = loginRes.body.tokens;

      // Logout
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // El refresh token previo debe fallar con 401
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });
});

