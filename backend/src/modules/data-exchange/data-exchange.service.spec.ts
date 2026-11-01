import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RolInstitucional, TipoAuditoria } from '@prisma/client';
import { DataExchangeService } from './data-exchange.service';
import { SpreadsheetParserService } from './spreadsheet-parser.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PasswordService } from '../auth/password.service';

describe('DataExchangeService (Unit Tests)', () => {
  let service: DataExchangeService;
  let parser: SpreadsheetParserService;
  let prisma: any;
  let auditService: any;
  let passwordService: any;

  const mockInstitucionId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '99999999-9999-9999-9999-999999999999';

  beforeEach(async () => {
    prisma = {
      paralelo: { findFirst: jest.fn() },
      persona: { findUnique: jest.fn(), create: jest.fn() },
      estudiante: { findUnique: jest.fn(), create: jest.fn() },
      inscripcion: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn() },
      usuario: { findFirst: jest.fn(), create: jest.fn() },
      maestro: { findUnique: jest.fn(), create: jest.fn() },
      vinculacionInstitucional: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    passwordService = {
      hash: jest.fn().mockResolvedValue('argon2id$hashedpassword'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataExchangeService,
        SpreadsheetParserService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: PasswordService, useValue: passwordService },
      ],
    }).compile();

    service = module.get<DataExchangeService>(DataExchangeService);
    parser = module.get<SpreadsheetParserService>(SpreadsheetParserService);
  });

  describe('SpreadsheetParserService', () => {
    it('debe generar y parsear un buffer CSV correctamente', () => {
      const data = [
        { ci: '1234567', nombres: 'Mateo', primerApellido: 'Arce' },
        { ci: '7654321', nombres: 'Lucia', primerApellido: 'Perez' },
      ];

      const csvBuffer = parser.generateBuffer(data, 'csv');
      expect(Buffer.isBuffer(csvBuffer)).toBe(true);

      const parsed = parser.parseBuffer(csvBuffer);
      expect(parsed.length).toBe(2);
      expect(parsed[0].ci).toBe('1234567');
      expect(parsed[0].nombres).toBe('Mateo');
      expect(parsed[1].ci).toBe('7654321');
    });

    it('debe generar un buffer XLSX válido', () => {
      const data = [{ col1: 'Valor 1', col2: 100 }];
      const xlsxBuffer = parser.generateBuffer(data, 'xlsx');
      expect(Buffer.isBuffer(xlsxBuffer)).toBe(true);
      expect(xlsxBuffer.length).toBeGreaterThan(100);
    });
  });

  describe('importStudents', () => {
    it('debe procesar e importar estudiantes válidos', async () => {
      prisma.paralelo.findFirst.mockResolvedValue({
        id: 'par-1',
        gestionId: 'gest-1',
        institucionId: mockInstitucionId,
      });

      const csvContent =
        'ci,nombres,primerApellido,codigoRude\n' +
        '10001,Mateo,Arce,8073004501\n' +
        '10002,Lucia,Zeballos,8073004502\n';
      const fileBuffer = Buffer.from(csvContent, 'utf-8');

      prisma.persona.findUnique.mockResolvedValue(null);
      prisma.persona.create
        .mockResolvedValueOnce({ id: 'pers-1', ci: '10001' })
        .mockResolvedValueOnce({ id: 'pers-2', ci: '10002' });

      prisma.estudiante.findUnique.mockResolvedValue(null);
      prisma.estudiante.create
        .mockResolvedValueOnce({ id: 'est-1', codigoRude: '8073004501' })
        .mockResolvedValueOnce({ id: 'est-2', codigoRude: '8073004502' });

      prisma.inscripcion.findFirst.mockResolvedValue(null);
      prisma.inscripcion.create.mockResolvedValue({ id: 'ins-1' });

      const result = await service.importStudents(
        mockInstitucionId,
        'par-1',
        fileBuffer,
        mockUserId,
      );

      expect(result.totalFilas).toBe(2);
      expect(result.creados).toBe(2);
      expect(result.duplicados).toBe(0);
      expect(result.errores.length).toBe(0);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'BULK_STUDENTS_IMPORTED',
        }),
      );
    });

    it('debe registrar error por fila si faltan campos requeridos', async () => {
      prisma.paralelo.findFirst.mockResolvedValue({
        id: 'par-1',
        gestionId: 'gest-1',
      });

      const csvContent =
        'ci,nombres,primerApellido,codigoRude\n' +
        ',Mateo,Arce,8073004501\n'; // CI vacío
      const fileBuffer = Buffer.from(csvContent, 'utf-8');

      const result = await service.importStudents(
        mockInstitucionId,
        'par-1',
        fileBuffer,
        mockUserId,
      );

      expect(result.creados).toBe(0);
      expect(result.errores.length).toBe(1);
      expect(result.errores[0].fila).toBe(2);
    });

    it('debe contabilizar inscripciones duplicadas sin abortar', async () => {
      prisma.paralelo.findFirst.mockResolvedValue({
        id: 'par-1',
        gestionId: 'gest-1',
      });

      const csvContent =
        'ci,nombres,primerApellido,codigoRude\n' +
        '10001,Mateo,Arce,8073004501\n';
      const fileBuffer = Buffer.from(csvContent, 'utf-8');

      prisma.persona.findUnique.mockResolvedValue({ id: 'pers-1', ci: '10001' });
      prisma.estudiante.findUnique.mockResolvedValue({ id: 'est-1', codigoRude: '8073004501' });
      prisma.inscripcion.findFirst.mockResolvedValue({ id: 'ins-existente' });

      const result = await service.importStudents(
        mockInstitucionId,
        'par-1',
        fileBuffer,
        mockUserId,
      );

      expect(result.creados).toBe(0);
      expect(result.duplicados).toBe(1);
      expect(result.errores.length).toBe(0);
    });
  });

  describe('importTeachers', () => {
    it('debe importar docentes y crear sus vinculaciones institucionales', async () => {
      const csvContent =
        'ci,nombres,primerApellido,email,rda,especialidad,cargo\n' +
        '55551,Hugo,Alvarez,hugo@minedu.bo,RDA-551,Matemática,DOCENTE\n';
      const fileBuffer = Buffer.from(csvContent, 'utf-8');

      prisma.persona.findUnique.mockResolvedValue(null);
      prisma.persona.create.mockResolvedValue({ id: 'pers-hugo', ci: '55551' });

      prisma.usuario.findFirst.mockResolvedValue(null);
      prisma.usuario.create.mockResolvedValue({ id: 'user-hugo', email: 'hugo@minedu.bo' });

      prisma.maestro.findUnique.mockResolvedValue(null);
      prisma.maestro.create.mockResolvedValue({ id: 'maestro-hugo', rda: 'RDA-551' });

      prisma.vinculacionInstitucional.findFirst.mockResolvedValue(null);
      prisma.vinculacionInstitucional.create.mockResolvedValue({ id: 'vinc-1' });

      const result = await service.importTeachers(mockInstitucionId, fileBuffer, mockUserId);

      expect(result.totalFilas).toBe(1);
      expect(result.creados).toBe(1);
      expect(result.errores.length).toBe(0);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'BULK_TEACHERS_IMPORTED',
        }),
      );
    });
  });

  describe('exportStudents y exportTeachers', () => {
    it('debe exportar la lista de estudiantes generando un buffer y nombre de archivo', async () => {
      prisma.paralelo.findFirst.mockResolvedValue({
        id: 'par-1',
        letra: 'A',
        curso: { nombre: '1ro Secundaria' },
        gestion: { anio: 2026 },
      });

      prisma.inscripcion.findMany.mockResolvedValue([
        {
          estudiante: {
            codigoRude: 'RUDE-111',
            nombreTutor: 'Juan Arce',
            telefonoTutor: '70000001',
            persona: {
              ci: '11111',
              complemento: null,
              primerApellido: 'Arce',
              segundoApellido: null,
              nombres: 'Mateo',
              genero: 'M',
              fechaNacimiento: new Date('2012-01-01'),
              telefono: null,
            },
          },
        },
      ]);

      const result = await service.exportStudents(mockInstitucionId, 'par-1', 'xlsx', mockUserId);

      expect(Buffer.isBuffer(result.buffer)).toBe(true);
      expect(result.filename).toContain('estudiantes_1ro_secundaria_a_2026.xlsx');
    });

    it('debe generar plantillas oficiales de descarga', () => {
      const template = service.getStudentsTemplate('csv');
      expect(Buffer.isBuffer(template.buffer)).toBe(true);
      expect(template.filename).toBe('plantilla_estudiantes.csv');
      expect(template.mimeType).toBe('text/csv');
    });
  });
});
