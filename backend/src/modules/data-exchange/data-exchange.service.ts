import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EstadoInscripcion,
  EstadoVinculacion,
  RolGlobal,
  RolInstitucional,
  TipoAuditoria,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PasswordService } from '../auth/password.service';
import { SpreadsheetParserService } from './spreadsheet-parser.service';

@Injectable()
export class DataExchangeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly passwordService: PasswordService,
    private readonly parser: SpreadsheetParserService,
  ) {}

  /**
   * Importa por lote estudiantes e inscripciones para un paralelo determinado
   */
  async importStudents(
    institucionId: string,
    paraleloId: string,
    fileBuffer: Buffer,
    userId: string,
  ) {
    const paralelo = await this.prisma.paralelo.findFirst({
      where: { id: paraleloId, institucionId, activo: true },
    });

    if (!paralelo) {
      throw new NotFoundException('Paralelo no encontrado');
    }

    const rows = this.parser.parseBuffer(fileBuffer);
    if (!rows || rows.length === 0) {
      throw new BadRequestException('El archivo no contiene registros para importar');
    }

    let creados = 0;
    let duplicados = 0;
    const errores: Array<{ fila: number; error: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // Fila Excel considerando cabecera en fila 1
      const raw = rows[i];

      // Normalización de claves (case-insensitive)
      const row: Record<string, any> = {};
      Object.keys(raw).forEach((k) => {
        row[k.trim().toLowerCase()] = String(raw[k]).trim();
      });

      const ci = row['ci'] || row['cedula'] || row['carnet'];
      const complemento = row['complemento'] || null;
      const nombres = row['nombres'] || row['nombre'];
      const primerApellido = row['primerapellido'] || row['paterno'] || row['apellido_paterno'];
      const segundoApellido = row['segundoapellido'] || row['materno'] || row['apellido_materno'] || null;
      const codigoRude = row['codigorude'] || row['rude'];
      const genero = (row['genero'] || 'M').toUpperCase().startsWith('F') ? 'F' : 'M';
      const fechaNacRaw = row['fechanacimiento'] || row['fecha_nacimiento'] || row['fechanac'] || '2010-01-01';
      const direccion = row['direccion'] || 'Sin dirección registrada';
      const telefono = row['telefono'] || null;
      const nombreTutor = row['nombretutor'] || row['tutor'] || null;
      const ciTutor = row['citutor'] || null;
      const telefonoTutor = row['telefonotutor'] || null;

      if (!ci || !nombres || !primerApellido || !codigoRude) {
        errores.push({
          fila: rowNum,
          error: 'Faltan campos obligatorios (ci, nombres, primerApellido, codigoRude)',
        });
        continue;
      }

      let fechaNacimiento = new Date(fechaNacRaw);
      if (isNaN(fechaNacimiento.getTime())) {
        fechaNacimiento = new Date('2010-01-01');
      }

      try {
        // 1. Buscar o crear Persona
        let persona = await this.prisma.persona.findUnique({
          where: { ci },
        });

        if (!persona) {
          persona = await this.prisma.persona.create({
            data: {
              ci,
              complemento,
              nombres,
              primerApellido,
              segundoApellido,
              genero,
              fechaNacimiento,
              direccion,
              telefono,
            },
          });
        }

        // 2. Buscar o crear Estudiante
        let estudiante = await this.prisma.estudiante.findUnique({
          where: { codigoRude },
        });

        if (!estudiante) {
          estudiante = await this.prisma.estudiante.create({
            data: {
              personaId: persona.id,
              codigoRude,
              nombreTutor,
              ciTutor,
              telefonoTutor,
            },
          });
        }

        // 3. Verificar si ya está inscrito en el paralelo
        const inscripcionExistente = await this.prisma.inscripcion.findFirst({
          where: {
            institucionId,
            gestionId: paralelo.gestionId,
            paraleloId,
            estudianteId: estudiante.id,
            activo: true,
          },
        });

        if (inscripcionExistente) {
          duplicados++;
          continue;
        }

        // 4. Crear inscripción
        await this.prisma.inscripcion.create({
          data: {
            institucionId,
            gestionId: paralelo.gestionId,
            paraleloId,
            estudianteId: estudiante.id,
            estado: EstadoInscripcion.EFECTIVO,
          },
        });

        creados++;
      } catch (err: any) {
        errores.push({
          fila: rowNum,
          error: err.message || 'Error al persistir registro',
        });
      }
    }

    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_CREATE,
      accion: 'BULK_STUDENTS_IMPORTED',
      detalle: {
        paraleloId,
        totalFilas: rows.length,
        creados,
        duplicados,
        erroresCount: errores.length,
      },
    });

    return {
      totalFilas: rows.length,
      creados,
      duplicados,
      errores,
    };
  }

  /**
   * Importa por lote docentes y vinculaciones institucionales
   */
  async importTeachers(
    institucionId: string,
    fileBuffer: Buffer,
    userId: string,
  ) {
    const rows = this.parser.parseBuffer(fileBuffer);
    if (!rows || rows.length === 0) {
      throw new BadRequestException('El archivo no contiene registros para importar');
    }

    let creados = 0;
    let duplicados = 0;
    const errores: Array<{ fila: number; error: string }> = [];

    const defaultPasswordHash = await this.passwordService.hash('Bolivia2026!');

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const raw = rows[i];

      const row: Record<string, any> = {};
      Object.keys(raw).forEach((k) => {
        row[k.trim().toLowerCase()] = String(raw[k]).trim();
      });

      const ci = row['ci'] || row['cedula'];
      const complemento = row['complemento'] || null;
      const nombres = row['nombres'] || row['nombre'];
      const primerApellido = row['primerapellido'] || row['paterno'];
      const segundoApellido = row['segundoapellido'] || row['materno'] || null;
      const genero = (row['genero'] || 'M').toUpperCase().startsWith('F') ? 'F' : 'M';
      const email = row['email'] || row['correo'];
      const telefono = row['telefono'] || null;
      const rda = row['rda'] || row['codigorda'];
      const especialidad = row['especialidad'] || 'General';
      const cargoRaw = (row['cargo'] || row['rol'] || 'DOCENTE').toUpperCase();

      let rolInstitucional: RolInstitucional = RolInstitucional.MAESTRO;
      if (cargoRaw.includes('DIRECTOR')) {
        rolInstitucional = RolInstitucional.DIRECTOR;
      } else if (cargoRaw.includes('SECRETARI')) {
        rolInstitucional = RolInstitucional.SECRETARIO;
      } else if (cargoRaw.includes('COMISION') || cargoRaw.includes('PEDAGOGIC')) {
        rolInstitucional = RolInstitucional.COMISION_PEDAGOGICA;
      }

      if (!ci || !nombres || !primerApellido || !email || !rda) {
        errores.push({
          fila: rowNum,
          error: 'Faltan campos obligatorios (ci, nombres, primerApellido, email, rda)',
        });
        continue;
      }

      try {
        // 1. Persona
        let persona = await this.prisma.persona.findUnique({
          where: { ci },
        });

        if (!persona) {
          persona = await this.prisma.persona.create({
            data: {
              ci,
              complemento,
              nombres,
              primerApellido,
              segundoApellido,
              genero,
              direccion: 'Sin dirección',
              telefono,
            },
          });
        }

        // 2. Usuario
        let usuario = await this.prisma.usuario.findFirst({
          where: {
            OR: [{ email }, { personaId: persona.id }],
          },
        });

        if (!usuario) {
          usuario = await this.prisma.usuario.create({
            data: {
              personaId: persona.id,
              email,
              passwordHash: defaultPasswordHash,
              rolGlobal: RolGlobal.INSTITUTIONAL_USER,
            },
          });
        }

        // 3. Maestro
        let maestro = await this.prisma.maestro.findUnique({
          where: { rda },
        });

        if (!maestro) {
          maestro = await this.prisma.maestro.create({
            data: {
              personaId: persona.id,
              rda,
              especialidad,
            },
          });
        }

        // 4. Vinculación Institucional
        const vinculacionExistente = await this.prisma.vinculacionInstitucional.findFirst({
          where: {
            institucionId,
            usuarioId: usuario.id,
            maestroId: maestro.id,
            estado: EstadoVinculacion.ACTIVO,
          },
        });

        if (vinculacionExistente) {
          duplicados++;
          continue;
        }

        await this.prisma.vinculacionInstitucional.create({
          data: {
            institucionId,
            usuarioId: usuario.id,
            maestroId: maestro.id,
            rolInstitucional,
            estado: EstadoVinculacion.ACTIVO,
          },
        });

        creados++;
      } catch (err: any) {
        errores.push({
          fila: rowNum,
          error: err.message || 'Error al persistir docente',
        });
      }
    }

    await this.auditService.log({
      usuarioId: userId,
      institucionId,
      tipo: TipoAuditoria.USER_CREATE,
      accion: 'BULK_TEACHERS_IMPORTED',
      detalle: {
        totalFilas: rows.length,
        creados,
        duplicados,
        erroresCount: errores.length,
      },
    });

    return {
      totalFilas: rows.length,
      creados,
      duplicados,
      errores,
    };
  }

  /**
   * Exporta nómina de estudiantes de un paralelo en Excel o CSV
   */
  async exportStudents(
    institucionId: string,
    paraleloId: string,
    format: 'xlsx' | 'csv' = 'xlsx',
    userId?: string,
  ) {
    const paralelo = await this.prisma.paralelo.findFirst({
      where: { id: paraleloId, institucionId, activo: true },
      include: { curso: true, gestion: true, institucion: true },
    });

    if (!paralelo) {
      throw new NotFoundException('Paralelo no encontrado');
    }

    const inscripciones = await this.prisma.inscripcion.findMany({
      where: {
        paraleloId,
        institucionId,
        estado: EstadoInscripcion.EFECTIVO,
        activo: true,
      },
      include: {
        estudiante: {
          include: {
            persona: true,
          },
        },
      },
    });

    const sorted = [...inscripciones].sort((a, b) => {
      const apeA = `${a.estudiante.persona.primerApellido} ${a.estudiante.persona.segundoApellido || ''}`.trim();
      const apeB = `${b.estudiante.persona.primerApellido} ${b.estudiante.persona.segundoApellido || ''}`.trim();
      return apeA.localeCompare(apeB, 'es');
    });

    const rows = sorted.map((ins, index) => {
      const p = ins.estudiante.persona;
      return {
        'Nº': index + 1,
        'Código RUDE': ins.estudiante.codigoRude,
        'Cédula de Identidad': p.ci,
        'Complemento': p.complemento || '',
        'Primer Apellido': p.primerApellido,
        'Segundo Apellido': p.segundoApellido || '',
        'Nombres': p.nombres,
        'Género': p.genero,
        'Fecha de Nacimiento': p.fechaNacimiento ? p.fechaNacimiento.toISOString().split('T')[0] : '',
        'Nombre Tutor': ins.estudiante.nombreTutor || '',
        'Teléfono Tutor': ins.estudiante.telefonoTutor || p.telefono || '',
      };
    });

    const buffer = this.parser.generateBuffer(rows, format, 'Estudiantes');
    const filename = `estudiantes_${paralelo.curso.nombre}_${paralelo.letra}_${paralelo.gestion.anio}.${format}`
      .replace(/\s+/g, '_')
      .toLowerCase();

    if (userId) {
      await this.auditService.log({
        usuarioId: userId,
        institucionId,
        tipo: TipoAuditoria.USER_UPDATE,
        accion: 'BULK_STUDENTS_EXPORTED',
        detalle: { paraleloId, format, total: rows.length },
      });
    }

    return {
      buffer,
      filename,
      mimeType:
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  /**
   * Exporta nómina de docentes vinculados en Excel o CSV
   */
  async exportTeachers(
    institucionId: string,
    format: 'xlsx' | 'csv' = 'xlsx',
    userId?: string,
  ) {
    const vinculaciones = await this.prisma.vinculacionInstitucional.findMany({
      where: { institucionId, estado: EstadoVinculacion.ACTIVO },
      include: {
        usuario: {
          include: {
            persona: true,
          },
        },
        maestro: true,
      },
    });

    const rows = vinculaciones.map((v, index) => {
      const p = v.usuario.persona;
      return {
        'Nº': index + 1,
        'RDA': v.maestro?.rda || '',
        'Cédula de Identidad': p.ci,
        'Primer Apellido': p.primerApellido,
        'Segundo Apellido': p.segundoApellido || '',
        'Nombres': p.nombres,
        'Especialidad': v.maestro?.especialidad || '',
        'Cargo': v.rolInstitucional,
        'Email': v.usuario.email,
        'Teléfono': p.telefono || '',
      };
    });

    const buffer = this.parser.generateBuffer(rows, format, 'Docentes');
    const filename = `docentes_${institucionId.substring(0, 8)}.${format}`;

    if (userId) {
      await this.auditService.log({
        usuarioId: userId,
        institucionId,
        tipo: TipoAuditoria.USER_UPDATE,
        accion: 'BULK_TEACHERS_EXPORTED',
        detalle: { format, total: rows.length },
      });
    }

    return {
      buffer,
      filename,
      mimeType:
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  /**
   * Genera plantilla oficial de estudiantes en Excel o CSV
   */
  getStudentsTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
    const sampleRows = [
      {
        ci: '10293847',
        complemento: '',
        nombres: 'Mateo',
        primerApellido: 'Arce',
        segundoApellido: 'Mendoza',
        fechaNacimiento: '2012-05-14',
        genero: 'M',
        direccion: 'Av. 6 de Agosto',
        telefono: '71234567',
        codigoRude: '80730045202601M',
        nombreTutor: 'Ramiro Arce',
        ciTutor: '4829102',
        telefonoTutor: '71234567',
      },
    ];

    const buffer = this.parser.generateBuffer(sampleRows, format, 'PlantillaEstudiantes');
    return {
      buffer,
      filename: `plantilla_estudiantes.${format}`,
      mimeType:
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  /**
   * Genera plantilla oficial de docentes en Excel o CSV
   */
  getTeachersTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
    const sampleRows = [
      {
        ci: '6789012',
        complemento: '',
        nombres: 'Hugo',
        primerApellido: 'Alvarez',
        segundoApellido: 'Flores',
        genero: 'M',
        email: 'hugo.alvarez@minedu.gob.bo',
        telefono: '78901234',
        rda: 'RDA-88990',
        especialidad: 'Matemática',
        cargo: 'DOCENTE',
      },
    ];

    const buffer = this.parser.generateBuffer(sampleRows, format, 'PlantillaDocentes');
    return {
      buffer,
      filename: `plantilla_docentes.${format}`,
      mimeType:
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}
