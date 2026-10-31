import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TipoInstitucion, NivelEducativo, RolInstitucional } from '@prisma/client';

describe('Feature 002: Gestión Centralizada y Descentralizada de Unidades Educativas (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superadminToken: string;
  let teacherToken: string;
  let directorElenaToken: string;

  let colFranzTamayoId: string;
  let createdSchoolId: string;

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

    // 1. Obtener tokens de autenticación
    // Superadmin Central
    const resAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin@minedu.gob.bo', password: 'Bolivia2026!' });
    superadminToken = resAdmin.body.tokens.accessToken;

    // Maestro Carlos (sin rol central)
    const resTeacher = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'carlos.mamani@minedu.gob.bo', password: 'Bolivia2026!' });
    teacherToken = resTeacher.body.tokens.accessToken;

    // Directora Elena (vinculada a Franz Tamayo)
    const resElena = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'elena.flores@minedu.gob.bo', password: 'Bolivia2026!' });
    directorElenaToken = resElena.body.tokens.accessToken;

    const franz = await prisma.unidadEducativa.findUnique({ where: { sie: '80730045' } });
    colFranzTamayoId = franz!.id;
  });

  afterAll(async () => {
    // Limpieza de la institución de prueba si fue creada
    if (createdSchoolId) {
      await prisma.vinculacionInstitucional.deleteMany({ where: { institucionId: createdSchoolId } });
      await prisma.registroAuditoria.deleteMany({ where: { institucionId: createdSchoolId } });
      await prisma.unidadEducativa.delete({ where: { id: createdSchoolId } }).catch(() => null);
    }
    await app.close();
  });

  describe('Nivel 1: Registro Central de Unidades Educativas (US-001)', () => {
    it('debe permitir al Superadmin registrar una nueva Unidad Educativa', async () => {
      const payload = {
        sie: '80730099',
        nombre: 'Unidad Educativa Eduardo Avaroa',
        departamento: 'La Paz',
        provincia: 'Murillo',
        municipio: 'La Paz',
        distrito: 'La Paz 2',
        direccion: 'Zona San Pedro, Calle Colombia #220',
        telefono: '22498765',
        tipo: TipoInstitucion.FISCAL,
        nivel: NivelEducativo.INTEGRADO,
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/institutions')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(payload)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.sie).toBe('80730099');
      expect(res.body.nombre).toBe('Unidad Educativa Eduardo Avaroa');
      expect(res.body.activo).toBe(true);

      createdSchoolId = res.body.id;
    });

    it('debe rechazar la creación si el código SIE ya está registrado (409 Conflict)', async () => {
      const payload = {
        sie: '80730099',
        nombre: 'Colegio Duplicado',
        departamento: 'La Paz',
        provincia: 'Murillo',
        municipio: 'La Paz',
        tipo: TipoInstitucion.PRIVADA,
        nivel: NivelEducativo.SECUNDARIA,
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/institutions')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(payload)
        .expect(409);

      expect(res.body.message).toContain('ya se encuentra registrado');
    });

    it('debe bloquear con 403 a un usuario sin rol de Administración Central', async () => {
      const payload = {
        sie: '80730100',
        nombre: 'Intento No Autorizado',
        departamento: 'Cochabamba',
        provincia: 'Cercado',
        municipio: 'Cochabamba',
        tipo: TipoInstitucion.FISCAL,
        nivel: NivelEducativo.PRIMARIA,
      };

      await request(app.getHttpServer())
        .post('/api/v1/institutions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(payload)
        .expect(403);
    });
  });

  describe('Nivel 1: Consulta Central y Filtros Geográficos (US-002)', () => {
    it('debe listar todas las instituciones registradas con paginación', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/institutions?page=1&limit=10')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(3);
    });

    it('debe filtrar colegios por término de búsqueda q', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/institutions?q=Avaroa')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].sie).toBe('80730099');
    });

    it('debe obtener la ficha detallada de una institución por su ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/institutions/${colFranzTamayoId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(res.body.sie).toBe('80730045');
      expect(res.body).toHaveProperty('autoridades');
      expect(res.body.autoridades.length).toBeGreaterThan(0);
      expect(res.body.autoridades[0].rolInstitucional).toBe('DIRECTOR');
    });
  });

  describe('Nivel 1: Asignación de Autoridad Institucional (US-003)', () => {
    it('debe permitir asignar a Carlos Mamani como DIRECTOR de la nueva institución', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/institutions/${createdSchoolId}/authorities`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          identifier: '6849302', // CI de Carlos
          rolInstitucional: RolInstitucional.DIRECTOR,
          cargoOficial: 'Director Titular Interino',
        })
        .expect(201);

      expect(res.body).toHaveProperty('vinculacionId');
      expect(res.body.rolInstitucional).toBe(RolInstitucional.DIRECTOR);

      // Verificar que Carlos ahora tiene esa vinculación en la BD
      const vinc = await prisma.vinculacionInstitucional.findUnique({
        where: { id: res.body.vinculacionId },
      });
      expect(vinc).toBeDefined();
      expect(vinc!.institucionId).toBe(createdSchoolId);
      expect(vinc!.maestroId).toBeDefined(); // Se ligó automáticamente su perfil de maestro
    });
  });

  describe('Nivel 1: Suspensión y Reactivación Institucional (US-004)', () => {
    it('debe permitir suspender la institución y verificar que el TenantContextGuard bloquea accesos', async () => {
      // 1. Suspender institución
      await request(app.getHttpServer())
        .patch(`/api/v1/institutions/${createdSchoolId}/status`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({ activo: false })
        .expect(200);

      // 2. Carlos (ahora director asignado) intenta acceder a isolated-data bajo el tenant suspendido
      const blockedRes = await request(app.getHttpServer())
        .get('/api/v1/tenant-test/isolated-data')
        .set('Authorization', `Bearer ${teacherToken}`)
        .set('X-Institution-Id', createdSchoolId)
        .expect(403);

      expect(blockedRes.body.message).toContain('no existe o no se encuentra activa');

      // 3. Reactivar institución
      await request(app.getHttpServer())
        .patch(`/api/v1/institutions/${createdSchoolId}/status`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({ activo: true })
        .expect(200);

      // 4. Ahora Carlos puede ingresar exitosamente
      await request(app.getHttpServer())
        .get('/api/v1/tenant-test/isolated-data')
        .set('Authorization', `Bearer ${teacherToken}`)
        .set('X-Institution-Id', createdSchoolId)
        .expect(200);
    });
  });

  describe('Nivel 2: Edición Institucional Descentralizada (US-005)', () => {
    it('debe permitir a la Directora Elena consultar y actualizar los datos de contacto de su colegio', async () => {
      // 1. Consultar ficha propia
      const profileRes = await request(app.getHttpServer())
        .get('/api/v1/institutions/my-institution/profile')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(profileRes.body.sie).toBe('80730045');

      // 2. Actualizar dirección y teléfono
      const updateRes = await request(app.getHttpServer())
        .patch('/api/v1/institutions/my-institution')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          direccion: 'Nueva Sede Miraflores #100',
          telefono: '22998877',
        })
        .expect(200);

      expect(updateRes.body.direccion).toBe('Nueva Sede Miraflores #100');
      expect(updateRes.body.telefono).toBe('22998877');

      // 3. Verificar en BD
      const updatedInDb = await prisma.unidadEducativa.findUnique({ where: { id: colFranzTamayoId } });
      expect(updatedInDb!.direccion).toBe('Nueva Sede Miraflores #100');
      expect(updatedInDb!.telefono).toBe('22998877');
    });
  });
});

