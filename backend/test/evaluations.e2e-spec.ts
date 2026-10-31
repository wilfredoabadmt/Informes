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
  TipoPeriodo,
  EstadoPeriodo,
  DimensionEvaluacion,
} from '@prisma/client';

describe('Feature 008: Periodos de Evaluación y Configuración de Dimensiones SEP (E2E)', () => {
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
  let asigJaimeId: string;

  let personaHugoId: string;
  let personaJaimeId: string;

  let primerTrimestreId: string;
  let segundoTrimestreId: string;
  let evaluacionSaber1Id: string;

  const testRdaHugo = 'RDA-77110';
  const testRdaJaime = 'RDA-77111';

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

    // 2. Tokens de autenticación
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
    await prisma.evaluacion.deleteMany({
      where: { institucionId: colFranzTamayoId },
    });
    await prisma.periodoEvaluacion.deleteMany({
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

    // 7. Docente Hugo (Asignado a 1º A)
    const pHugo = await prisma.persona.create({
      data: { ci: '7711990', nombres: 'Hugo', primerApellido: 'Alvarez', segundoApellido: 'Flores' },
    });
    personaHugoId = pHugo.id;
    const uHugo = await prisma.usuario.create({
      data: {
        personaId: pHugo.id,
        email: 'hugo.eval@minedu.gob.bo',
        passwordHash: validPasswordHash,
      },
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

    // Docente Jaime (Asignado a 1º B)
    const pJaime = await prisma.persona.create({
      data: { ci: '7711991', nombres: 'Jaime', primerApellido: 'Condori', segundoApellido: 'Choque' },
    });
    personaJaimeId = pJaime.id;
    const uJaime = await prisma.usuario.create({
      data: {
        personaId: pJaime.id,
        email: 'jaime.eval@minedu.gob.bo',
        passwordHash: validPasswordHash,
      },
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
    const asigJ = await prisma.asignacionAcademica.create({
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
    asigJaimeId = asigJ.id;

    // 8. Logins de los maestros
    const resH = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'hugo.eval@minedu.gob.bo', password: 'Bolivia2026!' });
    maestroHugoToken = resH.body.tokens.accessToken;

    const resJ = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'jaime.eval@minedu.gob.bo', password: 'Bolivia2026!' });
    maestroJaimeToken = resJ.body.tokens.accessToken;
  });

  afterAll(async () => {
    // Teardown completo de datos de prueba
    await prisma.evaluacion.deleteMany({
      where: { institucionId: colFranzTamayoId },
    });
    await prisma.periodoEvaluacion.deleteMany({
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

    for (const pId of [personaHugoId, personaJaimeId]) {
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

  describe('US-001 & US-002: Gestión de Periodos Evaluativos (Trimestres - Nivel 2)', () => {
    it('Directora Elena registra el 1er Trimestre (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/evaluation-periods')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          gestionId: gestionFranzId,
          periodo: TipoPeriodo.PRIMER_TRIMESTRE,
          fechaInicio: '2026-02-02',
          fechaFin: '2026-05-08',
          fechaLimiteNotas: '2026-05-15',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.periodo).toBe(TipoPeriodo.PRIMER_TRIMESTRE);
      expect(res.body.estado).toBe(EstadoPeriodo.PROGRAMADO);

      primerTrimestreId = res.body.id;
    });

    it('debe rechazar duplicación del 1er Trimestre en la misma gestión (409 Conflict)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/evaluation-periods')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          gestionId: gestionFranzId,
          periodo: TipoPeriodo.PRIMER_TRIMESTRE,
          fechaInicio: '2026-02-02',
          fechaFin: '2026-05-08',
          fechaLimiteNotas: '2026-05-15',
        })
        .expect(409);
    });

    it('Directora Elena registra el 2do Trimestre (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/evaluation-periods')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          gestionId: gestionFranzId,
          periodo: TipoPeriodo.SEGUNDO_TRIMESTRE,
          fechaInicio: '2026-05-11',
          fechaFin: '2026-08-14',
          fechaLimiteNotas: '2026-08-21',
        })
        .expect(201);

      segundoTrimestreId = res.body.id;
    });

    it('debe listar los trimestres ordenados cronológicamente (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/evaluation-periods')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .query({ gestionId: gestionFranzId })
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].periodo).toBe(TipoPeriodo.PRIMER_TRIMESTRE);
      expect(res.body[1].periodo).toBe(TipoPeriodo.SEGUNDO_TRIMESTRE);
    });

    it('Directora Elena abre el 1er Trimestre (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/evaluation-periods/${primerTrimestreId}/status`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({ estado: EstadoPeriodo.ABIERTO })
        .expect(200);

      expect(res.body.estado).toBe(EstadoPeriodo.ABIERTO);
    });

    it('debe rechazar abrir el 2do Trimestre mientras el 1ro sigue ABIERTO (400 Bad Request)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/evaluation-periods/${segundoTrimestreId}/status`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({ estado: EstadoPeriodo.ABIERTO })
        .expect(400);
    });
  });

  describe('US-003: Programación de Instrumentos de Evaluación (Nivel 3)', () => {
    it('debe rechazar evaluación con fecha fuera de rango del trimestre (400 Bad Request)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/evaluations')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          asignacionId: asigHugoId,
          periodoId: primerTrimestreId,
          dimension: DimensionEvaluacion.SABER,
          nombre: 'Examen fuera de rango',
          puntajeMaximo: 20,
          fechaEvaluacion: '2026-06-01', // Trimestre 1 concluye en mayo
        })
        .expect(400);
    });

    it('Maestro Jaime (no asignado a 1º A) intenta programar evaluación en 1º A (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/evaluations')
        .set('Authorization', `Bearer ${maestroJaimeToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          asignacionId: asigHugoId,
          periodoId: primerTrimestreId,
          dimension: DimensionEvaluacion.SABER,
          nombre: 'Examen de Jaime en aula ajena',
          puntajeMaximo: 20,
          fechaEvaluacion: '2026-03-15',
        })
        .expect(403);
    });

    it('Maestro Hugo crea primera evaluación en SABER por 20 pts (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/evaluations')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          asignacionId: asigHugoId,
          periodoId: primerTrimestreId,
          dimension: DimensionEvaluacion.SABER,
          nombre: 'Examen Parcial de Álgebra',
          descripcion: 'Ecuaciones de primer grado y sistemas lineales',
          puntajeMaximo: 20,
          fechaEvaluacion: '2026-03-20',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.dimension).toBe(DimensionEvaluacion.SABER);
      expect(res.body.puntajeMaximo).toBe(20);

      evaluacionSaber1Id = res.body.id;
    });

    it('Maestro Hugo crea segunda evaluación en SABER por 15 pts (total acumulado 35 pts) (201 Created)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/evaluations')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          asignacionId: asigHugoId,
          periodoId: primerTrimestreId,
          dimension: DimensionEvaluacion.SABER,
          nombre: 'Control Teórico de Geometría',
          puntajeMaximo: 15,
          fechaEvaluacion: '2026-04-10',
        })
        .expect(201);
    });

    it('debe rechazar tercera evaluación en SABER por 5 pts que superaría el tope de 35 (400 Bad Request)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/evaluations')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          asignacionId: asigHugoId,
          periodoId: primerTrimestreId,
          dimension: DimensionEvaluacion.SABER,
          nombre: 'Exceso de puntos',
          puntajeMaximo: 5, // 20 + 15 + 5 = 40 > 35
          fechaEvaluacion: '2026-04-25',
        })
        .expect(400);
    });

    it('Maestro Hugo crea evaluaciones en HACER (35), SER (10) y DECIDIR (10) (201 Created)', async () => {
      // HACER: 35 pts
      await request(app.getHttpServer())
        .post('/api/v1/evaluations')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          asignacionId: asigHugoId,
          periodoId: primerTrimestreId,
          dimension: DimensionEvaluacion.HACER,
          nombre: 'Cuaderno de Prácticas y Ejercicios',
          puntajeMaximo: 35,
          fechaEvaluacion: '2026-04-30',
        })
        .expect(201);

      // SER: 10 pts
      await request(app.getHttpServer())
        .post('/api/v1/evaluations')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          asignacionId: asigHugoId,
          periodoId: primerTrimestreId,
          dimension: DimensionEvaluacion.SER,
          nombre: 'Puntualidad, Respeto y Convivencia',
          puntajeMaximo: 10,
          fechaEvaluacion: '2026-05-02',
        })
        .expect(201);

      // DECIDIR: 10 pts
      await request(app.getHttpServer())
        .post('/api/v1/evaluations')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          asignacionId: asigHugoId,
          periodoId: primerTrimestreId,
          dimension: DimensionEvaluacion.DECIDIR,
          nombre: 'Impacto Comunitario y Aplicación Práctica',
          puntajeMaximo: 10,
          fechaEvaluacion: '2026-05-04',
        })
        .expect(201);
    });
  });

  describe('US-004: Consulta, Modificación y Cierre del Trimestre', () => {
    it('Maestro Hugo consulta la lista de evaluaciones programadas (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/evaluations')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .query({
          asignacionId: asigHugoId,
          periodoId: primerTrimestreId,
        })
        .expect(200);

      expect(res.body).toHaveLength(5);
    });

    it('Maestro Hugo modifica el nombre de la primera evaluación (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/evaluations/${evaluacionSaber1Id}`)
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({ nombre: 'Examen Parcial de Álgebra (Modificado)' })
        .expect(200);

      expect(res.body.nombre).toContain('Modificado');
    });

    it('Directora Elena cierra el 1er Trimestre (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/evaluation-periods/${primerTrimestreId}/status`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({ estado: EstadoPeriodo.CERRADO })
        .expect(200);

      expect(res.body.estado).toBe(EstadoPeriodo.CERRADO);
    });

    it('debe rechazar modificación de evaluación en trimestre CERRADO (400 Bad Request)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/evaluations/${evaluacionSaber1Id}`)
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({ nombre: 'Intento de cambio en periodo cerrado' })
        .expect(400);
    });

    it('debe rechazar eliminación de evaluación en trimestre CERRADO (400 Bad Request)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/evaluations/${evaluacionSaber1Id}`)
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(400);
    });
  });

  describe('Aislamiento Multi-Tenant (PostgreSQL RLS)', () => {
    it('Consultar evaluaciones de Franz Tamayo con tenant header de Mariscal Sucre no debe retornar registros ajenos', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/evaluations')
        .set('Authorization', `Bearer ${superadminToken}`)
        .set('X-Institution-Id', colMariscalSucreId) // Tenant ajeno
        .query({
          asignacionId: asigHugoId,
          periodoId: primerTrimestreId,
        });

      // Debe responder 404 porque la asignación no existe en Mariscal Sucre
      expect(res.status).toBe(404);
    });
  });
});
