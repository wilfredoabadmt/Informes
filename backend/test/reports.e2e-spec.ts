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
  EstadoAsistencia,
  CampoSaberes,
  SituacionFinalEstudiante,
} from '@prisma/client';

describe('Feature 011: Reportes Básicos en PDF y JSON (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superadminToken: string;
  let directorElenaToken: string;
  let colFranzTamayoId: string;
  let colMariscalSucreId: string;

  let gestionFranzId: string;
  let cursoSecundariaId: string;
  let paralelo1AId: string;
  let materiaMatematicaId: string;
  let materiaBiologiaId: string;

  let vinculacionHugoId: string;
  let asigMatId: string;
  let asigBioId: string;

  let studentMateoId: string;
  let studentLuciaId: string;
  let inscripcionMateoId: string;
  let inscripcionLuciaId: string;

  let periodo1TId: string;
  let periodo2TId: string;
  let periodo3TId: string;

  const testRdaHugo = 'RDA-99001';
  const testRudeMateo = '80730045202801M';
  const testRudeLucia = '80730045202802L';

  let personaHugoId: string;
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

    // 2. Curso base y materias
    const cursoSec = await prisma.curso.findFirst({
      where: { nivel: NivelEducativo.SECUNDARIA, grado: 1 },
    });
    cursoSecundariaId = cursoSec!.id;

    const mat = await prisma.materia.findFirst({
      where: { nivel: NivelEducativo.SECUNDARIA, codigo: 'SEC-MAT' },
    });
    materiaMatematicaId = mat!.id;

    let bio = await prisma.materia.findFirst({
      where: { nivel: NivelEducativo.SECUNDARIA, codigo: 'SEC-BIO' },
    });
    if (!bio) {
      bio = await prisma.materia.create({
        data: {
          codigo: 'SEC-BIO',
          nombre: 'Biología y Geografía',
          campo: CampoSaberes.VIDA_TIERRA_TERRITORIO,
          nivel: NivelEducativo.SECUNDARIA,
          esTroncal: true,
          orden: 2,
        },
      });
    }
    materiaBiologiaId = bio.id;

    // 3. Limpieza previa del colegio Franz Tamayo
    await prisma.detalleAsistencia.deleteMany({
      where: { registroAsistencia: { institucionId: colFranzTamayoId } },
    });
    await prisma.registroAsistencia.deleteMany({ where: { institucionId: colFranzTamayoId } });
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

    const m = await prisma.maestro.findUnique({ where: { rda: testRdaHugo } });
    if (m) {
      await prisma.vinculacionInstitucional.deleteMany({ where: { maestroId: m.id } });
      await prisma.maestro.delete({ where: { id: m.id } });
      await prisma.usuario.deleteMany({ where: { personaId: m.personaId } });
      await prisma.persona.delete({ where: { id: m.personaId } });
    }

    // 4. Gestión y Periodos
    const gestionFranz = await prisma.gestionEscolar.create({
      data: {
        institucionId: colFranzTamayoId,
        anio: 2026,
        fechaInicio: new Date('2026-02-01'),
        fechaFin: new Date('2026-11-30'),
        estado: EstadoGestion.ABIERTA,
      },
    });
    gestionFranzId = gestionFranz.id;

    const p1 = await prisma.periodoEvaluacion.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        periodo: TipoPeriodo.PRIMER_TRIMESTRE,
        fechaInicio: new Date('2026-02-01'),
        fechaFin: new Date('2026-05-15'),
        fechaLimiteNotas: new Date('2026-05-20'),
        estado: EstadoPeriodo.CERRADO,
      },
    });
    periodo1TId = p1.id;

    const p2 = await prisma.periodoEvaluacion.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        periodo: TipoPeriodo.SEGUNDO_TRIMESTRE,
        fechaInicio: new Date('2026-05-16'),
        fechaFin: new Date('2026-08-31'),
        fechaLimiteNotas: new Date('2026-09-05'),
        estado: EstadoPeriodo.CERRADO,
      },
    });
    periodo2TId = p2.id;

    const p3 = await prisma.periodoEvaluacion.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        periodo: TipoPeriodo.TERCER_TRIMESTRE,
        fechaInicio: new Date('2026-09-01'),
        fechaFin: new Date('2026-11-30'),
        fechaLimiteNotas: new Date('2026-12-05'),
        estado: EstadoPeriodo.CERRADO,
      },
    });
    periodo3TId = p3.id;

    // 5. Paralelo 1A
    const paralelo1A = await prisma.paralelo.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        cursoId: cursoSecundariaId,
        letra: 'A',
        turno: Turno.MANANA,
        cupoMaximo: 35,
      },
    });
    paralelo1AId = paralelo1A.id;

    // 6. Logins
    const resAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin@minedu.gob.bo', password: 'Bolivia2026!' });
    superadminToken = resAdmin.body.tokens.accessToken;

    const resElena = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'elena.flores@minedu.gob.bo', password: 'Bolivia2026!' });
    directorElenaToken = resElena.body.tokens.accessToken;

    // 7. Docente Hugo y Asignaciones Académicas
    const pHugo = await prisma.persona.create({
      data: {
        ci: '7755991',
        nombres: 'Hugo',
        primerApellido: 'Alvarez',
        segundoApellido: 'Flores',
        genero: 'M',
        direccion: 'Calle 5',
        telefono: '77889900',
      },
    });
    personaHugoId = pHugo.id;

    const uHugo = await prisma.usuario.create({
      data: {
        personaId: pHugo.id,
        email: 'hugo.rpt@minedu.gob.bo',
        passwordHash: validPasswordHash,
      },
    });

    const mHugo = await prisma.maestro.create({
      data: {
        personaId: pHugo.id,
        rda: testRdaHugo,
        especialidad: 'Matemática y Ciencias',
      },
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
    vinculacionHugoId = vHugo.id;

    const asigMat = await prisma.asignacionAcademica.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        paraleloId: paralelo1AId,
        materiaId: materiaMatematicaId,
        vinculacionId: vinculacionHugoId,
        horasSemanales: 6,
        esTitular: true,
      },
    });
    asigMatId = asigMat.id;

    const asigBio = await prisma.asignacionAcademica.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        paraleloId: paralelo1AId,
        materiaId: materiaBiologiaId,
        vinculacionId: vinculacionHugoId,
        horasSemanales: 4,
        esTitular: true,
      },
    });
    asigBioId = asigBio.id;

    // 8. Estudiantes: Mateo Arce (Aprobado) y Lucia Zeballos (Reprobada en Bio)
    const persMateo = await prisma.persona.create({
      data: {
        ci: '9901001-RPT',
        nombres: 'Mateo',
        primerApellido: 'Arce',
        segundoApellido: 'Mendoza',
        fechaNacimiento: new Date('2011-04-12'),
        genero: 'M',
        direccion: 'Calle 10, Obrajes',
        telefono: '71112233',
      },
    });
    personaMateoId = persMateo.id;

    const estMateo = await prisma.estudiante.create({
      data: {
        personaId: personaMateoId,
        codigoRude: testRudeMateo,
        nombreTutor: 'Ramiro Arce',
        telefonoTutor: '71112233',
      },
    });
    studentMateoId = estMateo.id;

    const insMateo = await prisma.inscripcion.create({
      data: {
        institucionId: colFranzTamayoId,
        estudianteId: studentMateoId,
        gestionId: gestionFranzId,
        paraleloId: paralelo1AId,
        estado: EstadoInscripcion.EFECTIVO,
      },
    });
    inscripcionMateoId = insMateo.id;

    const persLucia = await prisma.persona.create({
      data: {
        ci: '9901002-RPT',
        nombres: 'Lucia',
        primerApellido: 'Zeballos',
        segundoApellido: 'Perez',
        fechaNacimiento: new Date('2011-08-20'),
        genero: 'F',
        direccion: 'Calle 12, Calacoto',
        telefono: '72223344',
      },
    });
    personaLuciaId = persLucia.id;

    const estLucia = await prisma.estudiante.create({
      data: {
        personaId: personaLuciaId,
        codigoRude: testRudeLucia,
        nombreTutor: 'Carmen Perez',
        telefonoTutor: '72223344',
      },
    });
    studentLuciaId = estLucia.id;

    const insLucia = await prisma.inscripcion.create({
      data: {
        institucionId: colFranzTamayoId,
        estudianteId: studentLuciaId,
        gestionId: gestionFranzId,
        paraleloId: paralelo1AId,
        estado: EstadoInscripcion.EFECTIVO,
      },
    });
    inscripcionLuciaId = insLucia.id;

    // 9. Evaluaciones y Notas:
    const createEvalAndGrades = async (
      asigId: string,
      periodoId: string,
      dim: DimensionEvaluacion,
      name: string,
      max: number,
      date: Date,
      noteMateo: number,
      noteLucia: number,
      obsLucia?: string,
    ) => {
      const ev = await prisma.evaluacion.create({
        data: {
          institucionId: colFranzTamayoId,
          asignacionId: asigId,
          periodoId,
          dimension: dim,
          nombre: name,
          puntajeMaximo: max,
          fechaEvaluacion: date,
        },
      });

      await prisma.calificacion.create({
        data: {
          institucionId: colFranzTamayoId,
          evaluacionId: ev.id,
          estudianteId: studentMateoId,
          nota: noteMateo,
        },
      });

      await prisma.calificacion.create({
        data: {
          institucionId: colFranzTamayoId,
          evaluacionId: ev.id,
          estudianteId: studentLuciaId,
          nota: noteLucia,
          observacion: obsLucia || null,
        },
      });
    };

    // Trimestre 1 - Matemática (Mateo=80, Lucia=60)
    await createEvalAndGrades(asigMatId, periodo1TId, DimensionEvaluacion.SER, 'Ser 1T', 10, new Date('2026-03-01'), 10, 8);
    await createEvalAndGrades(asigMatId, periodo1TId, DimensionEvaluacion.SABER, 'Saber 1T', 35, new Date('2026-03-15'), 30, 20);
    await createEvalAndGrades(asigMatId, periodo1TId, DimensionEvaluacion.HACER, 'Hacer 1T', 35, new Date('2026-04-01'), 25, 20);
    await createEvalAndGrades(asigMatId, periodo1TId, DimensionEvaluacion.DECIDIR, 'Decidir 1T', 10, new Date('2026-04-15'), 10, 8);
    await createEvalAndGrades(asigMatId, periodo1TId, DimensionEvaluacion.AUTOEVALUACION, 'Auto 1T', 10, new Date('2026-05-01'), 5, 4);

    // Trimestre 1 - Biología (Mateo=70, Lucia=40)
    await createEvalAndGrades(asigBioId, periodo1TId, DimensionEvaluacion.SABER, 'Bio Saber 1T', 100, new Date('2026-03-10'), 70, 40, 'Dificultades en ciencias naturales');

    // Trimestre 2
    await createEvalAndGrades(asigMatId, periodo2TId, DimensionEvaluacion.SABER, 'Mat Saber 2T', 100, new Date('2026-06-10'), 85, 65);
    await createEvalAndGrades(asigBioId, periodo2TId, DimensionEvaluacion.SABER, 'Bio Saber 2T', 100, new Date('2026-06-15'), 75, 45);

    // Trimestre 3
    await createEvalAndGrades(asigMatId, periodo3TId, DimensionEvaluacion.SABER, 'Mat Saber 3T', 100, new Date('2026-10-10'), 90, 70);
    await createEvalAndGrades(asigBioId, periodo3TId, DimensionEvaluacion.SABER, 'Bio Saber 3T', 100, new Date('2026-10-15'), 80, 45);

    // 10. Asistencias
    const regAsist1 = await prisma.registroAsistencia.create({
      data: {
        institucionId: colFranzTamayoId,
        paraleloId: paralelo1AId,
        registradoPorId: uHugo.id,
        fecha: new Date('2026-03-01'),
      },
    });

    await prisma.detalleAsistencia.create({
      data: {
        registroAsistenciaId: regAsist1.id,
        estudianteId: studentMateoId,
        estado: EstadoAsistencia.PRESENTE,
      },
    });

    await prisma.detalleAsistencia.create({
      data: {
        registroAsistenciaId: regAsist1.id,
        estudianteId: studentLuciaId,
        estado: EstadoAsistencia.ATRASO,
      },
    });
  });

  afterAll(async () => {
    await prisma.detalleAsistencia.deleteMany({
      where: { registroAsistencia: { institucionId: colFranzTamayoId } },
    });
    await prisma.registroAsistencia.deleteMany({ where: { institucionId: colFranzTamayoId } });
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

    const m = await prisma.maestro.findUnique({ where: { rda: testRdaHugo } });
    if (m) {
      await prisma.vinculacionInstitucional.deleteMany({ where: { maestroId: m.id } });
      await prisma.maestro.delete({ where: { id: m.id } });
      await prisma.usuario.deleteMany({ where: { personaId: m.personaId } });
      await prisma.persona.delete({ where: { id: m.personaId } });
    }

    await app.close();
  });

  describe('US-001: Lista Oficial de Curso / Paralelo', () => {
    it('debe obtener la lista de curso en formato JSON ordenada alfabéticamente', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/reports/course-roster?paraleloId=${paralelo1AId}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(res.body.totalEstudiantes).toBe(2);
      expect(res.body.institucion.sie).toBe('80730045');
      expect(res.body.academico.curso).toContain('Secundaria');
      expect(res.body.academico.paralelo).toBe('A');

      // Orden alfabético: Arce Mendoza Mateo antes de Zeballos Perez Lucia
      expect(res.body.estudiantes[0].apellidos).toBe('Arce Mendoza');
      expect(res.body.estudiantes[0].nombres).toBe('Mateo');
      expect(res.body.estudiantes[0].numero).toBe(1);
      expect(res.body.estudiantes[0].rude).toBe(testRudeMateo);

      expect(res.body.estudiantes[1].apellidos).toBe('Zeballos Perez');
      expect(res.body.estudiantes[1].nombres).toBe('Lucia');
      expect(res.body.estudiantes[1].numero).toBe(2);
    });

    it('debe descargar la lista de curso en PDF binario válido', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/reports/course-roster/pdf?paraleloId=${paralelo1AId}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('lista_');
      expect(res.headers['content-disposition']).toContain('.pdf');

      const buffer = Buffer.from(res.body);
      expect(buffer.toString('utf-8', 0, 4)).toBe('%PDF');
    });
  });

  describe('US-002: Boletín Trimestral de Calificaciones', () => {
    it('debe obtener el boletín trimestral en formato JSON con desglose de dimensiones y notas', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/reports/trimester-bulletin?inscripcionId=${inscripcionMateoId}&periodoId=${periodo1TId}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(res.body.estudiante.rude).toBe(testRudeMateo);
      expect(res.body.periodo.nombre).toBe('1er Trimestre');
      expect(res.body.materias.length).toBe(2);

      const mat = res.body.materias.find((m: any) => m.codigo === 'SEC-MAT');
      expect(mat.dimensiones.ser).toBe(10);
      expect(mat.dimensiones.saber).toBe(30);
      expect(mat.dimensiones.hacer).toBe(25);
      expect(mat.dimensiones.decidir).toBe(10);
      expect(mat.dimensiones.autoevaluacion).toBe(5);
      expect(mat.notaFinal).toBe(80);
      expect(mat.estado).toBe('APROBADO');

      const bio = res.body.materias.find((m: any) => m.codigo === 'SEC-BIO');
      expect(bio.notaFinal).toBe(70);
      expect(bio.estado).toBe('APROBADO');

      expect(res.body.promedioTrimestral).toBe(75);
      expect(res.body.materiasAprobadas).toBe(2);
      expect(res.body.materiasReprobadas).toBe(0);
      expect(res.body.resumenAsistencia.presente).toBe(1);
    });

    it('debe reflejar apreciación cualitativa y reprobación en boletín de Lucia', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/reports/trimester-bulletin?inscripcionId=${inscripcionLuciaId}&periodoId=${periodo1TId}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      const bio = res.body.materias.find((m: any) => m.codigo === 'SEC-BIO');
      expect(bio.notaFinal).toBe(40);
      expect(bio.estado).toBe('REPROBADO');
      expect(bio.apreciacionCualitativa).toBe('Dificultades en ciencias naturales');

      expect(res.body.materiasReprobadas).toBe(1);
      expect(res.body.resumenAsistencia.atraso).toBe(1);
    });

    it('debe descargar el boletín trimestral en PDF binario', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/reports/trimester-bulletin/pdf?inscripcionId=${inscripcionMateoId}&periodoId=${periodo1TId}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(res.headers['content-type']).toContain('application/pdf');
      const buffer = Buffer.from(res.body);
      expect(buffer.toString('utf-8', 0, 4)).toBe('%PDF');
    });
  });

  describe('US-003: Libreta Escolar Anual Oficial', () => {
    it('debe consolidar los 3 trimestres y determinar situación final PROMOVIDO para Mateo', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/reports/school-report-card?inscripcionId=${inscripcionMateoId}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(res.body.estudiante.rude).toBe(testRudeMateo);
      expect(res.body.materias.length).toBe(2);

      const mat = res.body.materias.find((m: any) => m.codigo === 'SEC-MAT');
      expect(mat.primerTrimestre).toBe(80);
      expect(mat.segundoTrimestre).toBe(85);
      expect(mat.tercerTrimestre).toBe(90);
      // (80 + 85 + 90) / 3 = 85
      expect(mat.promedioAnual).toBe(85);
      expect(mat.estado).toBe('APROBADO');

      const bio = res.body.materias.find((m: any) => m.codigo === 'SEC-BIO');
      expect(bio.primerTrimestre).toBe(70);
      expect(bio.segundoTrimestre).toBe(75);
      expect(bio.tercerTrimestre).toBe(80);
      // (70 + 75 + 80) / 3 = 75
      expect(bio.promedioAnual).toBe(75);
      expect(bio.estado).toBe('APROBADO');

      // Promedio general: (85 + 75) / 2 = 80
      expect(res.body.promedioGeneralAnual).toBe(80);
      expect(res.body.situacionFinal).toBe(SituacionFinalEstudiante.PROMOVIDO);
    });

    it('debe determinar situación final RETENIDO para Lucia por reprobar Biología', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/reports/school-report-card?inscripcionId=${inscripcionLuciaId}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      const bio = res.body.materias.find((m: any) => m.codigo === 'SEC-BIO');
      expect(bio.primerTrimestre).toBe(40);
      expect(bio.segundoTrimestre).toBe(45);
      expect(bio.tercerTrimestre).toBe(45);
      // (40 + 45 + 45) / 3 = 43.33 -> 43
      expect(bio.promedioAnual).toBe(43);
      expect(bio.estado).toBe('REPROBADO');

      expect(res.body.situacionFinal).toBe(SituacionFinalEstudiante.RETENIDO);
    });

    it('debe descargar la libreta escolar anual en PDF binario', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/reports/school-report-card/pdf?inscripcionId=${inscripcionMateoId}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(res.headers['content-type']).toContain('application/pdf');
      const buffer = Buffer.from(res.body);
      expect(buffer.toString('utf-8', 0, 4)).toBe('%PDF');
    });
  });

  describe('US-004: Aislamiento RLS Multi-Tenant', () => {
    it('debe rechazar la consulta si el usuario no tiene vinculación con la institución (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/reports/course-roster?paraleloId=${paralelo1AId}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colMariscalSucreId) // Elena no pertenece a Mariscal Sucre
        .expect(403);
    });

    it('debe rechazar la lista de curso si el paralelo no pertenece a la institución del header (404 Not Found via RLS)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/reports/course-roster?paraleloId=${paralelo1AId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .set('X-Institution-Id', colMariscalSucreId) // Superadmin con tenant ajeno
        .expect(404);
    });

    it('debe rechazar el boletín trimestral si la inscripción no pertenece a la institución del header (404 Not Found via RLS)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/reports/trimester-bulletin?inscripcionId=${inscripcionMateoId}&periodoId=${periodo1TId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .set('X-Institution-Id', colMariscalSucreId) // Superadmin con tenant ajeno
        .expect(404);
    });

    it('debe rechazar la libreta escolar si la inscripción no pertenece a la institución del header (404 Not Found via RLS)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/reports/school-report-card?inscripcionId=${inscripcionMateoId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .set('X-Institution-Id', colMariscalSucreId) // Superadmin con tenant ajeno
        .expect(404);
    });
  });
});
