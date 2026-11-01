import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatNivelEducativo, formatCampoSaberes } from '../utils/formatters';
import {
  GraduationCap,
  BookOpen,
  Clock,
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Sparkles,
  UserCheck,
  UserPlus,
  Phone,
  Mail,
  Award,
  Search,
  School,
  FileCheck,
  Building2,
  FileSpreadsheet,
  Filter,
} from 'lucide-react';
import {
  getCoursesForInstitution,
  saveCoursesForInstitution,
  getTeachersForInstitution,
  saveTeachersForInstitution,
  getAssignmentsForInstitution,
  saveAssignmentsForInstitution,
  getMateriasForInstitution,
  saveMateriasForInstitution,
  DEFAULT_MATERIAS_PRIMARIA,
  DEFAULT_MATERIAS_SECUNDARIA,
  getStoredInstitutions,
  resolveTenantKey,
  type TenantParalelo,
  type TenantTeacher,
  type TenantAssignment,
  type TenantInstitution,
  type TenantMateria,
} from '../utils/multiTenantStore';

interface ParaleloItem {
  id: string;
  cursoNombre: string;
  nivel: string;
  grado: number;
  letra: string;
  turno: string;
  cupo: number;
  inscritos: number;
}

interface TeacherItem {
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

type MateriaItem = TenantMateria;

type AsignacionItem = TenantAssignment;

export const AcademicPage: React.FC = () => {
  const { user, isMaestro, isDirector, isSuperAdmin, currentInstitutionId, setCurrentInstitutionId } = useAuth();
  const [storedInstitutions, setStoredInstitutions] = useState<TenantInstitution[]>(() => getStoredInstitutions());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setStoredInstitutions(e.detail);
    };
    window.addEventListener('sigma_institutions_updated', handleUpdate);
    return () => window.removeEventListener('sigma_institutions_updated', handleUpdate);
  }, []);

  const authorizedInstitutions = React.useMemo(() => {
    if (isSuperAdmin) {
      return storedInstitutions;
    }
    if (user?.institutions && user.institutions.length > 0) {
      return user.institutions.map((ui) => {
        const full = storedInstitutions.find(
          (s) => s.id === (ui.institutionId || ui.id) || s.sie === ui.sie
        );
        return (
          full || {
            id: ui.institutionId || ui.id || '',
            sie: ui.sie,
            nombre: ui.nombre,
            departamento: (ui as any).departamento || '',
            provincia: '',
            municipio: '',
            distrito: '',
            tipo: 'FISCAL' as any,
            nivel: 'INTEGRADO' as any,
            activo: true,
            totalMaestrosVinculados: 0,
          }
        );
      });
    }
    const current = storedInstitutions.find(
      (s) => s.id === currentInstitutionId || s.sie === resolveTenantKey(currentInstitutionId)
    );
    return current ? [current] : [];
  }, [isSuperAdmin, user, storedInstitutions, currentInstitutionId]);

  const resolvedSie = resolveTenantKey(currentInstitutionId);
  const currentInst =
    authorizedInstitutions.find((i) => i.id === currentInstitutionId || i.sie === resolvedSie) ||
    authorizedInstitutions[0];
  const activeSie = currentInst?.sie || resolvedSie || '';

  const [tab, setTab] = useState<'cursos' | 'docentes' | 'asignaciones' | 'materias'>('cursos');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchDocente, setSearchDocente] = useState('');

  // 1. Cursos y Paralelos State (Multi-tenant scoped)
  const [paralelos, setParalelos] = useState<ParaleloItem[]>(() => getCoursesForInstitution(activeSie));

  // 2. Plantel Docente (Profesores) State (Multi-tenant scoped)
  const [docentes, setDocentes] = useState<TeacherItem[]>(() => getTeachersForInstitution(activeSie));

  // 3. Materias State (Multi-tenant scoped con currículo oficial)
  const [materias, setMaterias] = useState<TenantMateria[]>(() => getMateriasForInstitution(activeSie));

  // Filtros de Materias
  const [materiaFilterNivel, setMateriaFilterNivel] = useState<'ALL' | 'PRIMARIA' | 'SECUNDARIA'>('ALL');
  const [materiaFilterCampo, setMateriaFilterCampo] = useState<string>('ALL');
  const [searchMateria, setSearchMateria] = useState('');
  const [editingMateriaId, setEditingMateriaId] = useState<string | null>(null);
  const [materiaModalMode, setMateriaModalMode] = useState<'create' | 'edit'>('create');

  // 4. Asignaciones Docentes State (Multi-tenant scoped)
  const [asignaciones, setAsignaciones] = useState<AsignacionItem[]>(() => getAssignmentsForInstitution(activeSie));

  const [searchParams] = useSearchParams();

  // Sync state reactively when the selected school changes
  useEffect(() => {
    setParalelos(getCoursesForInstitution(activeSie));
    setDocentes(getTeachersForInstitution(activeSie));
    setAsignaciones(getAssignmentsForInstitution(activeSie));
    setMaterias(getMateriasForInstitution(activeSie));
  }, [activeSie]);

  // Modals state - auto-abrir si se pasó ?create=curso o ?open=curso en la URL
  const [showCursoModal, setShowCursoModal] = useState(() => {
    return searchParams.get('create') === 'curso' || searchParams.get('open') === 'curso';
  });
  const [newCurso, setNewCurso] = useState({
    nivel: 'SECUNDARIA',
    grado: 4,
    letra: 'A',
    turno: 'Mañana',
    cupo: 35,
  });

  const [showParaleloModal, setShowParaleloModal] = useState(false);
  const [newParalelo, setNewParalelo] = useState({
    cursoNombre: '1° de Secundaria Comunitaria Productiva',
    nivel: 'SECUNDARIA',
    grado: 1,
    letra: 'C',
    turno: 'Mañana',
    cupo: 35,
  });

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    rda: '',
    ci: '',
    nombres: '',
    primerApellido: '',
    segundoApellido: '',
    tituloProfesional: 'Profesor Normalista Superior',
    especialidad: 'Comunicación y Lenguajes',
    correo: '',
    telefono: '',
    cargoOficial: 'Docente de Asignatura',
    normalista: true,
    estado: 'ACTIVO' as 'ACTIVO' | 'LICENCIA' | 'TRASLADADO',
  });

  const [showMateriaModal, setShowMateriaModal] = useState(false);
  const [newMateria, setNewMateria] = useState<{
    codigo: string;
    nombre: string;
    campo: string;
    nivel: 'PRIMARIA' | 'SECUNDARIA' | 'AMBOS';
    horasSemanales: number;
    esTroncal: boolean;
  }>({
    codigo: '',
    nombre: '',
    campo: 'Comunidad y Sociedad',
    nivel: 'SECUNDARIA',
    horasSemanales: 4,
    esTroncal: true,
  });

  const [showAsignacionModal, setShowAsignacionModal] = useState(false);
  const [newAsignacion, setNewAsignacion] = useState({
    maestroNombre: 'Prof. Carlos Mamani Choque',
    cursoParalelo: '1° de Secundaria - Paralelo A',
    materiaNombre: 'Comunicación y Lenguajes',
    horasSemanales: 4,
    esTutor: false,
  });

  const triggerFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Handlers for Cursos CRUD
  const handleAddCurso = (e: React.FormEvent) => {
    e.preventDefault();
    const cursoNombre = `${newCurso.grado}° de ${
      newCurso.nivel === 'SECUNDARIA'
        ? 'Secundaria Comunitaria Productiva'
        : newCurso.nivel === 'PRIMARIA'
        ? 'Primaria Comunitaria Vocacional'
        : 'Educación Inicial en Familia Comunitaria'
    }`;

    const item: ParaleloItem = {
      id: `c-${Date.now()}`,
      cursoNombre,
      nivel: newCurso.nivel,
      grado: newCurso.grado,
      letra: newCurso.letra,
      turno: newCurso.turno,
      cupo: newCurso.cupo,
      inscritos: 0,
    };

    const updated = [...paralelos, item];
    setParalelos(updated);
    saveCoursesForInstitution(activeSie, updated);
    setShowCursoModal(false);
    triggerFeedback(`¡Curso "${cursoNombre}" y Paralelo "${newCurso.letra}" habilitados exitosamente!`);
  };

  // Handlers for Paralelos CRUD
  const handleAddParalelo = (e: React.FormEvent) => {
    e.preventDefault();
    const item: ParaleloItem = {
      id: `p-${Date.now()}`,
      ...newParalelo,
      inscritos: 0,
    };
    const updated = [...paralelos, item];
    setParalelos(updated);
    saveCoursesForInstitution(activeSie, updated);
    setShowParaleloModal(false);
    triggerFeedback(`¡Paralelo "${newParalelo.letra}" añadido al curso exitosamente!`);
  };

  const handleDeleteParalelo = (id: string) => {
    const updated = paralelos.filter((p) => p.id !== id);
    setParalelos(updated);
    saveCoursesForInstitution(activeSie, updated);
    triggerFeedback('Paralelo retirado de la gestión escolar.');
  };

  const handleQuickInitPrimaria = () => {
    const list: ParaleloItem[] = [
      { id: `c-${Date.now()}-p1`, cursoNombre: '1° de Primaria Comunitaria Vocacional', nivel: 'PRIMARIA', grado: 1, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-p2`, cursoNombre: '2° de Primaria Comunitaria Vocacional', nivel: 'PRIMARIA', grado: 2, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-p3`, cursoNombre: '3° de Primaria Comunitaria Vocacional', nivel: 'PRIMARIA', grado: 3, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-p4`, cursoNombre: '4° de Primaria Comunitaria Vocacional', nivel: 'PRIMARIA', grado: 4, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-p5`, cursoNombre: '5° de Primaria Comunitaria Vocacional', nivel: 'PRIMARIA', grado: 5, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-p6`, cursoNombre: '6° de Primaria Comunitaria Vocacional', nivel: 'PRIMARIA', grado: 6, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
    ];
    setParalelos(list);
    saveCoursesForInstitution(activeSie, list);
    triggerFeedback('¡Estructura de 1° a 6° de Primaria Comunitaria Vocacional habilitada con éxito!');
  };

  const handleQuickInitSecundaria = () => {
    const list: ParaleloItem[] = [
      { id: `c-${Date.now()}-s1`, cursoNombre: '1° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 1, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-s2`, cursoNombre: '2° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 2, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-s3`, cursoNombre: '3° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 3, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-s4`, cursoNombre: '4° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 4, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-s5`, cursoNombre: '5° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 5, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-s6`, cursoNombre: '6° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 6, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
    ];
    setParalelos(list);
    saveCoursesForInstitution(activeSie, list);
    triggerFeedback('¡Estructura de 1° a 6° de Secundaria Comunitaria Productiva habilitada con éxito!');
  };

  // Handlers for Plantel Docente CRUD
  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    const item: TeacherItem = {
      id: `t-${Date.now()}`,
      ...newTeacher,
      horasAsignadas: 0,
    };
    const updated = [item, ...docentes];
    setDocentes(updated);
    saveTeachersForInstitution(activeSie, updated);
    setShowTeacherModal(false);
    triggerFeedback(`¡Profesor(a) ${newTeacher.nombres} ${newTeacher.primerApellido} (RDA: ${newTeacher.rda}) vinculado al colegio con éxito!`);
    // Reset form
    setNewTeacher({
      rda: '',
      ci: '',
      nombres: '',
      primerApellido: '',
      segundoApellido: '',
      tituloProfesional: 'Profesor Normalista Superior',
      especialidad: 'Comunicación y Lenguajes',
      correo: '',
      telefono: '',
      cargoOficial: 'Docente de Asignatura',
      normalista: true,
      estado: 'ACTIVO',
    });
  };

  const handleDeleteTeacher = (id: string) => {
    const updated = docentes.filter((d) => d.id !== id);
    setDocentes(updated);
    saveTeachersForInstitution(activeSie, updated);
    triggerFeedback('Profesor desvinculado de la Unidad Educativa.');
  };

  const toggleTeacherStatus = (id: string) => {
    const updated = docentes.map((d) => {
      if (d.id === id) {
        const nextStatus: 'ACTIVO' | 'LICENCIA' = d.estado === 'ACTIVO' ? 'LICENCIA' : 'ACTIVO';
        return { ...d, estado: nextStatus };
      }
      return d;
    });
    setDocentes(updated);
    saveTeachersForInstitution(activeSie, updated);
    triggerFeedback('Estado de vinculación docente modificado.');
  };

  // Handlers for Materias CRUD
  const handleOpenCreateMateria = () => {
    setMateriaModalMode('create');
    setEditingMateriaId(null);
    setNewMateria({
      codigo: '',
      nombre: '',
      campo: 'Comunidad y Sociedad',
      nivel: materiaFilterNivel === 'ALL' ? 'SECUNDARIA' : materiaFilterNivel,
      horasSemanales: 4,
      esTroncal: true,
    });
    setShowMateriaModal(true);
  };

  const handleOpenEditMateria = (m: TenantMateria) => {
    setMateriaModalMode('edit');
    setEditingMateriaId(m.id);
    setNewMateria({
      codigo: m.codigo,
      nombre: m.nombre,
      campo: m.campo,
      nivel: m.nivel,
      horasSemanales: m.horasSemanales || 4,
      esTroncal: m.esOficial ?? true,
    });
    setShowMateriaModal(true);
  };

  const handleSaveMateria = (e: React.FormEvent) => {
    e.preventDefault();
    if (materiaModalMode === 'edit' && editingMateriaId) {
      const updated = materias.map((m) =>
        m.id === editingMateriaId
          ? {
              ...m,
              codigo: newMateria.codigo.trim().toUpperCase(),
              nombre: newMateria.nombre.trim(),
              campo: newMateria.campo,
              nivel: newMateria.nivel,
              horasSemanales: Number(newMateria.horasSemanales) || 4,
              esOficial: newMateria.esTroncal,
            }
          : m
      );
      setMaterias(updated);
      saveMateriasForInstitution(activeSie, updated);
      triggerFeedback('✅ Asignatura curricular actualizada exitosamente.');
    } else {
      const item: TenantMateria = {
        id: `m-${Date.now()}`,
        codigo: newMateria.codigo.trim().toUpperCase(),
        nombre: newMateria.nombre.trim(),
        campo: newMateria.campo,
        nivel: newMateria.nivel,
        horasSemanales: Number(newMateria.horasSemanales) || 4,
        esOficial: newMateria.esTroncal,
        activo: true,
      };
      const updated = [...materias, item];
      setMaterias(updated);
      saveMateriasForInstitution(activeSie, updated);
      triggerFeedback('✅ Nueva materia curricular registrada en el plan de estudios.');
    }
    setShowMateriaModal(false);
  };

  const handleDeleteMateria = (id: string) => {
    const updated = materias.filter((m) => m.id !== id);
    setMaterias(updated);
    saveMateriasForInstitution(activeSie, updated);
    triggerFeedback('Materia dada de baja de la malla curricular.');
  };

  const handleRestoreMallaPrimaria = () => {
    // Incorpora las 9 materias oficiales de primaria evitando duplicar códigos
    const existingCodes = new Set(materias.map((m) => m.codigo));
    const toAdd = DEFAULT_MATERIAS_PRIMARIA.filter((p) => !existingCodes.has(p.codigo));
    const updated = [...materias, ...toAdd];
    setMaterias(updated);
    saveMateriasForInstitution(activeSie, updated);
    setMateriaFilterNivel('PRIMARIA');
    triggerFeedback(`✅ Malla curricular de Primaria Comunitaria Vocacional incorporada (${toAdd.length} áreas agregadas).`);
  };

  const handleRestoreMallaSecundaria = () => {
    // Incorpora las 13 materias oficiales de secundaria evitando duplicar códigos
    const existingCodes = new Set(materias.map((m) => m.codigo));
    const toAdd = DEFAULT_MATERIAS_SECUNDARIA.filter((s) => !existingCodes.has(s.codigo));
    const updated = [...materias, ...toAdd];
    setMaterias(updated);
    saveMateriasForInstitution(activeSie, updated);
    setMateriaFilterNivel('SECUNDARIA');
    triggerFeedback(`✅ Malla curricular de Secundaria Comunitaria Productiva incorporada (${toAdd.length} áreas agregadas).`);
  };

  const filteredMaterias: TenantMateria[] = materias.filter((m) => {
    const matchesNivel =
      materiaFilterNivel === 'ALL' ||
      m.nivel === materiaFilterNivel ||
      m.nivel === 'AMBOS';

    const matchesCampo =
      materiaFilterCampo === 'ALL' || m.campo.toLowerCase().includes(materiaFilterCampo.toLowerCase());

    const matchesSearch =
      m.nombre.toLowerCase().includes(searchMateria.toLowerCase()) ||
      m.codigo.toLowerCase().includes(searchMateria.toLowerCase());

    return matchesNivel && matchesCampo && matchesSearch;
  });

  const handleExportMallaExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = filteredMaterias.map((m, idx) => ({
      NRO: idx + 1,
      CODIGO: m.codigo,
      ASIGNATURA: m.nombre,
      NIVEL: m.nivel,
      CAMPO_DE_SABERES: m.campo,
      CARGA_HORARIA_SEMANAL: `${m.horasSemanales} hrs`,
      TIPO: m.esOficial ? 'Troncal Ministerial' : 'Complementaria',
      ESTADO: m.activo ? 'ACTIVO' : 'INACTIVO',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'MALLA_CURRICULAR');
    XLSX.writeFile(wb, `Malla_Curricular_${activeSie || 'SEP'}_2026.xlsx`);
    triggerFeedback('✅ Malla curricular exportada a Excel.');
  };

  // Handlers for Asignaciones CRUD
  const handleAddAsignacion = (e: React.FormEvent) => {
    e.preventDefault();
    const item: AsignacionItem = {
      id: `as-${Date.now()}`,
      ...newAsignacion,
    };
    const updated = [...asignaciones, item];
    setAsignaciones(updated);
    saveAssignmentsForInstitution(activeSie, updated);
    setShowAsignacionModal(false);
    triggerFeedback('¡Carga horaria asignada al docente exitosamente!');
  };

  const handleDeleteAsignacion = (id: string) => {
    const updated = asignaciones.filter((a) => a.id !== id);
    setAsignaciones(updated);
    saveAssignmentsForInstitution(activeSie, updated);
    triggerFeedback('Asignación docente desvinculada.');
  };

  const searchLower = (searchDocente || '').trim().toLowerCase();
  const filteredDocentes = docentes.filter(
    (d) =>
      String(d.rda || '').toLowerCase().includes(searchLower) ||
      String(d.ci || '').toLowerCase().includes(searchLower) ||
      String(d.primerApellido || '').toLowerCase().includes(searchLower) ||
      String(d.nombres || '').toLowerCase().includes(searchLower) ||
      String(d.especialidad || '').toLowerCase().includes(searchLower)
  );

  return (
    <div className="space-y-6">
      {/* Active School Multi-Tenant Context Banner */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
            <School className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded">
                Unidad Educativa Activa
              </span>
              <span className="text-xs text-slate-400">SIE: {currentInst?.sie}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
              {currentInst?.nombre}
            </h2>
            <p className="text-xs text-slate-400">
              {currentInst?.departamento} • {currentInst?.distrito} • {currentInst?.nivel}
            </p>
          </div>
        </div>

        {/* Quick School Selector: solo visible si es Superadmin o tiene múltiples colegios asignados */}
        {(isSuperAdmin || authorizedInstitutions.length > 1) && (
          <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
            <span className="text-xs font-semibold text-slate-300 whitespace-nowrap pl-2">
              Gestionar Colegio:
            </span>
            <select
              value={currentInst?.id || currentInstitutionId || authorizedInstitutions[0]?.id}
              onChange={(e) => setCurrentInstitutionId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-emerald-400 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer max-w-[260px] truncate"
            >
              {authorizedInstitutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre} (SIE: {i.sie})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Gestión de Cursos, Plantel Docente y Asignaciones
            </h1>
            <p className="text-xs text-slate-500">
              Administración de grados escolares, vinculación de profesores (RDA) y carga horaria (Ley 070)
            </p>
          </div>
        </div>

        {/* Global Action Buttons based on active Tab */}
        {!isMaestro && (
          <div className="flex flex-wrap items-center gap-2">
            {tab === 'cursos' && (
              <>
                <button
                  onClick={() => setShowCursoModal(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  <School className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Habilitar Curso</span>
                </button>
                <button
                  onClick={() => setShowParaleloModal(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Adicionar Paralelo</span>
                </button>
              </>
            )}

            {tab === 'docentes' && (
              <button
                onClick={() => setShowTeacherModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Adicionar Profesor (Vincular RDA)</span>
              </button>
            )}

            {tab === 'asignaciones' && (
              <button
                onClick={() => setShowAsignacionModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Asignar Carga Horaria</span>
              </button>
            )}

            {tab === 'materias' && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRestoreMallaPrimaria}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition cursor-pointer border border-blue-200"
                  title="Cargar 9 áreas oficiales de Primaria Comunitaria Vocacional (Ley 070)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>🎒 9 Áreas Primaria</span>
                </button>
                <button
                  type="button"
                  onClick={handleRestoreMallaSecundaria}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold transition cursor-pointer border border-purple-200"
                  title="Cargar 13 áreas oficiales de Secundaria Comunitaria Productiva (Ley 070)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>🎓 13 Áreas Secundaria</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportMallaExcel}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Exportar (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreateMateria}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Nueva Materia</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-8 text-xs font-bold text-slate-600 overflow-x-auto">
        <button
          onClick={() => setTab('cursos')}
          className={`pb-3 border-b-2 flex items-center space-x-2 cursor-pointer transition whitespace-nowrap ${
            tab === 'cursos'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Cursos & Paralelos ({paralelos.length})</span>
        </button>

        <button
          onClick={() => setTab('docentes')}
          className={`pb-3 border-b-2 flex items-center space-x-2 cursor-pointer transition whitespace-nowrap ${
            tab === 'docentes'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Plantel Docente ({docentes.length})</span>
        </button>

        <button
          onClick={() => setTab('asignaciones')}
          className={`pb-3 border-b-2 flex items-center space-x-2 cursor-pointer transition whitespace-nowrap ${
            tab === 'asignaciones'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Asignaciones Docentes ({asignaciones.length})</span>
        </button>

        <button
          onClick={() => setTab('materias')}
          className={`pb-3 border-b-2 flex items-center space-x-2 cursor-pointer transition whitespace-nowrap ${
            tab === 'materias'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Malla Curricular ({materias.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CURSOS Y PARALELOS                                                 */}
      {/* ========================================================================= */}
      {tab === 'cursos' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Cursos y Paralelos Habilitados en la Institución
                </h2>
                <p className="text-xs text-slate-500">
                  Organización de aulas, turnos y cupos de matrícula (Gestión 2026)
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                {paralelos.length} Paralelos Activos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-4">Curso / Grado Oficial</th>
                    <th className="py-3 px-3 text-center">Nivel Educativo</th>
                    <th className="py-3 px-3 text-center">Paralelo</th>
                    <th className="py-3 px-3 text-center">Turno</th>
                    <th className="py-3 px-3 text-center">Cupo Máximo</th>
                    <th className="py-3 px-3 text-center">Alumnos Matriculados</th>
                    {!isMaestro && <th className="py-3 px-3 text-center w-24">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paralelos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <School className="w-10 h-10 text-slate-300" />
                          <span className="font-semibold text-slate-700">Esta Unidad Educativa no tiene cursos ni paralelos registrados aún.</span>
                          <p className="text-xs text-slate-400">Habilita los grados correspondientes para poder matricular alumnos y asignar profesores.</p>
                          {!isMaestro && (
                            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                              <button
                                onClick={handleQuickInitPrimaria}
                                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>⚡ Cargar 1° a 6° Primaria</span>
                              </button>

                              <button
                                onClick={handleQuickInitSecundaria}
                                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>⚡ Cargar 1° a 6° Secundaria</span>
                              </button>

                              <button
                                onClick={() => setShowCursoModal(true)}
                                className="inline-flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                <span>+ Crear Curso Manual</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paralelos.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900 flex items-center space-x-2">
                          <School className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{p.cursoNombre}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {formatNivelEducativo(p.nivel)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-700 text-sm">
                          "{p.letra}"
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 font-medium">{p.turno}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                          {p.cupo}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-bold text-emerald-800">{p.inscritos}</span>
                          <span className="text-slate-400"> / {p.cupo}</span>
                        </td>
                        {!isMaestro && (
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleDeleteParalelo(p.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                              title="Eliminar Paralelo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PLANTEL DOCENTE (PROFESORES / MAESTROS)                            */}
      {/* ========================================================================= */}
      {tab === 'docentes' && (
        <div className="space-y-4">
          {/* Search bar for teachers */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <Search className="w-4 h-4 text-slate-400 ml-2" />
            <input
              type="text"
              value={searchDocente}
              onChange={(e) => setSearchDocente(e.target.value)}
              placeholder="Buscar profesor por número de RDA, carnet de identidad, apellido o especialidad..."
              className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Nómina del Plantel Docente Institucional ({filteredDocentes.length} Maestros)
                </h2>
                <p className="text-xs text-slate-500">
                  Expediente profesional verificado con el Registro Docente Administrativo (RDA) del Ministerio
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                Gestión 2026
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-3 w-8">#</th>
                    <th className="py-3 px-3 w-28">Nº RDA</th>
                    <th className="py-3 px-4 min-w-[200px]">Apellidos y Nombres</th>
                    <th className="py-3 px-3 w-28">Carnet Identidad</th>
                    <th className="py-3 px-4 min-w-[180px]">Especialidad / Título</th>
                    <th className="py-3 px-4 min-w-[180px]">Contacto Oficial</th>
                    <th className="py-3 px-3 text-center">Carga Horaria</th>
                    <th className="py-3 px-3 text-center w-24">Estado</th>
                    {!isMaestro && <th className="py-3 px-3 text-center w-24">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocentes.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <UserPlus className="w-10 h-10 text-slate-300" />
                          <span className="font-semibold text-slate-700">No hay profesores vinculados a esta Unidad Educativa.</span>
                          <p className="text-xs text-slate-400">Adiciona docentes registrando su número de RDA y especialidad académica.</p>
                          {!isMaestro && (
                            <button
                              onClick={() => setShowTeacherModal(true)}
                              className="mt-2 inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Vincular Primer Profesor</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDocentes.map((d, idx) => (
                      <tr key={d.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-800">
                          {d.rda}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 uppercase">
                            {d.primerApellido} {d.segundoApellido} {d.nombres}
                          </div>
                          <div className="text-[11px] text-slate-500">{d.cargoOficial}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{d.ci}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{d.especialidad}</div>
                          <div className="text-[11px] text-slate-500">{d.tituloProfesional}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1 text-slate-600 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{d.correo}</span>
                          </div>
                          {d.telefono && (
                            <div className="flex items-center space-x-1 text-emerald-700 text-[11px] mt-0.5">
                              <Phone className="w-3 h-3" />
                              <span>{d.telefono}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                          {d.horasAsignadas > 0 ? `${d.horasAsignadas} hrs/sem` : 'Sin carga'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              d.estado === 'ACTIVO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {d.estado}
                          </span>
                        </td>
                        {!isMaestro && (
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => toggleTeacherStatus(d.id)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 transition"
                                title="Cambiar Estado (Licencia / Activo)"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTeacher(d.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                                title="Desvincular Profesor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ASIGNACIONES DOCENTES (CARGA HORARIA)                              */}
      {/* ========================================================================= */}
      {tab === 'asignaciones' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Distribución de Carga Horaria y Asignaciones
              </h2>
              <p className="text-xs text-slate-500">
                Vinculación de docentes con sus materias y cursos asignados
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {asignaciones.length} Asignaciones Activas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3 px-4">Maestro / Docente Responsable</th>
                  <th className="py-3 px-4">Curso y Paralelo</th>
                  <th className="py-3 px-4">Asignatura Curricular</th>
                  <th className="py-3 px-3 text-center">Carga Horaria</th>
                  <th className="py-3 px-3 text-center">Tutoría</th>
                  {!isMaestro && <th className="py-3 px-3 text-center w-24">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {asignaciones.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Clock className="w-10 h-10 text-slate-300" />
                        <span className="font-semibold text-slate-700">No hay asignaciones de carga horaria registradas en este colegio.</span>
                        <p className="text-xs text-slate-400">Asigna a los profesores vinculados sus materias y cursos correspondientes.</p>
                        {!isMaestro && docentes.length > 0 && paralelos.length > 0 && (
                          <button
                            onClick={() => setShowAsignacionModal(true)}
                            className="mt-2 inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Asignar Primera Carga Horaria</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  asignaciones.map((as) => (
                    <tr key={as.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">{as.maestroNombre}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{as.cursoParalelo}</td>
                      <td className="py-3 px-4 text-emerald-800 font-bold">{as.materiaNombre}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                        {as.horasSemanales} hrs/sem
                      </td>
                      <td className="py-3 px-3 text-center">
                        {as.esTutor ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                            Tutor de Curso
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Docente</span>
                        )}
                      </td>
                      {!isMaestro && (
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleDeleteAsignacion(as.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                            title="Desvincular Asignación"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MALLA CURRICULAR                                                   */}
      {/* ========================================================================= */}
      {tab === 'materias' && (
        <div className="space-y-4">
          {/* Barra de Filtros y Búsqueda de Materias */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Pills de Nivel Educativo */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
              <button
                type="button"
                onClick={() => setMateriaFilterNivel('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  materiaFilterNivel === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas ({materias.length})
              </button>
              <button
                type="button"
                onClick={() => setMateriaFilterNivel('PRIMARIA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                  materiaFilterNivel === 'PRIMARIA'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                <span>🎒 Primaria</span>
                <span className="text-[10px] opacity-90">
                  ({materias.filter((m) => m.nivel === 'PRIMARIA' || m.nivel === 'AMBOS').length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMateriaFilterNivel('SECUNDARIA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                  materiaFilterNivel === 'SECUNDARIA'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-700'
                }`}
              >
                <span>🎓 Secundaria</span>
                <span className="text-[10px] opacity-90">
                  ({materias.filter((m) => m.nivel === 'SECUNDARIA' || m.nivel === 'AMBOS').length})
                </span>
              </button>
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              {/* Filtro por Campo de Saberes */}
              <select
                value={materiaFilterCampo}
                onChange={(e) => setMateriaFilterCampo(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">🌐 Todos los Campos</option>
                <option value="Comunidad y Sociedad">Comunidad y Sociedad</option>
                <option value="Ciencia, Tecnología y Producción">Ciencia, Tecnología y Producción</option>
                <option value="Vida, Tierra y Territorio">Vida, Tierra y Territorio</option>
                <option value="Cosmos y Pensamiento">Cosmos y Pensamiento</option>
              </select>

              {/* Búsqueda rápida */}
              <div className="relative flex-1 md:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar materia..."
                  value={searchMateria}
                  onChange={(e) => setSearchMateria(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Tabla de Materias */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>
                  Malla Curricular ({filteredMaterias.length} de {materias.length} Asignaturas)
                </span>
              </h2>
              <span className="text-xs text-slate-500">Currículo Base Oficial del SEP (Ley 070)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-3 w-24">Código</th>
                    <th className="py-3 px-4 min-w-[220px]">Asignatura / Área</th>
                    <th className="py-3 px-4 min-w-[240px]">Campo de Saberes y Conocimientos</th>
                    <th className="py-3 px-3 text-center">Nivel</th>
                    <th className="py-3 px-3 text-center">Carga Horaria</th>
                    <th className="py-3 px-3 text-center">Tipo</th>
                    {!isMaestro && <th className="py-3 px-3 text-center w-28">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMaterias.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        <p>No se encontraron asignaturas con los filtros seleccionados.</p>
                        <div className="mt-2 space-x-2">
                          <button
                            type="button"
                            onClick={handleRestoreMallaPrimaria}
                            className="text-blue-600 hover:underline font-bold"
                          >
                            + Cargar Malla Primaria (9 Áreas)
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={handleRestoreMallaSecundaria}
                            className="text-purple-600 hover:underline font-bold"
                          >
                            + Cargar Malla Secundaria (13 Áreas)
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMaterias.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                            {m.codigo}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{m.nombre}</td>
                        <td className="py-3 px-4 text-slate-700">
                          <span className="text-xs font-medium text-slate-700">
                            {formatCampoSaberes(m.campo)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.nivel === 'PRIMARIA'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : m.nivel === 'SECUNDARIA'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {m.nivel === 'AMBOS' ? 'PRIMARIA & SECUNDARIA' : m.nivel}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {m.horasSemanales || 4} hrs/sem
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-[10px]">
                            {m.esOficial ?? true ? 'Troncal Ministerial' : 'Complementaria'}
                          </span>
                        </td>
                        {!isMaestro && (
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditMateria(m)}
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
                                title="Editar Asignatura"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMateria(m.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                title="Eliminar Materia"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: HABILITAR NUEVO CURSO / GRADO                                      */}
      {/* ========================================================================= */}
      {showCursoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase">Habilitar Nuevo Curso / Grado Escolar</h2>
              <button onClick={() => setShowCursoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCurso} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nivel Educativo:</label>
                  <select
                    value={newCurso.nivel}
                    onChange={(e) => setNewCurso({ ...newCurso, nivel: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  >
                    <option value="SECUNDARIA">Secundaria</option>
                    <option value="PRIMARIA">Primaria</option>
                    <option value="INICIAL">Inicial en Familia</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Año de Escolaridad:</label>
                  <select
                    value={newCurso.grado}
                    onChange={(e) => setNewCurso({ ...newCurso, grado: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  >
                    <option value={1}>1º de Escolaridad</option>
                    <option value={2}>2º de Escolaridad</option>
                    <option value={3}>3º de Escolaridad</option>
                    <option value={4}>4º de Escolaridad</option>
                    <option value={5}>5º de Escolaridad</option>
                    <option value={6}>6º de Escolaridad</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Paralelo Inicial:</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={newCurso.letra}
                    onChange={(e) => setNewCurso({ ...newCurso, letra: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-center"
                    placeholder="A"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Turno de Clases:</label>
                  <select
                    value={newCurso.turno}
                    onChange={(e) => setNewCurso({ ...newCurso, turno: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  >
                    <option value="Mañana">Turno Mañana</option>
                    <option value="Tarde">Turno Tarde</option>
                    <option value="Noche">Turno Noche</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cupo Máximo:</label>
                <input
                  type="number"
                  min="1"
                  max="45"
                  value={newCurso.cupo}
                  onChange={(e) => setNewCurso({ ...newCurso, cupo: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCursoModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Habilitar Curso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADICIONAR PARALELO                                                 */}
      {/* ========================================================================= */}
      {showParaleloModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase">Habilitar Nuevo Paralelo</h2>
              <button onClick={() => setShowParaleloModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddParalelo} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Curso / Grado:</label>
                <select
                  value={newParalelo.cursoNombre}
                  onChange={(e) => setNewParalelo({ ...newParalelo, cursoNombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                >
                  <option value="1° de Secundaria Comunitaria Productiva">1° de Secundaria Comunitaria Productiva</option>
                  <option value="2° de Secundaria Comunitaria Productiva">2° de Secundaria Comunitaria Productiva</option>
                  <option value="3° de Secundaria Comunitaria Productiva">3° de Secundaria Comunitaria Productiva</option>
                  <option value="1° de Primaria Comunitaria Vocacional">1° de Primaria Comunitaria Vocacional</option>
                  <option value="2° de Primaria Comunitaria Vocacional">2° de Primaria Comunitaria Vocacional</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Letra Paralelo:</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={newParalelo.letra}
                    onChange={(e) => setNewParalelo({ ...newParalelo, letra: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-center"
                    placeholder="B, C, D..."
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Turno:</label>
                  <select
                    value={newParalelo.turno}
                    onChange={(e) => setNewParalelo({ ...newParalelo, turno: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  >
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noche">Noche</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Cupo Máximo:</label>
                <input
                  type="number"
                  min="1"
                  max="45"
                  value={newParalelo.cupo}
                  onChange={(e) => setNewParalelo({ ...newParalelo, cupo: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowParaleloModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Crear Paralelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADICIONAR PROFESOR / REGISTRAR MAESTRO (RDA)                       */}
      {/* ========================================================================= */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase">
                  Adicionar Profesor / Vincular Maestro
                </h2>
                <p className="text-[11px] text-slate-500">
                  Registro oficial en la Unidad Educativa con Cédula y Nº RDA
                </p>
              </div>
              <button onClick={() => setShowTeacherModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Número de RDA (Registro Docente):
                  </label>
                  <input
                    type="text"
                    required
                    value={newTeacher.rda}
                    onChange={(e) => setNewTeacher({ ...newTeacher, rda: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold text-emerald-800"
                    placeholder="ej. 6849302"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Carnet de Identidad (CI):</label>
                  <input
                    type="text"
                    required
                    value={newTeacher.ci}
                    onChange={(e) => setNewTeacher({ ...newTeacher, ci: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                    placeholder="ej. 7214589 LP"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombres:</label>
                  <input
                    type="text"
                    required
                    value={newTeacher.nombres}
                    onChange={(e) => setNewTeacher({ ...newTeacher, nombres: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    placeholder="ej. Juan Carlos"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Primer Apellido:</label>
                  <input
                    type="text"
                    required
                    value={newTeacher.primerApellido}
                    onChange={(e) => setNewTeacher({ ...newTeacher, primerApellido: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    placeholder="ej. Mamani"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Segundo Apellido:</label>
                  <input
                    type="text"
                    value={newTeacher.segundoApellido}
                    onChange={(e) => setNewTeacher({ ...newTeacher, segundoApellido: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    placeholder="ej. Choque"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Especialidad Principal:</label>
                  <select
                    value={newTeacher.especialidad}
                    onChange={(e) => setNewTeacher({ ...newTeacher, especialidad: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  >
                    <option value="Comunicación y Lenguajes">Comunicación y Lenguajes</option>
                    <option value="Matemática y Lógica">Matemática y Lógica</option>
                    <option value="Ciencias Sociales e Historia">Ciencias Sociales e Historia</option>
                    <option value="Biología y Geografía">Biología y Geografía</option>
                    <option value="Física y Química">Física y Química</option>
                    <option value="Lengua Extranjera (Inglés)">Lengua Extranjera (Inglés)</option>
                    <option value="Educación Musical">Educación Musical</option>
                    <option value="Educación Física y Deportes">Educación Física y Deportes</option>
                    <option value="Cosmovisiones y Filosofía">Cosmovisiones y Filosofía</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Título Profesional:</label>
                  <select
                    value={newTeacher.tituloProfesional}
                    onChange={(e) => setNewTeacher({ ...newTeacher, tituloProfesional: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  >
                    <option value="Profesor Normalista Superior">Profesor Normalista Superior</option>
                    <option value="Licenciado en Ciencias de la Educación">Licenciado en Educación</option>
                    <option value="Maestro con Especialidad SEP">Maestro Especialista SEP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Correo Institucional:</label>
                  <input
                    type="email"
                    required
                    value={newTeacher.correo}
                    onChange={(e) => setNewTeacher({ ...newTeacher, correo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    placeholder="docente@minedu.gob.bo"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Celular / Teléfono:</label>
                  <input
                    type="text"
                    value={newTeacher.telefono}
                    onChange={(e) => setNewTeacher({ ...newTeacher, telefono: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    placeholder="ej. 71548923"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cargo Oficial en el Colegio:</label>
                <input
                  type="text"
                  required
                  value={newTeacher.cargoOficial}
                  onChange={(e) => setNewTeacher({ ...newTeacher, cargoOficial: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  placeholder="ej. Docente de Área / Maestro de Aula"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Registrar Profesor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASIGNAR CARGA HORARIA                                              */}
      {/* ========================================================================= */}
      {showAsignacionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase">Asignar Carga Horaria a Maestro</h2>
              <button onClick={() => setShowAsignacionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAsignacion} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Maestro(a):</label>
                <select
                  value={newAsignacion.maestroNombre}
                  onChange={(e) => setNewAsignacion({ ...newAsignacion, maestroNombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                >
                  {docentes.map((doc) => (
                    <option key={doc.id} value={`Prof. ${doc.nombres} ${doc.primerApellido}`}>
                      Prof. {doc.nombres} {doc.primerApellido} (RDA: {doc.rda})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Curso y Paralelo:</label>
                <select
                  value={newAsignacion.cursoParalelo}
                  onChange={(e) => setNewAsignacion({ ...newAsignacion, cursoParalelo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                >
                  {paralelos.map((p) => (
                    <option key={p.id} value={`${p.cursoNombre} - Paralelo ${p.letra}`}>
                      {p.cursoNombre} - Paralelo {p.letra} ({p.turno})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Asignatura:</label>
                <select
                  value={newAsignacion.materiaNombre}
                  onChange={(e) => setNewAsignacion({ ...newAsignacion, materiaNombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                >
                  {materias.map((m) => (
                    <option key={m.id} value={m.nombre}>
                      {m.nombre} ({m.codigo})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Horas Semanales:</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={newAsignacion.horasSemanales}
                    onChange={(e) => setNewAsignacion({ ...newAsignacion, horasSemanales: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAsignacion.esTutor}
                      onChange={(e) => setNewAsignacion({ ...newAsignacion, esTutor: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Es Tutor de Curso</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAsignacionModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Guardar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR / EDITAR MATERIA                                             */}
      {/* ========================================================================= */}
      {showMateriaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase">
                {materiaModalMode === 'edit' ? 'Editar Asignatura Curricular' : 'Añadir Asignatura a la Malla'}
              </h2>
              <button
                type="button"
                onClick={() => setShowMateriaModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveMateria} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Código de Materia:</label>
                  <input
                    type="text"
                    required
                    value={newMateria.codigo}
                    onChange={(e) => setNewMateria({ ...newMateria, codigo: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono uppercase font-bold"
                    placeholder="ej. FIS-SEC"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nivel Educativo:</label>
                  <select
                    value={newMateria.nivel}
                    onChange={(e) => setNewMateria({ ...newMateria, nivel: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                  >
                    <option value="PRIMARIA">🎒 Primaria (1° a 6°)</option>
                    <option value="SECUNDARIA">🎓 Secundaria (1° a 6°)</option>
                    <option value="AMBOS">🌐 Ambos Niveles</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre Oficial de la Asignatura:</label>
                <input
                  type="text"
                  required
                  value={newMateria.nombre}
                  onChange={(e) => setNewMateria({ ...newMateria, nombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  placeholder="ej. Física y Química"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Campo de Saberes:</label>
                  <select
                    value={newMateria.campo}
                    onChange={(e) => setNewMateria({ ...newMateria, campo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    <option value="Comunidad y Sociedad">Comunidad y Sociedad</option>
                    <option value="Ciencia, Tecnología y Producción">Ciencia, Tecnología y Producción</option>
                    <option value="Vida, Tierra y Territorio">Vida, Tierra y Territorio</option>
                    <option value="Cosmos y Pensamiento">Cosmos y Pensamiento</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Carga Horaria Semanal:</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    required
                    value={newMateria.horasSemanales}
                    onChange={(e) => setNewMateria({ ...newMateria, horasSemanales: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMateria.esTroncal}
                    onChange={(e) => setNewMateria({ ...newMateria, esTroncal: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Área Troncal Ministerial (Obligatoria SEP)</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMateriaModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  {materiaModalMode === 'edit' ? 'Guardar Cambios' : 'Registrar Asignatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
