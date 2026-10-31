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
  TipoPeriodo,
  EstadoPeriodo,
  DimensionEvaluacion,
} from '@prisma/client';

describe('Feature 009: Registro de Calificaciones Cuantitativas y Cualitativas (E2E)', () => {
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

  let primerTrimestreId: string;
  let evalSaberId: string;
  let evalHacerId: string;
  let evalSerId: string;
  let evalDecidirId: string;
  let evalAutoId: string;

  let califLuciaSaberId: string;

  const testRdaHugo = 'RDA-66551';
  const testRdaJaime = 'RDA-66552';
  const testRudeMateo = '80730045202691M';
  const testRudeLucia = '80730045202692L';
  const testRudeMario = '80730045202693X';

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

    // 1. Colegios base
    const franz = await prisma.unidadEducativa.findUnique({ where: { sie: '80730045' } });
    const mariscal = await prisma.unidadEducativa.findUnique({ where: { sie: '80730046' } });
    colFranzTamayoId = franz!.id;
    colMariscalSucreId = mariscal!.id;

    // 2. Tokens
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

    // 4. Limpieza previa de este suite
    await prisma.calificacion.deleteMany({
      where: { institucionId: colFranzTamayoId },
    });
    await prisma.evaluacion.deleteMany({
      where: { institucionId: colFranzTamayoId },
    });
    await prisma.periodoEvaluacion.deleteMany({
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

    for (const rda of [testRdaHugo, testRdaJaime]) {
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

    // 7. Docentes Hugo (1º A) y Jaime (1º B)
    const pHugo = await prisma.persona.create({
      data: { ci: '6655441', nombres: 'Hugo', primerApellido: 'Alvarez', segundoApellido: 'Flores' },
    });
    personaHugoId = pHugo.id;
    const uHugo = await prisma.usuario.create({
      data: { personaId: pHugo.id, email: 'hugo.grades@minedu.gob.bo', passwordHash: validPasswordHash },
    });
    userHugoId = uHugo.id;
    const mHugo = await prisma.maestro.create({
      data: { personaId: pHugo.id, rda: testRdaHugo, especialidad: 'Matemática' },
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
      },
    });
    asigHugoId = asigH.id;

    const pJaime = await prisma.persona.create({
      data: { ci: '6655442', nombres: 'Jaime', primerApellido: 'Condori', segundoApellido: 'Choque' },
    });
    personaJaimeId = pJaime.id;
    const uJaime = await prisma.usuario.create({
      data: { personaId: pJaime.id, email: 'jaime.grades@minedu.gob.bo', passwordHash: validPasswordHash },
    });
    userJaimeId = uJaime.id;
    const mJaime = await prisma.maestro.create({
      data: { personaId: pJaime.id, rda: testRdaJaime, especialidad: 'Matemática' },
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
      },
    });

    // 8. Estudiantes (Mateo & Lucia en 1º A, Mario en 1º B)
    const pMateo = await prisma.persona.create({
      data: { ci: '4433221', nombres: 'Mateo', primerApellido: 'Arce', segundoApellido: 'Rojas' },
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

    const pLucia = await prisma.persona.create({
      data: { ci: '4433222', nombres: 'Lucia', primerApellido: 'Blanco', segundoApellido: 'Salinas' },
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

    const pMario = await prisma.persona.create({
      data: { ci: '4433223', nombres: 'Mario', primerApellido: 'Condori', segundoApellido: 'Vargas' },
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

    // 9. Trimestre 1 en estado ABIERTO
    const trim1 = await prisma.periodoEvaluacion.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        periodo: TipoPeriodo.PRIMER_TRIMESTRE,
        fechaInicio: new Date('2026-02-02'),
        fechaFin: new Date('2026-05-08'),
        fechaLimiteNotas: new Date('2026-05-15'),
        estado: EstadoPeriodo.ABIERTO,
      },
    });
    primerTrimestreId = trim1.id;

    // 10. Instrumentos de Evaluación en las 5 Dimensiones para Hugo
    const evSaber = await prisma.evaluacion.create({
      data: {
        institucionId: colFranzTamayoId,
        asignacionId: asigHugoId,
        periodoId: primerTrimestreId,
        dimension: DimensionEvaluacion.SABER,
        nombre: 'Examen de Álgebra',
        puntajeMaximo: 35,
        fechaEvaluacion: new Date('2026-03-20'),
      },
    });
    evalSaberId = evSaber.id;

    const evHacer = await prisma.evaluacion.create({
      data: {
        institucionId: colFranzTamayoId,
        asignacionId: asigHugoId,
        periodoId: primerTrimestreId,
        dimension: DimensionEvaluacion.HACER,
        nombre: 'Cuaderno de Prácticas',
        puntajeMaximo: 35,
        fechaEvaluacion: new Date('2026-04-10'),
      },
    });
    evalHacerId = evHacer.id;

    const evSer = await prisma.evaluacion.create({
      data: {
        institucionId: colFranzTamayoId,
        asignacionId: asigHugoId,
        periodoId: primerTrimestreId,
        dimension: DimensionEvaluacion.SER,
        nombre: 'Valores y Puntualidad',
        puntajeMaximo: 10,
        fechaEvaluacion: new Date('2026-04-20'),
      },
    });
    evalSerId = evSer.id;

    const evDecidir = await prisma.evaluacion.create({
      data: {
        institucionId: colFranzTamayoId,
        asignacionId: asigHugoId,
        periodoId: primerTrimestreId,
        dimension: DimensionEvaluacion.DECIDIR,
        nombre: 'Liderazgo y Participación',
        puntajeMaximo: 10,
        fechaEvaluacion: new Date('2026-04-25'),
      },
    });
    evalDecidirId = evDecidir.id;

    const evAuto = await prisma.evaluacion.create({
      data: {
        institucionId: colFranzTamayoId,
        asignacionId: asigHugoId,
        periodoId: primerTrimestreId,
        dimension: DimensionEvaluacion.AUTOEVALUACION,
        nombre: 'Autoevaluación del Educando',
        puntajeMaximo: 10,
        fechaEvaluacion: new Date('2026-04-30'),
      },
    });
    evalAutoId = evAuto.id;

    // 11. Logins
    const resH = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'hugo.grades@minedu.gob.bo', password: 'Bolivia2026!' });
    maestroHugoToken = resH.body.tokens.accessToken;

    const resJ = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'jaime.grades@minedu.gob.bo', password: 'Bolivia2026!' });
    maestroJaimeToken = resJ.body.tokens.accessToken;
  });

  afterAll(async () => {
    // Limpieza completa
    await prisma.calificacion.deleteMany({
      where: { institucionId: colFranzTamayoId },
    });
    await prisma.evaluacion.deleteMany({
      where: { institucionId: colFranzTamayoId },
    });
    await prisma.periodoEvaluacion.deleteMany({
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
        await prisma.maestro.deleteMany({ where: { personaId: pId } });
        await prisma.usuario.deleteMany({ where: { personaId: pId } });
        await prisma.persona.deleteMany({ where: { id: pId } });
      }
    }

    if (app) {
      await app.close();
    }
  });

  describe('US-001: Asentamiento de Calificaciones en Bloque por Evaluación', () => {
    it('Maestro Jaime (no asignado a 1º A) intenta asentar notas en 1º A (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/grades/batch')
        .set('Authorization', `Bearer ${maestroJaimeToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          evaluacionId: evalSaberId,
          calificaciones: [{ estudianteId: studentMateoId, nota: 25 }],
        })
        .expect(403);
    });

    it('debe rechazar nota superior al puntaje máximo del instrumento (400 Bad Request)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/grades/batch')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          evaluacionId: evalSaberId,
          calificaciones: [{ estudianteId: studentMateoId, nota: 40 }], // Máx es 35
        })
        .expect(400);
    });

    it('debe rechazar si la nómina incluye a un estudiante de otro paralelo (400 Bad Request)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/grades/batch')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          evaluacionId: evalSaberId,
          calificaciones: [
            { estudianteId: studentMateoId, nota: 30 },
            { estudianteId: studentMarioId, nota: 25 }, // Mario está en 1º B
          ],
        })
        .expect(400);
    });

    it('Maestro Hugo asienta notas en SABER para Mateo (30) y Lucia (15) (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/grades/batch')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          evaluacionId: evalSaberId,
          calificaciones: [
            { estudianteId: studentMateoId, nota: 30, observacion: 'Excelente razonamiento' },
            { estudianteId: studentLuciaId, nota: 15, observacion: 'Dificultades en ecuaciones' },
          ],
        })
        .expect(201);

      expect(res.body.evaluacionId).toBe(evalSaberId);
      expect(res.body.totalCalificados).toBe(2);
      expect(res.body.promedioGrupo).toBe(22.5);
    });

    it('debe consultar la planilla de notas de la evaluación SABER (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/grades/evaluations/${evalSaberId}`)
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(res.body.evaluacion.nombre).toBe('Examen de Álgebra');
      expect(res.body.calificaciones).toHaveLength(2);

      // Mateo Arce antes que Lucia Blanco
      expect(res.body.calificaciones[0].nombreCompleto).toContain('Arce');
      expect(res.body.calificaciones[0].nota).toBe(30);

      expect(res.body.calificaciones[1].nombreCompleto).toContain('Blanco');
      expect(res.body.calificaciones[1].nota).toBe(15);

      califLuciaSaberId = res.body.calificaciones[1].id;
    });

    it('Maestro Hugo asienta notas en las demás dimensiones (HACER, SER, DECIDIR, AUTO) (201 Created)', async () => {
      // HACER (máx 35): Mateo 30, Lucia 15
      await request(app.getHttpServer())
        .post('/api/v1/grades/batch')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          evaluacionId: evalHacerId,
          calificaciones: [
            { estudianteId: studentMateoId, nota: 30 },
            { estudianteId: studentLuciaId, nota: 15 },
          ],
        })
        .expect(201);

      // SER (máx 10): Mateo 10, Lucia 8
      await request(app.getHttpServer())
        .post('/api/v1/grades/batch')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          evaluacionId: evalSerId,
          calificaciones: [
            { estudianteId: studentMateoId, nota: 10 },
            { estudianteId: studentLuciaId, nota: 8 },
          ],
        })
        .expect(201);

      // DECIDIR (máx 10): Mateo 10, Lucia 7
      await request(app.getHttpServer())
        .post('/api/v1/grades/batch')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          evaluacionId: evalDecidirId,
          calificaciones: [
            { estudianteId: studentMateoId, nota: 10 },
            { estudianteId: studentLuciaId, nota: 7 },
          ],
        })
        .expect(201);

      // AUTOEVALUACION (máx 10): Mateo 9, Lucia 5
      await request(app.getHttpServer())
        .post('/api/v1/grades/batch')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          evaluacionId: evalAutoId,
          calificaciones: [
            { estudianteId: studentMateoId, nota: 9 },
            { estudianteId: studentLuciaId, nota: 5 },
          ],
        })
        .expect(201);
    });
  });

  describe('US-002: Planilla Trimestral Consolidada de Aula', () => {
    it('Maestro Hugo consulta la planilla consolidada trimestral (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/grades/sheet')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .query({
          asignacionId: asigHugoId,
          periodoId: primerTrimestreId,
        })
        .expect(200);

      expect(res.body.materia).toBe('Matemática');
      expect(res.body.estudiantes).toHaveLength(2);

      // Mateo: 30(SABER) + 30(HACER) + 10(SER) + 10(DECIDIR) + 9(AUTO) = 89 -> APROBADO
      const mateo = res.body.estudiantes.find((e: any) => e.estudianteId === studentMateoId);
      expect(mateo.subtotalSaber).toBe(30);
      expect(mateo.subtotalHacer).toBe(30);
      expect(mateo.subtotalSer).toBe(10);
      expect(mateo.subtotalDecidir).toBe(10);
      expect(mateo.subtotalAutoevaluacion).toBe(9);
      expect(mateo.notaFinal).toBe(89);
      expect(mateo.estadoAprobacion).toBe('APROBADO');

      // Lucia: 15(SABER) + 15(HACER) + 8(SER) + 7(DECIDIR) + 5(AUTO) = 50 -> EN_DESARROLLO (< 51)
      const lucia = res.body.estudiantes.find((e: any) => e.estudianteId === studentLuciaId);
      expect(lucia.notaFinal).toBe(50);
      expect(lucia.estadoAprobacion).toBe('EN_DESARROLLO');
    });
  });

  describe('US-003: Rectificación Individual de Nota y Congelamiento Post-Cierre', () => {
    it('Maestro Hugo rectifica la nota de Lucia en SABER de 15 a 18 (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/grades/${califLuciaSaberId}`)
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          nota: 18,
          observacion: 'Recalificación tras presentación de cuaderno corregido',
          motivoRectificacion: 'Revisión en comisión pedagógica',
        })
        .expect(200);

      expect(res.body.id).toBe(califLuciaSaberId);
      expect(res.body.nota).toBe(18);
    });

    it('la planilla consolidada debe reflejar la nota actualizada de Lucia (53 -> APROBADO)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/grades/sheet')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .query({
          asignacionId: asigHugoId,
          periodoId: primerTrimestreId,
        })
        .expect(200);

      // Ahora Lucia tiene: 18(SABER) + 15(HACER) + 8(SER) + 7(DECIDIR) + 5(AUTO) = 53 -> APROBADO
      const lucia = res.body.estudiantes.find((e: any) => e.estudianteId === studentLuciaId);
      expect(lucia.subtotalSaber).toBe(18);
      expect(lucia.notaFinal).toBe(53);
      expect(lucia.estadoAprobacion).toBe('APROBADO');
    });

    it('Directora Elena cierra formalmente el 1er Trimestre (200 OK)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/evaluation-periods/${primerTrimestreId}/status`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({ estado: EstadoPeriodo.CERRADO })
        .expect(200);
    });

    it('debe rechazar cualquier intento de modificar notas en el trimestre cerrado (400 Bad Request)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/grades/${califLuciaSaberId}`)
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          nota: 20,
          motivoRectificacion: 'Intento extemporáneo',
        })
        .expect(400);
    });

    it('debe rechazar asentar nuevas calificaciones en el trimestre cerrado (400 Bad Request)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/grades/batch')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          evaluacionId: evalSaberId,
          calificaciones: [{ estudianteId: studentMateoId, nota: 32 }],
        })
        .expect(400);
    });
  });

  describe('Aislamiento Multi-Tenant (PostgreSQL RLS)', () => {
    it('Consultar la planilla consolidada de Franz Tamayo con tenant header de Mariscal Sucre debe fallar (404 Not Found)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/grades/sheet')
        .set('Authorization', `Bearer ${superadminToken}`)
        .set('X-Institution-Id', colMariscalSucreId) // Tenant ajeno
        .query({
          asignacionId: asigHugoId,
          periodoId: primerTrimestreId,
        })
        .expect(404);
    });
  });
});

