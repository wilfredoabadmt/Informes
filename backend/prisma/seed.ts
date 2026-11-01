import {
  PrismaClient,
  RolGlobal,
  RolInstitucional,
  EstadoUsuario,
  EstadoVinculacion,
  TipoInstitucion,
  NivelEducativo,
  CampoSaberes,
  EstadoGestion,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos multi-tenant...');

  // 1. Password genérica de desarrollo hasheada con Argon2id
  const defaultPasswordHash = await argon2.hash('Bolivia2026!');

  // 2. Persona y Usuario: Superadministrador Central
  const personaAdmin = await prisma.persona.upsert({
    where: { ci: '10000001' },
    update: {},
    create: {
      ci: '10000001',
      nombres: 'Administrador',
      primerApellido: 'Central',
      segundoApellido: 'Nacional',
      direccion: 'Av. Arce #2147, La Paz',
      telefono: '22443322',
    },
  });

  const adminUser = await prisma.usuario.upsert({
    where: { email: 'admin@minedu.gob.bo' },
    update: {},
    create: {
      personaId: personaAdmin.id,
      email: 'admin@minedu.gob.bo',
      passwordHash: defaultPasswordHash,
      rolGlobal: RolGlobal.SUPERADMIN,
      estado: EstadoUsuario.ACTIVO,
    },
  });

  console.log(`✅ Superadmin creado: ${adminUser.email}`);

  // 3. Unidades Educativas (Tenants)
  const colFranzTamayo = await prisma.unidadEducativa.upsert({
    where: { sie: '80730045' },
    update: {},
    create: {
      sie: '80730045',
      nombre: 'Unidad Educativa Franz Tamayo',
      departamento: 'La Paz',
      provincia: 'Murillo',
      municipio: 'La Paz',
      distrito: 'La Paz 1',
      direccion: 'Zona Miraflores, Calle Cuba #450',
      telefono: '2221234',
      tipo: TipoInstitucion.FISCAL,
      nivel: NivelEducativo.INTEGRADO,
      activo: true,
    },
  });

  const colMariscalSucre = await prisma.unidadEducativa.upsert({
    where: { sie: '80730046' },
    update: {},
    create: {
      sie: '80730046',
      nombre: 'Unidad Educativa Mariscal Sucre',
      departamento: 'La Paz',
      provincia: 'Murillo',
      municipio: 'El Alto',
      distrito: 'El Alto 1',
      direccion: 'Zona Ciudad Satélite, Av. Del Policía #120',
      telefono: '2281234',
      tipo: TipoInstitucion.FISCAL,
      nivel: NivelEducativo.INTEGRADO,
      activo: true,
    },
  });

  console.log(`✅ Unidades Educativas creadas: SIE ${colFranzTamayo.sie} y ${colMariscalSucre.sie}`);

  // 4. Maestro 1: Carlos Mamani Condori (MULTI-TENANT: Trabaja en ambas instituciones)
  const personaCarlos = await prisma.persona.upsert({
    where: { ci: '6849302' },
    update: {},
    create: {
      ci: '6849302',
      nombres: 'Carlos',
      primerApellido: 'Mamani',
      segundoApellido: 'Condori',
      telefono: '71542389',
    },
  });

  const usuarioCarlos = await prisma.usuario.upsert({
    where: { email: 'carlos.mamani@minedu.gob.bo' },
    update: {},
    create: {
      personaId: personaCarlos.id,
      email: 'carlos.mamani@minedu.gob.bo',
      passwordHash: defaultPasswordHash,
      rolGlobal: RolGlobal.INSTITUTIONAL_USER,
      estado: EstadoUsuario.ACTIVO,
    },
  });

  const maestroCarlos = await prisma.maestro.upsert({
    where: { rda: 'RDA-98321' },
    update: {},
    create: {
      personaId: personaCarlos.id,
      rda: 'RDA-98321',
      tituloProfesional: 'Licenciado en Ciencias de la Educación - Mención Matemática',
      especialidad: 'Matemática y Ciencias Naturales',
      anioEgreso: 2015,
      normalista: true,
    },
  });

  await prisma.vinculacionInstitucional.upsert({
    where: {
      institucionId_usuarioId_rolInstitucional: {
        institucionId: colFranzTamayo.id,
        usuarioId: usuarioCarlos.id,
        rolInstitucional: RolInstitucional.MAESTRO,
      },
    },
    update: {},
    create: {
      institucionId: colFranzTamayo.id,
      usuarioId: usuarioCarlos.id,
      maestroId: maestroCarlos.id,
      rolInstitucional: RolInstitucional.MAESTRO,
      cargoOficial: 'Profesor de Matemáticas - Secundaria',
      estado: EstadoVinculacion.ACTIVO,
    },
  });

  await prisma.vinculacionInstitucional.upsert({
    where: {
      institucionId_usuarioId_rolInstitucional: {
        institucionId: colMariscalSucre.id,
        usuarioId: usuarioCarlos.id,
        rolInstitucional: RolInstitucional.MAESTRO,
      },
    },
    update: {},
    create: {
      institucionId: colMariscalSucre.id,
      usuarioId: usuarioCarlos.id,
      maestroId: maestroCarlos.id,
      rolInstitucional: RolInstitucional.MAESTRO,
      cargoOficial: 'Profesor de Álgebra - Secundaria',
      estado: EstadoVinculacion.ACTIVO,
    },
  });

  // 5. Maestro 2: Elena Flores Quispe (Directora en Franz Tamayo)
  const personaElena = await prisma.persona.upsert({
    where: { ci: '7214589' },
    update: {},
    create: {
      ci: '7214589',
      nombres: 'Elena',
      primerApellido: 'Flores',
      segundoApellido: 'Quispe',
      telefono: '72098412',
    },
  });

  const usuarioElena = await prisma.usuario.upsert({
    where: { email: 'elena.flores@minedu.gob.bo' },
    update: {},
    create: {
      personaId: personaElena.id,
      email: 'elena.flores@minedu.gob.bo',
      passwordHash: defaultPasswordHash,
      rolGlobal: RolGlobal.INSTITUTIONAL_USER,
      estado: EstadoUsuario.ACTIVO,
    },
  });

  const maestroElena = await prisma.maestro.upsert({
    where: { rda: 'RDA-45120' },
    update: {},
    create: {
      personaId: personaElena.id,
      rda: 'RDA-45120',
      tituloProfesional: 'Licenciada en Pedagogía y Gestión Educativa',
      especialidad: 'Gestión Institucional',
      anioEgreso: 2010,
      normalista: true,
    },
  });

  await prisma.vinculacionInstitucional.upsert({
    where: {
      institucionId_usuarioId_rolInstitucional: {
        institucionId: colFranzTamayo.id,
        usuarioId: usuarioElena.id,
        rolInstitucional: RolInstitucional.DIRECTOR,
      },
    },
    update: {},
    create: {
      institucionId: colFranzTamayo.id,
      usuarioId: usuarioElena.id,
      maestroId: maestroElena.id,
      rolInstitucional: RolInstitucional.DIRECTOR,
      cargoOficial: 'Directora General Institucional',
      estado: EstadoVinculacion.ACTIVO,
    },
  });

  console.log(`✅ Directora creada: Elena Flores (Franz Tamayo)`);

  // -------------------------------------------------------------
  // 6. CATÁLOGO BASE DE CURSOS OFICIALES DE BOLIVIA
  // -------------------------------------------------------------
  const cursosData = [
    // Primaria Comunitaria Vocacional
    { nivel: NivelEducativo.PRIMARIA, grado: 1, nombre: '1º de Primaria Comunitaria Vocacional', orden: 1 },
    { nivel: NivelEducativo.PRIMARIA, grado: 2, nombre: '2º de Primaria Comunitaria Vocacional', orden: 2 },
    { nivel: NivelEducativo.PRIMARIA, grado: 3, nombre: '3º de Primaria Comunitaria Vocacional', orden: 3 },
    { nivel: NivelEducativo.PRIMARIA, grado: 4, nombre: '4º de Primaria Comunitaria Vocacional', orden: 4 },
    { nivel: NivelEducativo.PRIMARIA, grado: 5, nombre: '5º de Primaria Comunitaria Vocacional', orden: 5 },
    { nivel: NivelEducativo.PRIMARIA, grado: 6, nombre: '6º de Primaria Comunitaria Vocacional', orden: 6 },
    // Secundaria Comunitaria Productiva
    { nivel: NivelEducativo.SECUNDARIA, grado: 1, nombre: '1º de Secundaria Comunitaria Productiva', orden: 7 },
    { nivel: NivelEducativo.SECUNDARIA, grado: 2, nombre: '2º de Secundaria Comunitaria Productiva', orden: 8 },
    { nivel: NivelEducativo.SECUNDARIA, grado: 3, nombre: '3º de Secundaria Comunitaria Productiva', orden: 9 },
    { nivel: NivelEducativo.SECUNDARIA, grado: 4, nombre: '4º de Secundaria Comunitaria Productiva', orden: 10 },
    { nivel: NivelEducativo.SECUNDARIA, grado: 5, nombre: '5º de Secundaria Comunitaria Productiva', orden: 11 },
    { nivel: NivelEducativo.SECUNDARIA, grado: 6, nombre: '6º de Secundaria Comunitaria Productiva', orden: 12 },
  ];

  for (const c of cursosData) {
    await prisma.curso.upsert({
      where: { nivel_grado: { nivel: c.nivel, grado: c.grado } },
      update: { nombre: c.nombre, orden: c.orden },
      create: c,
    });
  }
  console.log('✅ Catálogo de 12 cursos oficiales creado (Primaria y Secundaria)');

  // -------------------------------------------------------------
  // 7. CATÁLOGO BASE DE MATERIAS OFICIALES DEL SEP
  // -------------------------------------------------------------
  const materiasData = [
    // Secundaria
    { codigo: 'SEC-MAT', nombre: 'Matemática', campo: CampoSaberes.CIENCIA_TECNOLOGIA_PRODUCCION, nivel: NivelEducativo.SECUNDARIA, orden: 1 },
    { codigo: 'SEC-LEN', nombre: 'Comunicación y Lenguajes', campo: CampoSaberes.COMUNIDAD_Y_SOCIEDAD, nivel: NivelEducativo.SECUNDARIA, orden: 2 },
    { codigo: 'SEC-BIO', nombre: 'Ciencias Naturales: Biología - Geografía', campo: CampoSaberes.VIDA_TIERRA_TERRITORIO, nivel: NivelEducativo.SECUNDARIA, orden: 3 },
    { codigo: 'SEC-FIS', nombre: 'Física', campo: CampoSaberes.VIDA_TIERRA_TERRITORIO, nivel: NivelEducativo.SECUNDARIA, orden: 4 },
    { codigo: 'SEC-QUI', nombre: 'Química', campo: CampoSaberes.VIDA_TIERRA_TERRITORIO, nivel: NivelEducativo.SECUNDARIA, orden: 5 },
    { codigo: 'SEC-SOC', nombre: 'Ciencias Sociales', campo: CampoSaberes.COMUNIDAD_Y_SOCIEDAD, nivel: NivelEducativo.SECUNDARIA, orden: 6 },
    { codigo: 'SEC-ART', nombre: 'Artes Plásticas y Visuales', campo: CampoSaberes.COMUNIDAD_Y_SOCIEDAD, nivel: NivelEducativo.SECUNDARIA, orden: 7 },
    { codigo: 'SEC-MUS', nombre: 'Educación Musical', campo: CampoSaberes.COMUNIDAD_Y_SOCIEDAD, nivel: NivelEducativo.SECUNDARIA, orden: 8 },
    { codigo: 'SEC-EFIS', nombre: 'Educación Física y Deportes', campo: CampoSaberes.COMUNIDAD_Y_SOCIEDAD, nivel: NivelEducativo.SECUNDARIA, orden: 9 },
    { codigo: 'SEC-FIL', nombre: 'Cosmovisiones, Filosofía y Sicología', campo: CampoSaberes.COSMOS_Y_PENSAMIENTO, nivel: NivelEducativo.SECUNDARIA, orden: 10 },
    { codigo: 'SEC-REL', nombre: 'Valores, Espiritualidades y Religiones', campo: CampoSaberes.COSMOS_Y_PENSAMIENTO, nivel: NivelEducativo.SECUNDARIA, orden: 11 },
    { codigo: 'SEC-TEC', nombre: 'Técnica Tecnológica General', campo: CampoSaberes.CIENCIA_TECNOLOGIA_PRODUCCION, nivel: NivelEducativo.SECUNDARIA, orden: 12 },
    // Primaria
    { codigo: 'PRI-COM', nombre: 'Comunicación y Lenguajes', campo: CampoSaberes.COMUNIDAD_Y_SOCIEDAD, nivel: NivelEducativo.PRIMARIA, orden: 1 },
    { codigo: 'PRI-MAT', nombre: 'Matemática', campo: CampoSaberes.CIENCIA_TECNOLOGIA_PRODUCCION, nivel: NivelEducativo.PRIMARIA, orden: 2 },
    { codigo: 'PRI-NAT', nombre: 'Ciencias Naturales', campo: CampoSaberes.VIDA_TIERRA_TERRITORIO, nivel: NivelEducativo.PRIMARIA, orden: 3 },
    { codigo: 'PRI-SOC', nombre: 'Ciencias Sociales', campo: CampoSaberes.COMUNIDAD_Y_SOCIEDAD, nivel: NivelEducativo.PRIMARIA, orden: 4 },
    { codigo: 'PRI-ART', nombre: 'Artes Plásticas y Visuales', campo: CampoSaberes.COMUNIDAD_Y_SOCIEDAD, nivel: NivelEducativo.PRIMARIA, orden: 5 },
    { codigo: 'PRI-MUS', nombre: 'Educación Musical', campo: CampoSaberes.COMUNIDAD_Y_SOCIEDAD, nivel: NivelEducativo.PRIMARIA, orden: 6 },
    { codigo: 'PRI-EFIS', nombre: 'Educación Física y Deportes', campo: CampoSaberes.COMUNIDAD_Y_SOCIEDAD, nivel: NivelEducativo.PRIMARIA, orden: 7 },
    { codigo: 'PRI-VAL', nombre: 'Valores, Espiritualidad y Religiones', campo: CampoSaberes.COSMOS_Y_PENSAMIENTO, nivel: NivelEducativo.PRIMARIA, orden: 8 },
  ];

  for (const m of materiasData) {
    await prisma.materia.upsert({
      where: { codigo: m.codigo },
      update: { nombre: m.nombre, campo: m.campo, nivel: m.nivel, orden: m.orden },
      create: m,
    });
  }
  console.log(`✅ Catálogo de ${materiasData.length} materias del SEP creado en los 4 Campos de Saberes`);

  // -------------------------------------------------------------
  // 8. CATÁLOGO SAAS: PLANES DE SUSCRIPCIÓN & FACTURACIÓN
  // -------------------------------------------------------------
  await prisma.planSuscripcion.upsert({
    where: { codigo: 'PLAN_BASIC' },
    update: {},
    create: {
      codigo: 'PLAN_BASIC',
      nombre: 'Plan Básico / Rural',
      descripcion: 'Para maestros independientes o unidades educativas rurales pequeñas.',
      precioMensual: 0,
      precioAnual: 0,
      moneda: 'BOB',
      maxEstudiantes: 100,
      maxDocentes: 8,
      permiteReportesOficiales: true,
      permiteLogoPersonalizado: false,
      permiteKardexCompleto: false,
      permiteSoportePrioritario: false,
      orden: 1,
    },
  });

  const planPro = await prisma.planSuscripcion.upsert({
    where: { codigo: 'PLAN_PRO' },
    update: {},
    create: {
      codigo: 'PLAN_PRO',
      nombre: 'Plan Colegio Profesional',
      descripcion: 'Solución integral para colegios fiscales, privados y de convenio.',
      precioMensual: 250,
      precioAnual: 2400,
      moneda: 'BOB',
      maxEstudiantes: 1200,
      maxDocentes: 60,
      permiteReportesOficiales: true,
      permiteLogoPersonalizado: true,
      permiteKardexCompleto: true,
      permiteSoportePrioritario: true,
      orden: 2,
    },
  });

  await prisma.planSuscripcion.upsert({
    where: { codigo: 'PLAN_ENTERPRISE' },
    update: {},
    create: {
      codigo: 'PLAN_ENTERPRISE',
      nombre: 'Plan Red Educativa / Distrito',
      descripcion: 'Para redes de colegios (Fe y Alegría, Don Bosco) y Direcciones Distritales.',
      precioMensual: 600,
      precioAnual: 5800,
      moneda: 'BOB',
      maxEstudiantes: 99999,
      maxDocentes: 9999,
      permiteReportesOficiales: true,
      permiteLogoPersonalizado: true,
      permiteKardexCompleto: true,
      permiteSoportePrioritario: true,
      orden: 3,
    },
  });

  console.log('✅ Catálogo de 3 planes SaaS creado (Básico, Pro Colegio, Red Educativa)');

  // Asignar suscripción Pro activa a las instituciones existentes
  const instituciones = await prisma.unidadEducativa.findMany();
  for (const inst of instituciones) {
    const unAnioMas = new Date();
    unAnioMas.setFullYear(unAnioMas.getFullYear() + 1);

    await prisma.suscripcionInstitucion.upsert({
      where: { institucionId: inst.id },
      update: {},
      create: {
        institucionId: inst.id,
        planId: planPro.id,
        estado: 'ACTIVA',
        periodoFacturacion: 'ANUAL',
        fechaInicio: new Date(),
        fechaFin: unAnioMas,
        diasGracia: 10,
        montoActual: 2400,
      },
    });
  }
  console.log(`✅ Suscripciones SaaS asignadas a ${instituciones.length} unidades educativas.`);

  console.log('✨ Seed multi-tenant completado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
