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

describe('Feature 010: Centralizadores de Calificaciones y Promedios Anuales (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superadminToken: string;
  let directorElenaToken: string;
  let maestroHugoToken: string;

  let colFranzTamayoId: string;
  let colMariscalSucreId: string;

  let gestionFranzId: string;
  let cursoSecundariaId: string;
  let paralelo1AId: string;
  let paralelo1BId: string;
  let materiaMatematicaId: string;

  let asigHugoId: string;

  let studentMateoId: string;
  let studentLuciaId: string;

  let evalSaber1TId: string;
  let evalHacer1TId: string;
  let evalSaber2TId: string;
  let evalHacer2TId: string;
  let evalSaber3TId: string;
  let evalHacer3TId: string;

  const testRdaHugo = 'RDA-77551';
  const testRdaJaime = 'RDA-77552';
  const testRudeMateo = '80730045202701M';
  const testRudeLucia = '80730045202702L';

  let personaHugoId: string;
  let personaJaimeId: string;
  let personaMateoId: string;
  let personaLuciaId: string;

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

    // 2. Estructura Académica base
    const cursoSec = await prisma.curso.findFirst({
      where: { nivel: NivelEducativo.SECUNDARIA, grado: 1 },
    });
    cursoSecundariaId = cursoSec!.id;

    const mat = await prisma.materia.findFirst({
      where: { nivel: NivelEducativo.SECUNDARIA, codigo: 'SEC-MAT' },
    });
    materiaMatematicaId = mat!.id;

    // 3. Limpieza previa del suite sobre la institución bajo prueba
    await prisma.calificacion.deleteMany({ where: { institucionId: colFranzTamayoId } });
    await prisma.evaluacion.deleteMany({ where: { institucionId: colFranzTamayoId } });
    await prisma.periodoEvaluacion.deleteMany({ where: { institucionId: colFranzTamayoId } });
    await prisma.inscripcion.deleteMany({ where: { institucionId: colFranzTamayoId } });
    await prisma.asignacionAcademica.deleteMany({ where: { institucionId: colFranzTamayoId } });
    await prisma.paralelo.deleteMany({ where: { institucionId: colFranzTamayoId } });
    await prisma.gestionEscolar.deleteMany({ where: { institucionId: colFranzTamayoId } });

    for (const rude of [testRudeMateo, testRudeLucia]) {
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

    // 4. Gestión 2026 y Paralelos 1º A / 1º B
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

    // 5. Maestro Hugo (1º A Matemática) y Maestro Jaime (1º B Matemática)
    const pHugo = await prisma.persona.create({
      data: { ci: '7755441', nombres: 'Hugo', primerApellido: 'Alvarez', segundoApellido: 'Flores' },
    });
    personaHugoId = pHugo.id;
    const uHugo = await prisma.usuario.create({
      data: {
        personaId: pHugo.id,
        email: 'hugo.centralizers@minedu.gob.bo',
        passwordHash: validPasswordHash,
      },
    });
    const mHugo = await prisma.maestro.create({
      data: { personaId: pHugo.id, rda: testRdaHugo, especialidad: 'Matemática' },
    });
    const vHugo = await prisma.vinculacionInstitucional.create({
      data: {
        institucionId: colFranzTamayoId,
        usuarioId: uHugo.id,
        maestroId: mHugo.id,
        rolInstitucional: RolInstitucional.MAESTRO,
        estado: EstadoVinculacion.ACTIVO,
      },
    });
    const asigH = await prisma.asignacionAcademica.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        paraleloId: paralelo1AId,
        materiaId: materiaMatematicaId,
        vinculacionId: vHugo.id,
        horasSemanales: 6,
        esTitular: true,
      },
    });
    asigHugoId = asigH.id;

    const pJaime = await prisma.persona.create({
      data: { ci: '7755442', nombres: 'Jaime', primerApellido: 'Condori', segundoApellido: 'Choque' },
    });
    personaJaimeId = pJaime.id;
    const uJaime = await prisma.usuario.create({
      data: {
        personaId: pJaime.id,
        email: 'jaime.centralizers@minedu.gob.bo',
        passwordHash: validPasswordHash,
      },
    });
    const mJaime = await prisma.maestro.create({
      data: { personaId: pJaime.id, rda: testRdaJaime, especialidad: 'Matemática' },
    });
    const vJaime = await prisma.vinculacionInstitucional.create({
      data: {
        institucionId: colFranzTamayoId,
        usuarioId: uJaime.id,
        maestroId: mJaime.id,
        rolInstitucional: RolInstitucional.MAESTRO,
        estado: EstadoVinculacion.ACTIVO,
      },
    });
    await prisma.asignacionAcademica.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        paraleloId: paralelo1BId,
        materiaId: materiaMatematicaId,
        vinculacionId: vJaime.id,
        horasSemanales: 6,
        esTitular: true,
      },
    });

    // 6. Estudiantes con matrícula EFECTIVO en 1º A
    const pMateo = await prisma.persona.create({
      data: { ci: '6644331', nombres: 'Mateo', primerApellido: 'Arce', segundoApellido: 'Rojas' },
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
      data: { ci: '6644332', nombres: 'Lucia', primerApellido: 'Blanco', segundoApellido: 'Salinas' },
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

    // 7. Tres trimestres ABIERTO
    for (const [periodo, fechaInicio, fechaFin] of [
      [TipoPeriodo.PRIMER_TRIMESTRE, '2026-02-02', '2026-05-08'],
      [TipoPeriodo.SEGUNDO_TRIMESTRE, '2026-05-11', '2026-08-14'],
      [TipoPeriodo.TERCER_TRIMESTRE, '2026-08-17', '2026-11-20'],
    ] as const) {
      await prisma.periodoEvaluacion.create({
        data: {
          institucionId: colFranzTamayoId,
          gestionId: gestionFranzId,
          periodo,
          fechaInicio: new Date(fechaInicio),
          fechaFin: new Date(fechaFin),
          fechaLimiteNotas: new Date(fechaFin),
          estado: EstadoPeriodo.ABIERTO,
        },
      });
    }

    // 8. Instrumentos de evaluación por trimestre (SABER + HACER, máx 35 c/u)
    const periodos = await prisma.periodoEvaluacion.findMany({
      where: { gestionId: gestionFranzId },
    });
    const periodoPorTipo = new Map(periodos.map((p) => [p.periodo, p.id]));

    const crearEval = async (periodo: TipoPeriodo, dimension: DimensionEvaluacion, nombre: string) =>
      (
        await prisma.evaluacion.create({
          data: {
            institucionId: colFranzTamayoId,
            asignacionId: asigHugoId,
            periodoId: periodoPorTipo.get(periodo)!,
            dimension,
            nombre,
            puntajeMaximo: 35,
            fechaEvaluacion: new Date('2026-04-10'),
          },
        })
      ).id;

    evalSaber1TId = await crearEval(TipoPeriodo.PRIMER_TRIMESTRE, DimensionEvaluacion.SABER, 'Examen 1T SABER');
    evalHacer1TId = await crearEval(TipoPeriodo.PRIMER_TRIMESTRE, DimensionEvaluacion.HACER, 'Prácticas 1T HACER');
    evalSaber2TId = await crearEval(TipoPeriodo.SEGUNDO_TRIMESTRE, DimensionEvaluacion.SABER, 'Examen 2T SABER');
    evalHacer2TId = await crearEval(TipoPeriodo.SEGUNDO_TRIMESTRE, DimensionEvaluacion.HACER, 'Prácticas 2T HACER');
    evalSaber3TId = await crearEval(TipoPeriodo.TERCER_TRIMESTRE, DimensionEvaluacion.SABER, 'Examen 3T SABER');
    evalHacer3TId = await crearEval(TipoPeriodo.TERCER_TRIMESTRE, DimensionEvaluacion.HACER, 'Prácticas 3T HACER');

    // 9. Logins
    const resAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin@minedu.gob.bo', password: 'Bolivia2026!' });
    superadminToken = resAdmin.body.tokens.accessToken;

    const resElena = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'elena.flores@minedu.gob.bo', password: 'Bolivia2026!' });
    directorElenaToken = resElena.body.tokens.accessToken;

    const resHugo = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'hugo.centralizers@minedu.gob.bo', password: 'Bolivia2026!' });
    maestroHugoToken = resHugo.body.tokens.accessToken;
  });

  afterAll(async () => {
    // Limpieza completa
    await prisma.calificacion.deleteMany({ where: { institucionId: colFranzTamayoId } });
    await prisma.evaluacion.deleteMany({ where: { institucionId: colFranzTamayoId } });
    await prisma.periodoEvaluacion.deleteMany({ where: { institucionId: colFranzTamayoId } });
    await prisma.inscripcion.deleteMany({ where: { institucionId: colFranzTamayoId } });
    await prisma.asignacionAcademica.deleteMany({ where: { institucionId: colFranzTamayoId } });
    await prisma.paralelo.deleteMany({ where: { institucionId: colFranzTamayoId } });
    await prisma.gestionEscolar.deleteMany({ where: { institucionId: colFranzTamayoId } });

    for (const sId of [studentMateoId, studentLuciaId]) {
      if (sId) {
        await prisma.estudiante.deleteMany({ where: { id: sId } });
      }
    }
    for (const pId of [personaMateoId, personaLuciaId, personaHugoId, personaJaimeId]) {
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

  const registrarCalificaciones = (
    evaluacionId: string,
    notas: { estudianteId: string; nota: number }[],
  ) =>
    request(app.getHttpServer())
      .post('/api/v1/grades/batch')
      .set('Authorization', `Bearer ${maestroHugoToken}`)
      .set('X-Institution-Id', colFranzTamayoId)
      .send({ evaluacionId, calificaciones: notas });

  describe('Preparación: Asentamiento de calificaciones en los 3 trimestres (API de Calificaciones)', () => {
    it('1er Trimestre: Mateo 30+25=55, Lucia 20+18=38 (201 Created)', async () => {
      await registrarCalificaciones(evalSaber1TId, [
        { estudianteId: studentMateoId, nota: 30 },
        { estudianteId: studentLuciaId, nota: 20 },
      ]).expect(201);
      await registrarCalificaciones(evalHacer1TId, [
        { estudianteId: studentMateoId, nota: 25 },
        { estudianteId: studentLuciaId, nota: 18 },
      ]).expect(201);
    });

    it('2do Trimestre: Mateo 30+26=56, Lucia 20+20=40 (201 Created)', async () => {
      await registrarCalificaciones(evalSaber2TId, [
        { estudianteId: studentMateoId, nota: 30 },
        { estudianteId: studentLuciaId, nota: 20 },
      ]).expect(201);
      await registrarCalificaciones(evalHacer2TId, [
        { estudianteId: studentMateoId, nota: 26 },
        { estudianteId: studentLuciaId, nota: 20 },
      ]).expect(201);
    });

    it('3er Trimestre: Mateo 29+27=56, Lucia 21+18=39 (201 Created)', async () => {
      await registrarCalificaciones(evalSaber3TId, [
        { estudianteId: studentMateoId, nota: 29 },
        { estudianteId: studentLuciaId, nota: 21 },
      ]).expect(201);
      await registrarCalificaciones(evalHacer3TId, [
        { estudianteId: studentMateoId, nota: 27 },
        { estudianteId: studentLuciaId, nota: 18 },
      ]).expect(201);
    });
  });

  describe('US-CEN-01: Centralizador Trimestral de Paralelo', () => {
    it('Directora consulta el centralizador del 1er Trimestre de 1º A (200 OK)', async () => {
      const trim1 = await prisma.periodoEvaluacion.findFirst({
        where: { gestionId: gestionFranzId, periodo: TipoPeriodo.PRIMER_TRIMESTRE },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/centralizers/trimester')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .query({ paraleloId: paralelo1AId, periodoId: trim1!.id })
        .expect(200);

      expect(res.body.paraleloId).toBe(paralelo1AId);
      expect(res.body.curso).toBe('1º de Secundaria Comunitaria Productiva');
      expect(res.body.trimestre).toBe('1er Trimestre');
      expect(res.body.materias).toHaveLength(1);
      expect(res.body.materias[0].codigo).toBe('SEC-MAT');
      expect(res.body.estudiantes).toHaveLength(2);

      // Mateo Arce antes que Lucia Blanco (orden por apellidos)
      expect(res.body.estudiantes[0].nombreCompleto).toContain('Arce');
      expect(res.body.estudiantes[0].calificaciones[0].nota).toBe(55);
      expect(res.body.estudiantes[0].calificaciones[0].estado).toBe('APROBADO');
      expect(res.body.estudiantes[0].promedioTrimestral).toBe(55);

      expect(res.body.estudiantes[1].nombreCompleto).toContain('Blanco');
      expect(res.body.estudiantes[1].calificaciones[0].nota).toBe(38);
      expect(res.body.estudiantes[1].calificaciones[0].estado).toBe('REPROBADO');
      expect(res.body.estudiantes[1].promedioTrimestral).toBe(38);

      expect(res.body.estadisticas.totalEstudiantes).toBe(2);
      expect(res.body.estadisticas.aprobadosEnTodo).toBe(1);
      expect(res.body.estadisticas.conReprobadas).toBe(1);
      expect(res.body.estadisticas.promedioGeneralAula).toBe(46.5);
    });

    it('Maestro Hugo consulta el centralizador trimestral de su paralelo asignado (200 OK)', async () => {
      const trim2 = await prisma.periodoEvaluacion.findFirst({
        where: { gestionId: gestionFranzId, periodo: TipoPeriodo.SEGUNDO_TRIMESTRE },
      });

      await request(app.getHttpServer())
        .get('/api/v1/centralizers/trimester')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .query({ paraleloId: paralelo1AId, periodoId: trim2!.id })
        .expect(200);
    });

    it('Maestro Hugo (sin asignación en 1º B) obtiene 403 Forbidden al consultar 1º B', async () => {
      const trim1 = await prisma.periodoEvaluacion.findFirst({
        where: { gestionId: gestionFranzId, periodo: TipoPeriodo.PRIMER_TRIMESTRE },
      });

      await request(app.getHttpServer())
        .get('/api/v1/centralizers/trimester')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .query({ paraleloId: paralelo1BId, periodoId: trim1!.id })
        .expect(403);
    });

    it('Paralelo inexistente devuelve 404 Not Found', async () => {
      const trim1 = await prisma.periodoEvaluacion.findFirst({
        where: { gestionId: gestionFranzId, periodo: TipoPeriodo.PRIMER_TRIMESTRE },
      });

      await request(app.getHttpServer())
        .get('/api/v1/centralizers/trimester')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .query({ paraleloId: '00000000-0000-4000-8000-000000000000', periodoId: trim1!.id })
        .expect(404);
    });
  });

  describe('US-CEN-02: Centralizador Anual de Gestión (Vista Tentativa)', () => {
    it('Directora consulta el centralizador anual con promedios y situación tentativa (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/centralizers/annual')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .query({ paraleloId: paralelo1AId })
        .expect(200);

      expect(res.body.gestion).toBe(2026);
      expect(res.body.materias).toHaveLength(1);
      expect(res.body.estudiantes).toHaveLength(2);

      const mateo = res.body.estudiantes.find((e: any) => e.estudianteId === studentMateoId);
      expect(mateo.materias[0].nota1T).toBe(55);
      expect(mateo.materias[0].nota2T).toBe(56);
      expect(mateo.materias[0].nota3T).toBe(56);
      expect(mateo.materias[0].promedioAnual).toBe(56); // round((55+56+56)/3)
      expect(mateo.materias[0].estado).toBe('APROBADO');
      expect(mateo.promedioGeneralAnual).toBe(56);
      expect(mateo.situacionFinal).toBe('PROMOVIDO');

      const lucia = res.body.estudiantes.find((e: any) => e.estudianteId === studentLuciaId);
      expect(lucia.materias[0].nota1T).toBe(38);
      expect(lucia.materias[0].nota2T).toBe(40);
      expect(lucia.materias[0].nota3T).toBe(39);
      expect(lucia.materias[0].promedioAnual).toBe(39); // round((38+40+39)/3)
      expect(lucia.materias[0].estado).toBe('REPROBADO');
      expect(lucia.promedioGeneralAnual).toBe(39);
      expect(lucia.situacionFinal).toBe('RETENIDO');

      expect(res.body.estadisticas).toEqual({
        totalEstudiantes: 2,
        promovidos: 1,
        retenidos: 1,
        promedioGeneralGestion: 47.5, // (56+39)/2
      });
    });

    it('La vista tentativa NO persiste la situación final en las inscripciones', async () => {
      const insMateo = await prisma.inscripcion.findFirst({
        where: { paraleloId: paralelo1AId, estudianteId: studentMateoId },
      });
      const insLucia = await prisma.inscripcion.findFirst({
        where: { paraleloId: paralelo1AId, estudianteId: studentLuciaId },
      });
      expect(insMateo!.promedioAnual).toBeNull();
      expect(insMateo!.situacionFinal).toBeNull();
      expect(insLucia!.promedioAnual).toBeNull();
      expect(insLucia!.situacionFinal).toBeNull();
    });

    it('Maestro Hugo consulta el centralizador anual de su paralelo asignado (200 OK)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/centralizers/annual')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .query({ paraleloId: paralelo1AId })
        .expect(200);
    });

    it('Maestro Hugo (sin asignación en 1º B) obtiene 403 Forbidden al consultar anual de 1º B', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/centralizers/annual')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .query({ paraleloId: paralelo1BId })
        .expect(403);
    });
  });

  describe('US-CEN-03: Cierre Anual Oficial con Situación Final', () => {
    it('Maestro Hugo (Nivel 3) intenta el cierre anual y recibe 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/centralizers/finalize')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({ paraleloId: paralelo1AId })
        .expect(403);
    });

    it('Directora intenta el cierre con trimestres aún ABIERTO y recibe 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/centralizers/finalize')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({ paraleloId: paralelo1AId })
        .expect(400);

      expect(res.body.message).toContain('trimestres no cerrados');
    });

    it('Directora cierra los 3 trimestres (gestión de periodos de evaluación)', async () => {
      await prisma.periodoEvaluacion.updateMany({
        where: { institucionId: colFranzTamayoId, gestionId: gestionFranzId },
        data: { estado: EstadoPeriodo.CERRADO },
      });
    });

    it('Directora ejecuta el cierre anual oficial (200 OK: 1 promovido, 1 retenido)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/centralizers/finalize')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({ paraleloId: paralelo1AId })
        .expect(201);

      expect(res.body.paraleloId).toBe(paralelo1AId);
      expect(res.body.totalProcesados).toBe(2);
      expect(res.body.promovidos).toBe(1);
      expect(res.body.retenidos).toBe(1);
      expect(res.body.mensaje).toContain('Cierre anual de gestión 2026');
    });

    it('Las inscripciones quedan con promedioAnual y situacionFinal oficiales persistidos', async () => {
      const insMateo = await prisma.inscripcion.findFirst({
        where: { paraleloId: paralelo1AId, estudianteId: studentMateoId },
      });
      const insLucia = await prisma.inscripcion.findFirst({
        where: { paraleloId: paralelo1AId, estudianteId: studentLuciaId },
      });

      expect(insMateo!.promedioAnual).toBe(56);
      expect(insMateo!.situacionFinal).toBe('PROMOVIDO');
      expect(insLucia!.promedioAnual).toBe(39);
      expect(insLucia!.situacionFinal).toBe('RETENIDO');
    });

    it('La re-ejecución del cierre es idempotente (200 OK sin alterar resultados)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/centralizers/finalize')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({ paraleloId: paralelo1AId })
        .expect(201);

      expect(res.body.totalProcesados).toBe(2);
      expect(res.body.promovidos).toBe(1);
      expect(res.body.retenidos).toBe(1);

      const insMateo = await prisma.inscripcion.findFirst({
        where: { paraleloId: paralelo1AId, estudianteId: studentMateoId },
      });
      expect(insMateo!.promedioAnual).toBe(56);
      expect(insMateo!.situacionFinal).toBe('PROMOVIDO');
    });

    it('El cierre queda registrado en el log de auditoría (CIERRE_ANUAL_PARALELO)', async () => {
      const logs = await prisma.registroAuditoria.findMany({
        where: {
          tipo: 'USER_UPDATE',
          accion: 'CIERRE_ANUAL_PARALELO',
          institucionId: colFranzTamayoId,
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(logs.length).toBeGreaterThanOrEqual(2); // Cierre inicial + re-ejecución
      expect(logs[0].detalle).toMatchObject({ gestion: 2026, totalProcesados: 2 });
    });
  });

  describe('Aislamiento Multi-Tenant (PostgreSQL RLS)', () => {
    it('Consultar el centralizador anual de Franz Tamayo con tenant header de Mariscal Sucre devuelve 404 Not Found', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/centralizers/annual')
        .set('Authorization', `Bearer ${superadminToken}`)
        .set('X-Institution-Id', colMariscalSucreId)
        .query({ paraleloId: paralelo1AId })
        .expect(404);
    });

    it('Consultar el centralizador trimestral de Franz Tamayo con tenant header de Mariscal Sucre devuelve 404 Not Found', async () => {
      const trim1 = await prisma.periodoEvaluacion.findFirst({
        where: { gestionId: gestionFranzId, periodo: TipoPeriodo.PRIMER_TRIMESTRE },
      });

      await request(app.getHttpServer())
        .get('/api/v1/centralizers/trimester')
        .set('Authorization', `Bearer ${superadminToken}`)
        .set('X-Institution-Id', colMariscalSucreId)
        .query({ paraleloId: paralelo1AId, periodoId: trim1!.id })
        .expect(404);
    });

    it('Intentar el cierre anual bajo tenant ajeno devuelve 403 Forbidden (rol Nivel 2 requerido)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/centralizers/finalize')
        .set('Authorization', `Bearer ${superadminToken}`)
        .set('X-Institution-Id', colMariscalSucreId)
        .send({ paraleloId: paralelo1AId })
        .expect(403);
    });
  });
});
