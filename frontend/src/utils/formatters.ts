/**
 * Diccionario Oficial de Traducción y Formato Descriptivo
 * Subsistema de Educación Regular (SEP) - Estado Plurinacional de Bolivia
 */

export const formatRol = (role?: string): string => {
  if (!role) return 'Usuario';
  const map: Record<string, string> = {
    SUPERADMIN: 'Superadministrador Nacional',
    CENTRAL_ADMIN: 'Administrador Central (Ministerio)',
    INSTITUTIONAL_USER: 'Personal Institucional',
    ADMIN_INSTITUCIONAL: 'Administrador de Unidad Educativa',
    DIRECTOR: 'Directora / Director de Unidad Educativa',
    SECRETARIO: 'Secretaría Académica',
    MAESTRO: 'Maestra / Maestro de Aula',
    COMISION_PEDAGOGICA: 'Comisión Técnico-Pedagógica',
  };
  return map[role] || role;
};

export const formatTipoInstitucion = (tipo?: string): string => {
  if (!tipo) return 'No especificado';
  const map: Record<string, string> = {
    FISCAL: 'Fiscal (Pública del Estado)',
    CONVENIO: 'Convenio (Institucional / Iglesia)',
    PRIVADA: 'Privada',
  };
  return map[tipo] || tipo;
};

export const formatNivelEducativo = (nivel?: string): string => {
  if (!nivel) return 'No especificado';
  const map: Record<string, string> = {
    INICIAL: 'Educación Inicial en Familia Comunitaria',
    PRIMARIA: 'Educación Primaria Comunitaria Vocacional',
    SECUNDARIA: 'Educación Secundaria Comunitaria Productiva',
    INTEGRADO: 'Niveles Integrados (Primaria y Secundaria)',
  };
  return map[nivel] || nivel;
};

export const formatCampoSaberes = (campo?: string): string => {
  if (!campo) return 'General';
  const map: Record<string, string> = {
    COSMOS_Y_PENSAMIENTO: 'Cosmos y Pensamiento',
    COMUNIDAD_Y_SOCIEDAD: 'Comunidad y Sociedad',
    VIDA_TIERRA_TERRITORIO: 'Vida, Tierra y Territorio',
    CIENCIA_TECNOLOGIA_PRODUCCION: 'Ciencia, Tecnología y Producción',
  };
  return map[campo] || campo;
};

export const formatTurno = (turno?: string): string => {
  if (!turno) return '';
  const map: Record<string, string> = {
    MANANA: 'Turno Mañana',
    TARDE: 'Turno Tarde',
    NOCHE: 'Turno Noche',
  };
  return map[turno] || turno;
};

export const formatEstadoInscripcion = (estado?: string): { label: string; color: string } => {
  if (!estado) return { label: 'Sin Estado', color: 'bg-slate-100 text-slate-700' };
  const map: Record<string, { label: string; color: string }> = {
    EFECTIVO: { label: 'Matrícula Efectiva (Activo)', color: 'bg-emerald-100 text-emerald-800' },
    RETIRADO_TRASLADO: { label: 'Retirado por Traslado', color: 'bg-amber-100 text-amber-800' },
    RETIRADO_ABANDONO: { label: 'Retirado por Abandono', color: 'bg-rose-100 text-rose-800' },
    NO_INCORPORADO: { label: 'No Incorporado', color: 'bg-slate-100 text-slate-700' },
  };
  return map[estado] || { label: estado, color: 'bg-slate-100 text-slate-700' };
};

export const formatAccionAuditoria = (accion?: string): string => {
  if (!accion) return 'Operación del Sistema';
  const map: Record<string, string> = {
    REGISTRO_CALIFICACION: 'Registro / Edición de Calificaciones',
    MATRICULA_ESTUDIANTE: 'Inscripción y Matrícula de Alumno',
    CREACION_INSTITUCION: 'Creación de Unidad Educativa',
    ASIGNACION_DOCENTE: 'Asignación de Materia y Paralelo a Docente',
    ACTUALIZACION_ESTUDIANTE: 'Actualización de Datos de Estudiante',
    IMPORTACION_MASIVA: 'Importación Masiva de Nómina Excel',
    CIERRE_TRIMESTRE: 'Cierre Oficial de Periodo Trimestral',
    EMISION_LIBRETA: 'Emisión de Libreta Escolar PDF',
    LOGIN_SUCCESS: 'Inicio de Sesión Exitoso',
    LOGIN_FAILED: 'Intento Fallido de Inicio de Sesión',
    CONTEXT_SWITCH: 'Cambio de Unidad Educativa',
  };
  return map[accion] || accion.replace(/_/g, ' ');
};

export const formatDimension = (dim?: string): string => {
  if (!dim) return '';
  const map: Record<string, string> = {
    SER: 'Ser (Principios y Valores - 10 pts)',
    SABER: 'Saber (Conocimientos Teóricos - 35 pts)',
    HACER: 'Hacer (Aplicación y Práctica - 35 pts)',
    DECIDIR: 'Decidir (Impacto Comunitario - 10 pts)',
    AUTOEVALUACION: 'Autoevaluación del Estudiante (10 pts)',
  };
  return map[dim] || dim;
};

export interface EscalaCualitativaInfo {
  codigo: 'ED' | 'DA' | 'DO' | 'DP';
  label: string;
  rango: string;
  descripcion: string;
  badgeClass: string;
}

/**
 * Escala Cualitativa Oficial del Subsistema de Educación Regular (SEP - Ley 070)
 * Extraída de los Cuadernos Pedagógicos Oficiales de Primaria y Secundaria
 */
export const getEscalaCualitativa = (nota: number): EscalaCualitativaInfo => {
  const n = Math.round(nota);
  if (n >= 85) {
    return {
      codigo: 'DP',
      label: 'Desarrollo Pleno',
      rango: '85 - 100',
      descripcion: 'Demuestra capacidades y potencialidades con excelencia y creatividad comunitaria.',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    };
  }
  if (n >= 69) {
    return {
      codigo: 'DO',
      label: 'Desarrollo Óptimo',
      rango: '69 - 84',
      descripcion: 'Demuestra cumplimiento satisfactorio de los objetivos holísticos planificados.',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
  }
  if (n >= 51) {
    return {
      codigo: 'DA',
      label: 'Desarrollo Aceptable',
      rango: '51 - 68',
      descripcion: 'Demuestra suficiencia en el aprendizaje y desarrollo de los saberes requeridos.',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    };
  }
  return {
    codigo: 'ED',
    label: 'En Desarrollo',
    rango: '1 - 50',
    descripcion: 'Requiere acompañamiento pedagógico prioritario y apoyo complementario continuo.',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
  };
};

/**
 * 9 Áreas Curriculares Oficiales de Primaria Comunitaria Vocacional (SEP - Bolivia)
 */
export const AREAS_PRIMARIA_OFICIALES = [
  { id: 'LEN', codigo: 'LEN', nombre: 'Comunicación y Lenguajes (Lengua Castellana, Originaria y Extranjera)', campo: 'COMUNIDAD_Y_SOCIEDAD' },
  { id: 'SOC', codigo: 'SOC', nombre: 'Ciencias Sociales', campo: 'COMUNIDAD_Y_SOCIEDAD' },
  { id: 'EFD', codigo: 'EFD', nombre: 'Educación Física y Deportes', campo: 'COMUNIDAD_Y_SOCIEDAD' },
  { id: 'EMU', codigo: 'EMU', nombre: 'Educación Musical', campo: 'COMUNIDAD_Y_SOCIEDAD' },
  { id: 'APV', codigo: 'APV', nombre: 'Artes Plásticas y Visuales', campo: 'COMUNIDAD_Y_SOCIEDAD' },
  { id: 'MAT', codigo: 'MAT', nombre: 'Matemática', campo: 'CIENCIA_TECNOLOGIA_PRODUCCION' },
  { id: 'TEC', codigo: 'TEC', nombre: 'Técnica Tecnológica', campo: 'CIENCIA_TECNOLOGIA_PRODUCCION' },
  { id: 'NAT', codigo: 'NAT', nombre: 'Ciencias Naturales', campo: 'VIDA_TIERRA_TERRITORIO' },
  { id: 'VER', codigo: 'VER', nombre: 'Valores, Espiritualidad y Religiones', campo: 'COSMOS_Y_PENSAMIENTO' },
];

