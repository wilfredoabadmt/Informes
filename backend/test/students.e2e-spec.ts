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
  ParentescoTutor,
  EstadoAsignacion,
} from '@prisma/client';

describe('Feature 006: Empadronamiento de Estudiantes (RUDE) y Matriculación Escolar (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superadminToken: string;
  let directorElenaToken: string;
  let maestroHugoToken: string;
  let maestroJaimeToken: string;

  let colFranzTamayoId: string;
  let colMariscalSucreId: string;

  let gestionFranzId: string;
  let gestionMariscalId: string;

  let cursoSecundariaId: string;
  let paraleloFranzAId: string;
  let paraleloFranzBId: string;
  let paraleloMariscalAId: string;

  let materiaMatematicaId: string;

  let teacherHugoId: string;
  let teacherJaimeId: string;
  let vincHugoId: string;
  let vincJaimeId: string;

  let studentMateoId: string;
  let enrollmentFranzId: string;
  let enrollmentMariscalId: string;

  const testRude = '80730045202601M';
  const testCI = '5544332';

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

    // 3. Obtener curso oficial 1º de Secundaria y materia Matemática
    const cursoSec = await prisma.curso.findFirst({
      where: { nivel: NivelEducativo.SECUNDARIA, grado: 1 },
    });
    cursoSecundariaId = cursoSec!.id;

    const mat = await prisma.materia.findFirst({
      where: { nivel: NivelEducativo.SECUNDARIA, codigo: 'SEC-MAT' },
    });
    materiaMatematicaId = mat!.id;

    // 4. Limpieza previa de datos de este test suite
    await prisma.inscripcion.deleteMany({
      where: { institucionId: { in: [colFranzTamayoId, colMariscalSucreId] } },
    });
    const prevEst = await prisma.estudiante.findUnique({ where: { codigoRude: testRude } });
    if (prevEst) {
      await prisma.inscripcion.deleteMany({ where: { estudianteId: prevEst.id } });
      await prisma.estudiante.delete({ where: { id: prevEst.id } });
      await prisma.persona.delete({ where: { id: prevEst.personaId } });
    }
    await prisma.asignacionAcademica.deleteMany({
      where: { institucionId: { in: [colFranzTamayoId, colMariscalSucreId] } },
    });
    await prisma.paralelo.deleteMany({
      where: { institucionId: { in: [colFranzTamayoId, colMariscalSucreId] } },
    });
    await prisma.gestionEscolar.deleteMany({
      where: { institucionId: { in: [colFranzTamayoId, colMariscalSucreId] } },
    });

    // 5. Crear Gestiones 2026 en ambos colegios
    const gf = await prisma.gestionEscolar.create({
      data: {
        institucionId: colFranzTamayoId,
        anio: 2026,
        fechaInicio: new Date('2026-02-01'),
        estado: EstadoGestion.ABIERTA,
      },
    });
    gestionFranzId = gf.id;

    const gm = await prisma.gestionEscolar.create({
      data: {
        institucionId: colMariscalSucreId,
        anio: 2026,
        fechaInicio: new Date('2026-02-01'),
        estado: EstadoGestion.ABIERTA,
      },
    });
    gestionMariscalId = gm.id;

    // 6. Crear Paralelos
    const pfA = await prisma.paralelo.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        cursoId: cursoSecundariaId,
        letra: 'A',
        turno: Turno.MANANA,
        cupoMaximo: 35,
      },
    });
    paraleloFranzAId = pfA.id;

    const pfB = await prisma.paralelo.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        cursoId: cursoSecundariaId,
        letra: 'B',
        turno: Turno.TARDE,
        cupoMaximo: 35,
      },
    });
    paraleloFranzBId = pfB.id;

    const pmA = await prisma.paralelo.create({
      data: {
        institucionId: colMariscalSucreId,
        gestionId: gestionMariscalId,
        cursoId: cursoSecundariaId,
        letra: 'A',
        turno: Turno.MANANA,
        cupoMaximo: 35,
      },
    });
    paraleloMariscalAId = pmA.id;

    // 7. Crear Docente Hugo (con asignación en 1º A)
    const passwordService = app.get<PasswordService>(PasswordService);
    const validPasswordHash = await passwordService.hash('Bolivia2026!');

    const pHugo = await prisma.persona.create({
      data: {
        ci: '6677881',
        nombres: 'Hugo',
        primerApellido: 'Banzer',
      },
    });
    const uHugo = await prisma.usuario.create({
      data: {
        personaId: pHugo.id,
        email: 'hugo.banzer@minedu.gob.bo',
        passwordHash: validPasswordHash,
      },
    });
    const mHugo = await prisma.maestro.create({
      data: {
        personaId: pHugo.id,
        rda: 'RDA-66771',
        especialidad: 'Matemática',
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

    await prisma.asignacionAcademica.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        paraleloId: paraleloFranzAId,
        materiaId: materiaMatematicaId,
        vinculacionId: vincHugoId,
        esTitular: true,
        estado: EstadoAsignacion.ACTIVA,
      },
    });

    // 8. Crear Docente Jaime (sin asignación en 1º A)
    const pJaime = await prisma.persona.create({
      data: {
        ci: '6677882',
        nombres: 'Jaime',
        primerApellido: 'Paz',
      },
    });
    const uJaime = await prisma.usuario.create({
      data: {
        personaId: pJaime.id,
        email: 'jaime.paz@minedu.gob.bo',
        passwordHash: validPasswordHash,
      },
    });
    const mJaime = await prisma.maestro.create({
      data: {
        personaId: pJaime.id,
        rda: 'RDA-66772',
        especialidad: 'Ciencias Sociales',
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

    // Login Hugo y Jaime
    const resH = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'hugo.banzer@minedu.gob.bo', password: 'Bolivia2026!' });
    expect(resH.status).toBe(200);
    maestroHugoToken = resH.body.tokens.accessToken;

    const resJ = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'jaime.paz@minedu.gob.bo', password: 'Bolivia2026!' });
    expect(resJ.status).toBe(200);
    maestroJaimeToken = resJ.body.tokens.accessToken;
  });

  afterAll(async () => {
    await prisma.inscripcion.deleteMany({
      where: { institucionId: { in: [colFranzTamayoId, colMariscalSucreId] } },
    });
    if (studentMateoId) {
      const e = await prisma.estudiante.findUnique({ where: { id: studentMateoId } });
      if (e) {
        await prisma.estudiante.delete({ where: { id: studentMateoId } });
        await prisma.persona.delete({ where: { id: e.personaId } });
      }
    }
    await prisma.asignacionAcademica.deleteMany({
      where: { institucionId: { in: [colFranzTamayoId, colMariscalSucreId] } },
    });
    if (teacherHugoId) {
      await prisma.vinculacionInstitucional.deleteMany({ where: { maestroId: teacherHugoId } });
      const m = await prisma.maestro.findUnique({ where: { id: teacherHugoId } });
      if (m) {
        await prisma.maestro.delete({ where: { id: teacherHugoId } });
        await prisma.usuario.deleteMany({ where: { personaId: m.personaId } });
        await prisma.persona.delete({ where: { id: m.personaId } });
      }
    }
    if (teacherJaimeId) {
      await prisma.vinculacionInstitucional.deleteMany({ where: { maestroId: teacherJaimeId } });
      const m = await prisma.maestro.findUnique({ where: { id: teacherJaimeId } });
      if (m) {
        await prisma.maestro.delete({ where: { id: teacherJaimeId } });
        await prisma.usuario.deleteMany({ where: { personaId: m.personaId } });
        await prisma.persona.delete({ where: { id: m.personaId } });
      }
    }
    await prisma.paralelo.deleteMany({
      where: { institucionId: { in: [colFranzTamayoId, colMariscalSucreId] } },
    });
    await prisma.gestionEscolar.deleteMany({
      where: { institucionId: { in: [colFranzTamayoId, colMariscalSucreId] } },
    });
    await app.close();
  });

  // -------------------------------------------------------------
  // US-001: EMPADRONAMIENTO NACIONAL CON RUDE
  // -------------------------------------------------------------
  describe('US-001: Empadronamiento Nacional del Estudiante con RUDE', () => {
    it('debe permitir empadronar a un nuevo estudiante con RUDE oficial', async () => {
      const payload = {
        codigoRude: testRude,
        ci: testCI,
        nombres: 'Mateo',
        primerApellido: 'Mamani',
        segundoApellido: 'Quispe',
        fechaNacimiento: '2012-05-14',
        genero: 'M',
        direccion: 'Av. Juan Pablo II #450, El Alto',
        nombreTutor: 'Lucía Quispe de Mamani',
        ciTutor: '4567890',
        parentescoTutor: ParentescoTutor.MADRE,
        telefonoTutor: '78912345',
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .send(payload)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.codigoRude).toBe(testRude);
      expect(res.body.nombreCompleto).toContain('Mateo Mamani');
      expect(res.body.tutor.nombre).toBe('Lucía Quispe de Mamani');

      studentMateoId = res.body.id;
    });

    it('debe rechazar la creación si el código RUDE ya existe (409 Conflict)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .send({
          codigoRude: testRude,
          nombres: 'Otro',
          primerApellido: 'Estudiante',
          fechaNacimiento: '2012-01-01',
        })
        .expect(409);
    });

    it('debe buscar al estudiante en el padrón nacional por RUDE o nombre', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/students?q=${testRude}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].codigoRude).toBe(testRude);
    });

    it('debe consultar la ficha biográfica del estudiante', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/students/${studentMateoId}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .expect(200);

      expect(res.body.id).toBe(studentMateoId);
      expect(res.body.codigoRude).toBe(testRude);
      expect(res.body.historialMatriculas).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------
  // US-002: MATRICULACIÓN ESCOLAR EN PARALELO Y GESTIÓN
  // -------------------------------------------------------------
  describe('US-002: Matriculación del Estudiante (Nivel 2)', () => {
    it('debe permitir matricular a Mateo en 1º A de Franz Tamayo para la gestión 2026', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/students/enroll')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          estudianteId: studentMateoId,
          gestionId: gestionFranzId,
          paraleloId: paraleloFranzAId,
          esRepitente: false,
          observaciones: 'Inscripción regular periodo 2026',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.estado).toBe(EstadoInscripcion.EFECTIVO);
      expect(res.body.institucionId).toBe(colFranzTamayoId);

      enrollmentFranzId = res.body.id;
    });

    it('debe rechazar doble matrícula activa de Mateo en la misma gestión escolar (409 Conflict)', async () => {
      // Intento en otro paralelo del mismo colegio
      await request(app.getHttpServer())
        .post('/api/v1/students/enroll')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          estudianteId: studentMateoId,
          gestionId: gestionFranzId,
          paraleloId: paraleloFranzBId,
        })
        .expect(409);
    });

    it('debe rechazar matrícula en otro colegio si no hay traspaso previo (409 Conflict)', async () => {
      // Superadmin intenta matricularlo en Mariscal Sucre para la misma gestión 2026
      await request(app.getHttpServer())
        .post('/api/v1/students/enroll')
        .set('Authorization', `Bearer ${superadminToken}`)
        .set('X-Institution-Id', colMariscalSucreId)
        .send({
          estudianteId: studentMateoId,
          gestionId: gestionMariscalId,
          paraleloId: paraleloMariscalAId,
        })
        .expect(409);
    });
  });

  // -------------------------------------------------------------
  // US-003: ROSTER OFICIAL DE AULA Y AUTORIZACIÓN PEDAGÓGICA
  // -------------------------------------------------------------
  describe('US-003: Consulta de Roster de Aula (Nivel 2 y Nivel 3)', () => {
    it('debe permitir a la Directora Elena consultar la nómina de 1º A Franz Tamayo', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/students/sections/${paraleloFranzAId}/roster`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].codigoRude).toBe(testRude);
      expect(res.body[0].nombreCompleto).toContain('Mateo');
      expect(res.body[0].estadoInscripcion).toBe(EstadoInscripcion.EFECTIVO);
    });

    it('debe permitir al Maestro Hugo consultar el roster de 1º A (donde tiene asignación activa)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/students/sections/${paraleloFranzAId}/roster`)
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].codigoRude).toBe(testRude);
    });

    it('debe denegar el acceso al roster de 1º A al Maestro Jaime (que NO tiene asignación en 1º A)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/students/sections/${paraleloFranzAId}/roster`)
        .set('Authorization', `Bearer ${maestroJaimeToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(403);
    });
  });

  // -------------------------------------------------------------
  // US-004: TRASPASO ESCOLAR ENTRE UNIDADES EDUCATIVAS
  // -------------------------------------------------------------
  describe('US-004: Traspaso Escolar y Modificación de Matrícula', () => {
    it('debe permitir a la Directora Elena cambiar el estado de Mateo a RETIRADO_TRASLADO', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/students/enrollments/${enrollmentFranzId}/status`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          estado: EstadoInscripcion.RETIRADO_TRASLADO,
          motivo: 'Traspaso por cambio de domicilio a U.E. Mariscal Sucre',
        })
        .expect(200);

      expect(res.body.estado).toBe(EstadoInscripcion.RETIRADO_TRASLADO);
    });

    it('debe permitir matricular a Mateo en Mariscal Sucre una vez liberado el traspaso', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/students/enroll')
        .set('Authorization', `Bearer ${superadminToken}`)
        .set('X-Institution-Id', colMariscalSucreId)
        .send({
          estudianteId: studentMateoId,
          gestionId: gestionMariscalId,
          paraleloId: paraleloMariscalAId,
          observaciones: 'Traspaso formal procedente de Franz Tamayo',
        })
        .expect(201);

      expect(res.body.estado).toBe(EstadoInscripcion.EFECTIVO);
      expect(res.body.institucionId).toBe(colMariscalSucreId);

      enrollmentMariscalId = res.body.id;
    });

    it('la ficha del estudiante debe reflejar el historial completo de escolaridad con ambos colegios', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/students/${studentMateoId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(res.body.historialMatriculas).toHaveLength(2);
      const sieColegios = res.body.historialMatriculas.map((h: any) => h.unidadEducativa.sie);
      expect(sieColegios).toContain('80730045'); // Franz Tamayo
      expect(sieColegios).toContain('80730046'); // Mariscal Sucre
    });
  });
});
