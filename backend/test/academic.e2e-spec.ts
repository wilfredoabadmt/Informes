import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { NivelEducativo, Turno, EstadoGestion, CampoSaberes } from '@prisma/client';

describe('Feature 004: Estructura Académica Institucional (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superadminToken: string;
  let directorElenaToken: string;

  let colFranzTamayoId: string;
  let colMariscalSucreId: string;

  let cursoPrimeroSecundariaId: string;
  let gestionFranz2026Id: string;
  let gestionMariscal2026Id: string;
  let gestionFranz2027Id: string;

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
    const resAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin@minedu.gob.bo', password: 'Bolivia2026!' });
    superadminToken = resAdmin.body.tokens.accessToken;

    const resElena = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'elena.flores@minedu.gob.bo', password: 'Bolivia2026!' });
    directorElenaToken = resElena.body.tokens.accessToken;

    // 2. Obtener colegios base
    const franz = await prisma.unidadEducativa.findUnique({ where: { sie: '80730045' } });
    const mariscal = await prisma.unidadEducativa.findUnique({ where: { sie: '80730046' } });
    colFranzTamayoId = franz!.id;
    colMariscalSucreId = mariscal!.id;

    // 3. Obtener curso oficial 1º de Secundaria
    const curso = await prisma.curso.findFirst({
      where: { nivel: NivelEducativo.SECUNDARIA, grado: 1 },
    });
    cursoPrimeroSecundariaId = curso!.id;

    // Limpieza previa por si quedaron datos de ejecuciones anteriores
    await prisma.paralelo.deleteMany({
      where: {
        institucionId: { in: [colFranzTamayoId, colMariscalSucreId] },
      },
    });
    await prisma.gestionEscolar.deleteMany({
      where: {
        institucionId: { in: [colFranzTamayoId, colMariscalSucreId] },
      },
    });
  });

  afterAll(async () => {
    // Limpieza de datos creados en el test
    await prisma.paralelo.deleteMany({
      where: {
        institucionId: { in: [colFranzTamayoId, colMariscalSucreId] },
      },
    });
    await prisma.gestionEscolar.deleteMany({
      where: {
        institucionId: { in: [colFranzTamayoId, colMariscalSucreId] },
      },
    });
    await app.close();
  });

  // -------------------------------------------------------------
  // 1. CATÁLOGOS NACIONALES DEL SEP
  // -------------------------------------------------------------
  describe('Catálogo Nacional Curricular del SEP (Nivel Central)', () => {
    it('debe listar los 12 cursos oficiales del SEP ordenados', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/academic/courses')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .expect(200);

      expect(res.body).toHaveLength(12);
      expect(res.body[0].grado).toBe(1);
      expect(res.body[0].nivel).toBe(NivelEducativo.PRIMARIA);
      expect(res.body[11].grado).toBe(6);
      expect(res.body[11].nivel).toBe(NivelEducativo.SECUNDARIA);
    });

    it('debe filtrar cursos por nivel SECUNDARIA (6 grados)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/academic/courses?nivel=SECUNDARIA')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .expect(200);

      expect(res.body).toHaveLength(6);
      res.body.forEach((c: any) => {
        expect(c.nivel).toBe(NivelEducativo.SECUNDARIA);
      });
    });

    it('debe consultar materias curriculares del SEP agrupadas en campos', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/academic/subjects?nivel=SECUNDARIA&campo=CIENCIA_TECNOLOGIA_PRODUCCION')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(2);
      const nombres = res.body.map((m: any) => m.nombre);
      expect(nombres).toContain('Matemática');
      expect(nombres).toContain('Técnica Tecnológica General');
    });
  });

  // -------------------------------------------------------------
  // 2. GESTIONES ESCOLARES Y SEGURIDAD MULTI-TENANT
  // -------------------------------------------------------------
  describe('Apertura y Gestión del Ciclo Escolar Anual (Nivel 2)', () => {
    it('debe rechazar la apertura si falta el encabezado X-Institution-Id (400 Bad Request)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/academic/school-years')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .send({
          anio: 2026,
          fechaInicio: '2026-02-01',
          fechaFin: '2026-11-30',
        })
        .expect(400);
    });

    it('debe denegar si la Directora Elena intenta operar en Mariscal Sucre (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/academic/school-years')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colMariscalSucreId)
        .send({
          anio: 2026,
          fechaInicio: '2026-02-01',
          fechaFin: '2026-11-30',
        })
        .expect(403);
    });

    it('debe permitir a la Directora Elena aperturar la Gestión 2026 en Franz Tamayo', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/school-years')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          anio: 2026,
          fechaInicio: '2026-02-01',
          fechaFin: '2026-11-30',
          estado: EstadoGestion.ABIERTA,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.anio).toBe(2026);
      expect(res.body.estado).toBe(EstadoGestion.ABIERTA);
      expect(res.body.institucionId).toBe(colFranzTamayoId);

      gestionFranz2026Id = res.body.id;
    });

    it('debe rechazar la duplicidad de la gestión 2026 en Franz Tamayo (409 Conflict)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/academic/school-years')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          anio: 2026,
          fechaInicio: '2026-02-01',
        })
        .expect(409);
    });

    it('debe permitir al Superadmin aperturar la Gestión 2026 en Mariscal Sucre (Aislamiento Multi-Tenant)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/school-years')
        .set('Authorization', `Bearer ${superadminToken}`)
        .set('X-Institution-Id', colMariscalSucreId)
        .send({
          anio: 2026,
          fechaInicio: '2026-02-03',
          fechaFin: '2026-11-28',
          estado: EstadoGestion.ABIERTA,
        })
        .expect(201);

      expect(res.body.anio).toBe(2026);
      expect(res.body.institucionId).toBe(colMariscalSucreId);

      gestionMariscal2026Id = res.body.id;
    });

    it('debe listar solo las gestiones del colegio activo bajo TenantContext', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/academic/school-years')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(gestionFranz2026Id);
      expect(res.body[0].institucionId).toBe(colFranzTamayoId);
    });
  });

  // -------------------------------------------------------------
  // 3. PARALELOS Y AULAS INSTITUCIONALES
  // -------------------------------------------------------------
  describe('Creación y Gestión de Paralelos / Aulas Institucionales', () => {
    it('debe crear el paralelo 1º A Secundaria en Turno Mañana en Franz Tamayo', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/sections')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          gestionId: gestionFranz2026Id,
          cursoId: cursoPrimeroSecundariaId,
          letra: 'a', // minúscula para verificar normalización
          turno: Turno.MANANA,
          cupoMaximo: 35,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.letra).toBe('A');
      expect(res.body.turno).toBe(Turno.MANANA);
      expect(res.body.institucionId).toBe(colFranzTamayoId);
      expect(res.body.curso.nombre).toContain('1º de Secundaria');
    });

    it('debe rechazar la duplicidad del paralelo 1º A Mañana en Franz Tamayo (409 Conflict)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/academic/sections')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          gestionId: gestionFranz2026Id,
          cursoId: cursoPrimeroSecundariaId,
          letra: 'A',
          turno: Turno.MANANA,
        })
        .expect(409);
    });

    it('debe permitir crear el paralelo 1º B Secundaria en Turno Tarde en Franz Tamayo', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/sections')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          gestionId: gestionFranz2026Id,
          cursoId: cursoPrimeroSecundariaId,
          letra: 'B',
          turno: Turno.TARDE,
          cupoMaximo: 30,
        })
        .expect(201);

      expect(res.body.letra).toBe('B');
      expect(res.body.turno).toBe(Turno.TARDE);
    });

    it('debe permitir crear el paralelo 1º A Mañana en Mariscal Sucre sin colisión (Multi-Tenant)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/sections')
        .set('Authorization', `Bearer ${superadminToken}`)
        .set('X-Institution-Id', colMariscalSucreId)
        .send({
          gestionId: gestionMariscal2026Id,
          cursoId: cursoPrimeroSecundariaId,
          letra: 'A',
          turno: Turno.MANANA,
        })
        .expect(201);

      expect(res.body.institucionId).toBe(colMariscalSucreId);
      expect(res.body.letra).toBe('A');
    });
  });

  // -------------------------------------------------------------
  // 4. ÁRBOL ACADÉMICO JERÁRQUICO
  // -------------------------------------------------------------
  describe('Consulta del Árbol Académico Institucional', () => {
    it('debe retornar la estructura jerárquica con los paralelos agrupados por curso', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/academic/sections/tree?gestionId=${gestionFranz2026Id}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(12);

      const primeroSec = res.body.find(
        (c: any) => c.cursoId === cursoPrimeroSecundariaId,
      );
      expect(primeroSec).toBeDefined();
      expect(primeroSec.paralelos).toHaveLength(2);

      const letras = primeroSec.paralelos.map((p: any) => p.letra);
      expect(letras).toContain('A');
      expect(letras).toContain('B');
    });

    it('debe denegar o arrojar 404 si se consulta el árbol de una gestión de otro colegio', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/academic/sections/tree?gestionId=${gestionMariscal2026Id}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(404);
    });
  });

  // -------------------------------------------------------------
  // 5. CICLO DE VIDA Y REGLAS DE NEGOCIO (CIERRE E INMUTABILIDAD)
  // -------------------------------------------------------------
  describe('Ciclo de Vida y Reglas de Cierre de Gestión', () => {
    it('al aperturar Gestión 2027 debe cerrar automáticamente la Gestión 2026 de Franz Tamayo', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/school-years')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          anio: 2027,
          fechaInicio: '2027-02-01',
          estado: EstadoGestion.ABIERTA,
        })
        .expect(201);

      gestionFranz2027Id = res.body.id;

      // Comprobar que 2026 ahora está CERRADA
      const gestion2026 = await prisma.gestionEscolar.findUnique({
        where: { id: gestionFranz2026Id },
      });
      expect(gestion2026!.estado).toBe(EstadoGestion.CERRADA);
    });

    it('debe rechazar la creación de paralelos en la gestión 2026 ahora CERRADA (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/sections')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          gestionId: gestionFranz2026Id,
          cursoId: cursoPrimeroSecundariaId,
          letra: 'C',
          turno: Turno.MANANA,
        })
        .expect(400);

      expect(res.body.message).toContain('cerrada');
    });

    it('debe permitir cambiar el estado de una gestión manualmente mediante PATCH', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/academic/school-years/${gestionFranz2027Id}/status`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({ estado: EstadoGestion.CERRADA })
        .expect(200);

      expect(res.body.estado).toBe(EstadoGestion.CERRADA);
    });
  });
});
