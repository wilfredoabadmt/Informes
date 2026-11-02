import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getCoursesForInstitution,
  getStudentsForInstitution,
  saveCoursesForInstitution,
  resolveTenantKey,
  getTrimestreStatus,
  lockTrimestreStatus,
  unlockTrimestreStatus,
  getGradesForInstitutionAndKey,
  saveGradesForInstitutionAndKey,
  type TenantParalelo,
  type TenantStudent,
  type TenantTrimestreStatus,
} from '../utils/multiTenantStore';
import {
  BookOpenCheck,
  Save,
  CheckCircle2,
  ShieldCheck,
  Info,
  Printer,
  FileSpreadsheet,
  Download,
  Filter,
  ArrowRight,
  School,
  Plus,
  Sparkles,
  X,
  Lock,
  Unlock,
  AlertTriangle,
  FileCheck,
  KeyRound,
  History,
} from 'lucide-react';
import { exportGradesToExcel, exportGradesToPdf } from '../utils/exportHelpers';
import type { GradeExportRow } from '../utils/exportHelpers';
import { getEscalaCualitativa, AREAS_PRIMARIA_OFICIALES } from '../utils/formatters';

export interface StudentGradeRow {
  inscripcionId: string;
  rude: string;
  estudiante: string;
  // Dimensional summary
  ser: number;
  saber: number;
  hacer: number;
  decidir: number;
  autoSer: number;
  autoDecidir: number;
  puntosExtras: number;
  // Detailed criteria breakdown (Sheet 1D in REGISTRO_MODERNO.xlsb)
  serAct1: number;
  serAct2: number;
  saberEv1: number;
  hacerPrac1: number;
}

// Catálogo de Cursos
export const CURSOS_DISPONIBLES = [
  { id: 'SEC_1A', nombre: '1° de Secundaria Comunitaria Productiva - Paralelo A', nivel: 'Secundaria' },
  { id: 'SEC_1B', nombre: '1° de Secundaria Comunitaria Productiva - Paralelo B', nivel: 'Secundaria' },
  { id: 'SEC_2A', nombre: '2° de Secundaria Comunitaria Productiva - Paralelo A', nivel: 'Secundaria' },
  { id: 'PRIM_1A', nombre: '1° de Primaria Comunitaria Vocacional - Paralelo A', nivel: 'Primaria' },
  { id: 'PRIM_2A', nombre: '2° de Primaria Comunitaria Vocacional - Paralelo A', nivel: 'Primaria' },
];

// Catálogo de Asignaturas
export const ASIGNATURAS_DISPONIBLES = [
  { id: 'MAT', nombre: 'Matemática (Ciencia, Tecnología y Producción)' },
  { id: 'LEN', nombre: 'Comunicación y Lenguajes (Comunidad y Sociedad)' },
  { id: 'GUA', nombre: 'Lengua Originaria Guaraní (Comunidad y Sociedad)' },
  { id: 'CIEN', nombre: 'Ciencias Naturales: Biología-Geografía (Vida Tierra Territorio)' },
  { id: 'SOC', nombre: 'Ciencias Sociales (Comunidad y Sociedad)' },
  { id: 'ART', nombre: 'Artes Plásticas y Visuales (Comunidad y Sociedad)' },
];

// Estudiantes según Curso
const ESTUDIANTES_POR_CURSO: Record<string, { rude: string; estudiante: string }[]> = {
  SEC_1A: [
    { rude: '807300452026001', estudiante: 'ALANOCA CRUZ ERICK ELIAS' },
    { rude: '807300452026002', estudiante: 'ARAMAYO TOLEDO FABIOLA' },
    { rude: '807300452026003', estudiante: 'CAMACHO RENJIFO KAROL LUCERO' },
    { rude: '807300452026004', estudiante: 'CARDOZO YEVARA CARLIN YARITA' },
    { rude: '807300452026005', estudiante: 'COLQUE COLODRO JHOANNA MAYENNI' },
    { rude: '807300452026006', estudiante: 'FLORES CALLISAYA GABRIEL OMAR' },
  ],
  SEC_1B: [
    { rude: '807300452026007', estudiante: 'ARCE CONDORI MATEO DANIEL' },
    { rude: '807300452026008', estudiante: 'GUTIERREZ ROJAS SOFIA BELEN' },
    { rude: '807300452026009', estudiante: 'MAMANI QUISPE LUCIA VALENTINA' },
    { rude: '807300452026010', estudiante: 'TORREZ MENDOZA NICOLE ANDREA' },
    { rude: '807300452026011', estudiante: 'VARGAS PAZ ALEJANDRO JOSE' },
    { rude: '807300452026012', estudiante: 'CHOQUE HUANCA BRUNO JHOEL' },
  ],
  SEC_2A: [
    { rude: '807300452026013', estudiante: 'SALAZAR RAMOS DIEGO ARMANDO' },
    { rude: '807300452026014', estudiante: 'PINTO MORALES CAMILA RENATA' },
    { rude: '807300452026015', estudiante: 'FERNANDEZ LUNA RODRIGO MARTIN' },
    { rude: '807300452026016', estudiante: 'CASTRO GUZMAN VALERIA PAOLA' },
    { rude: '807300452026017', estudiante: 'ORTIZ PEREZ SEBASTIAN ANDRES' },
  ],
  PRIM_1A: [
    { rude: '807300452026018', estudiante: 'MAMANI LOPEZ THIAGO GAEL' },
    { rude: '807300452026019', estudiante: 'RIOS CONDORI VALENTINA PAZ' },
    { rude: '807300452026020', estudiante: 'CRUZ QUISPE LIAM SAMUEL' },
    { rude: '807300452026021', estudiante: 'FLORES ALVAREZ MIA ISABELLA' },
    { rude: '807300452026022', estudiante: 'CHOQUE HUANCA LUCAS MATEO' },
  ],
  PRIM_2A: [
    { rude: '807300452026023', estudiante: 'SANCHEZ NINA GAEL FACUNDO' },
    { rude: '807300452026024', estudiante: 'GUTIERREZ LUNA EMMA VICTORIA' },
    { rude: '807300452026025', estudiante: 'MENDOZA RAMOS IAN PATRICIO' },
    { rude: '807300452026026', estudiante: 'MORALES PINTO ZOE VALERIA' },
  ],
};

// Generador determinista de notas por curso/materia/trimestre
function generateRowsForStudents(
  students: { rude: string; estudiante: string }[],
  cursoId: string,
  subjectId: string,
  trim: string
): StudentGradeRow[] {
  const trimNum = Number(trim) || 1;
  const seed = (cursoId || 'C').charCodeAt(0) + (subjectId || 'S').charCodeAt(0) + trimNum * 7;

  return students.map((s, idx) => {
    const offset = (seed + idx * 13) % 20;
    const baseSaber = Math.min(35, Math.max(16, 22 + (offset % 14)));
    const baseHacer = Math.min(35, Math.max(17, 23 + ((offset + 3) % 13)));
    const baseSer = Math.min(10, Math.max(5, 7 + (offset % 4)));
    const baseDecidir = Math.min(10, Math.max(5, 7 + ((offset + 2) % 4)));
    const extra = idx === 1 ? 2 : idx === 3 ? 1 : 0;

    return {
      inscripcionId: `${cursoId}-${idx}`,
      rude: s.rude,
      estudiante: s.estudiante,
      ser: baseSer,
      saber: baseSaber,
      hacer: baseHacer,
      decidir: baseDecidir,
      autoSer: 5,
      autoDecidir: 5,
      puntosExtras: extra,
      serAct1: Math.floor(baseSer / 2),
      serAct2: Math.ceil(baseSer / 2),
      saberEv1: baseSaber,
      hacerPrac1: baseHacer,
    };
  });
}

export const GradesPage: React.FC = () => {
  const { isMaestro, isDirector, isSuperAdmin, currentInstitutionId, user } = useAuth();
  const navigate = useNavigate();
  const activeSie = resolveTenantKey(currentInstitutionId);
  const currentInst = user?.institutions?.find(i => (i.id || i.institutionId || i.sie) === currentInstitutionId) || user?.institutions?.[0];
  const institutionName = currentInst?.nombre || 'Unidad Educativa';

  // Cursos y estudiantes reales reactivos habilitados para esta institución activa
  const [coursesList, setCoursesList] = useState<TenantParalelo[]>(() => getCoursesForInstitution(activeSie));
  const [studentsList, setStudentsList] = useState<TenantStudent[]>(() => getStudentsForInstitution(activeSie));

  useEffect(() => {
    setCoursesList(getCoursesForInstitution(activeSie));
    setStudentsList(getStudentsForInstitution(activeSie));
  }, [activeSie]);

  useEffect(() => {
    const handleCoursesUpdated = () => {
      setCoursesList(getCoursesForInstitution(activeSie));
    };
    const handleStudentsUpdated = () => {
      setStudentsList(getStudentsForInstitution(activeSie));
    };
    window.addEventListener('sigma_courses_updated', handleCoursesUpdated);
    window.addEventListener('sigma_students_updated', handleStudentsUpdated);
    return () => {
      window.removeEventListener('sigma_courses_updated', handleCoursesUpdated);
      window.removeEventListener('sigma_students_updated', handleStudentsUpdated);
    };
  }, [activeSie]);

  // Modal rápido de habilitación de curso en sitio
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickNivel, setQuickNivel] = useState('SECUNDARIA');
  const [quickGrado, setQuickGrado] = useState(1);
  const [quickLetra, setQuickLetra] = useState('A');
  const [quickTurno, setQuickTurno] = useState('Mañana');
  const [quickCupo, setQuickCupo] = useState(35);

  const cursosVisibles = coursesList.map((c) => ({
    id: c.id,
    nombre: `${c.cursoNombre} - Paralelo "${c.letra}" (${c.turno})`,
    nivel: c.nivel,
    grado: c.grado,
    letra: c.letra,
  }));

  // Selectores de Navegación Dinámica
  const [selectedCurso, setSelectedCurso] = useState('');
  const [selectedTrimestre, setSelectedTrimestre] = useState('1');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  const currentCursoObj = cursosVisibles.find((c) => c.id === selectedCurso);
  const isCursoPrimaria = currentCursoObj?.nivel === 'PRIMARIA' || currentCursoObj?.nombre?.toLowerCase().includes('primaria');

  const isMaestroOnly = isMaestro && !isDirector && !isSuperAdmin;
  const asignaturasBase = isCursoPrimaria ? AREAS_PRIMARIA_OFICIALES : ASIGNATURAS_DISPONIBLES;
  const asignaturasVisibles = isMaestroOnly
    ? asignaturasBase.filter((a) => ['LEN', 'MAT'].includes(a.id))
    : asignaturasBase;

  const [selectedAsignatura, setSelectedAsignatura] = useState(isMaestroOnly ? 'LEN' : 'MAT');

  // Asegurar selección inicial del primer curso si cambia la institución o carga cursos
  useEffect(() => {
    if (cursosVisibles.length > 0) {
      if (!selectedCurso || !cursosVisibles.some((c) => c.id === selectedCurso)) {
        setSelectedCurso(cursosVisibles[0].id);
      }
    } else {
      setSelectedCurso('');
    }
  }, [cursosVisibles, selectedCurso]);

  // Asegurar que la asignatura seleccionada pertenezca a la malla del curso activo (Primaria / Secundaria)
  useEffect(() => {
    if (asignaturasVisibles.length > 0 && !asignaturasVisibles.some(a => a.id === selectedAsignatura)) {
      setSelectedAsignatura(asignaturasVisibles[0].id);
    }
  }, [asignaturasVisibles, selectedAsignatura]);

  // Nombre y cargo del usuario para el registro formal de aprobaciones y desbloqueos
  const userFullName = user?.persona
    ? `${user.persona.nombres} ${user.persona.primerApellido}${user.persona.segundoApellido ? ' ' + user.persona.segundoApellido : ''}`.trim()
    : user?.email || (isDirector ? 'Dirección General' : isMaestro ? 'Docente de Asignatura' : 'Administrador');

  // Estado oficial de bloqueo y aprobación del trimestre actual
  const [trimestreStatus, setTrimestreStatus] = useState<TenantTrimestreStatus>(() =>
    getTrimestreStatus(activeSie, selectedCurso, selectedAsignatura, selectedTrimestre)
  );

  // Estados de modales
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [confirmApprovedCheck, setConfirmApprovedCheck] = useState(false);
  const [approving, setApproving] = useState(false);

  const [showRectifyModal, setShowRectifyModal] = useState(false);
  const [rectifyReason, setRectifyReason] = useState('Error material de transcripción o cálculo de notas');
  const [rectifyCustom, setRectifyCustom] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  // Carga y sincronización reactiva del estado del trimestre
  useEffect(() => {
    if (selectedCurso && selectedAsignatura) {
      setTrimestreStatus(getTrimestreStatus(activeSie, selectedCurso, selectedAsignatura, selectedTrimestre));
    }
  }, [activeSie, selectedCurso, selectedAsignatura, selectedTrimestre]);

  useEffect(() => {
    const handleStatusUpdate = () => {
      if (selectedCurso && selectedAsignatura) {
        setTrimestreStatus(getTrimestreStatus(activeSie, selectedCurso, selectedAsignatura, selectedTrimestre));
      }
    };
    window.addEventListener('sigma_trimestre_status_updated', handleStatusUpdate);
    return () => {
      window.removeEventListener('sigma_trimestre_status_updated', handleStatusUpdate);
    };
  }, [activeSie, selectedCurso, selectedAsignatura, selectedTrimestre]);

  const isLocked = trimestreStatus.estado === 'CERRADO_APROBADO';
  const isHabilitadoRectificacion = trimestreStatus.estado === 'HABILITADO_RECTIFICACION';
  // Bloqueo estricto: cuando está cerrado y aprobado, las notas no pueden modificarse salvo habilitación de Dirección
  const canEdit = !isLocked && (isMaestro || isSuperAdmin);

  // Almacén reactivo de planillas por llave: sie_curso_materia_trimestre
  const [gradesStore, setGradesStore] = useState<Record<string, StudentGradeRow[]>>({});
  const [rows, setRows] = useState<StudentGradeRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const currentKey = `${activeSie}_${selectedCurso}_${selectedAsignatura}_${selectedTrimestre}`;
  const persistentKey = `${selectedCurso}_${selectedAsignatura}_${selectedTrimestre}`;

  // Carga o regenera las notas cuando cambia cualquier selector
  useEffect(() => {
    if (!selectedCurso) {
      setRows([]);
      return;
    }

    // 1. Intentar recuperar desde almacenamiento persistente multi-tenant
    const savedGrades = getGradesForInstitutionAndKey<StudentGradeRow[]>(activeSie, persistentKey);

    if (savedGrades && savedGrades.length > 0) {
      setRows(savedGrades);
      setGradesStore((prev) => ({ ...prev, [currentKey]: savedGrades }));
    } else if (gradesStore[currentKey]) {
      setRows(gradesStore[currentKey]);
    } else {
      // Buscar estudiantes del curso actual en la institución activa
      const currentC = coursesList.find((c) => c.id === selectedCurso);
      const matchingStudents = studentsList.filter((s) => {
        if (!currentC) return false;
        const matchGrado = s.curso.includes(`${currentC.grado}°`);
        const matchLetra =
          s.curso.includes(`Paralelo ${currentC.letra}`) ||
          s.curso.includes(`"${currentC.letra}"`) ||
          s.curso.endsWith(` ${currentC.letra}`);
        return matchGrado && matchLetra;
      });

      let generated: StudentGradeRow[] = [];
      if (matchingStudents.length > 0) {
        const studentList = matchingStudents.map((s) => ({
          rude: s.rude,
          estudiante: `${s.primerApellido} ${s.segundoApellido || ''} ${s.nombres}`.trim(),
        }));
        generated = generateRowsForStudents(studentList, selectedCurso, selectedAsignatura, selectedTrimestre);
      } else if (studentsList.length > 0) {
        const studentList = studentsList.slice(0, 8).map((s) => ({
          rude: s.rude,
          estudiante: `${s.primerApellido} ${s.segundoApellido || ''} ${s.nombres}`.trim(),
        }));
        generated = generateRowsForStudents(studentList, selectedCurso, selectedAsignatura, selectedTrimestre);
      }

      setRows(generated);
      setGradesStore((prev) => ({ ...prev, [currentKey]: generated }));
      if (generated.length > 0) {
        saveGradesForInstitutionAndKey(activeSie, persistentKey, generated);
      }
    }
    setMessage(null);
  }, [selectedCurso, selectedAsignatura, selectedTrimestre, activeSie, currentKey, persistentKey, coursesList, studentsList]);

  const updateField = (
    index: number,
    field: keyof StudentGradeRow,
    value: number,
    max: number
  ) => {
    if (!canEdit) {
      setMessage('🔒 Este trimestre se encuentra aprobado y bloqueado. Solo la Dirección puede autorizar modificaciones.');
      return;
    }
    const val = Math.max(0, Math.min(max, isNaN(value) ? 0 : value));
    const newRows = [...rows];
    (newRows[index] as any)[field] = val;

    // Recalcular dimensiones si se editó en vista desglose (1D)
    if (field === 'serAct1' || field === 'serAct2') {
      newRows[index].ser = newRows[index].serAct1 + newRows[index].serAct2;
    } else if (field === 'saberEv1') {
      newRows[index].saber = newRows[index].saberEv1;
    } else if (field === 'hacerPrac1') {
      newRows[index].hacer = newRows[index].hacerPrac1;
    }

    setRows(newRows);
    setGradesStore((prev) => ({ ...prev, [currentKey]: newRows }));
    saveGradesForInstitutionAndKey(activeSie, persistentKey, newRows);
  };

  const calculateTotal = (row: StudentGradeRow) => {
    const rawSum =
      Number(row.ser || 0) +
      Number(row.saber || 0) +
      Number(row.hacer || 0) +
      Number(row.decidir || 0) +
      Number(row.autoSer || 0) +
      Number(row.autoDecidir || 0) +
      Number(row.puntosExtras || 0);
    return Math.min(100, rawSum);
  };

  const currentAsigObj = asignaturasBase.find((a) => a.id === selectedAsignatura) || ASIGNATURAS_DISPONIBLES.find((a) => a.id === selectedAsignatura);
  const trimLabel =
    selectedTrimestre === '1'
      ? 'Primer Trimestre'
      : selectedTrimestre === '2'
      ? 'Segundo Trimestre'
      : 'Tercer Trimestre';

  const handleSave = async () => {
    if (!canEdit) {
      setMessage('🔒 No se pueden guardar cambios: el trimestre está cerrado y bloqueado oficialmente.');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      // Guardar en store local y en persistencia de institución
      setGradesStore((prev) => ({ ...prev, [currentKey]: rows }));
      saveGradesForInstitutionAndKey(activeSie, persistentKey, rows);
      await new Promise((res) => setTimeout(res, 350));
      setMessage(
        `✅ Planilla guardada exitosamente para ${currentCursoObj?.nombre} - ${currentAsigObj?.nombre} (${trimLabel} 2026).`
      );
    } catch (e: any) {
      setMessage('❌ Error al guardar las calificaciones.');
    } finally {
      setSaving(false);
    }
  };

  // Acción Docente: Confirmar y Aprobar Trimestre (Bloqueo Definitivo)
  const handleConfirmApprove = async () => {
    setApproving(true);
    setMessage(null);
    try {
      // 1. Guardar notas finales
      saveGradesForInstitutionAndKey(activeSie, persistentKey, rows);
      setGradesStore((prev) => ({ ...prev, [currentKey]: rows }));

      // 2. Ejecutar bloqueo y cierre formal
      const updated = lockTrimestreStatus(
        activeSie,
        selectedCurso,
        selectedAsignatura,
        selectedTrimestre,
        userFullName
      );
      setTrimestreStatus(updated);
      setShowApproveModal(false);
      setConfirmApprovedCheck(false);
      setMessage(
        `🔒 ${trimLabel} Aprobado y Bloqueado Oficialmente. Las calificaciones han sido registradas y aseguradas contra modificaciones.`
      );
    } catch (e) {
      setMessage('❌ Ocurrió un error al aprobar y bloquear el trimestre.');
    } finally {
      setApproving(false);
    }
  };

  // Acción Dirección: Habilitar Modificación de Notas (Rectificación)
  const handleConfirmRectify = async () => {
    setUnlocking(true);
    setMessage(null);
    try {
      const finalMotivo =
        rectifyReason === 'Otro motivo debidamente fundamentado' && rectifyCustom.trim()
          ? rectifyCustom.trim()
          : rectifyReason + (rectifyCustom.trim() ? ` (${rectifyCustom.trim()})` : '');

      const updated = unlockTrimestreStatus(
        activeSie,
        selectedCurso,
        selectedAsignatura,
        selectedTrimestre,
        userFullName,
        finalMotivo
      );
      setTrimestreStatus(updated);
      setShowRectifyModal(false);
      setRectifyCustom('');
      setMessage(
        `🔓 Modificación de notas habilitada por Dirección. El docente asignado ya puede corregir las calificaciones del ${trimLabel}.`
      );
    } catch (e) {
      setMessage('❌ Error al autorizar la rectificación de notas.');
    } finally {
      setUnlocking(false);
    }
  };

  // Acción Dirección: Re-cerrar / Bloquear directamente el trimestre
  const handleDirectorReclose = () => {
    const updated = lockTrimestreStatus(
      activeSie,
      selectedCurso,
      selectedAsignatura,
      selectedTrimestre,
      `${userFullName} (Dirección)`
    );
    setTrimestreStatus(updated);
    setMessage(`🔒 ${trimLabel} vuelto a bloquear formalmente por la Dirección.`);
  };

  // Exportar Excel Oficial
  const handleExportExcel = () => {
    const exportData: GradeExportRow[] = rows.map((r) => {
      const tot = calculateTotal(r);
      return {
        rude: r.rude,
        estudiante: r.estudiante,
        ser: r.ser,
        saber: r.saber,
        hacer: r.hacer,
        decidir: r.decidir,
        autoSer: r.autoSer,
        autoDecidir: r.autoDecidir,
        puntosExtras: r.puntosExtras,
        total: tot,
        estado: tot >= 51 ? 'APROBADO' : 'RETENIDO',
      };
    });

    exportGradesToExcel(
      currentCursoObj?.nombre || selectedCurso,
      currentAsigObj?.nombre || selectedAsignatura,
      trimLabel,
      exportData
    );
  };

  // Exportar PDF Oficial
  const handleExportPdf = () => {
    const exportData: GradeExportRow[] = rows.map((r) => {
      const tot = calculateTotal(r);
      return {
        rude: r.rude,
        estudiante: r.estudiante,
        ser: r.ser,
        saber: r.saber,
        hacer: r.hacer,
        decidir: r.decidir,
        autoSer: r.autoSer,
        autoDecidir: r.autoDecidir,
        puntosExtras: r.puntosExtras,
        total: tot,
        estado: tot >= 51 ? 'APROBADO' : 'RETENIDO',
      };
    });

    exportGradesToPdf(
      currentCursoObj?.nombre || selectedCurso,
      currentAsigObj?.nombre || selectedAsignatura,
      trimLabel,
      exportData
    );
  };

  // Handlers para creación rápida en GradesPage
  const handleCreateQuickCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const nivelNombre = quickNivel === 'SECUNDARIA'
      ? 'Secundaria Comunitaria Productiva'
      : quickNivel === 'PRIMARIA'
      ? 'Primaria Comunitaria Vocacional'
      : 'Educación Inicial en Familia Comunitaria';
    const cursoNombre = `${quickGrado}° de ${nivelNombre}`;
    const newCourseItem: TenantParalelo = {
      id: `c-${Date.now()}`,
      cursoNombre,
      nivel: quickNivel,
      grado: Number(quickGrado),
      letra: (quickLetra.trim() || 'A').toUpperCase(),
      turno: quickTurno,
      cupo: Number(quickCupo) || 35,
      inscritos: 0,
    };
    const updated = [...coursesList, newCourseItem];
    saveCoursesForInstitution(activeSie, updated);
    setCoursesList(updated);
    setSelectedCurso(newCourseItem.id);
    setShowQuickModal(false);
  };

  const handleQuickInitStandardCourses = (nivel: 'PRIMARIA' | 'SECUNDARIA' = 'SECUNDARIA') => {
    const isPrim = nivel === 'PRIMARIA';
    const nivelLabel = isPrim ? 'Primaria Comunitaria Vocacional' : 'Secundaria Comunitaria Productiva';
    const defaultCourses: TenantParalelo[] = [
      { id: `c-${Date.now()}-1`, cursoNombre: `1° de ${nivelLabel}`, nivel, grado: 1, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-2`, cursoNombre: `2° de ${nivelLabel}`, nivel, grado: 2, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-3`, cursoNombre: `3° de ${nivelLabel}`, nivel, grado: 3, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-4`, cursoNombre: `4° de ${nivelLabel}`, nivel, grado: 4, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-5`, cursoNombre: `5° de ${nivelLabel}`, nivel, grado: 5, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-6`, cursoNombre: `6° de ${nivelLabel}`, nivel, grado: 6, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
    ];
    saveCoursesForInstitution(activeSie, defaultCourses);
    setCoursesList(defaultCourses);
    setSelectedCurso(defaultCourses[0].id);
  };

  if (cursosVisibles.length === 0) {
    return (
      <div className="relative">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto my-8">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <BookOpenCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Espacio de Calificaciones en Blanco</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
            Esta Unidad Educativa aún no tiene cursos ni paralelos habilitados. Para comenzar a calificar en las 4 dimensiones de la Ley 070 (SER, SABER, HACER, DECIDIR), primero debes crear tus cursos y vincular a tus docentes.
          </p>

          {/* Action buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowQuickModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-200 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Habilitar Curso & Docentes</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickInitStandardCourses('PRIMARIA')}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded-xl text-xs border border-purple-200 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>⚡ Cargar 1° a 6° Primaria</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickInitStandardCourses('SECUNDARIA')}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs border border-blue-200 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>⚡ Cargar 1° a 6° Secundaria</span>
            </button>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/academic?create=curso')}
              className="text-xs text-slate-500 hover:text-emerald-700 font-semibold inline-flex items-center space-x-1.5 transition cursor-pointer"
            >
              <span>O abrir panel avanzado de Cursos, Paralelos y Asignaciones</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal de Habilitación Rápida de Curso */}
        {showQuickModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Habilitar Nuevo Curso & Paralelo</h3>
                    <p className="text-[11px] text-slate-400">Crea el curso para comenzar a registrar notas de inmediato</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateQuickCourse} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nivel del Subsistema Regular
                  </label>
                  <select
                    value={quickNivel}
                    onChange={(e) => {
                      setQuickNivel(e.target.value);
                      if (e.target.value === 'INICIAL' && quickGrado > 2) setQuickGrado(1);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="SECUNDARIA">Secundaria Comunitaria Productiva</option>
                    <option value="PRIMARIA">Primaria Comunitaria Vocacional</option>
                    <option value="INICIAL">Educación Inicial en Familia Comunitaria</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Año de Escolaridad (Grado)
                    </label>
                    <select
                      value={quickGrado}
                      onChange={(e) => setQuickGrado(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {quickNivel === 'INICIAL' ? (
                        <>
                          <option value={1}>1° Año</option>
                          <option value={2}>2° Año</option>
                        </>
                      ) : (
                        <>
                          <option value={1}>1° Año</option>
                          <option value={2}>2° Año</option>
                          <option value={3}>3° Año</option>
                          <option value={4}>4° Año</option>
                          <option value={5}>5° Año</option>
                          <option value={6}>6° Año</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Paralelo (Letra)
                    </label>
                    <select
                      value={quickLetra}
                      onChange={(e) => setQuickLetra(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="A">Paralelo "A"</option>
                      <option value="B">Paralelo "B"</option>
                      <option value="C">Paralelo "C"</option>
                      <option value="D">Paralelo "D"</option>
                      <option value="E">Paralelo "E"</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Turno Oficial
                    </label>
                    <select
                      value={quickTurno}
                      onChange={(e) => setQuickTurno(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Mañana">Mañana</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Noche">Noche</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cupo Máximo
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={60}
                      value={quickCupo}
                      onChange={(e) => setQuickCupo(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm cursor-pointer"
                  >
                    Habilitar Curso y Comenzar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
            <BookOpenCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isDirector
                ? 'Supervisión Institucional de Calificaciones (Ley 070)'
                : 'Planilla de Evaluación Trimestral'}
            </h1>
            <p className="text-xs text-slate-500">
              {institutionName} • Valoración Integral en SER (10), SABER (35), HACER (35), DECIDIR (10), AUTOEVALUACIÓN (10) y Puntos Extras
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Excel Export */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
            title="Descargar Planilla Oficial en Formato Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>

          {/* PDF Export */}
          <button
            onClick={handleExportPdf}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
            title="Descargar Planilla Oficial en Formato PDF del SEP con firmas"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Descargar PDF</span>
          </button>

          {/* Print */}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>

          {/* Guardar Planilla */}
          {(isMaestro || isSuperAdmin) && canEdit && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>{saving ? 'Guardando...' : 'Guardar Planilla'}</span>
            </button>
          )}

          {/* Botón de Aprobación y Cierre de Trimestre para el Docente */}
          {(isMaestro || isSuperAdmin) && !isLocked && (
            <button
              type="button"
              onClick={() => {
                setConfirmApprovedCheck(false);
                setShowApproveModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
              title={`Aprobar formalmente y bloquear las calificaciones del ${trimLabel}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Aprobar y Cerrar {selectedTrimestre}° Trimestre</span>
            </button>
          )}

          {/* Indicador de Trimestre Bloqueado para Docente */}
          {isLocked && !isDirector && !isSuperAdmin && (
            <div className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-bold">
              <Lock className="w-4 h-4 text-rose-600" />
              <span>{selectedTrimestre}° Trimestre Aprobado y Bloqueado</span>
            </div>
          )}

          {/* Botón Exclusivo de Dirección para Habilitar Modificación */}
          {(isDirector || isSuperAdmin) && isLocked && (
            <button
              type="button"
              onClick={() => {
                setRectifyReason('Error material de transcripción o cálculo de notas');
                setRectifyCustom('');
                setShowRectifyModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
              title="Habilitar rectificación formal de calificaciones para el docente"
            >
              <Unlock className="w-4 h-4" />
              <span>Habilitar Modificación (Dirección)</span>
            </button>
          )}

          {/* Botón de Dirección para Re-bloquear Trimestre */}
          {(isDirector || isSuperAdmin) && isHabilitadoRectificacion && (
            <button
              type="button"
              onClick={handleDirectorReclose}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer"
              title="Volver a bloquear el trimestre"
            >
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span>Re-bloquear</span>
            </button>
          )}

          {!isMaestro && !isDirector && !isSuperAdmin && (
            <div className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Modo Supervisión</span>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{message}</span>
        </div>
      )}

      {/* Selectors Bar (TOTALMENTE REACTIVO) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Selector de Curso y Paralelo */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Curso y Paralelo</span>
          </label>
          <select
            value={selectedCurso}
            onChange={(e) => setSelectedCurso(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
          >
            {cursosVisibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Asignatura */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            Asignatura / Campo de Saberes
          </label>
          <select
            value={selectedAsignatura}
            onChange={(e) => setSelectedAsignatura(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
          >
            {asignaturasVisibles.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Periodo Trimestral */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            Periodo Trimestral
          </label>
          <select
            value={selectedTrimestre}
            onChange={(e) => setSelectedTrimestre(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
          >
            <option value="1">
              1° Trimestre {getTrimestreStatus(activeSie, selectedCurso, selectedAsignatura, '1').estado === 'CERRADO_APROBADO' ? '🔒 (Bloqueado)' : getTrimestreStatus(activeSie, selectedCurso, selectedAsignatura, '1').estado === 'HABILITADO_RECTIFICACION' ? '🔓 (Rectificación)' : '🟢 (Abierto)'}
            </option>
            <option value="2">
              2° Trimestre {getTrimestreStatus(activeSie, selectedCurso, selectedAsignatura, '2').estado === 'CERRADO_APROBADO' ? '🔒 (Bloqueado)' : getTrimestreStatus(activeSie, selectedCurso, selectedAsignatura, '2').estado === 'HABILITADO_RECTIFICACION' ? '🔓 (Rectificación)' : '🟢 (Abierto)'}
            </option>
            <option value="3">
              3° Trimestre {getTrimestreStatus(activeSie, selectedCurso, selectedAsignatura, '3').estado === 'CERRADO_APROBADO' ? '🔒 (Bloqueado)' : getTrimestreStatus(activeSie, selectedCurso, selectedAsignatura, '3').estado === 'HABILITADO_RECTIFICACION' ? '🔓 (Rectificación)' : '🟢 (Abierto)'}
            </option>
          </select>
        </div>

        {/* Modalidad de Planilla */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            Modalidad de Planilla
          </label>
          <div className="flex space-x-1.5 mt-0.5">
            <button
              onClick={() => setViewMode('summary')}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'summary'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Dimensiones
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'detailed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Desglose (1D)
            </button>
          </div>
        </div>
      </div>

      {/* Banner de Estado Oficial de Aprobación y Bloqueo */}
      {isLocked ? (
        <div className="p-4 bg-gradient-to-r from-rose-50 to-amber-50 border-2 border-rose-300 rounded-2xl text-xs text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-rose-900 flex items-center gap-2">
                <span>{trimLabel} Cerrado y Aprobado Oficialmente</span>
                <span className="px-2 py-0.5 bg-rose-200 text-rose-900 text-[10px] font-black rounded-full uppercase tracking-wider">
                  Solo Lectura (Bloqueado)
                </span>
              </div>
              <p className="text-slate-700 mt-1 leading-relaxed">
                Las calificaciones de este trimestre fueron aprobadas formalmente por <strong>{trimestreStatus.aprobadoPor || 'Docente'}</strong> el <strong>{trimestreStatus.fechaAprobacion || 'recientemente'}</strong>. El periodo se encuentra cerrado para evitar alteraciones en los siguientes trimestres.
              </p>
              {isMaestro && !isDirector && !isSuperAdmin && (
                <p className="text-[11px] text-amber-800 font-semibold mt-1">
                  ⚠️ Para rectificar alguna nota por error justificado, solicita formalmente la habilitación a la <strong>Dirección de la Unidad Educativa</strong>.
                </p>
              )}
            </div>
          </div>

          {(isDirector || isSuperAdmin) && (
            <button
              type="button"
              onClick={() => {
                setRectifyReason('Error material de transcripción o cálculo de notas');
                setRectifyCustom('');
                setShowRectifyModal(true);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <Unlock className="w-4 h-4" />
              <span>Habilitar Modificación (Dirección)</span>
            </button>
          )}
        </div>
      ) : isHabilitadoRectificacion ? (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-emerald-50 border-2 border-amber-400 rounded-2xl text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-amber-900 flex items-center gap-2">
                <span>Modificación Habilitada por Dirección (Rectificación Oficial)</span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-black rounded-full uppercase tracking-wider">
                  Edición Habilitada
                </span>
              </div>
              <p className="text-slate-800 mt-1 leading-relaxed">
                Autorizado por: <strong>{trimestreStatus.habilitadoPor}</strong> el <strong>{trimestreStatus.fechaHabilitacion}</strong>.
                <br />
                <strong>Motivo formal:</strong> {trimestreStatus.motivoRectificacion || 'Rectificación justificada'}.
              </p>
              <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                ✏️ Puedes corregir las calificaciones. Al concluir las correcciones, presiona <strong>"Aprobar y Re-cerrar Trimestre"</strong> para volver a proteger el periodo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {(isMaestro || isSuperAdmin) && (
              <button
                type="button"
                onClick={() => {
                  setConfirmApprovedCheck(false);
                  setShowApproveModal(true);
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aprobar y Re-cerrar</span>
              </button>
            )}
            {(isDirector || isSuperAdmin) && (
              <button
                type="button"
                onClick={handleDirectorReclose}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Re-bloquear</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>{trimLabel}:</strong> Registro abierto para el llenado de notas. Al finalizar de calificar, presiona <strong>"Aprobar y Cerrar {selectedTrimestre}° Trimestre"</strong> para oficializarlo y bloquearlo contra cambios.
            </span>
          </div>
          {(isMaestro || isSuperAdmin) && (
            <button
              type="button"
              onClick={() => {
                setConfirmApprovedCheck(false);
                setShowApproveModal(true);
              }}
              className="hidden sm:inline-flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition shrink-0 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Aprobar Trimestre</span>
            </button>
          )}
        </div>
      )}

      {/* Explanatory legend of dimensions */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold text-slate-800">Cálculo Oficial SEP (Ley 070):</span>
          <span>SER + SABER + HACER + DECIDIR + AUTOEVALUACIÓN + PUNTOS EXTRAS = NOTA FINAL</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded border border-purple-200" title="Desarrollo Pleno (85-100 pts)">DP: 85-100 Pleno</span>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-200" title="Desarrollo Óptimo (69-84 pts)">DO: 69-84 Óptimo</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-200" title="Desarrollo Aceptable (51-68 pts)">DA: 51-68 Aceptable</span>
          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded border border-rose-200" title="En Desarrollo (1-50 pts)">ED: 1-50 En Desarr.</span>
        </div>
      </div>

      {/* Grading Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3 w-8">#</th>
                <th className="py-3 px-3 w-36">Código RUDE</th>
                <th className="py-3 px-4 min-w-[200px]">Nombres y Apellidos</th>

                {viewMode === 'detailed' ? (
                  <>
                    <th className="py-3 px-2 text-center bg-emerald-50 text-emerald-900 border-l border-emerald-100">
                      SER Act 1<br /><span className="text-[10px] font-normal">(Resp. / 5)</span>
                    </th>
                    <th className="py-3 px-2 text-center bg-emerald-50 text-emerald-900 border-r border-emerald-100">
                      SER Act 2<br /><span className="text-[10px] font-normal">(Compr. / 5)</span>
                    </th>
                    <th className="py-3 px-2 text-center bg-blue-50 text-blue-900 border-r border-blue-100">
                      SABER Ev 1<br /><span className="text-[10px] font-normal">(Teoría / 35)</span>
                    </th>
                    <th className="py-3 px-2 text-center bg-amber-50 text-amber-900 border-r border-amber-100">
                      HACER Prac<br /><span className="text-[10px] font-normal">(Prácticos / 35)</span>
                    </th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-2 text-center bg-emerald-50 text-emerald-900 border-l border-r border-emerald-100">
                      SER<br /><span className="text-[10px] font-normal">(Máx. 10)</span>
                    </th>
                    <th className="py-3 px-2 text-center bg-blue-50 text-blue-900 border-r border-blue-100">
                      SABER<br /><span className="text-[10px] font-normal">(Máx. 35)</span>
                    </th>
                    <th className="py-3 px-2 text-center bg-amber-50 text-amber-900 border-r border-amber-100">
                      HACER<br /><span className="text-[10px] font-normal">(Máx. 35)</span>
                    </th>
                  </>
                )}

                <th className="py-3 px-2 text-center bg-purple-50 text-purple-900 border-r border-purple-100">
                  DECIDIR<br /><span className="text-[10px] font-normal">(Máx. 10)</span>
                </th>
                <th className="py-3 px-2 text-center bg-rose-50 text-rose-900 border-r border-rose-100">
                  AUTO<br /><span className="text-[10px] font-normal">(Máx. 10)</span>
                </th>
                <th className="py-3 px-2 text-center bg-amber-50/60 text-amber-900 border-r border-amber-100">
                  EXTRAS<br /><span className="text-[10px] font-normal">(Bonif.)</span>
                </th>
                <th className="py-3 px-3 text-center bg-slate-200/60 font-extrabold text-slate-900 min-w-[70px]">
                  NOTA FINAL<br /><span className="text-[10px] font-normal">(Sobre 100)</span>
                </th>
                <th className="py-3 px-4 text-center min-w-[170px]">VALORACIÓN CUALITATIVA (SEP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={viewMode === 'detailed' ? 12 : 10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <School className="w-8 h-8 text-slate-300" />
                      <span className="font-semibold text-slate-700">No hay estudiantes matriculados en este curso.</span>
                      <p className="text-xs text-slate-400">Inscribe alumnos en la sección "Estudiantes & Matrícula" para habilitar su planilla de calificaciones.</p>
                      <Link
                        to="/students"
                        className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                      >
                        <span>Matricular Estudiantes</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                const total = calculateTotal(row);
                const isPassing = total >= 51;
                return (
                  <tr key={row.rude} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{row.rude}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{row.estudiante}</td>

                    {viewMode === 'detailed' ? (
                      <>
                        {/* SER Act 1 (5) */}
                        <td className="py-2 px-2 text-center bg-emerald-50/30 border-l border-emerald-100/60">
                          <input
                            type="number"
                            min="0"
                            max="5"
                            disabled={!canEdit}
                            value={row.serAct1}
                            onChange={(e) => updateField(idx, 'serAct1', parseInt(e.target.value), 5)}
                            className="w-12 text-center py-1 bg-white border border-slate-200 rounded font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </td>
                        {/* SER Act 2 (5) */}
                        <td className="py-2 px-2 text-center bg-emerald-50/30 border-r border-emerald-100/60">
                          <input
                            type="number"
                            min="0"
                            max="5"
                            disabled={!canEdit}
                            value={row.serAct2}
                            onChange={(e) => updateField(idx, 'serAct2', parseInt(e.target.value), 5)}
                            className="w-12 text-center py-1 bg-white border border-slate-200 rounded font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </td>
                        {/* SABER Ev 1 (35) */}
                        <td className="py-2 px-2 text-center bg-blue-50/30 border-r border-blue-100/60">
                          <input
                            type="number"
                            min="0"
                            max="35"
                            disabled={!canEdit}
                            value={row.saberEv1}
                            onChange={(e) => updateField(idx, 'saberEv1', parseInt(e.target.value), 35)}
                            className="w-14 text-center py-1 bg-white border border-slate-200 rounded font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </td>
                        {/* HACER Prac 1 (35) */}
                        <td className="py-2 px-2 text-center bg-amber-50/30 border-r border-amber-100/60">
                          <input
                            type="number"
                            min="0"
                            max="35"
                            disabled={!canEdit}
                            value={row.hacerPrac1}
                            onChange={(e) => updateField(idx, 'hacerPrac1', parseInt(e.target.value), 35)}
                            className="w-14 text-center py-1 bg-white border border-slate-200 rounded font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        {/* SER (10) */}
                        <td className="py-2 px-2 text-center bg-emerald-50/40 border-l border-r border-emerald-100/60">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            disabled={!canEdit}
                            value={row.ser}
                            onChange={(e) => updateField(idx, 'ser', parseInt(e.target.value), 10)}
                            className="w-14 text-center py-1 bg-white border border-slate-200 rounded font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </td>
                        {/* SABER (35) */}
                        <td className="py-2 px-2 text-center bg-blue-50/40 border-r border-blue-100/60">
                          <input
                            type="number"
                            min="0"
                            max="35"
                            disabled={!canEdit}
                            value={row.saber}
                            onChange={(e) => updateField(idx, 'saber', parseInt(e.target.value), 35)}
                            className="w-14 text-center py-1 bg-white border border-slate-200 rounded font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </td>
                        {/* HACER (35) */}
                        <td className="py-2 px-2 text-center bg-amber-50/40 border-r border-amber-100/60">
                          <input
                            type="number"
                            min="0"
                            max="35"
                            disabled={!canEdit}
                            value={row.hacer}
                            onChange={(e) => updateField(idx, 'hacer', parseInt(e.target.value), 35)}
                            className="w-14 text-center py-1 bg-white border border-slate-200 rounded font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </td>
                      </>
                    )}

                    {/* DECIDIR (10) */}
                    <td className="py-2 px-2 text-center bg-purple-50/40 border-r border-purple-100/60">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        disabled={!canEdit}
                        value={row.decidir}
                        onChange={(e) => updateField(idx, 'decidir', parseInt(e.target.value), 10)}
                        className="w-14 text-center py-1 bg-white border border-slate-200 rounded font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      />
                    </td>

                    {/* AUTO (10) */}
                    <td className="py-2 px-2 text-center bg-rose-50/40 border-r border-rose-100/60">
                      <span className="font-bold text-slate-700">
                        {row.autoSer + row.autoDecidir}
                      </span>
                    </td>

                    {/* PUNTOS EXTRAS */}
                    <td className="py-2 px-2 text-center bg-amber-50/30 border-r border-amber-100/60">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        disabled={!canEdit}
                        value={row.puntosExtras}
                        onChange={(e) => updateField(idx, 'puntosExtras', parseInt(e.target.value), 10)}
                        className="w-12 text-center py-1 bg-white border border-slate-200 rounded font-bold text-amber-700 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      />
                    </td>

                    {/* TOTAL / 100 */}
                    <td className="py-3 px-3 text-center bg-slate-50">
                      <span
                        className={`text-base font-black ${
                          isPassing ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {total}
                      </span>
                    </td>

                    {/* VALORACIÓN CUALITATIVA OFICIAL (LEY 070 - MODELO SEP) */}
                    <td className="py-3 px-4 text-center">
                      {(() => {
                        const escala = getEscalaCualitativa(total);
                        return (
                          <span
                            title={`${escala.label} (${escala.rango} pts): ${escala.descripcion}`}
                            className={`text-[10px] font-black px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 shadow-2xs ${escala.badgeClass}`}
                          >
                            <span className="font-extrabold">{escala.codigo}</span>
                            <span className="font-semibold">· {escala.label}</span>
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Docente: Confirmación de Aprobación y Cierre de Trimestre */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Aprobar y Cerrar {trimLabel}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentCursoObj?.nombre} • {currentAsigObj?.nombre}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowApproveModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Consecuencias del Cierre Oficial:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>Las notas de este trimestre quedarán <strong>bloqueadas en modo solo lectura</strong>.</li>
                  <li>No se podrán modificar calificaciones en los siguientes trimestres para evitar inconsistencias en el centralizador.</li>
                  <li>Únicamente la <strong>Dirección de la Unidad Educativa</strong> podrá autorizar una rectificación formal si se presenta un motivo justificado.</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Estudiantes Evaluados:</span>
                  <span className="font-bold text-slate-900">{rows.length} alumnos</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Responsable de Aprobación:</span>
                  <span className="font-bold text-slate-900">{userFullName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Gestión Educativa:</span>
                  <span className="font-bold text-slate-900">2026</span>
                </div>
              </div>

              <label className="flex items-start space-x-2.5 pt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmApprovedCheck}
                  onChange={(e) => setConfirmApprovedCheck(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-700 font-semibold leading-tight">
                  Doy mi aprobación formal de que las calificaciones registradas son correctas, definitivas y conformes a la normativa de evaluación.
                </span>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!confirmApprovedCheck || approving}
                onClick={handleConfirmApprove}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center space-x-2"
              >
                <Lock className="w-4 h-4" />
                <span>{approving ? 'Bloqueando Trimestre...' : 'Aprobar y Bloquear Trimestre'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dirección: Habilitar Modificación de Notas (Rectificación) */}
      {showRectifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Autorización de Dirección: Habilitar Modificación
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentCursoObj?.nombre} • {currentAsigObj?.nombre} ({trimLabel})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRectifyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 leading-relaxed">
                ℹ️ Como <strong>Dirección de la Unidad Educativa</strong>, tienes la potestad legal y administrativa de desbloquear este trimestre para que el docente pueda rectificar calificaciones fundamentadas.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Motivo Administrativo de la Rectificación:
                </label>
                <select
                  value={rectifyReason}
                  onChange={(e) => setRectifyReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Error material de transcripción o cálculo de notas">
                    Error material de transcripción o cálculo de notas
                  </option>
                  <option value="Revisión de prueba objetiva con estudiante / reclamo fundado">
                    Revisión de prueba objetiva con estudiante / reclamo fundado
                  </option>
                  <option value="Presentación extemporánea de justificativo médico o licencia formal">
                    Presentación extemporánea de justificativo médico o licencia formal
                  </option>
                  <option value="Disposición de Consejo de Maestros / Resolución Interna">
                    Disposición de Consejo de Maestros / Resolución Interna
                  </option>
                  <option value="Otro motivo debidamente fundamentado">
                    Otro motivo debidamente fundamentado...
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Detalle u Observación Oficial (Opcional):
                </label>
                <textarea
                  rows={2}
                  value={rectifyCustom}
                  onChange={(e) => setRectifyCustom(e.target.value)}
                  placeholder="Escribe detalles adicionales sobre la rectificación autorizada..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] leading-tight">
                ⚠️ Una vez habilitada la modificación, el docente asignado podrá editar las notas. Al concluir, el docente deberá volver a presionar <strong>"Aprobar y Re-cerrar Trimestre"</strong>.
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowRectifyModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={unlocking}
                onClick={handleConfirmRectify}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center space-x-2"
              >
                <Unlock className="w-4 h-4" />
                <span>{unlocking ? 'Habilitando...' : 'Autorizar y Habilitar Modificación'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
