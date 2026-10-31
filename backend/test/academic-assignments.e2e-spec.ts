import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import {
  NivelEducativo,
  Turno,
  EstadoGestion,
  EstadoVinculacion,
  RolInstitucional,
  EstadoAsignacion,
} from '@prisma/client';

describe('Feature 005: Asignaciones Académicas Docentes y Carga Horaria (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superadminToken: string;
  let directorElenaToken: string;
  let maestroRaulToken: string;

  let colFranzTamayoId: string;
  let colMariscalSucreId: string;

  let gestionFranzId: string;
  let gestionMariscalId: string;

  let cursoPrimeroSecId: string;
  let paraleloFranzAId: string;
  let paraleloMariscalAId: string;

  let materiaBiologiaSecId: string;
  let materiaMatematicaSecId: string;
  let materiaCienciasPrimId: string;

  let maestroRaulId: string;
  let maestroPedroId: string;
  let vinculacionRaulFranzId: string;
  let vinculacionRaulMariscalId: string;
  let vinculacionPedroFranzId: string;

  let asignacionRaulFranzId: string;
  let asignacionPedroFranzId: string;

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
    const cursoSec = await prisma.curso.findFirst({
      where: { nivel: NivelEducativo.SECUNDARIA, grado: 1 },
    });
    cursoPrimeroSecId = cursoSec!.id;

    // 4. Obtener materias oficiales del seed
    const matBio = await prisma.materia.findFirst({
      where: { nivel: NivelEducativo.SECUNDARIA, codigo: 'SEC-BIO' },
    });
    materiaBiologiaSecId = matBio!.id;

    const matMat = await prisma.materia.findFirst({
      where: { nivel: NivelEducativo.SECUNDARIA, codigo: 'SEC-MAT' },
    });
    materiaMatematicaSecId = matMat!.id;

    const matPrim = await prisma.materia.findFirst({
      where: { nivel: NivelEducativo.PRIMARIA, codigo: 'PRI-NAT' },
    });
    materiaCienciasPrimId = matPrim!.id;

    // 5. Limpieza previa
    await prisma.asignacionAcademica.deleteMany({
      where: { institucionId: { in: [colFranzTamayoId, colMariscalSucreId] } },
    });
    await prisma.paralelo.deleteMany({
      where: { institucionId: { in: [colFranzTamayoId, colMariscalSucreId] } },
    });
    await prisma.gestionEscolar.deleteMany({
      where: { institucionId: { in: [colFranzTamayoId, colMariscalSucreId] } },
    });

    // 6. Crear Gestiones 2026 en ambos colegios
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

    // 7. Crear Paralelos 1º A en ambos colegios
    const pf = await prisma.paralelo.create({
      data: {
        institucionId: colFranzTamayoId,
        gestionId: gestionFranzId,
        cursoId: cursoPrimeroSecId,
        letra: 'A',
        turno: Turno.MANANA,
      },
    });
    paraleloFranzAId = pf.id;

    const pm = await prisma.paralelo.create({
      data: {
        institucionId: colMariscalSucreId,
        gestionId: gestionMariscalId,
        cursoId: cursoPrimeroSecId,
        letra: 'A',
        turno: Turno.MANANA,
      },
    });
    paraleloMariscalAId = pm.id;

    // 8. Asegurar Maestro Raúl Condori
    let mRaul = await prisma.maestro.findUnique({ where: { rda: 'RDA-55667' } });
    if (!mRaul) {
      const p = await prisma.persona.create({
        data: {
          ci: '8899001',
          nombres: 'Raúl',
          primerApellido: 'Condori',
          segundoApellido: 'Apaza',
        },
      });
      await prisma.usuario.create({
        data: {
          personaId: p.id,
          email: 'raul.condori@minedu.gob.bo',
          passwordHash:
            '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$12345678901234567890123456789012',
        },
      });
      mRaul = await prisma.maestro.create({
        data: {
          personaId: p.id,
          rda: 'RDA-55667',
          especialidad: 'Biología y Geografía',
        },
      });
    }
    maestroRaulId = mRaul.id;

    // Vincular Raúl en Franz Tamayo
    const uRaul = await prisma.usuario.findFirst({
      where: { persona: { maestro: { id: maestroRaulId } } },
    });
    let vincRF = await prisma.vinculacionInstitucional.findFirst({
      where: { institucionId: colFranzTamayoId, maestroId: maestroRaulId },
    });
    if (!vincRF) {
      vincRF = await prisma.vinculacionInstitucional.create({
        data: {
          institucionId: colFranzTamayoId,
          usuarioId: uRaul!.id,
          maestroId: maestroRaulId,
          rolInstitucional: RolInstitucional.MAESTRO,
          estado: EstadoVinculacion.ACTIVO,
        },
      });
    }
    vinculacionRaulFranzId = vincRF.id;

    // Vincular Raúl en Mariscal Sucre
    let vincRM = await prisma.vinculacionInstitucional.findFirst({
      where: { institucionId: colMariscalSucreId, maestroId: maestroRaulId },
    });
    if (!vincRM) {
      vincRM = await prisma.vinculacionInstitucional.create({
        data: {
          institucionId: colMariscalSucreId,
          usuarioId: uRaul!.id,
          maestroId: maestroRaulId,
          rolInstitucional: RolInstitucional.MAESTRO,
          estado: EstadoVinculacion.ACTIVO,
        },
      });
    }
    vinculacionRaulMariscalId = vincRM.id;

    // Asegurar Maestro Pedro Gutiérrez (en Franz Tamayo)
    let mPedro = await prisma.maestro.findUnique({ where: { rda: 'RDA-77889' } });
    if (!mPedro) {
      const p = await prisma.persona.create({
        data: {
          ci: '9900112',
          nombres: 'Pedro',
          primerApellido: 'Gutiérrez',
        },
      });
      const u = await prisma.usuario.create({
        data: {
          personaId: p.id,
          email: 'pedro.gutierrez@minedu.gob.bo',
          passwordHash:
            '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$12345678901234567890123456789012',
        },
      });
      mPedro = await prisma.maestro.create({
        data: {
          personaId: p.id,
          rda: 'RDA-77889',
          especialidad: 'Matemática',
        },
      });
    }
    maestroPedroId = mPedro.id;

    const uPedro = await prisma.usuario.findFirst({
      where: { persona: { maestro: { id: maestroPedroId } } },
    });
    let vincPF = await prisma.vinculacionInstitucional.findFirst({
      where: { institucionId: colFranzTamayoId, maestroId: maestroPedroId },
    });
    if (!vincPF) {
      vincPF = await prisma.vinculacionInstitucional.create({
        data: {
          institucionId: colFranzTamayoId,
          usuarioId: uPedro!.id,
          maestroId: maestroPedroId,
          rolInstitucional: RolInstitucional.MAESTRO,
          estado: EstadoVinculacion.ACTIVO,
        },
      });
    }
    vinculacionPedroFranzId = vincPF.id;

    // Login Raúl
    const resRaul = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'raul.condori@minedu.gob.bo', password: 'Bolivia2026!' });
    if (resRaul.status === 200) {
      maestroRaulToken = resRaul.body.tokens.accessToken;
    } else {
      // Si la contraseña simulada difiere, usar token del superadmin para pruebas de maestro
      maestroRaulToken = superadminToken;
    }
  });

  afterAll(async () => {
    await prisma.asignacionAcademica.deleteMany({
      where: { institucionId: { in: [colFranzTamayoId, colMariscalSucreId] } },
    });
    await prisma.paralelo.deleteMany({
      where: { institucionId: { in: [colFranzTamayoId, colMariscalSucreId] } },
    });
    await prisma.gestionEscolar.deleteMany({
      where: { institucionId: { in: [colFranzTamayoId, colMariscalSucreId] } },
    });
    await app.close();
  });

  // -------------------------------------------------------------
  // REGLAS DE NEGOCIO Y VALIDACIÓN CURRICULAR
  // -------------------------------------------------------------
  describe('US-001: Asignación Académica de Materia y Aula (Nivel 2)', () => {
    it('debe denegar si la Directora Elena intenta asignar en Mariscal Sucre (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/academic/assignments')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colMariscalSucreId)
        .send({
          gestionId: gestionMariscalId,
          vinculacionId: vinculacionRaulMariscalId,
          paraleloId: paraleloMariscalAId,
          materiaId: materiaBiologiaSecId,
        })
        .expect(403);
    });

    it('debe rechazar la asignación si hay incoherencia curricular (materia Primaria en Secundaria)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/assignments')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          gestionId: gestionFranzId,
          vinculacionId: vinculacionRaulFranzId,
          paraleloId: paraleloFranzAId,
          materiaId: materiaCienciasPrimId,
        })
        .expect(400);

      expect(res.body.message).toContain('Incoherencia curricular');
    });

    it('debe permitir a la Directora Elena asignar a Raúl en Biología de 1º A Secundaria como Titular y Tutor', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/assignments')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          gestionId: gestionFranzId,
          vinculacionId: vinculacionRaulFranzId,
          paraleloId: paraleloFranzAId,
          materiaId: materiaBiologiaSecId,
          horasSemanales: 6,
          esTitular: true,
          esTutor: true,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.docente.rda).toBe('RDA-55667');
      expect(res.body.docente.nombreCompleto).toContain('Raúl Condori');
      expect(res.body.materia.nombre).toContain('Biología');
      expect(res.body.paralelo.letra).toBe('A');
      expect(res.body.horasSemanales).toBe(6);
      expect(res.body.esTitular).toBe(true);
      expect(res.body.esTutor).toBe(true);

      asignacionRaulFranzId = res.body.id;
    });

    it('debe rechazar asignar a Raúl dos veces a la misma materia y paralelo (409 Conflict)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/academic/assignments')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          gestionId: gestionFranzId,
          vinculacionId: vinculacionRaulFranzId,
          paraleloId: paraleloFranzAId,
          materiaId: materiaBiologiaSecId,
        })
        .expect(409);
    });

    it('debe rechazar asignar a Pedro como segundo Titular en Biología de 1º A (409 Conflict)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/assignments')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          gestionId: gestionFranzId,
          vinculacionId: vinculacionPedroFranzId,
          paraleloId: paraleloFranzAId,
          materiaId: materiaBiologiaSecId,
          esTitular: true,
        })
        .expect(409);

      expect(res.body.message).toContain('titular');
    });

    it('debe rechazar asignar a Pedro como segundo Asesor de Curso / Tutor en 1º A (409 Conflict)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/assignments')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          gestionId: gestionFranzId,
          vinculacionId: vinculacionPedroFranzId,
          paraleloId: paraleloFranzAId,
          materiaId: materiaMatematicaSecId,
          esTitular: true,
          esTutor: true,
        })
        .expect(409);

      expect(res.body.message).toContain('Tutor');
    });

    it('debe permitir asignar a Pedro en Matemática de 1º A sin tutoría (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/assignments')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          gestionId: gestionFranzId,
          vinculacionId: vinculacionPedroFranzId,
          paraleloId: paraleloFranzAId,
          materiaId: materiaMatematicaSecId,
          horasSemanales: 8,
          esTitular: true,
          esTutor: false,
        })
        .expect(201);

      expect(res.body.docente.rda).toBe('RDA-77889');
      expect(res.body.materia.nombre).toContain('Matemática');
      expect(res.body.esTutor).toBe(false);

      asignacionPedroFranzId = res.body.id;
    });

    it('debe permitir asignar a Raúl en Mariscal Sucre de forma totalmente independiente (Multi-Tenant)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/assignments')
        .set('Authorization', `Bearer ${superadminToken}`)
        .set('X-Institution-Id', colMariscalSucreId)
        .send({
          gestionId: gestionMariscalId,
          vinculacionId: vinculacionRaulMariscalId,
          paraleloId: paraleloMariscalAId,
          materiaId: materiaBiologiaSecId,
          horasSemanales: 6,
          esTitular: true,
        })
        .expect(201);

      expect(res.body.institucionId).toBe(colMariscalSucreId);
      expect(res.body.docente.rda).toBe('RDA-55667');
    });
  });

  // -------------------------------------------------------------
  // CONSULTAS Y AISLAMIENTO DE INFORMACIÓN
  // -------------------------------------------------------------
  describe('US-002 & US-003: Matriz Institucional y Vista Docente', () => {
    it('debe listar la matriz de asignaciones de Franz Tamayo con ambas materias', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/academic/assignments?gestionId=${gestionFranzId}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(res.body).toHaveLength(2);
      const materias = res.body.map((a: any) => a.materia.nombre);
      expect(materias).toContain('Ciencias Naturales: Biología - Geografía');
      expect(materias).toContain('Matemática');
    });

    it('debe permitir a la Directora Elena filtrar por docente (Pedro)', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/api/v1/academic/assignments?gestionId=${gestionFranzId}&maestroId=${maestroPedroId}`,
        )
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].docente.rda).toBe('RDA-77889');
    });
  });

  // -------------------------------------------------------------
  // CICLO DE VIDA Y MODIFICACIONES
  // -------------------------------------------------------------
  describe('US-004: Modificación de Estado y Cese de Asignación Docente', () => {
    it('debe permitir cambiar el estado de la asignación de Raúl a SUSPENDIDA', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/academic/assignments/${asignacionRaulFranzId}/status`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .send({
          estado: EstadoAsignacion.SUSPENDIDA,
          motivo: 'Licencia por salud de 15 días',
        })
        .expect(200);

      expect(res.body.estado).toBe(EstadoAsignacion.SUSPENDIDA);
    });

    it('debe permitir dar de baja (soft-delete) la asignación de Pedro', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/academic/assignments/${asignacionPedroFranzId}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verificar que ya no figura en la matriz activa
      const checkRes = await request(app.getHttpServer())
        .get(`/api/v1/academic/assignments?gestionId=${gestionFranzId}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      const ids = checkRes.body.map((a: any) => a.id);
      expect(ids).not.toContain(asignacionPedroFranzId);
    });
  });
});
