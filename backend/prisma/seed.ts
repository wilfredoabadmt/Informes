import { PrismaClient, RolGlobal, RolInstitucional, EstadoUsuario, EstadoVinculacion, TipoInstitucion, NivelEducativo } from '@prisma/client';
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

  // Vinculación en Institución 1 (Franz Tamayo)
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

  // Vinculación en Institución 2 (Mariscal Sucre)
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

  console.log(`✅ Maestro multi-institución vinculado: Carlos Mamani (Franz Tamayo + Mariscal Sucre)`);

  // 5. Maestro 2: Elena Flores Quispe (SINGLE-TENANT: Directora en Franz Tamayo)
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

  console.log(`✅ Directora institucional creada: Elena Flores (Sólo en Franz Tamayo)`);
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
