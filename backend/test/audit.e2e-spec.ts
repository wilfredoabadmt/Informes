import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { PasswordService } from '../src/modules/auth/password.service';
import {
  RolGlobal,
  RolInstitucional,
  EstadoVinculacion,
  TipoAuditoria,
} from '@prisma/client';

describe('Feature 012: Auditoría del Sistema e Inspección de Seguridad (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superadminToken: string;
  let directorElenaToken: string;
  let maestroHugoToken: string;

  let colFranzTamayoId: string;
  let colMariscalSucreId: string;

  let logFranzId: string;
  let logMariscalId: string;

  let personaHugoId: string;
  let userHugoId: string;
  let maestroHugoId: string;

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

    // 1. Colegios
    const franz = await prisma.unidadEducativa.findUnique({ where: { sie: '80730045' } });
    const mariscal = await prisma.unidadEducativa.findUnique({ where: { sie: '80730046' } });
    colFranzTamayoId = franz!.id;
    colMariscalSucreId = mariscal!.id;

    // 2. Logins Superadmin y Directora Elena
    const resAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin@minedu.gob.bo', password: 'Bolivia2026!' });
    superadminToken = resAdmin.body.tokens.accessToken;

    const resElena = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'elena.flores@minedu.gob.bo', password: 'Bolivia2026!' });
    directorElenaToken = resElena.body.tokens.accessToken;

    // 3. Crear Maestro Hugo con RolInstitucional MAESTRO en Franz Tamayo
    const persHugo = await prisma.persona.create({
      data: {
        ci: '7766551-AUD',
        nombres: 'Hugo',
        primerApellido: 'Rios',
        segundoApellido: 'Maldonado',
        genero: 'M',
        direccion: 'Calle 8',
        telefono: '79998877',
      },
    });
    personaHugoId = persHugo.id;

    const uHugo = await prisma.usuario.create({
      data: {
        personaId: personaHugoId,
        email: 'hugo.audit@minedu.gob.bo',
        passwordHash: validPasswordHash,
        rolGlobal: RolGlobal.INSTITUTIONAL_USER,
      },
    });
    userHugoId = uHugo.id;

    const mHugo = await prisma.maestro.create({
      data: {
        personaId: personaHugoId,
        rda: 'RDA-AUDIT-01',
        especialidad: 'Lenguaje',
      },
    });
    maestroHugoId = mHugo.id;

    await prisma.vinculacionInstitucional.create({
      data: {
        institucionId: colFranzTamayoId,
        usuarioId: userHugoId,
        maestroId: maestroHugoId,
        rolInstitucional: RolInstitucional.MAESTRO,
        estado: EstadoVinculacion.ACTIVO,
      },
    });

    const resHugo = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'hugo.audit@minedu.gob.bo', password: 'Bolivia2026!' });
    maestroHugoToken = resHugo.body.tokens.accessToken;

    // 4. Crear registros de auditoría representativos
    const logFranz = await prisma.registroAuditoria.create({
      data: {
        institucionId: colFranzTamayoId,
        usuarioId: userHugoId,
        tipo: TipoAuditoria.USER_UPDATE,
        accion: 'RECTIFICACION_CALIFICACION_PRUEBA',
        detalle: { motivo: 'Error de tipeo', materia: 'Lenguaje' },
        ip: '192.168.1.10',
        userAgent: 'Mozilla/5.0 Test Suite',
      },
    });
    logFranzId = logFranz.id;

    const logMariscal = await prisma.registroAuditoria.create({
      data: {
        institucionId: colMariscalSucreId,
        tipo: TipoAuditoria.USER_CREATE,
        accion: 'CREACION_ESTUDIANTE_PRUEBA',
        detalle: { rude: '80730046202699X' },
        ip: '192.168.1.20',
        userAgent: 'Mozilla/5.0 Test Suite',
      },
    });
    logMariscalId = logMariscal.id;
  });

  afterAll(async () => {
    // Limpieza
    await prisma.registroAuditoria.deleteMany({
      where: { id: { in: [logFranzId, logMariscalId] } },
    });
    await prisma.registroAuditoria.deleteMany({
      where: { accion: 'GLOBAL_AUDIT_INSPECTED' },
    });
    await prisma.vinculacionInstitucional.deleteMany({
      where: { usuarioId: userHugoId },
    });
    await prisma.maestro.deleteMany({
      where: { id: maestroHugoId },
    });
    await prisma.usuario.deleteMany({
      where: { id: userHugoId },
    });
    await prisma.persona.deleteMany({
      where: { id: personaHugoId },
    });

    await app.close();
  });

  describe('US-001 & US-004: Consulta Global de Auditoría (Nivel 1 - Superadmin)', () => {
    it('debe permitir a Superadmin consultar auditoría transversal y registrar traza de Principio 7', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/audit/logs?limit=50')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.page).toBe(1);

      // Verificar que incluye logs de múltiples instituciones
      const hasFranz = res.body.data.some((l: any) => l.institucionId === colFranzTamayoId);
      const hasMariscal = res.body.data.some((l: any) => l.institucionId === colMariscalSucreId);
      expect(hasFranz).toBe(true);
      expect(hasMariscal).toBe(true);

      // Verificar Principio 7: El sistema debe haber registrado un evento GLOBAL_AUDIT_INSPECTED
      const inspectionLog = await prisma.registroAuditoria.findFirst({
        where: {
          accion: 'GLOBAL_AUDIT_INSPECTED',
          tipo: TipoAuditoria.SECURITY_VIOLATION,
        },
      });
      expect(inspectionLog).toBeDefined();
    });

    it('debe permitir a Superadmin filtrar logs por una institución específica', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/audit/logs?institucionId=${colFranzTamayoId}&limit=50`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      const todosDeFranz = res.body.data.every((l: any) => l.institucionId === colFranzTamayoId);
      expect(todosDeFranz).toBe(true);
    });
  });

  describe('US-001 & US-002: Consulta Institucional de Auditoría (Nivel 2 - Director)', () => {
    it('debe permitir a Directora Elena consultar los logs exclusivamente de su colegio', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/audit/logs?limit=50')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      const todosDeFranz = res.body.data.every((l: any) => l.institucionId === colFranzTamayoId);
      expect(todosDeFranz).toBe(true);
    });

    it('debe rechazar con 400 Bad Request si el usuario institucional no provee X-Institution-Id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/audit/logs')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .expect(400);
    });

    it('debe permitir consultar el detalle de un evento propio por ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/audit/logs/${logFranzId}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(res.body.id).toBe(logFranzId);
      expect(res.body.accion).toBe('RECTIFICACION_CALIFICACION_PRUEBA');
      expect(res.body.detalle.motivo).toBe('Error de tipeo');
    });

    it('debe retornar 404 Not Found si Directora intenta consultar un log de otra institución', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/audit/logs/${logMariscalId}`)
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(404);
    });
  });

  describe('Control de Acceso y RBAC', () => {
    it('debe denegar con 403 Forbidden a un docente (MAESTRO) el acceso a la auditoría', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/audit/logs')
        .set('Authorization', `Bearer ${maestroHugoToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(403);
    });
  });

  describe('US-003: Estadísticas Agregadas de Auditoría', () => {
    it('debe retornar las estadísticas de eventos para la institución', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/audit/stats')
        .set('Authorization', `Bearer ${directorElenaToken}`)
        .set('X-Institution-Id', colFranzTamayoId)
        .expect(200);

      expect(res.body.totalEventos).toBeGreaterThanOrEqual(1);
      expect(res.body.porTipo).toBeDefined();
      expect(res.body.topAcciones).toBeDefined();
      expect(Array.isArray(res.body.topAcciones)).toBe(true);
    });
  });
});
