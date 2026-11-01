import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import {
  NivelEducativo,
  Turno,
  EstadoGestion,
  EstadoInscripcion,
  EstadoVinculacion,
} from '@prisma/client';

describe('Feature 013: Importación y Exportación Masiva (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let directorElenaToken: string;
  let superadminToken: string;
  let colFranzTamayoId: string;
  let colMariscalSucreId: string;

  let gestionFranzId: string;
  let cursoSecundariaId: string;
  let paralelo1AId: string;

  const testRude1 = '807300459901M';
  const testRude2 = '807300459902L';
  const testRdaDoc = 'RDA-IMPORT-99';

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

    // 1. Colegios
    const franz = await prisma.unidadEducativa.findUnique({ where: { sie: '80730045' } });
    const mariscal = await prisma.unidadEducativa.findUnique({ where: { sie: '80730046' } });
    colFranzTamayoId = franz!.id;
    colMariscalSucreId = mariscal!.id;

    // 2. Curso base
    const cursoSec = await prisma.curso.findFirst({
      where: { nivel: NivelEducativo.SECUNDARIA, grado: 1 },
    });
    cursoSecundariaId = cursoSec!.id;

    // Limpieza previa
    for (const rude of [testRude1, testRude2]) {
      const e = await prisma.estudiante.findUnique({ where: { codigoRude: rude } });
      if (e) {
        await prisma.inscripcion.deleteMany({ where: { estudianteId: e.id } });
        await prisma.estudiante.delete({ where: { id: e.id } });
        await prisma.persona.delete({ where: { id: e.personaId } });
      }
    }

    const m = await prisma.maestro.findUnique({ where: { rda: testRdaDoc } });
    if (m) {
      await prisma.vinculacionInstitucional.deleteMany({ where: { maestroId: m.id } });
      await prisma.maestro.delete({ where: { id: m.id } });
      await prisma.usuario.deleteMany({ where: { personaId: m.personaId } });
      await prisma.persona.delete({ where: { id: m.personaId } });
    }

    await prisma.paralelo.deleteMany({ where: { institucionId: colFranzTamayoId } });
    await prisma.gestionEscolar.deleteMany({ where: { institucionId: colFranzTamayoId } });

    // 3. Gestión y Paralelo
    const gf = await prisma.gestionEscolar.create({
      data: {
        institucionId: colFranzTamayoId,
        anio: 2026,
        fechaInicio: new Date('2026-02-01'),
        estado: EstadoGestion.ABIERTA,
      },
    });
    gestionFranzId = gf.id;

    const p1A = await prisma.paralelo.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        cursoId: cursoSecundariaId,
        letra: 'A',
        turno: Turno.MANANA,
        cupoMaximo: 35,
      },
    });
    paralelo1AId = p1A.id;

    // 4. Logins
    const resAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin@minedu.gob.bo', password: 'Bolivia2026!' });
    superadminToken = resAdmin.body.tokens.accessToken;

    const resElena = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'elena.flores@minedu.gob.bo', password: 'Bolivia2026!' });
    directorElenaToken = resElena.body.tokens.accessToken;
  });

  afterAll(async () => {
    for (const rude of [testRude1, testRude2]) {
      const e = await prisma.estudiante.findUnique({ where: { codigoRude: rude } });
      if (e) {
        await prisma.inscripcion.deleteMany({ where: { estudianteId: e.id } });
        await prisma.estudiante.delete({ where: { id: e.id } });
        await prisma.persona.delete({ where: { id: e.personaId } });
      }
    }

    const m = await prisma.maestro.findUnique({ where: { rda: testRdaDoc } });
    if (m) {
      await prisma.vinculacionInstitucional.deleteMany({ where: { maestroId: m.id } });
      await prisma.maestro.delete({ where: { id: m.id } });
      await prisma.usuario.deleteMany({ where: { personaId: m.personaId } });
      await prisma.persona.delete({ where: { id: m.personaId } });
    }

    await prisma.paralelo.deleteMany({ where: { institucionId: colFranzTamayoId } });
    await prisma.gestionEscolar.deleteMany({ where: { institucionId: colFranzTamayoId } });

    await app.close();
  });

  describe('US-001: Importación Masiva de Estudiantes', () => {
    it('debe importar por lotes estudiantes desde un archivo CSV adjunto', async () => {
      const csvData =
        'ci,nombres,primerApellido,segundoApellido,codigoRude,genero,fechaNacimiento,nombreTutor\n' +
        `880011,Mateo,Arce,Mendoza,${testRude1},M,2012-04-10,Ramiro Arce\n` +
        `880022,Lucia,Zeballos,Perez,${testRude2},F,2012-09-15,Carmen Perez\n`;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/data-exchange/import/students?paraleloId=${paralelo1AId}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .attach('file', Buffer.from(csvData, 'utf-8'), 'estudiantes.csv')
        .expect(201);

      expect(res.body.totalFilas).toBe(2);
      expect(res.body.creados).toBe(2);
      expect(res.body.duplicados).toBe(0);
      expect(res.body.errores.length).toBe(0);

      // Verificar que se crearon en la base de datos
      const e1 = await prisma.estudiante.findUnique({ where: { codigoRude: testRude1 } });
      expect(e1).toBeDefined();

      const ins1 = await prisma.inscripcion.findFirst({
        where: { estudianteId: e1!.id, paraleloId: paralelo1AId },
      });
      expect(ins1).toBeDefined();
      expect(ins1!.estado).toBe(EstadoInscripcion.EFECTIVO);
    });

    it('debe detectar duplicados al reimportar el mismo archivo', async () => {
      const csvData =
        'ci,nombres,primerApellido,codigoRude\n' +
        `880011,Mateo,Arce,${testRude1}\n` +
        `880022,Lucia,Zeballos,${testRude2}\n`;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/data-exchange/import/students?paraleloId=${paralelo1AId}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .attach('file', Buffer.from(csvData, 'utf-8'), 'estudiantes_dup.csv')
        .expect(201);

      expect(res.body.totalFilas).toBe(2);
      expect(res.body.creados).toBe(0);
      expect(res.body.duplicados).toBe(2);
    });

    it('debe registrar error si faltan columnas obligatorias', async () => {
      const csvInvalido =
        'ci,nombres,primerApellido,codigoRude\n' +
        ',NombreSinCI,Apellido,807300000X\n';

      const res = await request(app.getHttpServer())
        .post(`/api/v1/data-exchange/import/students?paraleloId=${paralelo1AId}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .attach('file', Buffer.from(csvInvalido, 'utf-8'), 'invalido.csv')
        .expect(201);

      expect(res.body.errores.length).toBe(1);
      expect(res.body.errores[0].fila).toBe(2);
    });
  });

  describe('US-002: Importación Masiva de Docentes', () => {
    it('debe importar docentes y crear sus vinculaciones institucionales', async () => {
      const csvDocentes =
        'ci,nombres,primerApellido,email,rda,especialidad,cargo\n' +
        `771199,Marcelo,Quiroga,marcelo.import@minedu.gob.bo,${testRdaDoc},Literatura,DOCENTE\n`;

      const res = await request(app.getHttpServer())
        .post('/api/v1/data-exchange/import/teachers')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .attach('file', Buffer.from(csvDocentes, 'utf-8'), 'docentes.csv')
        .expect(201);

      expect(res.body.totalFilas).toBe(1);
      expect(res.body.creados).toBe(1);
      expect(res.body.errores.length).toBe(0);

      // Verificar en BD
      const m = await prisma.maestro.findUnique({ where: { rda: testRdaDoc } });
      expect(m).toBeDefined();

      const vinc = await prisma.vinculacionInstitucional.findFirst({
        where: { maestroId: m!.id, institucionId: colFranzTamayoId },
      });
      expect(vinc).toBeDefined();
      expect(vinc!.estado).toBe(EstadoVinculacion.ACTIVO);
    });
  });

  describe('US-003: Exportación Tabular de Nóminas', () => {
    it('debe exportar nómina de estudiantes en formato XLSX', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/data-exchange/export/students?paraleloId=${paralelo1AId}&format=xlsx`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .buffer(true)
        .parse((res, cb) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => cb(null, Buffer.concat(chunks)));
        })
        .expect(200);

      expect(res.headers['content-type']).toContain('spreadsheetml.sheet');
      expect(res.headers['content-disposition']).toContain('estudiantes_');
      expect(res.headers['content-disposition']).toContain('.xlsx');
      expect(Buffer.isBuffer(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(100);
    });

    it('debe exportar nómina de docentes en formato CSV', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/data-exchange/export/teachers?format=csv')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('docentes_');
      expect(res.headers['content-disposition']).toContain('.csv');
      const text = res.text || res.body.toString('utf-8');
      expect(text).toContain('RDA');
    });
  });

  describe('US-004: Descarga de Plantillas', () => {
    it('debe descargar la plantilla de estudiantes en CSV', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/data-exchange/templates/students?format=csv')
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      const text = res.text || res.body.toString('utf-8');
      expect(text).toContain('codigoRude');
    });

    it('debe descargar la plantilla de docentes en XLSX', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/data-exchange/templates/teachers?format=xlsx')
        .buffer(true)
        .parse((res, cb) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => cb(null, Buffer.concat(chunks)));
        })
        .expect(200);

      expect(res.headers['content-type']).toContain('spreadsheetml.sheet');
      expect(Buffer.isBuffer(res.body)).toBe(true);
    });
  });

  describe('Aislamiento Multi-Tenant y Seguridad RLS', () => {
    it('debe rechazar la importación si el paralelo pertenece a otra institución', async () => {
      const csvData = 'ci,nombres,primerApellido,codigoRude\n999,Test,Test,807300459999\n';

      await request(app.getHttpServer())
        .post(`/api/v1/data-exchange/import/students?paraleloId=${paralelo1AId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .set('X-Institution-Id', colMariscalSucreId) // Institución ajena
        .attach('file', Buffer.from(csvData, 'utf-8'), 'estudiantes.csv')
        .expect(404);
    });

    it('debe rechazar si falta el archivo en la petición multipart', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/data-exchange/import/students?paraleloId=${paralelo1AId}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(400);
    });
  });
});
