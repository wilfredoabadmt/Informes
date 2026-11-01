import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getCoursesForInstitution,
  getStudentsForInstitution,
  resolveTenantKey,
} from '../utils/multiTenantStore';
import {
  FileText,
  User,
  Phone,
  Calendar,
  AlertTriangle,
  CheckSquare,
  Square,
  Send,
  Printer,
  ChevronDown,
  ShieldAlert,
  ClipboardList,
  Sparkles,
  BookOpen,
  Trash2,
  Filter,
  CheckCircle2,
  School,
  ArrowRight,
  Users,
} from 'lucide-react';
import { exportParentalCitationPdf } from '../utils/exportHelpers';

interface KardexEntry {
  id: string;
  fecha: string;
  asistencia: {
    faltaConLicencia: boolean;
    faltaSinLicencia: boolean;
    fueraDeHorario: boolean;
    abandonoClase: boolean;
  };
  responsabilidad: {
    noPresentoDeber: boolean;
    noDioEvaluacion: boolean;
    noExpuso: boolean;
    noTrajoMateriales: boolean;
    danoMobiliario: boolean;
    trajoCelularSinPermiso: boolean;
  };
  participacion: {
    noParticipa: boolean;
    noPrestaAtencion: boolean;
  };
  conducta: {
    faltoRespetoDocente: boolean;
    faltoRespetoCompaneros: boolean;
    lenguajeInapropiado: boolean;
  };
  observacionDetalle: string;
  compromisoEstudiante: string;
  firmaMaestro: string;
  citacionPadres: boolean;
}

interface StudentKardexInfo {
  id: string;
  cursoId: string;
  rude: string;
  ci: string;
  nombreCompleto: string;
  curso: string;
  fechaNacimiento: string;
  tutorNombre: string;
  tutorContacto: string;
  parentesco: string;
  entries: KardexEntry[];
}

const CURSOS_KARDEX = [
  { id: 'SEC_1A', nombre: '1º de Secundaria - Paralelo "A"', turno: 'Mañana' },
  { id: 'SEC_1B', nombre: '1º de Secundaria - Paralelo "B"', turno: 'Tarde' },
  { id: 'SEC_2A', nombre: '2º de Secundaria - Paralelo "A"', turno: 'Mañana' },
  { id: 'PRIM_1A', nombre: '1º de Primaria - Paralelo "A"', turno: 'Mañana' },
  { id: 'PRIM_2A', nombre: '2º de Primaria - Paralelo "A"', turno: 'Mañana' },
];

const INITIAL_KARDEX_STUDENTS: StudentKardexInfo[] = [
  // 1° Secundaria A
  {
    id: 'k-1',
    cursoId: 'SEC_1A',
    rude: '807300452026001',
    ci: '10928374 LP',
    nombreCompleto: 'ALANOCA CRUZ ERICK ELIAS',
    curso: '1º de Secundaria - Paralelo "A"',
    fechaNacimiento: '14/05/2012',
    tutorNombre: 'Marcos Alanoca Ticona',
    tutorContacto: '71548923',
    parentesco: 'Padre',
    entries: [
      {
        id: 'ent-1',
        fecha: '2026-03-12',
        asistencia: { faltaConLicencia: false, faltaSinLicencia: false, fueraDeHorario: true, abandonoClase: false },
        responsabilidad: { noPresentoDeber: true, noDioEvaluacion: false, noExpuso: false, noTrajoMateriales: false, danoMobiliario: false, trajoCelularSinPermiso: false },
        participacion: { noParticipa: false, noPrestaAtencion: true },
        conducta: { faltoRespetoDocente: false, faltoRespetoCompaneros: false, lenguajeInapropiado: false },
        observacionDetalle: 'Llegó con 20 minutos de retraso e ingresó sin la tarea del tema de Análisis Sintáctico.',
        compromisoEstudiante: 'El estudiante se compromete a regularizar la presentación el día lunes a primera hora.',
        firmaMaestro: 'Prof. Carlos Mamani C.',
        citacionPadres: false,
      },
      {
        id: 'ent-1b',
        fecha: '2026-03-24',
        asistencia: { faltaConLicencia: false, faltaSinLicencia: false, fueraDeHorario: true, abandonoClase: false },
        responsabilidad: { noPresentoDeber: false, noDioEvaluacion: false, noExpuso: false, noTrajoMateriales: true, danoMobiliario: false, trajoCelularSinPermiso: false },
        participacion: { noParticipa: false, noPrestaAtencion: false },
        conducta: { faltoRespetoDocente: false, faltoRespetoCompaneros: false, lenguajeInapropiado: false },
        observacionDetalle: 'Olvidó traer su texto guía y carpeta de apuntes en hora de clases.',
        compromisoEstudiante: 'Cuidar de empacar su material de trabajo la noche anterior.',
        firmaMaestro: 'Prof. Carlos Mamani C.',
        citacionPadres: false,
      },
    ],
  },
  {
    id: 'k-2',
    cursoId: 'SEC_1A',
    rude: '807300452026002',
    ci: '12847593 LP',
    nombreCompleto: 'ARAMAYO TOLEDO FABIOLA',
    curso: '1º de Secundaria - Paralelo "A"',
    fechaNacimiento: '22/09/2012',
    tutorNombre: 'Sonia Toledo Quispe',
    tutorContacto: '68923145',
    parentesco: 'Madre',
    entries: [],
  },
  {
    id: 'k-3',
    cursoId: 'SEC_1A',
    rude: '807300452026003',
    ci: '11029485 LP',
    nombreCompleto: 'CAMACHO RENJIFO KAROL LUCERO',
    curso: '1º de Secundaria - Paralelo "A"',
    fechaNacimiento: '11/11/2012',
    tutorNombre: 'Lucero Renjifo',
    tutorContacto: '72034918',
    parentesco: 'Madre',
    entries: [
      {
        id: 'ent-camacho-1',
        fecha: '2026-03-15',
        asistencia: { faltaConLicencia: false, faltaSinLicencia: true, fueraDeHorario: false, abandonoClase: false },
        responsabilidad: { noPresentoDeber: false, noDioEvaluacion: true, noExpuso: false, noTrajoMateriales: false, danoMobiliario: false, trajoCelularSinPermiso: false },
        participacion: { noParticipa: false, noPrestaAtencion: false },
        conducta: { faltoRespetoDocente: false, faltoRespetoCompaneros: false, lenguajeInapropiado: false },
        observacionDetalle: 'Falta no justificada a la evaluación programada del primer bloque temático.',
        compromisoEstudiante: 'Presentar justificativo médico firmado por apoderado para reprogramación.',
        firmaMaestro: 'Prof. Carlos Mamani C.',
        citacionPadres: false,
      },
    ],
  },
  {
    id: 'k-4',
    cursoId: 'SEC_1A',
    rude: '807300452026004',
    ci: '10847291 LP',
    nombreCompleto: 'CARDOZO YEVARA CARLIN YARITA',
    curso: '1º de Secundaria - Paralelo "A"',
    fechaNacimiento: '05/04/2012',
    tutorNombre: 'Elena Yevara',
    tutorContacto: '71928301',
    parentesco: 'Madre',
    entries: [],
  },
  {
    id: 'k-5',
    cursoId: 'SEC_1A',
    rude: '807300452026005',
    ci: '12948172 LP',
    nombreCompleto: 'COLQUE COLODRO JHOANNA MAYENNI',
    curso: '1º de Secundaria - Paralelo "A"',
    fechaNacimiento: '18/08/2012',
    tutorNombre: 'Ramiro Colque',
    tutorContacto: '67019284',
    parentesco: 'Padre',
    entries: [],
  },
  {
    id: 'k-6',
    cursoId: 'SEC_1A',
    rude: '807300452026006',
    ci: '9847261 LP',
    nombreCompleto: 'FLORES CALLISAYA GABRIEL OMAR',
    curso: '1º de Secundaria - Paralelo "A"',
    fechaNacimiento: '03/02/2012',
    tutorNombre: 'Ramiro Flores Choque',
    tutorContacto: '73091824',
    parentesco: 'Padre',
    entries: [
      {
        id: 'ent-2',
        fecha: '2026-03-18',
        asistencia: { faltaConLicencia: false, faltaSinLicencia: true, fueraDeHorario: false, abandonoClase: false },
        responsabilidad: { noPresentoDeber: false, noDioEvaluacion: true, noExpuso: false, noTrajoMateriales: true, danoMobiliario: false, trajoCelularSinPermiso: true },
        participacion: { noParticipa: true, noPrestaAtencion: true },
        conducta: { faltoRespetoDocente: false, faltoRespetoCompaneros: true, lenguajeInapropiado: false },
        observacionDetalle: 'Uso reiterado de teléfono celular en horas de clase y distracción continua a compañeros.',
        compromisoEstudiante: 'No volver a ingresar al aula con dispositivos electrónicos sin previa autorización.',
        firmaMaestro: 'Prof. Carlos Mamani C.',
        citacionPadres: true,
      },
    ],
  },

  // 1° Secundaria B
  {
    id: 'k-7',
    cursoId: 'SEC_1B',
    rude: '807300452026007',
    ci: '13948271 LP',
    nombreCompleto: 'ARCE CONDORI MATEO DANIEL',
    curso: '1º de Secundaria - Paralelo "B"',
    fechaNacimiento: '15/06/2012',
    tutorNombre: 'Daniel Arce',
    tutorContacto: '71548123',
    parentesco: 'Padre',
    entries: [],
  },
  {
    id: 'k-8',
    cursoId: 'SEC_1B',
    rude: '807300452026012',
    ci: '12948194 LP',
    nombreCompleto: 'CHOQUE HUANCA BRUNO JHOEL',
    curso: '1º de Secundaria - Paralelo "B"',
    fechaNacimiento: '24/10/2012',
    tutorNombre: 'Rosa Huanca',
    tutorContacto: '71829444',
    parentesco: 'Madre',
    entries: [
      {
        id: 'ent-choque-1',
        fecha: '2026-03-20',
        asistencia: { faltaConLicencia: false, faltaSinLicencia: false, fueraDeHorario: false, abandonoClase: false },
        responsabilidad: { noPresentoDeber: false, noDioEvaluacion: false, noExpuso: false, noTrajoMateriales: false, danoMobiliario: true, trajoCelularSinPermiso: false },
        participacion: { noParticipa: false, noPrestaAtencion: false },
        conducta: { faltoRespetoDocente: false, faltoRespetoCompaneros: true, lenguajeInapropiado: true },
        observacionDetalle: 'Manchó con corrector y rayó la mesa de trabajo de su aula; usó términos inadecuados.',
        compromisoEstudiante: 'Limpiar el mobiliario afectado en presencia del regente de disciplina.',
        firmaMaestro: 'Prof. Carlos Mamani C.',
        citacionPadres: true,
      },
    ],
  },
  {
    id: 'k-9',
    cursoId: 'SEC_1B',
    rude: '807300452026009',
    ci: '14920184 LP',
    nombreCompleto: 'MAMANI QUISPE LUCIA VALENTINA',
    curso: '1º de Secundaria - Paralelo "B"',
    fechaNacimiento: '19/01/2012',
    tutorNombre: 'Juan Mamani',
    tutorContacto: '72034111',
    parentesco: 'Padre',
    entries: [
      {
        id: 'ent-lucia-1',
        fecha: '2026-03-10',
        asistencia: { faltaConLicencia: false, faltaSinLicencia: false, fueraDeHorario: true, abandonoClase: false },
        responsabilidad: { noPresentoDeber: false, noDioEvaluacion: false, noExpuso: false, noTrajoMateriales: false, danoMobiliario: false, trajoCelularSinPermiso: false },
        participacion: { noParticipa: false, noPrestaAtencion: false },
        conducta: { faltoRespetoDocente: false, faltoRespetoCompaneros: false, lenguajeInapropiado: false },
        observacionDetalle: 'Retraso de 15 minutos en el ingreso de la jornada matutina.',
        compromisoEstudiante: 'Tomar previsiones de transporte escolar.',
        firmaMaestro: 'Prof. Carlos Mamani C.',
        citacionPadres: false,
      },
    ],
  },

  // 2° Secundaria A
  {
    id: 'k-10',
    cursoId: 'SEC_2A',
    rude: '807300452026017',
    ci: '14829104 LP',
    nombreCompleto: 'ORTIZ PEREZ SEBASTIAN ANDRES',
    curso: '2º de Secundaria - Paralelo "A"',
    fechaNacimiento: '12/12/2011',
    tutorNombre: 'Andres Ortiz',
    tutorContacto: '67019999',
    parentesco: 'Padre',
    entries: [
      {
        id: 'ent-ortiz-1',
        fecha: '2026-03-25',
        asistencia: { faltaConLicencia: false, faltaSinLicencia: false, fueraDeHorario: false, abandonoClase: true },
        responsabilidad: { noPresentoDeber: true, noDioEvaluacion: false, noExpuso: false, noTrajoMateriales: false, danoMobiliario: false, trajoCelularSinPermiso: false },
        participacion: { noParticipa: false, noPrestaAtencion: true },
        conducta: { faltoRespetoDocente: true, faltoRespetoCompaneros: false, lenguajeInapropiado: false },
        observacionDetalle: 'Salió del aula sin autorización del docente 10 minutos antes del timbre de salida.',
        compromisoEstudiante: 'Permanecer en su pupitre hasta la finalización reglamentaria del periodo.',
        firmaMaestro: 'Prof. Carlos Mamani C.',
        citacionPadres: true,
      },
    ],
  },
  {
    id: 'k-11',
    cursoId: 'SEC_2A',
    rude: '807300452026013',
    ci: '11928471 LP',
    nombreCompleto: 'SALAZAR RAMOS DIEGO ARMANDO',
    curso: '2º de Secundaria - Paralelo "A"',
    fechaNacimiento: '08/07/2011',
    tutorNombre: 'Armando Salazar',
    tutorContacto: '71548555',
    parentesco: 'Padre',
    entries: [],
  },
];

export const KardexPage: React.FC = () => {
  const { isMaestro, isDirector, isSuperAdmin, user, currentInstitutionId } = useAuth();
  const activeSie = resolveTenantKey(currentInstitutionId);
  const currentInst = user?.institutions?.find(i => (i.id || i.institutionId || i.sie) === currentInstitutionId) || user?.institutions?.[0];
  const institutionName = currentInst?.nombre || 'Unidad Educativa';

  const rawCourses = getCoursesForInstitution(activeSie);
  const rawStudents = getStudentsForInstitution(activeSie);

  const cursosDisponibles = rawCourses.map((c) => ({
    id: c.id,
    nombre: `${c.cursoNombre} - Paralelo "${c.letra}"`,
    turno: c.turno,
    nivel: c.nivel,
    grado: c.grado,
    letra: c.letra,
  }));

  const [selectedCursoId, setSelectedCursoId] = useState<string>('');
  const [filterOnlyIncidents, setFilterOnlyIncidents] = useState<boolean>(false);
  const [students, setStudents] = useState<StudentKardexInfo[]>([]);

  // Sincronizar curso seleccionado
  useEffect(() => {
    if (cursosDisponibles.length > 0) {
      if (!selectedCursoId || !cursosDisponibles.some((c) => c.id === selectedCursoId)) {
        setSelectedCursoId(cursosDisponibles[0].id);
      }
    } else {
      setSelectedCursoId('');
    }
  }, [cursosDisponibles, selectedCursoId]);

  // Carga reactiva de Kardex por institución
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`sigma_kardex_${activeSie}`);
      if (stored) {
        setStudents(JSON.parse(stored));
        return;
      }
    } catch (e) {
      console.error(e);
    }

    if (activeSie === '80730045') {
      setStudents(INITIAL_KARDEX_STUDENTS);
    } else {
      const mapped: StudentKardexInfo[] = rawStudents.map((st) => {
        const matchingCourse = rawCourses.find((c) => {
          const matchGrado = st.curso.includes(`${c.grado}°`);
          const matchLetra =
            st.curso.includes(`Paralelo ${c.letra}`) ||
            st.curso.includes(`"${c.letra}"`) ||
            st.curso.endsWith(` ${c.letra}`);
          return matchGrado && matchLetra;
        }) || rawCourses[0];

        return {
          id: `k-${st.id}`,
          cursoId: matchingCourse ? matchingCourse.id : '',
          rude: st.rude,
          ci: st.ci,
          nombreCompleto: `${st.primerApellido} ${st.segundoApellido || ''} ${st.nombres}`.trim(),
          curso: st.curso,
          fechaNacimiento: st.fechaNacimiento,
          tutorNombre: st.nombreTutor || 'No registrado',
          tutorContacto: st.telefonoTutor || 'No registrado',
          parentesco: st.parentescoTutor || 'Tutor',
          entries: [],
        };
      });
      setStudents(mapped);
    }
  }, [activeSie, rawCourses, rawStudents]);

  // Filtrado reactivo de estudiantes según curso y opción de incidencias
  const studentsOfCourse = students.filter((s) => s.cursoId === selectedCursoId);
  const visibleStudents = filterOnlyIncidents
    ? studentsOfCourse.filter((s) => s.entries.length > 0)
    : studentsOfCourse;

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [showCitationModal, setShowCitationModal] = useState<boolean>(false);
  const [citationDate, setCitationDate] = useState<string>('2026-04-08');
  const [citationTime, setCitationTime] = useState<string>('09:30');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form state para nueva observación de Kardex
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [asistencia, setAsistencia] = useState({
    faltaConLicencia: false,
    faltaSinLicencia: false,
    fueraDeHorario: false,
    abandonoClase: false,
  });
  const [responsabilidad, setResponsabilidad] = useState({
    noPresentoDeber: false,
    noDioEvaluacion: false,
    noExpuso: false,
    noTrajoMateriales: false,
    danoMobiliario: false,
    trajoCelularSinPermiso: false,
  });
  const [participacion, setParticipacion] = useState({
    noParticipa: false,
    noPrestaAtencion: false,
  });
  const [conducta, setConducta] = useState({
    faltoRespetoDocente: false,
    faltoRespetoCompaneros: false,
    lenguajeInapropiado: false,
  });
  const [observacionDetalle, setObservacionDetalle] = useState('');
  const [compromisoEstudiante, setCompromisoEstudiante] = useState('');
  const [citacionPadres, setCitacionPadres] = useState(false);

  // Asegurar que el estudiante seleccionado pertenezca al curso visible
  const selectedStudent =
    visibleStudents.find((s) => s.id === selectedStudentId) ||
    visibleStudents[0] ||
    studentsOfCourse[0];

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!observacionDetalle.trim() || !selectedStudent) return;

    const teacherName = user?.persona
      ? `${user.persona.nombres} ${user.persona.primerApellido}`
      : 'Prof. Carlos Mamani C.';

    const newEntry: KardexEntry = {
      id: `ent-${Date.now()}`,
      fecha: newDate,
      asistencia: { ...asistencia },
      responsabilidad: { ...responsabilidad },
      participacion: { ...participacion },
      conducta: { ...conducta },
      observacionDetalle,
      compromisoEstudiante,
      firmaMaestro: teacherName,
      citacionPadres,
    };

    setStudents((prev) => {
      const updated = prev.map((s) =>
        s.id === selectedStudent.id ? { ...s, entries: [newEntry, ...s.entries] } : s
      );
      localStorage.setItem(`sigma_kardex_${activeSie}`, JSON.stringify(updated));
      return updated;
    });

    setFeedback('✅ Registro de Kardex disciplinario añadido exitosamente.');
    setTimeout(() => setFeedback(null), 3000);

    // Reset Form
    setObservacionDetalle('');
    setCompromisoEstudiante('');
    setCitacionPadres(false);
    setAsistencia({ faltaConLicencia: false, faltaSinLicencia: false, fueraDeHorario: false, abandonoClase: false });
    setResponsabilidad({ noPresentoDeber: false, noDioEvaluacion: false, noExpuso: false, noTrajoMateriales: false, danoMobiliario: false, trajoCelularSinPermiso: false });
    setParticipacion({ noParticipa: false, noPrestaAtencion: false });
    setConducta({ faltoRespetoDocente: false, faltoRespetoCompaneros: false, lenguajeInapropiado: false });
  };

  const handleDeleteEntry = (entryId: string) => {
    if (!selectedStudent) return;
    setStudents((prev) => {
      const updated = prev.map((s) =>
        s.id === selectedStudent.id
          ? { ...s, entries: s.entries.filter((e) => e.id !== entryId) }
          : s
      );
      localStorage.setItem(`sigma_kardex_${activeSie}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Descarga del documento formal de Citación a Padres en PDF
  const handleGenerateCitationPdf = () => {
    if (!selectedStudent) return;
    const teacherName = user?.persona
      ? `Prof. ${user.persona.nombres} ${user.persona.primerApellido}`
      : 'Prof. Carlos Mamani Condori';

    const lastEntry = selectedStudent.entries[0];
    const motivoTexto = lastEntry
      ? lastEntry.observacionDetalle
      : 'Reiteradas llamadas de atención pedagógicas y retrasos en el horario de ingreso.';

    exportParentalCitationPdf(
      selectedStudent.nombreCompleto,
      selectedStudent.rude,
      selectedStudent.curso,
      selectedStudent.tutorNombre,
      selectedStudent.tutorContacto,
      motivoTexto,
      citationDate,
      citationTime,
      teacherName
    );

    setShowCitationModal(false);
    setFeedback(`✅ Citación Oficial generada y descargada en PDF para el apoderado ${selectedStudent.tutorNombre}.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  if (cursosDisponibles.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-50 rounded-xl text-red-600">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Kardex & Seguimiento Disciplinario Estudiantil
              </h1>
              <p className="text-xs text-slate-500">
                {institutionName} • Gestión 2026
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <School className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Espacio en blanco: Aún no hay cursos creados
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Para habilitar el Kardex disciplinario, registro de observaciones y citaciones a padres de familia de <span className="font-semibold text-slate-700">{institutionName}</span>, primero debes configurar los cursos y paralelos.
            </p>
            <div className="pt-2">
              <Link
                to="/academic"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <span>Habilitar Cursos y Paralelos</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-red-50 rounded-xl text-red-600">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Kardex & Seguimiento Disciplinario Estudiantil
            </h1>
            <p className="text-xs text-slate-500">
              Evaluación Integral de Convivencia y Trazabilidad de 14 Aspectos Normativos (Ley 070) • {institutionName}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {selectedStudent && (
            <button
              onClick={() => setShowCitationModal(true)}
              className="flex items-center space-x-2 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Generar Citación a Padres</span>
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Kardex</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="flex items-center space-x-2 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Course and Filters Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Curso y Paralelo:</span>
          </label>
          <select
            value={selectedCursoId}
            onChange={(e) => {
              setSelectedCursoId(e.target.value);
              const firstSt = students.find((s) => s.cursoId === e.target.value);
              if (firstSt) setSelectedStudentId(firstSt.id);
            }}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {cursosDisponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} (Turno {c.turno})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
            Filtro de Incidentes:
          </label>
          <div className="flex space-x-1.5">
            <button
              type="button"
              onClick={() => setFilterOnlyIncidents(false)}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                !filterOnlyIncidents
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({studentsOfCourse.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterOnlyIncidents(true)}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${
                filterOnlyIncidents
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
            >
              <span>🔴 Con Incidencias</span>
              <span className="ml-1 px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
                {studentsOfCourse.filter((s) => s.entries.length > 0).length}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <div className="text-right text-xs text-slate-500">
            <div>
              Total con Incidencias:{' '}
              <span className="font-bold text-red-600">
                {studentsOfCourse.filter((s) => s.entries.length > 0).length}
              </span>{' '}
              de {studentsOfCourse.length}
            </div>
            <div className="text-[11px] text-slate-400">{institutionName} (SIE {activeSie})</div>
          </div>
        </div>
      </div>

      {/* Main Layout: Student List + Detailed Kardex Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Selection List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nómina de Estudiantes
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {visibleStudents.length} mostrados
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
              {visibleStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                  <Users className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">No hay estudiantes en este curso</p>
                  <Link
                    to="/students"
                    className="inline-flex items-center space-x-1 text-emerald-600 font-bold hover:underline"
                  >
                    <span>Matricular alumnos</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                visibleStudents.map((st) => {
                  const isSelected = selectedStudent && selectedStudent.id === st.id;
                  const incidentCount = st.entries.length;
                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStudentId(st.id)}
                      className={`p-3.5 cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-50/80 border-l-4 border-emerald-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{st.nombreCompleto}</div>
                        <div className="text-[10px] text-slate-400 font-mono">RUDE: {st.rude}</div>
                      </div>
                      <div>
                        {incidentCount > 0 ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            <span>{incidentCount} {incidentCount === 1 ? 'falta' : 'faltas'}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Sin faltas
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Kardex Details & Form */}
        <div className="lg:col-span-8 space-y-5">
          {selectedStudent ? (
            <>
              {/* Student Demographics Header */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      {selectedStudent.nombreCompleto}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedStudent.curso} • Código RUDE:{' '}
                      <span className="font-mono">{selectedStudent.rude}</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                      CI: {selectedStudent.ci}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        selectedStudent.entries.length > 0
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {selectedStudent.entries.length} Incidentes Registrados
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 pt-1">
                  <div>
                    <span className="font-bold text-slate-700">Tutor / Apoderado:</span>{' '}
                    <span>{selectedStudent.tutorNombre} ({selectedStudent.parentesco})</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Teléfono Contacto:</span>{' '}
                    <span className="font-mono">{selectedStudent.tutorContacto}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Fecha Nacimiento:</span>{' '}
                    <span>{selectedStudent.fechaNacimiento}</span>
                  </div>
                </div>
              </div>

              {/* Add New Observation Form (14 Aspects) */}
              {(isMaestro || isSuperAdmin) && (
                <form
                  onSubmit={handleAddEntry}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                      <ClipboardList className="w-4 h-4 text-emerald-600" />
                      <span>Registrar Nuevo Hecho / Observación Disciplinaria</span>
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold text-slate-600">Fecha:</span>
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="text-xs p-1 bg-slate-50 border border-slate-200 rounded font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  {/* 14 Aspects Checklist */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    {/* Asistencia */}
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1.5">
                      <span className="font-bold text-blue-900 block text-[11px] uppercase">
                        1. Asistencia
                      </span>
                      <label className="flex items-center space-x-2 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={asistencia.fueraDeHorario}
                          onChange={(e) =>
                            setAsistencia({ ...asistencia, fueraDeHorario: e.target.checked })
                          }
                          className="rounded text-emerald-600"
                        />
                        <span>Llegada con retraso</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={asistencia.faltaSinLicencia}
                          onChange={(e) =>
                            setAsistencia({ ...asistencia, faltaSinLicencia: e.target.checked })
                          }
                          className="rounded text-emerald-600"
                        />
                        <span>Falta injustificada</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={asistencia.abandonoClase}
                          onChange={(e) =>
                            setAsistencia({ ...asistencia, abandonoClase: e.target.checked })
                          }
                          className="rounded text-emerald-600"
                        />
                        <span>Abandono de aula</span>
                      </label>
                    </div>

                    {/* Responsabilidad */}
                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-1.5">
                      <span className="font-bold text-amber-900 block text-[11px] uppercase">
                        2. Responsabilidad
                      </span>
                      <label className="flex items-center space-x-2 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={responsabilidad.noPresentoDeber}
                          onChange={(e) =>
                            setResponsabilidad({
                              ...responsabilidad,
                              noPresentoDeber: e.target.checked,
                            })
                          }
                          className="rounded text-emerald-600"
                        />
                        <span>No presentó tarea</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={responsabilidad.noTrajoMateriales}
                          onChange={(e) =>
                            setResponsabilidad({
                              ...responsabilidad,
                              noTrajoMateriales: e.target.checked,
                            })
                          }
                          className="rounded text-emerald-600"
                        />
                        <span>Sin material / libro</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={responsabilidad.trajoCelularSinPermiso}
                          onChange={(e) =>
                            setResponsabilidad({
                              ...responsabilidad,
                              trajoCelularSinPermiso: e.target.checked,
                            })
                          }
                          className="rounded text-emerald-600"
                        />
                        <span>Uso no autorizado de celular</span>
                      </label>
                    </div>

                    {/* Participación */}
                    <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-1.5">
                      <span className="font-bold text-purple-900 block text-[11px] uppercase">
                        3. Participación
                      </span>
                      <label className="flex items-center space-x-2 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={participacion.noPrestaAtencion}
                          onChange={(e) =>
                            setParticipacion({
                              ...participacion,
                              noPrestaAtencion: e.target.checked,
                            })
                          }
                          className="rounded text-emerald-600"
                        />
                        <span>Falta de atención</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={participacion.noParticipa}
                          onChange={(e) =>
                            setParticipacion({
                              ...participacion,
                              noParticipa: e.target.checked,
                            })
                          }
                          className="rounded text-emerald-600"
                        />
                        <span>No participa en grupo</span>
                      </label>
                    </div>

                    {/* Conducta */}
                    <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 space-y-1.5">
                      <span className="font-bold text-rose-900 block text-[11px] uppercase">
                        4. Convivencia
                      </span>
                      <label className="flex items-center space-x-2 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={conducta.faltoRespetoDocente}
                          onChange={(e) =>
                            setConducta({ ...conducta, faltoRespetoDocente: e.target.checked })
                          }
                          className="rounded text-emerald-600"
                        />
                        <span>Falta respeto a docente</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={conducta.faltoRespetoCompaneros}
                          onChange={(e) =>
                            setConducta({ ...conducta, faltoRespetoCompaneros: e.target.checked })
                          }
                          className="rounded text-emerald-600"
                        />
                        <span>Conflicto con pares</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={conducta.lenguajeInapropiado}
                          onChange={(e) =>
                            setConducta({ ...conducta, lenguajeInapropiado: e.target.checked })
                          }
                          className="rounded text-emerald-600"
                        />
                        <span>Lenguaje inadecuado</span>
                      </label>
                    </div>
                  </div>

                  {/* Detail Narrative and Commitment */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Descripción Detallada del Hecho:
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={observacionDetalle}
                        onChange={(e) => setObservacionDetalle(e.target.value)}
                        placeholder="Describa el hecho ocurrido de forma objetiva y pedagógica..."
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Compromiso del Estudiante:
                      </label>
                      <input
                        type="text"
                        value={compromisoEstudiante}
                        onChange={(e) => setCompromisoEstudiante(e.target.value)}
                        placeholder="ej. El estudiante se compromete a no reincidir y cumplir con sus deberes..."
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-slate-100">
                    <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-red-700">
                      <input
                        type="checkbox"
                        checked={citacionPadres}
                        onChange={(e) => setCitacionPadres(e.target.checked)}
                        className="rounded text-red-600"
                      />
                      <span>¿Requiere Citación Oficial a Padres de Familia?</span>
                    </label>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition cursor-pointer"
                    >
                      Guardar en Kardex
                    </button>
                  </div>
                </form>
              )}

              {/* Historical Log of Entries */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>Historial de Observaciones Registradas ({selectedStudent.entries.length})</span>
                </h3>

                {selectedStudent.entries.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Este estudiante no tiene faltas ni observaciones registradas en la presente gestión.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedStudent.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative hover:border-slate-300 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {entry.fecha}
                            </span>
                            {entry.citacionPadres && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
                                Citación Requerida
                              </span>
                            )}
                          </div>

                          {(isMaestro || isSuperAdmin) && (
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-slate-400 hover:text-red-600 transition"
                              title="Eliminar observación"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-slate-800 font-medium">{entry.observacionDetalle}</p>

                        {entry.compromisoEstudiante && (
                          <div className="text-[11px] text-emerald-800 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                            <span className="font-bold">Compromiso: </span>
                            <span>{entry.compromisoEstudiante}</span>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 flex justify-between items-center pt-1 border-t border-slate-100">
                          <span>Registrado por: {entry.firmaMaestro}</span>
                          <span className="font-semibold text-slate-500">{institutionName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200">
              Seleccione un estudiante de la nómina lateral para ver su expediente disciplinario.
            </div>
          )}
        </div>
      </div>

      {/* Parental Citation Modal */}
      {showCitationModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase">
                Emitir Citación a Padres de Familia
              </h2>
              <button
                onClick={() => setShowCitationModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2 bg-red-50/60 p-3 rounded-xl border border-red-100">
              <div>
                <span className="font-bold text-slate-800">Estudiante: </span>
                <span>{selectedStudent.nombreCompleto}</span>
              </div>
              <div>
                <span className="font-bold text-slate-800">Apoderado Convocado: </span>
                <span>{selectedStudent.tutorNombre} ({selectedStudent.parentesco})</span>
              </div>
              <div>
                <span className="font-bold text-slate-800">Contacto: </span>
                <span className="font-mono">{selectedStudent.tutorContacto}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Fecha de la Cita:</label>
                <input
                  type="date"
                  value={citationDate}
                  onChange={(e) => setCitationDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hora de Atención:</label>
                <input
                  type="time"
                  value={citationTime}
                  onChange={(e) => setCitationTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCitationModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGenerateCitationPdf}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-sm transition cursor-pointer"
              >
                Descargar Citación en PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
