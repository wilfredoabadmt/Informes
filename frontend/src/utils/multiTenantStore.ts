// Sistema Multi-Tenant Centralizado de Almacenamiento por Unidad Educativa (SEP)

export interface TenantInstitution {
  id: string;
  sie: string;
  nombre: string;
  departamento: string;
  provincia: string;
  municipio: string;
  distrito: string;
  direccion: string;
  telefono: string;
  tipo: string;
  nivel: string;
  activo: boolean;
  totalMaestrosVinculados: number;
}

export interface TenantParalelo {
  id: string;
  cursoNombre: string;
  nivel: string;
  grado: number;
  letra: string;
  turno: string;
  cupo: number;
  inscritos: number;
}

export interface TenantTeacher {
  id: string;
  rda: string;
  ci: string;
  nombres: string;
  primerApellido: string;
  segundoApellido: string;
  tituloProfesional: string;
  especialidad: string;
  correo: string;
  telefono: string;
  cargoOficial: string;
  normalista: boolean;
  estado: 'ACTIVO' | 'LICENCIA' | 'TRASLADADO';
  horasAsignadas: number;
}

export interface TenantAssignment {
  id: string;
  maestroNombre: string;
  cursoParalelo: string;
  materiaNombre: string;
  horasSemanales: number;
  esTutor?: boolean;
  docenteId?: string;
  docenteNombre?: string;
  paraleloId?: string;
  paraleloNombre?: string;
  materiaCodigo?: string;
}

export interface TenantStudent {
  id: string;
  rude: string;
  ci: string;
  nombres: string;
  primerApellido: string;
  segundoApellido: string;
  fechaNacimiento: string;
  genero: 'M' | 'F';
  curso: string;
  nombreTutor: string;
  parentescoTutor: string;
  telefonoTutor: string;
  estado: string;
}

// 1. Colegios Semilla Oficiales alineados con la Base de Datos PostgreSQL
export const DEFAULT_INSTITUTIONS: TenantInstitution[] = [
  {
    id: 'd07e3a6c-2f35-4f8c-9897-163321eb469f',
    sie: '42608102',
    nombre: 'San Simon de Ayacucho',
    departamento: 'La Paz',
    provincia: 'Murillo',
    municipio: 'La Paz',
    distrito: 'La Paz 1',
    direccion: 'Calle Yanacocha esq. Indaburo #102',
    telefono: '2283920',
    tipo: 'FISCAL',
    nivel: 'INTEGRADO',
    activo: true,
    totalMaestrosVinculados: 2,
  },
  {
    id: 'abc186c6-867a-4a4c-b272-68c7a7506e16',
    sie: '80730045',
    nombre: 'Unidad Educativa Franz Tamayo',
    departamento: 'La Paz',
    provincia: 'Murillo',
    municipio: 'La Paz',
    distrito: 'La Paz 1',
    direccion: 'Zona Miraflores, Calle Cuba #450',
    telefono: '2221234',
    tipo: 'FISCAL',
    nivel: 'INTEGRADO',
    activo: true,
    totalMaestrosVinculados: 4,
  },
  {
    id: '251398a7-408a-41d1-a8e7-87654d86ffd0',
    sie: '80730046',
    nombre: 'Unidad Educativa Mariscal Sucre',
    departamento: 'La Paz',
    provincia: 'Murillo',
    municipio: 'El Alto',
    distrito: 'El Alto 1',
    direccion: 'Zona Ciudad Satélite, Av. Del Policía #120',
    telefono: '2281234',
    tipo: 'FISCAL',
    nivel: 'INTEGRADO',
    activo: true,
    totalMaestrosVinculados: 2,
  },
];

// 2. Cursos Semilla por Código SIE
const DEFAULT_COURSES_BY_SIE: Record<string, TenantParalelo[]> = {
  '80730045': [
    { id: 'p-1', cursoNombre: '1° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 1, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 32 },
    { id: 'p-2', cursoNombre: '1° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 1, letra: 'B', turno: 'Tarde', cupo: 35, inscritos: 28 },
    { id: 'p-3', cursoNombre: '2° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 2, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 30 },
    { id: 'p-4', cursoNombre: '3° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 3, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 26 },
    { id: 'p-5', cursoNombre: '1° de Primaria Comunitaria Vocacional', nivel: 'PRIMARIA', grado: 1, letra: 'A', turno: 'Mañana', cupo: 30, inscritos: 29 },
    { id: 'p-6', cursoNombre: '2° de Primaria Comunitaria Vocacional', nivel: 'PRIMARIA', grado: 2, letra: 'A', turno: 'Mañana', cupo: 30, inscritos: 27 },
  ],
  '80730046': [
    { id: 'ms-p-1', cursoNombre: '1° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 1, letra: 'A', turno: 'Tarde', cupo: 35, inscritos: 25 },
    { id: 'ms-p-2', cursoNombre: '2° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 2, letra: 'A', turno: 'Tarde', cupo: 35, inscritos: 22 },
  ],
  '42608102': [
    { id: 'ay-p-1', cursoNombre: '1° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 1, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 28 },
    { id: 'ay-p-2', cursoNombre: '2° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 2, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 30 },
  ],
  '80730047': [
    { id: 'emb-p-1', cursoNombre: '1° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 1, letra: 'A', turno: 'Mañana', cupo: 25, inscritos: 18 },
  ],
};

// 3. Plantel Docente Semilla por Código SIE
const DEFAULT_TEACHERS_BY_SIE: Record<string, TenantTeacher[]> = {
  '80730045': [
    {
      id: 't-1',
      rda: '6849302',
      ci: '6849302 LP',
      nombres: 'Carlos',
      primerApellido: 'Mamani',
      segundoApellido: 'Choque',
      tituloProfesional: 'Profesor Normalista de Secundaria',
      especialidad: 'Comunicación y Lenguajes',
      correo: 'carlos.mamani@minedu.gob.bo',
      telefono: '71548923',
      cargoOficial: 'Docente de Área y Tutor de Curso',
      normalista: true,
      estado: 'ACTIVO',
      horasAsignadas: 16,
    },
    {
      id: 't-2',
      rda: '5748291',
      ci: '5748291 LP',
      nombres: 'Alberto',
      primerApellido: 'Simón',
      segundoApellido: 'Mercado',
      tituloProfesional: 'Licenciado en Ciencias de la Educación',
      especialidad: 'Matemática y Lógica',
      correo: 'alberto.mercado@minedu.gob.bo',
      telefono: '68923412',
      cargoOficial: 'Docente de Matemática',
      normalista: true,
      estado: 'ACTIVO',
      horasAsignadas: 20,
    },
    {
      id: 't-3',
      rda: '7214589',
      ci: '7214589 LP',
      nombres: 'Elena',
      primerApellido: 'Flores',
      segundoApellido: 'Mamani',
      tituloProfesional: 'Licenciada en Gestión Educativa',
      especialidad: 'Administración y Ciencias Sociales',
      correo: 'elena.flores@minedu.gob.bo',
      telefono: '73091823',
      cargoOficial: 'Directora Institucional / Docente',
      normalista: true,
      estado: 'ACTIVO',
      horasAsignadas: 8,
    },
    {
      id: 't-4',
      rda: '8192304',
      ci: '8192304 LP',
      nombres: 'Roberto',
      primerApellido: 'Jaramillo',
      segundoApellido: 'Quispe',
      tituloProfesional: 'Profesor de Ciencias Naturales',
      especialidad: 'Biología y Geografía',
      correo: 'roberto.jaramillo@minedu.gob.bo',
      telefono: '77291034',
      cargoOficial: 'Docente de Biología',
      normalista: true,
      estado: 'ACTIVO',
      horasAsignadas: 18,
    },
  ],
  '80730046': [
    {
      id: 'ms-t-1',
      rda: '6849302',
      ci: '6849302 LP',
      nombres: 'Carlos',
      primerApellido: 'Mamani',
      segundoApellido: 'Condori',
      tituloProfesional: 'Profesor Normalista de Secundaria',
      especialidad: 'Álgebra y Matemática',
      correo: 'carlos.mamani@minedu.gob.bo',
      telefono: '71548923',
      cargoOficial: 'Docente de Área',
      normalista: true,
      estado: 'ACTIVO',
      horasAsignadas: 12,
    },
    {
      id: 'ms-t-2',
      rda: '8392014',
      ci: '8392014 LP',
      nombres: 'Ramiro',
      primerApellido: 'Vaca',
      segundoApellido: 'Medina',
      tituloProfesional: 'Licenciado en Ciencias Sociales',
      especialidad: 'Ciencias Sociales e Historia',
      correo: 'ramiro.vaca@minedu.gob.bo',
      telefono: '72019482',
      cargoOficial: 'Docente de Ciencias Sociales',
      normalista: true,
      estado: 'ACTIVO',
      horasAsignadas: 18,
    },
  ],
  '42608102': [
    {
      id: 'ay-t-1',
      rda: '8392014',
      ci: '8392014 LP',
      nombres: 'Ramiro',
      primerApellido: 'Vaca',
      segundoApellido: 'Medina',
      tituloProfesional: 'Licenciado en Ciencias Sociales',
      especialidad: 'Ciencias Sociales e Historia',
      correo: 'ramiro.vaca@minedu.gob.bo',
      telefono: '72019482',
      cargoOficial: 'Docente de Área y Tutor',
      normalista: true,
      estado: 'ACTIVO',
      horasAsignadas: 16,
    },
    {
      id: 'ay-t-2',
      rda: '7214589',
      ci: '7214589 LP',
      nombres: 'Elena',
      primerApellido: 'Flores',
      segundoApellido: 'Mamani',
      tituloProfesional: 'Licenciada en Educación',
      especialidad: 'Comunicación y Lenguajes',
      correo: 'elena.flores@minedu.gob.bo',
      telefono: '73091823',
      cargoOficial: 'Docente de Asignatura',
      normalista: true,
      estado: 'ACTIVO',
      horasAsignadas: 14,
    },
  ],
  '80730047': [
    {
      id: 'emb-t-1',
      rda: '4920183',
      ci: '4920183 TJ',
      nombres: 'Walter',
      primerApellido: 'Flores',
      segundoApellido: 'Zeballos',
      tituloProfesional: 'Profesor de Educación Técnica',
      especialidad: 'Técnica Tecnológica Agropecuaria',
      correo: 'walter.flores@minedu.gob.bo',
      telefono: '76892014',
      cargoOficial: 'Docente Técnico',
      normalista: true,
      estado: 'ACTIVO',
      horasAsignadas: 24,
    },
  ],
};

// 4. Asignaciones Semilla por Código SIE
const DEFAULT_ASSIGNMENTS_BY_SIE: Record<string, TenantAssignment[]> = {
  '80730045': [
    { id: 'as-1', maestroNombre: 'Prof. Carlos Mamani Choque', cursoParalelo: '1° de Secundaria - Paralelo A', materiaNombre: 'Comunicación y Lenguajes', horasSemanales: 6, esTutor: true },
    { id: 'as-2', maestroNombre: 'Prof. Carlos Mamani Choque', cursoParalelo: '1° de Secundaria - Paralelo B', materiaNombre: 'Comunicación y Lenguajes', horasSemanales: 6, esTutor: false },
    { id: 'as-3', maestroNombre: 'Prof. Alberto Simón Mercado', cursoParalelo: '2° de Secundaria - Paralelo A', materiaNombre: 'Matemática y Lógica', horasSemanales: 6, esTutor: false },
    { id: 'as-4', maestroNombre: 'Prof. Roberto Jaramillo Quispe', cursoParalelo: '1° de Secundaria - Paralelo A', materiaNombre: 'Ciencias Naturales: Biología - Geografía', horasSemanales: 4, esTutor: false },
  ],
  '80730046': [
    { id: 'ms-as-1', maestroNombre: 'Prof. Carlos Mamani Condori', cursoParalelo: '1° de Secundaria - Paralelo A', materiaNombre: 'Álgebra y Matemática', horasSemanales: 6, esTutor: true },
    { id: 'ms-as-2', maestroNombre: 'Prof. Ramiro Vaca Medina', cursoParalelo: '1° de Secundaria - Paralelo A', materiaNombre: 'Ciencias Sociales e Historia', horasSemanales: 4, esTutor: false },
  ],
  '42608102': [
    { id: 'ay-as-1', maestroNombre: 'Prof. Ramiro Vaca Medina', cursoParalelo: '1° de Secundaria - Paralelo A', materiaNombre: 'Ciencias Sociales e Historia', horasSemanales: 6, esTutor: true },
    { id: 'ay-as-2', maestroNombre: 'Prof. Elena Flores Mamani', cursoParalelo: '1° de Secundaria - Paralelo A', materiaNombre: 'Comunicación y Lenguajes', horasSemanales: 6, esTutor: false },
  ],
  '80730047': [
    { id: 'emb-as-1', maestroNombre: 'Prof. Walter Flores Zeballos', cursoParalelo: '1° de Secundaria - Paralelo A', materiaNombre: 'Técnica Tecnológica Agropecuaria', horasSemanales: 8, esTutor: true },
  ],
};

// 5. Estudiantes Semilla por Código SIE
const DEFAULT_STUDENTS_BY_SIE: Record<string, TenantStudent[]> = {
  '80730045': [
    { id: 'st-1', rude: '807300452026001', ci: '10928374', nombres: 'Erick Elias', primerApellido: 'Alanoca', segundoApellido: 'Cruz', fechaNacimiento: '2012-05-14', genero: 'M', curso: '1° de Secundaria - Paralelo A', nombreTutor: 'Marcos Alanoca Ticona', parentescoTutor: 'Padre', telefonoTutor: '71548923', estado: 'EFECTIVO' },
    { id: 'st-2', rude: '807300452026002', ci: '12847593', nombres: 'Fabiola', primerApellido: 'Aramayo', segundoApellido: 'Toledo', fechaNacimiento: '2012-09-22', genero: 'F', curso: '1° de Secundaria - Paralelo A', nombreTutor: 'Sonia Toledo Quispe', parentescoTutor: 'Madre', telefonoTutor: '68923145', estado: 'EFECTIVO' },
    { id: 'st-3', rude: '807300452026003', ci: '11029485', nombres: 'Karol Lucero', primerApellido: 'Camacho', segundoApellido: 'Renjifo', fechaNacimiento: '2012-11-03', genero: 'F', curso: '1° de Secundaria - Paralelo A', nombreTutor: 'Lucero Renjifo', parentescoTutor: 'Madre', telefonoTutor: '72034918', estado: 'EFECTIVO' },
    { id: 'st-4', rude: '807300452026004', ci: '10847291', nombres: 'Carlin Yarita', primerApellido: 'Cardozo', segundoApellido: 'Yevara', fechaNacimiento: '2012-04-05', genero: 'F', curso: '1° de Secundaria - Paralelo A', nombreTutor: 'Elena Yevara', parentescoTutor: 'Madre', telefonoTutor: '71928301', estado: 'EFECTIVO' },
    { id: 'st-5', rude: '807300452026005', ci: '12948172', nombres: 'Jhoanna Mayenni', primerApellido: 'Colque', segundoApellido: 'Colodro', fechaNacimiento: '2012-08-18', genero: 'F', curso: '1° de Secundaria - Paralelo A', nombreTutor: 'Ramiro Colque', parentescoTutor: 'Padre', telefonoTutor: '67019284', estado: 'EFECTIVO' },
    { id: 'st-6', rude: '807300452026006', ci: '9847261', nombres: 'Gabriel Omar', primerApellido: 'Flores', segundoApellido: 'Callisaya', fechaNacimiento: '2012-02-03', genero: 'M', curso: '1° de Secundaria - Paralelo A', nombreTutor: 'Ramiro Flores Choque', parentescoTutor: 'Padre', telefonoTutor: '73091824', estado: 'EFECTIVO' },
    { id: 'st-7', rude: '807300452026007', ci: '13948271', nombres: 'Mateo Daniel', primerApellido: 'Arce', segundoApellido: 'Condori', fechaNacimiento: '2012-06-15', genero: 'M', curso: '1° de Secundaria - Paralelo B', nombreTutor: 'Daniel Arce', parentescoTutor: 'Padre', telefonoTutor: '71548123', estado: 'EFECTIVO' },
    { id: 'st-8', rude: '807300452026008', ci: '12049182', nombres: 'Sofia Belen', primerApellido: 'Gutierrez', segundoApellido: 'Rojas', fechaNacimiento: '2012-03-20', genero: 'F', curso: '1° de Secundaria - Paralelo B', nombreTutor: 'Belen Rojas', parentescoTutor: 'Madre', telefonoTutor: '68923456', estado: 'EFECTIVO' },
    { id: 'st-9', rude: '807300452026009', ci: '14920184', nombres: 'Lucia Valentina', primerApellido: 'Mamani', segundoApellido: 'Quispe', fechaNacimiento: '2012-01-19', genero: 'F', curso: '1° de Secundaria - Paralelo B', nombreTutor: 'Juan Mamani', parentescoTutor: 'Padre', telefonoTutor: '72034111', estado: 'EFECTIVO' },
    { id: 'st-10', rude: '807300452026010', ci: '11049283', nombres: 'Nicole Andrea', primerApellido: 'Torrez', segundoApellido: 'Mendoza', fechaNacimiento: '2012-10-12', genero: 'F', curso: '1° de Secundaria - Paralelo B', nombreTutor: 'Andrea Mendoza', parentescoTutor: 'Madre', telefonoTutor: '71928222', estado: 'EFECTIVO' },
    { id: 'st-11', rude: '807300452026011', ci: '10948271', nombres: 'Alejandro Jose', primerApellido: 'Vargas', segundoApellido: 'Paz', fechaNacimiento: '2012-08-30', genero: 'M', curso: '1° de Secundaria - Paralelo B', nombreTutor: 'Jose Vargas', parentescoTutor: 'Padre', telefonoTutor: '67019333', estado: 'EFECTIVO' },
    { id: 'st-12', rude: '807300452026012', ci: '12948194', nombres: 'Bruno Jhoel', primerApellido: 'Choque', segundoApellido: 'Huanca', fechaNacimiento: '2012-10-24', genero: 'M', curso: '1° de Secundaria - Paralelo B', nombreTutor: 'Rosa Huanca', parentescoTutor: 'Madre', telefonoTutor: '71829444', estado: 'EFECTIVO' },
    { id: 'st-13', rude: '807300452026013', ci: '11928471', nombres: 'Diego Armando', primerApellido: 'Salazar', segundoApellido: 'Ramos', fechaNacimiento: '2011-07-08', genero: 'M', curso: '2° de Secundaria - Paralelo A', nombreTutor: 'Armando Salazar', parentescoTutor: 'Padre', telefonoTutor: '71548555', estado: 'EFECTIVO' },
    { id: 'st-14', rude: '807300452026014', ci: '10948172', nombres: 'Camila Renata', primerApellido: 'Pinto', segundoApellido: 'Morales', fechaNacimiento: '2011-09-14', genero: 'F', curso: '2° de Secundaria - Paralelo A', nombreTutor: 'Renata Morales', parentescoTutor: 'Madre', telefonoTutor: '68923666', estado: 'EFECTIVO' },
    { id: 'st-15', rude: '807300452026015', ci: '12847192', nombres: 'Rodrigo Martin', primerApellido: 'Fernandez', segundoApellido: 'Luna', fechaNacimiento: '2011-12-05', genero: 'M', curso: '2° de Secundaria - Paralelo A', nombreTutor: 'Martin Fernandez', parentescoTutor: 'Padre', telefonoTutor: '72034777', estado: 'EFECTIVO' },
  ],
  '80730046': [
    { id: 'ms-st-1', rude: '807300462026001', ci: '14829101', nombres: 'Jhonny', primerApellido: 'Quisbert', segundoApellido: 'Apaza', fechaNacimiento: '2012-04-10', genero: 'M', curso: '1° de Secundaria - Paralelo A', nombreTutor: 'Mario Quisbert', parentescoTutor: 'Padre', telefonoTutor: '72819203', estado: 'EFECTIVO' },
    { id: 'ms-st-2', rude: '807300462026002', ci: '15920194', nombres: 'Brenda', primerApellido: 'Condori', segundoApellido: 'Poma', fechaNacimiento: '2012-08-15', genero: 'F', curso: '1° de Secundaria - Paralelo A', nombreTutor: 'Juana Poma', parentescoTutor: 'Madre', telefonoTutor: '68192847', estado: 'EFECTIVO' },
    { id: 'ms-st-3', rude: '807300462026003', ci: '13948104', nombres: 'Kevin Samuel', primerApellido: 'Mamani', segundoApellido: 'Flores', fechaNacimiento: '2012-11-20', genero: 'M', curso: '1° de Secundaria - Paralelo A', nombreTutor: 'Samuel Mamani', parentescoTutor: 'Padre', telefonoTutor: '71920384', estado: 'EFECTIVO' },
  ],
  '42608102': [
    { id: 'ay-st-1', rude: '426081022026001', ci: '10928371', nombres: 'Joaquin', primerApellido: 'Morales', segundoApellido: 'Vargas', fechaNacimiento: '2012-03-11', genero: 'M', curso: '1° de Secundaria - Paralelo A', nombreTutor: 'Hernan Morales', parentescoTutor: 'Padre', telefonoTutor: '72019284', estado: 'EFECTIVO' },
    { id: 'ay-st-2', rude: '426081022026002', ci: '11029482', nombres: 'Adriana', primerApellido: 'Gutierrez', segundoApellido: 'Quisbert', fechaNacimiento: '2012-07-19', genero: 'F', curso: '1° de Secundaria - Paralelo A', nombreTutor: 'Patricia Quisbert', parentescoTutor: 'Madre', telefonoTutor: '71548291', estado: 'EFECTIVO' },
    { id: 'ay-st-3', rude: '426081022026003', ci: '12948104', nombres: 'Cristian', primerApellido: 'Rios', segundoApellido: 'Mendoza', fechaNacimiento: '2012-10-05', genero: 'M', curso: '1° de Secundaria - Paralelo A', nombreTutor: 'Raul Rios', parentescoTutor: 'Padre', telefonoTutor: '68920148', estado: 'EFECTIVO' },
  ],
  '80730047': [
    { id: 'emb-st-1', rude: '807300472026001', ci: '16928104', nombres: 'Luciano', primerApellido: 'Armella', segundoApellido: 'Ramos', fechaNacimiento: '2012-02-14', genero: 'M', curso: '1° de Secundaria - Paralelo A', nombreTutor: 'Carlos Armella', parentescoTutor: 'Padre', telefonoTutor: '76829104', estado: 'EFECTIVO' },
    { id: 'emb-st-2', rude: '807300472026002', ci: '17920184', nombres: 'Yamila', primerApellido: 'Guanuco', segundoApellido: 'Choque', fechaNacimiento: '2012-07-28', genero: 'F', curso: '1° de Secundaria - Paralelo A', nombreTutor: 'Elena Choque', parentescoTutor: 'Madre', telefonoTutor: '78291048', estado: 'EFECTIVO' },
  ],
};

// =========================================================================
// RESOLUTOR CANÓNICO DE TENANT (SOPORTA UUID, SIE O PREFIX inst-)
// =========================================================================

export function resolveTenantKey(idOrSie: string | null | undefined): string {
  if (!idOrSie) return '80730045';

  // Si es un número SIE oficial directamente
  if (/^\d{6,10}$/.test(idOrSie)) {
    return idOrSie;
  }

  // Si tiene el formato inst-80730045
  if (idOrSie.startsWith('inst-')) {
    const stripped = idOrSie.replace('inst-', '');
    if (/^\d+$/.test(stripped)) return stripped;
  }

  // Buscar en las instituciones registradas por UUID o ID
  const insts = getStoredInstitutions();
  const match = insts.find((i) => i.id === idOrSie || i.sie === idOrSie);
  if (match) return match.sie;

  return idOrSie;
}

// =========================================================================
// API DEL MULTI-TENANT STORE (LOCALSTORAGE CON SINCRONIZACIÓN DE API)
// =========================================================================

export function getStoredInstitutions(): TenantInstitution[] {
  try {
    const raw = localStorage.getItem('sigma_institutions');
    if (raw) {
      const parsed: TenantInstitution[] = JSON.parse(raw);
      if (parsed && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading stored institutions', e);
  }
  localStorage.setItem('sigma_institutions', JSON.stringify(DEFAULT_INSTITUTIONS));
  return DEFAULT_INSTITUTIONS;
}

export function saveStoredInstitutions(institutions: TenantInstitution[]): void {
  localStorage.setItem('sigma_institutions', JSON.stringify(institutions));
}

export function syncApiInstitutions(apiList: TenantInstitution[]): TenantInstitution[] {
  if (!apiList || apiList.length === 0) return getStoredInstitutions();

  const formatted: TenantInstitution[] = apiList.map((item) => ({
    id: item.id || `inst-${item.sie}`,
    sie: item.sie,
    nombre: item.nombre,
    departamento: item.departamento || 'La Paz',
    provincia: item.provincia || 'Murillo',
    municipio: item.municipio || 'La Paz',
    distrito: item.distrito || 'La Paz 1',
    direccion: item.direccion || '',
    telefono: item.telefono || '',
    tipo: item.tipo || 'FISCAL',
    nivel: item.nivel || 'INTEGRADO',
    activo: item.activo !== undefined ? item.activo : true,
    totalMaestrosVinculados: item.totalMaestrosVinculados || 0,
  }));

  saveStoredInstitutions(formatted);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sigma_institutions_updated', { detail: formatted })
    );
  }

  return formatted;
}

export function addStoredInstitution(inst: TenantInstitution): void {
  const current = getStoredInstitutions();
  const updated = [inst, ...current.filter((i) => i.sie !== inst.sie && i.id !== inst.id)];
  saveStoredInstitutions(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sigma_institutions_updated', { detail: updated })
    );
  }
}

export function getCoursesForInstitution(idOrSie: string): TenantParalelo[] {
  const sie = resolveTenantKey(idOrSie);
  try {
    const raw = localStorage.getItem(`sigma_courses_${sie}`);
    if (raw) return JSON.parse(raw);

    // Fallback a clave previa si existiese
    const legacy = localStorage.getItem(`sigma_courses_${idOrSie}`);
    if (legacy) {
      localStorage.setItem(`sigma_courses_${sie}`, legacy);
      return JSON.parse(legacy);
    }
  } catch (e) {
    console.error('Error loading courses for institution', e);
  }
  const defaults = DEFAULT_COURSES_BY_SIE[sie] || [];
  localStorage.setItem(`sigma_courses_${sie}`, JSON.stringify(defaults));
  return defaults;
}

export function saveCoursesForInstitution(idOrSie: string, courses: TenantParalelo[]): void {
  const sie = resolveTenantKey(idOrSie);
  localStorage.setItem(`sigma_courses_${sie}`, JSON.stringify(courses));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sigma_courses_updated', { detail: { sie, courses } }));
  }
}

export function getTeachersForInstitution(idOrSie: string): TenantTeacher[] {
  const sie = resolveTenantKey(idOrSie);
  try {
    const raw = localStorage.getItem(`sigma_teachers_${sie}`);
    if (raw) return JSON.parse(raw);

    const legacy = localStorage.getItem(`sigma_teachers_${idOrSie}`);
    if (legacy) {
      localStorage.setItem(`sigma_teachers_${sie}`, legacy);
      return JSON.parse(legacy);
    }
  } catch (e) {
    console.error('Error loading teachers for institution', e);
  }
  const defaults = DEFAULT_TEACHERS_BY_SIE[sie] || [];
  localStorage.setItem(`sigma_teachers_${sie}`, JSON.stringify(defaults));
  return defaults;
}

export function saveTeachersForInstitution(idOrSie: string, teachers: TenantTeacher[]): void {
  const sie = resolveTenantKey(idOrSie);
  localStorage.setItem(`sigma_teachers_${sie}`, JSON.stringify(teachers));

  // Actualizar contador en la institución almacenada
  const insts = getStoredInstitutions();
  const updated = insts.map((i) =>
    i.sie === sie || i.id === idOrSie
      ? { ...i, totalMaestrosVinculados: teachers.length }
      : i
  );
  saveStoredInstitutions(updated);
}

export function getAssignmentsForInstitution(idOrSie: string): TenantAssignment[] {
  const sie = resolveTenantKey(idOrSie);
  try {
    const raw = localStorage.getItem(`sigma_assignments_${sie}`);
    if (raw) return JSON.parse(raw);

    const legacy = localStorage.getItem(`sigma_assignments_${idOrSie}`);
    if (legacy) {
      localStorage.setItem(`sigma_assignments_${sie}`, legacy);
      return JSON.parse(legacy);
    }
  } catch (e) {
    console.error('Error loading assignments for institution', e);
  }
  const defaults = DEFAULT_ASSIGNMENTS_BY_SIE[sie] || [];
  localStorage.setItem(`sigma_assignments_${sie}`, JSON.stringify(defaults));
  return defaults;
}

export function saveAssignmentsForInstitution(
  idOrSie: string,
  assignments: TenantAssignment[]
): void {
  const sie = resolveTenantKey(idOrSie);
  localStorage.setItem(`sigma_assignments_${sie}`, JSON.stringify(assignments));
}

export function getStudentsForInstitution(idOrSie: string): TenantStudent[] {
  const sie = resolveTenantKey(idOrSie);
  try {
    const raw = localStorage.getItem(`sigma_students_${sie}`);
    if (raw) return JSON.parse(raw);

    const legacy = localStorage.getItem(`sigma_students_${idOrSie}`);
    if (legacy) {
      localStorage.setItem(`sigma_students_${sie}`, legacy);
      return JSON.parse(legacy);
    }
  } catch (e) {
    console.error('Error loading students for institution', e);
  }
  const defaults = DEFAULT_STUDENTS_BY_SIE[sie] || [];
  localStorage.setItem(`sigma_students_${sie}`, JSON.stringify(defaults));
  return defaults;
}

export function saveStudentsForInstitution(idOrSie: string, students: TenantStudent[]): void {
  const sie = resolveTenantKey(idOrSie);
  localStorage.setItem(`sigma_students_${sie}`, JSON.stringify(students));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sigma_students_updated', { detail: { sie, students } }));
  }
}
