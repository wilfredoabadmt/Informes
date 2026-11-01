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

