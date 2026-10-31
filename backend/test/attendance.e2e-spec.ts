import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { PasswordService } from '../src/modules/auth/password.service';
import {
  NivelEducativo,
  Turno,
  EstadoGestion,
  EstadoVinculacion,
  RolInstitucional,
  EstadoInscripcion,
  EstadoAsistencia,
} from '@prisma/client';

describe('Feature 007: Control de Asistencia y Justificaciones (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superadminToken: string;
  let directorElenaToken: string;
  let maestroHugoToken: string;
  let maestroJaimeToken: string;

  let colFranzTamayoId: string;
  let colMariscalSucreId: string;

  let gestionFranzId: string;
  let cursoSecundariaId: string;
  let paralelo1AId: string;
  let paralelo1BId: string;
  let materiaMatematicaId: string;

  let teacherHugoId: string;
  let teacherJaimeId: string;
  let userHugoId: string;
  let userJaimeId: string;
  let vincHugoId: string;
  let vincJaimeId: string;
  let asigHugoId: string;

  let studentMateoId: string;
  let studentLuciaId: string;
  let studentMarioId: string;

  let personaMateoId: string;
  let personaLuciaId: string;
  let personaMarioId: string;
  let personaHugoId: string;
  let personaJaimeId: string;

  let detalleLuciaId: string;

  const testRudeMateo = '80730045202671A';
  const testRudeLucia = '80730045202672B';
  const testRudeMario = '80730045202673C';

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
    const passwordService = app.get<PasswordService>(PasswordService);
    const validPasswordHash = await passwordService.hash('Bolivia2026!');

    // 1. Obtener colegios base
    const franz = await prisma.unidadEducativa.findUnique({ where: { sie: '80730045' } });
    const mariscal = await prisma.unidadEducativa.findUnique({ where: { sie: '80730046' } });
    colFranzTamayoId = franz!.id;
    colMariscalSucreId = mariscal!.id;

    // 2. Tokens de Superadmin y Director Elena
    const resAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin@minedu.gob.bo', password: 'Bolivia2026!' });
    superadminToken = resAdmin.body.tokens.accessToken;

    const resElena = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'elena.flores@minedu.gob.bo', password: 'Bolivia2026!' });
    directorElenaToken = resElena.body.tokens.accessToken;

    // 3. Estructura Académica (Curso 1º Secundaria y Materia Matemática)
    const cursoSec = await prisma.curso.findFirst({
      where: { nivel: NivelEducativo.SECUNDARIA, grado: 1 },
    });
    cursoSecundariaId = cursoSec!.id;

    const mat = await prisma.materia.findFirst({
      where: { nivel: NivelEducativo.SECUNDARIA, codigo: 'SEC-MAT' },
    });
    materiaMatematicaId = mat!.id;

    // 4. Limpieza previa de datos de este suite
    await prisma.detalleAsistencia.deleteMany({
      where: {
        registroAsistencia: { institucionId: colFranzTamayoId },
      },
    });
    await prisma.registroAsistencia.deleteMany({
      where: { institucionId: colFranzTamayoId },
    });
    await prisma.inscripcion.deleteMany({
      where: { institucionId: colFranzTamayoId },
    });
    await prisma.asignacionAcademica.deleteMany({
      where: { institucionId: colFranzTamayoId },
    });
    await prisma.paralelo.deleteMany({
      where: { institucionId: colFranzTamayoId },
    });
    await prisma.gestionEscolar.deleteMany({
      where: { institucionId: colFranzTamayoId },
    });

    for (const rude of [testRudeMateo, testRudeLucia, testRudeMario]) {
      const e = await prisma.estudiante.findUnique({ where: { codigoRude: rude } });
      if (e) {
        await prisma.estudiante.delete({ where: { id: e.id } });
        await prisma.persona.delete({ where: { id: e.personaId } });
      }
    }

    for (const rda of ['RDA-88221', 'RDA-88222']) {
      const m = await prisma.maestro.findUnique({ where: { rda } });
      if (m) {
        await prisma.vinculacionInstitucional.deleteMany({ where: { maestroId: m.id } });
        await prisma.maestro.delete({ where: { id: m.id } });
        await prisma.usuario.deleteMany({ where: { personaId: m.personaId } });
        await prisma.persona.delete({ where: { id: m.personaId } });
      }
    }

    // 5. Crear Gestión 2026 en Franz Tamayo
    const gf = await prisma.gestionEscolar.create({
      data: {
        institucionId: colFranzTamayoId,
        anio: 2026,
        fechaInicio: new Date('2026-02-01'),
        estado: EstadoGestion.ABIERTA,
      },
    });
    gestionFranzId = gf.id;

    // 6. Crear Paralelos 1º A y 1º B
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

    const p1B = await prisma.paralelo.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        cursoId: cursoSecundariaId,
        letra: 'B',
        turno: Turno.MANANA,
        cupoMaximo: 35,
      },
    });
    paralelo1BId = p1B.id;

    // 7. Crear Docentes Hugo (1º A) y Jaime (1º B)
    const pHugo = await prisma.persona.create({
      data: {
        ci: '7788221',
        nombres: 'Hugo',
        primerApellido: 'Quispe',
        segundoApellido: 'Flores',
      },
    });
    personaHugoId = pHugo.id;

    const uHugo = await prisma.usuario.create({
      data: {
        personaId: pHugo.id,
        email: 'hugo.att@minedu.gob.bo',
        passwordHash: validPasswordHash,
      },
    });
    userHugoId = uHugo.id;

    const mHugo = await prisma.maestro.create({
      data: {
        personaId: pHugo.id,
        rda: 'RDA-88221',
        especialidad: 'Matemática y Física',
      },
    });
    teacherHugoId = mHugo.id;

    const vHugo = await prisma.vinculacionInstitucional.create({
      data: {
        institucionId: colFranzTamayoId,
        usuarioId: uHugo.id,
        maestroId: teacherHugoId,
        rolInstitucional: RolInstitucional.MAESTRO,
        estado: EstadoVinculacion.ACTIVO,
      },
    });
    vincHugoId = vHugo.id;

    const asigH = await prisma.asignacionAcademica.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        paraleloId: paralelo1AId,
        materiaId: materiaMatematicaId,
        vinculacionId: vincHugoId,
        horasSemanales: 6,
        esTitular: true,
        esTutor: true,
      },
    });
    asigHugoId = asigH.id;

    // Docente Jaime (vinculado pero solo en 1º B)
    const pJaime = await prisma.persona.create({
      data: {
        ci: '7788222',
        nombres: 'Jaime',
        primerApellido: 'Mamani',
        segundoApellido: 'Choque',
      },
    });
    personaJaimeId = pJaime.id;

    const uJaime = await prisma.usuario.create({
      data: {
        personaId: pJaime.id,
        email: 'jaime.att@minedu.gob.bo',
        passwordHash: validPasswordHash,
      },
    });
    userJaimeId = uJaime.id;

    const mJaime = await prisma.maestro.create({
      data: {
        personaId: pJaime.id,
        rda: 'RDA-88222',
        especialidad: 'Matemática',
      },
    });
    teacherJaimeId = mJaime.id;

    const vJaime = await prisma.vinculacionInstitucional.create({
      data: {
        institucionId: colFranzTamayoId,
        usuarioId: uJaime.id,
        maestroId: teacherJaimeId,
        rolInstitucional: RolInstitucional.MAESTRO,
        estado: EstadoVinculacion.ACTIVO,
      },
    });
    vincJaimeId = vJaime.id;

    await prisma.asignacionAcademica.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        paraleloId: paralelo1BId,
        materiaId: materiaMatematicaId,
        vinculacionId: vincJaimeId,
        horasSemanales: 6,
        esTitular: true,
        esTutor: false,
      },
    });

    // 8. Crear Estudiantes y Matrículas
    // Estudiante 1 (Mateo) -> en 1º A
    const pMateo = await prisma.persona.create({
      data: { ci: '7711001', nombres: 'Mateo', primerApellido: 'Arce', segundoApellido: 'Rojas' },
    });
    personaMateoId = pMateo.id;
    const estMateo = await prisma.estudiante.create({
      data: { personaId: pMateo.id, codigoRude: testRudeMateo },
    });
    studentMateoId = estMateo.id;
    await prisma.inscripcion.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        paraleloId: paralelo1AId,
        estudianteId: studentMateoId,
        estado: EstadoInscripcion.EFECTIVO,
      },
    });

    // Estudiante 2 (Lucia) -> en 1º A
    const pLucia = await prisma.persona.create({
      data: { ci: '7711002', nombres: 'Lucia', primerApellido: 'Blanco', segundoApellido: 'Salinas' },
    });
    personaLuciaId = pLucia.id;
    const estLucia = await prisma.estudiante.create({
      data: { personaId: pLucia.id, codigoRude: testRudeLucia },
    });
    studentLuciaId = estLucia.id;
    await prisma.inscripcion.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        paraleloId: paralelo1AId,
        estudianteId: studentLuciaId,
        estado: EstadoInscripcion.EFECTIVO,
      },
    });

    // Estudiante 3 (Mario) -> en 1º B
    const pMario = await prisma.persona.create({
      data: { ci: '7711003', nombres: 'Mario', primerApellido: 'Condori', segundoApellido: 'Vargas' },
    });
    personaMarioId = pMario.id;
    const estMario = await prisma.estudiante.create({
      data: { personaId: pMario.id, codigoRude: testRudeMario },
    });
    studentMarioId = estMario.id;
    await prisma.inscripcion.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        paraleloId: paralelo1BId,
        estudianteId: studentMarioId,
        estado: EstadoInscripcion.EFECTIVO,
      },
    });

    // 9. Login de los Maestros Hugo y Jaime
    const resHugo = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'hugo.att@minedu.gob.bo', password: 'Bolivia2026!' });
    maestroHugoToken = resHugo.body.tokens.accessToken;

    const resJaime = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'jaime.att@minedu.gob.bo', password: 'Bolivia2026!' });
    maestroJaimeToken = resJaime.body.tokens.accessToken;
  });

  afterAll(async () => {
    // Teardown completo de datos de prueba
    await prisma.detalleAsistencia.deleteMany({
      where: {
        registroAsistencia: { institucionId: colFranzTamayoId },
      },
    });
    await prisma.registroAsistencia.deleteMany({
      where: { institucionId: colFranzTamayoId },
    });
    await prisma.inscripcion.deleteMany({
      where: { institucionId: colFranzTamayoId },
    });
    await prisma.asignacionAcademica.deleteMany({
      where: { institucionId: colFranzTamayoId },
    });
    await prisma.paralelo.deleteMany({
      where: { institucionId: colFranzTamayoId },
    });
    await prisma.gestionEscolar.deleteMany({
      where: { institucionId: colFranzTamayoId },
    });

    for (const sId of [studentMateoId, studentLuciaId, studentMarioId]) {
      if (sId) {
        await prisma.estudiante.deleteMany({ where: { id: sId } });
      }
    }
    for (const pId of [personaMateoId, personaLuciaId, personaMarioId, personaHugoId, personaJaimeId]) {
      if (pId) {
        await prisma.persona.deleteMany({ where: { id: pId } });
      }
    }

    if (app) {
      await app.close();
    }
  });

  describe('US-001: Registro de Asistencia en Bloque', () => {
    it('debe rechazar a un maestro que intenta tomar lista en un paralelo donde no enseña (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${maestroJaimeToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          paraleloId: paralelo1AId,
          fecha: '2026-03-02',
          asistencia: [
            { estudianteId: studentMateoId, estado: EstadoAsistencia.PRESENTE },
          ],
        })
        .expect(403);
    });

    it('debe rechazar registro con fecha futura (400 Bad Request)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          paraleloId: paralelo1AId,
          fecha: '2099-12-31',
          asistencia: [
            { estudianteId: studentMateoId, estado: EstadoAsistencia.PRESENTE },
          ],
        })
        .expect(400);
    });

    it('debe rechazar si la nómina incluye un estudiante que no pertenece al paralelo (400 Bad Request)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          paraleloId: paralelo1AId,
          fecha: '2026-03-02',
          asistencia: [
            { estudianteId: studentMateoId, estado: EstadoAsistencia.PRESENTE },
            { estudianteId: studentMarioId, estado: EstadoAsistencia.PRESENTE }, // Mario está en 1º B
          ],
        })
        .expect(400);
    });

    it('Maestro Hugo registra la asistencia en bloque de 1º A para 2026-03-02 (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          paraleloId: paralelo1AId,
          asignacionId: asigHugoId,
          fecha: '2026-03-02',
          observaciones: 'Asistencia clase regular mañana',
          asistencia: [
            { estudianteId: studentMateoId, estado: EstadoAsistencia.PRESENTE },
            {
              estudianteId: studentLuciaId,
              estado: EstadoAsistencia.FALTA,
              observacion: 'No se presentó al aula',
            },
          ],
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.institucionId).toBe(colFranzTamayoId);
      expect(res.body.paraleloId).toBe(paralelo1AId);
      expect(res.body.totalEstudiantes).toBe(2);
      expect(res.body.presentes).toBe(1);
      expect(res.body.faltas).toBe(1);
      expect(res.body.licencias).toBe(0);
      expect(res.body.atrasos).toBe(0);
    });

    it('debe rechazar duplicación de asistencia para la misma fecha y materia (409 Conflict)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          paraleloId: paralelo1AId,
          asignacionId: asigHugoId,
          fecha: '2026-03-02',
          asistencia: [
            { estudianteId: studentMateoId, estado: EstadoAsistencia.PRESENTE },
            { estudianteId: studentLuciaId, estado: EstadoAsistencia.PRESENTE },
          ],
        })
        .expect(409);
    });

    it('Maestro Hugo registra una segunda fecha 2026-03-03 con ambos presentes (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          paraleloId: paralelo1AId,
          asignacionId: asigHugoId,
          fecha: '2026-03-03',
          asistencia: [
            { estudianteId: studentMateoId, estado: EstadoAsistencia.PRESENTE },
            { estudianteId: studentLuciaId, estado: EstadoAsistencia.PRESENTE },
          ],
        })
        .expect(201);

      expect(res.body.presentes).toBe(2);
      expect(res.body.faltas).toBe(0);
    });
  });

  describe('US-002: Consulta de Planilla de Asistencia por Fecha', () => {
    it('Maestro Hugo consulta la planilla del 2026-03-02 ordenada alfabéticamente (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/attendance')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .query({
          paraleloId: paralelo1AId,
          fecha: '2026-03-02',
          asignacionId: asigHugoId,
        })
        .expect(200);

      expect(res.body.paralelo.letra).toBe('A');
      expect(res.body.detalles).toHaveLength(2);

      // Mateo Arce debe ir antes que Lucia Blanco
      expect(res.body.detalles[0].nombreCompleto).toContain('Arce');
      expect(res.body.detalles[0].estado).toBe(EstadoAsistencia.PRESENTE);

      expect(res.body.detalles[1].nombreCompleto).toContain('Blanco');
      expect(res.body.detalles[1].estado).toBe(EstadoAsistencia.FALTA);

      detalleLuciaId = res.body.detalles[1].id;
    });

    it('Maestro Jaime (no asignado) intenta consultar la planilla de 1º A (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/attendance')
        .set('Authorization', `Bearer ${maestroJaimeToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .query({
          paraleloId: paralelo1AId,
          fecha: '2026-03-02',
        })
        .expect(403);
    });

    it('Consulta de fecha sin registro de asistencia debe retornar 404 Not Found', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/attendance')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .query({
          paraleloId: paralelo1AId,
          fecha: '2026-03-10',
        })
        .expect(404);
    });
  });

  describe('US-003: Justificación de Ausencias y Modificación Individual', () => {
    it('Director Elena justifica la falta de Lucia Blanco con certificado médico (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/attendance/details/${detalleLuciaId}/justify`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          estado: EstadoAsistencia.LICENCIA,
          justificado: true,
          observacion: 'Presentó certificado médico CNS por faringitis aguda',
        })
        .expect(200);

      expect(res.body.id).toBe(detalleLuciaId);
      expect(res.body.estado).toBe(EstadoAsistencia.LICENCIA);
      expect(res.body.justificado).toBe(true);
      expect(res.body.observacion).toContain('CNS');
    });

    it('debe rechazar modificación de detalle con UUID inexistente (404 Not Found)', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/attendance/details/00000000-0000-0000-0000-000000000000/justify')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          estado: EstadoAsistencia.LICENCIA,
          justificado: true,
          observacion: 'Prueba',
        })
        .expect(404);
    });
  });

  describe('US-004: Estadísticas Consolidadas de Asistencia', () => {
    it('Director Elena consulta el consolidado mensual de 1º A (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/attendance/stats')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .query({
          paraleloId: paralelo1AId,
          fechaInicio: '2026-03-01',
          fechaFin: '2026-03-31',
        })
        .expect(200);

      expect(res.body.totalSesiones).toBe(2);
      expect(res.body.estudiantes).toHaveLength(2);

      const mateoStats = res.body.estudiantes.find(
        (e: any) => e.estudianteId === studentMateoId,
      );
      expect(mateoStats.presentes).toBe(2);
      expect(mateoStats.faltas).toBe(0);
      expect(mateoStats.porcentajeAsistencia).toBe(100);

      const luciaStats = res.body.estudiantes.find(
        (e: any) => e.estudianteId === studentLuciaId,
      );
      expect(luciaStats.presentes).toBe(1);
      expect(luciaStats.licencias).toBe(1);
      expect(luciaStats.faltas).toBe(0);
      expect(luciaStats.porcentajeAsistencia).toBe(50);

      // Global: 3 asistencias de 4 sesiones-alumno = 75.0%
      expect(res.body.porcentajeGlobal).toBe(75);
    });

    it('Maestro Hugo (asignado) consulta las estadísticas de su aula (200 OK)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/attendance/stats')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .query({
          paraleloId: paralelo1AId,
          fechaInicio: '2026-03-01',
          fechaFin: '2026-03-31',
        })
        .expect(200);
    });

    it('Maestro Jaime (no asignado) no puede consultar estadísticas de 1º A (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/attendance/stats')
        .set('Authorization', `Bearer ${maestroJaimeToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .query({
          paraleloId: paralelo1AId,
          fechaInicio: '2026-03-01',
          fechaFin: '2026-03-31',
        })
        .expect(403);
    });
  });

  describe('Aislamiento Multi-Tenant (PostgreSQL RLS)', () => {
    it('Intentar consultar asistencia de Franz Tamayo con tenant header de Mariscal Sucre debe fallar (404 Not Found)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/attendance')
        .set('Authorization', `Bearer ${superadminToken}`)
        .set('X-Institution-Id', colMariscalSucreId) // Tenant ajeno
        .query({
          paraleloId: paralelo1AId,
          fecha: '2026-03-02',
        })
        .expect(404);
    });
  });
});
