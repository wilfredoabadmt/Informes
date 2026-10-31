import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { RolInstitucional, EstadoVinculacion } from '@prisma/client';

describe('Feature 003: Expediente Profesional y Gestión de Maestros Multi-Institucional (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superadminToken: string;
  let directorElenaToken: string;

  let colFranzTamayoId: string;
  let colMariscalSucreId: string;

  let createdTeacherId: string;
  let franzVinculacionId: string;

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

    // 1. Obtener tokens
    const resAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin@minedu.gob.bo', password: 'Bolivia2026!' });
    superadminToken = resAdmin.body.tokens.accessToken;

    const resElena = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'elena.flores@minedu.gob.bo', password: 'Bolivia2026!' });
    directorElenaToken = resElena.body.tokens.accessToken;

    const franz = await prisma.unidadEducativa.findUnique({ where: { sie: '80730045' } });
    const mariscal = await prisma.unidadEducativa.findUnique({ where: { sie: '80730046' } });
    colFranzTamayoId = franz!.id;
    colMariscalSucreId = mariscal!.id;
  });

  afterAll(async () => {
    // Limpieza de datos creados en la prueba
    if (createdTeacherId) {
      await prisma.vinculacionInstitucional.deleteMany({ where: { maestroId: createdTeacherId } });
      const maestro = await prisma.maestro.findUnique({ where: { id: createdTeacherId } });
      if (maestro) {
        await prisma.maestro.delete({ where: { id: createdTeacherId } });
        await prisma.usuario.deleteMany({ where: { personaId: maestro.personaId } });
        await prisma.persona.delete({ where: { id: maestro.personaId } });
      }
    }
    await app.close();
  });

  describe('US-001: Alta de Maestro en el Padrón Nacional (Nivel Central)', () => {
    it('debe permitir al Superadmin dar de alta a un nuevo docente con RDA único', async () => {
      const payload = {
        ci: '8899001',
        nombres: 'Raúl',
        primerApellido: 'Condori',
        segundoApellido: 'Apaza',
        email: 'raul.condori@minedu.gob.bo',
        telefono: '76543210',
        rda: 'RDA-55667',
        tituloProfesional: 'Licenciado en Ciencias Biológicas',
        especialidad: 'Biología y Geografía',
        anioEgreso: 2018,
        normalista: true,
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/teachers')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(payload)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.rda).toBe('RDA-55667');
      expect(res.body.persona.nombres).toBe('Raúl');
      expect(res.body.email).toBe('raul.condori@minedu.gob.bo');

      createdTeacherId = res.body.id;
    });

    it('debe rechazar la creación si el RDA ya está registrado (409 Conflict)', async () => {
      const payload = {
        ci: '9988776',
        nombres: 'Docente Duplicado',
        primerApellido: 'Pérez',
        email: 'otro.perez@minedu.gob.bo',
        rda: 'RDA-55667', // Mismo RDA
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/teachers')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(payload)
        .expect(409);

      expect(res.body.message).toContain('ya se encuentra registrado');
    });
  });

  describe('US-002: Búsqueda y Vinculación Multi-Institucional', () => {
    it('debe permitir a la Directora Elena buscar al nuevo maestro por RDA', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/teachers/search?q=55667')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].rda).toBe('RDA-55667');
      expect(res.body[0].nombreCompleto).toContain('Raúl Condori');
    });

    it('debe permitir vincular a Raúl en la U.E. Franz Tamayo', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/teachers/link')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          identifier: 'RDA-55667',
          rolInstitucional: RolInstitucional.MAESTRO,
          cargoOficial: 'Profesor de Biología - Secundaria',
        })
        .expect(201);

      expect(res.body).toHaveProperty('vinculacionId');
      expect(res.body.estado).toBe(EstadoVinculacion.ACTIVO);
      franzVinculacionId = res.body.vinculacionId;
    });

    it('debe permitir vincular al MISMO maestro Raúl en la U.E. Mariscal Sucre (Multi-Tenant)', async () => {
      // El Superadmin (con acceso central) opera en Mariscal Sucre
      const res = await request(app.getHttpServer())
        .post('/api/v1/teachers/link')
        .set('Authorization', `Bearer ${superadminToken}`)
        .set('X-Institution-Id', colMariscalSucreId)
        .send({
          identifier: '8899001', // Usando su CI en lugar de RDA
          rolInstitucional: RolInstitucional.MAESTRO,
          cargoOficial: 'Profesor de Geografía - Secundaria',
        })
        .expect(201);

      expect(res.body).toHaveProperty('vinculacionId');
      expect(res.body.estado).toBe(EstadoVinculacion.ACTIVO);
    });
  });

  describe('US-003: Plantilla Docente Institucional', () => {
    it('debe listar a Raúl en la nómina de Franz Tamayo', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/teachers/my-institution')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const rdas = res.body.map((t: any) => t.rda);
      expect(rdas).toContain('RDA-55667');
    });
  });

  describe('US-004: Expediente Profesional e Historial Multi-Colegio', () => {
    it('debe permitir al maestro Raúl consultar su propio expediente con ambas vinculaciones', async () => {
      // 1. Login de Raúl
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: 'raul.condori@minedu.gob.bo',
          password: 'Bolivia2026!',
        })
        .expect(200);

      const raulToken = loginRes.body.tokens.accessToken;

      // 2. Consulta de expediente personal
      const dossierRes = await request(app.getHttpServer())
        .get('/api/v1/teachers/me/dossier')
        .set('Authorization', `Bearer ${raulToken}`)
        .expect(200);

      expect(dossierRes.body.rda).toBe('RDA-55667');
      expect(dossierRes.body.especialidad).toBe('Biología y Geografía');
      expect(dossierRes.body.normalista).toBe(true);

      // Debe reflejar las 2 vinculaciones simultáneas e independientes
      expect(dossierRes.body.historialVinculaciones).toHaveLength(2);
      const sies = dossierRes.body.historialVinculaciones.map((h: any) => h.sie);
      expect(sies).toContain('80730045'); // Franz Tamayo
      expect(sies).toContain('80730046'); // Mariscal Sucre
    });
  });

  describe('US-005: Independencia Laboral de Vinculaciones', () => {
    it('debe permitir a Elena poner a Raúl en LICENCIA en Franz Tamayo sin afectar Mariscal Sucre', async () => {
      // 1. Elena actualiza estado a LICENCIA en Franz Tamayo
      await request(app.getHttpServer())
        .patch(`/api/v1/teachers/link/${franzVinculacionId}/status`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          estado: EstadoVinculacion.LICENCIA,
          motivo: 'Comisión de estudios pedagógicos',
        })
        .expect(200);

      // 2. Verificar que en la BD, la vinculación de Franz Tamayo está en LICENCIA
      const vincFranz = await prisma.vinculacionInstitucional.findUnique({
        where: { id: franzVinculacionId },
      });
      expect(vincFranz!.estado).toBe(EstadoVinculacion.LICENCIA);

      // 3. Verificar que la vinculación en Mariscal Sucre SIGUE ACTIVA
      const vincMariscal = await prisma.vinculacionInstitucional.findFirst({
        where: {
          institucionId: colMariscalSucreId,
          maestroId: createdTeacherId,
        },
      });
      expect(vincMariscal).toBeDefined();
      expect(vincMariscal!.estado).toBe(EstadoVinculacion.ACTIVO);
    });
  });
});
