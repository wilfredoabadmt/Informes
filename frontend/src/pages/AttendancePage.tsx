import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getCoursesForInstitution,
  getStudentsForInstitution,
  resolveTenantKey,
} from '../utils/multiTenantStore';
import * as XLSX from 'xlsx';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Printer,
  FileSpreadsheet,
  Filter,
  Users,
  Award,
  ArrowRight,
  School,
} from 'lucide-react';

type AttendanceStatus = 'PRESENTE' | 'FALTA' | 'ATRASO' | 'LICENCIA';

interface StudentAttendance {
  id: string;
  rude: string;
  nombreCompleto: string;
  days: Record<number, AttendanceStatus>;
}

const MONTHS = [
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
];

const CURSOS_CATALOGO = [
  { id: 'SEC_1A', nombre: '1º de Secundaria - Paralelo "A" (Turno Mañana)', nivel: 'Secundaria' },
  { id: 'SEC_1B', nombre: '1º de Secundaria - Paralelo "B" (Turno Tarde)', nivel: 'Secundaria' },
  { id: 'SEC_2A', nombre: '2º de Secundaria - Paralelo "A" (Turno Mañana)', nivel: 'Secundaria' },
  { id: 'PRIM_1A', nombre: '1º de Primaria - Paralelo "A" (Turno Mañana)', nivel: 'Primaria' },
  { id: 'PRIM_2A', nombre: '2º de Primaria - Paralelo "A" (Turno Mañana)', nivel: 'Primaria' },
];

const ESTUDIANTES_POR_CURSO: Record<string, { id: string; rude: string; nombreCompleto: string }[]> = {
  SEC_1A: [
    { id: 'st-1', rude: '807300452026001', nombreCompleto: 'ALANOCA CRUZ ERICK ELIAS' },
    { id: 'st-2', rude: '807300452026002', nombreCompleto: 'ARAMAYO TOLEDO FABIOLA' },
    { id: 'st-3', rude: '807300452026003', nombreCompleto: 'CAMACHO RENJIFO KAROL LUCERO' },
    { id: 'st-4', rude: '807300452026004', nombreCompleto: 'CARDOZO YEVARA CARLIN YARITA' },
    { id: 'st-5', rude: '807300452026005', nombreCompleto: 'COLQUE COLODRO JHOANNA MAYENNI' },
    { id: 'st-6', rude: '807300452026006', nombreCompleto: 'FLORES CALLISAYA GABRIEL OMAR' },
  ],
  SEC_1B: [
    { id: 'st-7', rude: '807300452026007', nombreCompleto: 'ARCE CONDORI MATEO DANIEL' },
    { id: 'st-8', rude: '807300452026008', nombreCompleto: 'GUTIERREZ ROJAS SOFIA BELEN' },
    { id: 'st-9', rude: '807300452026009', nombreCompleto: 'MAMANI QUISPE LUCIA VALENTINA' },
    { id: 'st-10', rude: '807300452026010', nombreCompleto: 'TORREZ MENDOZA NICOLE ANDREA' },
    { id: 'st-11', rude: '807300452026011', nombreCompleto: 'VARGAS PAZ ALEJANDRO JOSE' },
    { id: 'st-12', rude: '807300452026012', nombreCompleto: 'CHOQUE HUANCA BRUNO JHOEL' },
  ],
  SEC_2A: [
    { id: 'st-13', rude: '807300452026013', nombreCompleto: 'SALAZAR RAMOS DIEGO ARMANDO' },
    { id: 'st-14', rude: '807300452026014', nombreCompleto: 'PINTO MORALES CAMILA RENATA' },
    { id: 'st-15', rude: '807300452026015', nombreCompleto: 'FERNANDEZ LUNA RODRIGO MARTIN' },
    { id: 'st-16', rude: '807300452026016', nombreCompleto: 'CASTRO GUZMAN VALERIA PAOLA' },
    { id: 'st-17', rude: '807300452026017', nombreCompleto: 'ORTIZ PEREZ SEBASTIAN ANDRES' },
  ],
  PRIM_1A: [
    { id: 'st-18', rude: '807300452026018', nombreCompleto: 'MAMANI LOPEZ THIAGO GAEL' },
    { id: 'st-19', rude: '807300452026019', nombreCompleto: 'RIOS CONDORI VALENTINA PAZ' },
    { id: 'st-20', rude: '807300452026020', nombreCompleto: 'CRUZ QUISPE LIAM SAMUEL' },
    { id: 'st-21', rude: '807300452026021', nombreCompleto: 'FLORES ALVAREZ MIA ISABELLA' },
    { id: 'st-22', rude: '807300452026022', nombreCompleto: 'CHOQUE HUANCA LUCAS MATEO' },
  ],
  PRIM_2A: [
    { id: 'st-23', rude: '807300452026023', nombreCompleto: 'SANCHEZ NINA GAEL FACUNDO' },
    { id: 'st-24', rude: '807300452026024', nombreCompleto: 'GUTIERREZ LUNA EMMA VICTORIA' },
    { id: 'st-25', rude: '807300452026025', nombreCompleto: 'MENDOZA RAMOS IAN PATRICIO' },
    { id: 'st-26', rude: '807300452026026', nombreCompleto: 'MORALES PINTO ZOE VALERIA' },
  ],
};

function generateInitialAttendance(cursoId: string, month: number): StudentAttendance[] {
  const lista = ESTUDIANTES_POR_CURSO[cursoId] || ESTUDIANTES_POR_CURSO.SEC_1A;
  const daysInMonth = new Date(2026, month, 0).getDate();

  return lista.map((st, idx) => {
    const days: Record<number, AttendanceStatus> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(2026, month - 1, d).getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Asignación realista: Mayoría presente, pocas faltas o atrasos
        const rand = (d * 7 + idx * 11) % 100;
        if (rand > 94) {
          days[d] = 'FALTA';
        } else if (rand > 87) {
          days[d] = 'ATRASO';
        } else if (rand > 83) {
          days[d] = 'LICENCIA';
        } else {
          days[d] = 'PRESENTE';
        }
      }
    }
    return {
      id: st.id,
      rude: st.rude,
      nombreCompleto: st.nombreCompleto,
      days,
    };
  });
}

export const AttendancePage: React.FC = () => {
  const { isMaestro, isDirector, isSuperAdmin, currentInstitutionId, user } = useAuth();
  const activeSie = resolveTenantKey(currentInstitutionId);
  const currentInst = user?.institutions?.find(i => (i.id || i.institutionId || i.sie) === currentInstitutionId) || user?.institutions?.[0];
  const institutionName = currentInst?.nombre || 'Unidad Educativa';

  // Cursos y estudiantes reales de la institución activa
  const rawCourses = getCoursesForInstitution(activeSie);
  const rawStudents = getStudentsForInstitution(activeSie);

  const cursosDisponibles = rawCourses.map((c) => ({
    id: c.id,
    nombre: `${c.cursoNombre} - Paralelo "${c.letra}" (${c.turno})`,
    nivel: c.nivel,
    grado: c.grado,
    letra: c.letra,
  }));

  const [selectedMonth, setSelectedMonth] = useState<number>(3); // Marzo default
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (cursosDisponibles.length > 0) {
      if (!selectedCourse || !cursosDisponibles.some((c) => c.id === selectedCourse)) {
        setSelectedCourse(cursosDisponibles[0].id);
      }
    } else {
      setSelectedCourse('');
    }
  }, [cursosDisponibles, selectedCourse]);

  // Almacén persistente en memoria por clave: sie_curso_mes
  const [attendanceStore, setAttendanceStore] = useState<Record<string, StudentAttendance[]>>({});
  const [students, setStudents] = useState<StudentAttendance[]>([]);

  const currentKey = `${activeSie}_${selectedCourse}_${selectedMonth}`;

  // Efecto reactivo al cambiar de curso o mes
  useEffect(() => {
    if (!selectedCourse) {
      setStudents([]);
      return;
    }

    if (attendanceStore[currentKey]) {
      setStudents(attendanceStore[currentKey]);
    } else {
      const currentC = rawCourses.find((c) => c.id === selectedCourse);
      const matchingStudents = rawStudents.filter((s) => {
        if (!currentC) return false;
        const matchGrado = s.curso.includes(`${currentC.grado}°`);
        const matchLetra =
          s.curso.includes(`Paralelo ${currentC.letra}`) ||
          s.curso.includes(`"${currentC.letra}"`) ||
          s.curso.endsWith(` ${currentC.letra}`);
        return matchGrado && matchLetra;
      });

      const pool = matchingStudents.length > 0 ? matchingStudents : rawStudents.slice(0, 8);
      const daysInMonth = new Date(2026, selectedMonth, 0).getDate();
      const generated: StudentAttendance[] = pool.map((st, idx) => {
        const days: Record<number, AttendanceStatus> = {};
        for (let d = 1; d <= daysInMonth; d++) {
          const dayOfWeek = new Date(2026, selectedMonth - 1, d).getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            const rand = (d * 7 + idx * 11) % 100;
            if (rand > 94) days[d] = 'FALTA';
            else if (rand > 87) days[d] = 'ATRASO';
            else if (rand > 83) days[d] = 'LICENCIA';
            else days[d] = 'PRESENTE';
          }
        }
        return {
          id: st.id,
          rude: st.rude,
          nombreCompleto: `${st.primerApellido} ${st.segundoApellido || ''} ${st.nombres}`.trim(),
          days,
        };
      });

      setStudents(generated);
      setAttendanceStore((prev) => ({ ...prev, [currentKey]: generated }));
    }
  }, [selectedCourse, selectedMonth, activeSie, currentKey, rawCourses, rawStudents]);

  // Días laborables del mes (Lunes a Viernes)
  const workingDays = useMemo(() => {
    const days: Array<{ day: number; weekday: string }> = [];
    const year = 2026;
    const daysInMonth = new Date(year, selectedMonth, 0).getDate();
    const weekdayShort = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, selectedMonth - 1, d);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days.push({ day: d, weekday: weekdayShort[dayOfWeek] });
      }
    }
    return days;
  }, [selectedMonth]);

  // Alternar estado al hacer clic en la casilla
  const toggleAttendance = (studentIndex: number, day: number) => {
    if (!isMaestro && !isSuperAdmin) return;
    const nextStatus: Record<AttendanceStatus, AttendanceStatus> = {
      PRESENTE: 'ATRASO',
      ATRASO: 'FALTA',
      FALTA: 'LICENCIA',
      LICENCIA: 'PRESENTE',
    };

    setStudents((prev) => {
      const updated = [...prev];
      const current = updated[studentIndex].days[day] || 'PRESENTE';
      updated[studentIndex] = {
        ...updated[studentIndex],
        days: {
          ...updated[studentIndex].days,
          [day]: nextStatus[current],
        },
      };
      setAttendanceStore((store) => ({ ...store, [currentKey]: updated }));
      return updated;
    });
  };

  // Marcar todos presentes hoy
  const markAllPresentToday = () => {
    const today = workingDays[0]?.day || 1;
    setStudents((prev) => {
      const updated = prev.map((s) => ({
        ...s,
        days: { ...s.days, [today]: 'PRESENTE' as AttendanceStatus },
      }));
      setAttendanceStore((store) => ({ ...store, [currentKey]: updated }));
      return updated;
    });
    setSaveSuccess(`¡Asistencias actualizadas! Todos los estudiantes marcados Presentes para el día ${today}.`);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  // Guardar Planilla
  const handleSaveAttendance = () => {
    setAttendanceStore((prev) => ({ ...prev, [currentKey]: students }));
    setSaveSuccess(`✅ Asistencias del mes guardadas exitosamente para ${cursoActual?.nombre}.`);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  // Calcular estadísticas del estudiante
  const getStats = (days: Record<number, AttendanceStatus>) => {
    let p = 0;
    let f = 0;
    let a = 0;
    let l = 0;

    workingDays.forEach((wd) => {
      const status = days[wd.day] || 'PRESENTE';
      if (status === 'PRESENTE') p++;
      else if (status === 'FALTA') f++;
      else if (status === 'ATRASO') a++;
      else if (status === 'LICENCIA') l++;
    });

    const totalDays = workingDays.length;
    const effectivePresent = p + a * 0.5 + l;
    const percentage = totalDays > 0 ? Math.round((effectivePresent / totalDays) * 100) : 100;

    return { p, f, a, l, percentage };
  };

  const cursoActual = CURSOS_CATALOGO.find((c) => c.id === selectedCourse);
  const mesActual = MONTHS.find((m) => m.value === selectedMonth);

  // Exportar Asistencia a Excel (.xlsx)
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const header = [
      ['ESTADO PLURINACIONAL DE BOLIVIA - MINISTERIO DE EDUCACIÓN'],
      ['UNIDAD EDUCATIVA FRANZ TAMAYO (SIE: 80730045)'],
      ['CONTROL MENSUAL DE ASISTENCIA ESCOLAR - GESTIÓN 2026'],
      [''],
      ['Curso y Paralelo:', cursoActual?.nombre || selectedCourse],
      ['Mes Académico:', `${mesActual?.label} 2026`, 'Días Laborables:', workingDays.length],
      [''],
      [
        'N°',
        'Código RUDE',
        'Apellidos y Nombres',
        ...workingDays.map((wd) => `Día ${wd.day}`),
        'Presentes (P)',
        'Faltas (F)',
        'Atrasos (A)',
        'Licencias (L)',
        '% Asistencia',
      ],
    ];

    students.forEach((s, idx) => {
      const stats = getStats(s.days);
      const row = [
        idx + 1,
        s.rude,
        s.nombreCompleto,
        ...workingDays.map((wd) => {
          const st = s.days[wd.day] || 'PRESENTE';
          return st === 'PRESENTE' ? 'P' : st === 'FALTA' ? 'F' : st === 'ATRASO' ? 'A' : 'L';
        }),
        stats.p,
        stats.f,
        stats.a,
        stats.l,
        `${stats.percentage}%`,
      ];
      header.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(header);
    XLSX.utils.book_append_sheet(wb, ws, 'AsistenciaMensual');

    const clean = (cursoActual?.nombre || selectedCourse).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    XLSX.writeFile(wb, `Asistencia_${clean}_${mesActual?.label}_2026.xlsx`);
  };

  if (cursosDisponibles.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
              <CalendarCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Control Mensual de Asistencia Escolar
              </h1>
              <p className="text-xs text-slate-500">
                {institutionName} • Gestión 2026
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <School className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Espacio en blanco: Aún no hay cursos creados
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Para comenzar a controlar la asistencia mensual y generar los registros pedagógicos, primero debes registrar los cursos y paralelos de <span className="font-semibold text-slate-700">{institutionName}</span>.
            </p>
            <div className="pt-2">
              <Link
                to="/academic?create=curso"
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
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
            <CalendarCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Control Mensual de Asistencia Escolar
            </h1>
            <p className="text-xs text-slate-500">
              {cursoActual?.nombre || 'Seleccione un curso'} • {institutionName} (Gestión 2026)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Excel Export */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>

          {(isMaestro || isSuperAdmin) && (
            <>
              <button
                onClick={markAllPresentToday}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Marcar Presentes Hoy</span>
              </button>
              <button
                onClick={handleSaveAttendance}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <span>Guardar Asistencias</span>
              </button>
            </>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center space-x-2 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Selectors and Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Course / Parallel Selector */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Curso y Paralelo:</span>
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
          >
            {cursosDisponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Month Selector */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
            Mes Académico:
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label} (Gestión 2026)
              </option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
            Leyenda Interactiva (Clic para cambiar):
          </label>
          <div className="flex items-center justify-between text-xs font-bold pt-1">
            <span className="inline-flex items-center space-x-1">
              <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">P</span>
              <span className="text-[11px] text-slate-600 font-medium">Presente</span>
            </span>
            <span className="inline-flex items-center space-x-1">
              <span className="w-5 h-5 rounded bg-rose-100 text-rose-700 flex items-center justify-center font-black">F</span>
              <span className="text-[11px] text-slate-600 font-medium">Falta</span>
            </span>
            <span className="inline-flex items-center space-x-1">
              <span className="w-5 h-5 rounded bg-amber-100 text-amber-700 flex items-center justify-center font-black">A</span>
              <span className="text-[11px] text-slate-600 font-medium">Atraso</span>
            </span>
            <span className="inline-flex items-center space-x-1">
              <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-black">L</span>
              <span className="text-[11px] text-slate-600 font-medium">Licencia</span>
            </span>
          </div>
        </div>
      </div>

      {/* Attendance Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Nómina de Asistencia • {cursoActual?.nombre} ({students.length} Estudiantes)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {mesActual?.label} 2026 • {workingDays.length} días hábiles
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-2.5 px-3 w-8 border-r border-slate-200 text-center">#</th>
                <th className="py-2.5 px-4 min-w-[200px] border-r border-slate-200">Apellidos y Nombres</th>
                {workingDays.map((wd) => (
                  <th
                    key={wd.day}
                    className="py-1 px-1 text-center border-r border-slate-200 w-7 min-w-[28px] hover:bg-slate-200 transition"
                  >
                    <div className="text-[9px] text-slate-400 font-medium">{wd.weekday}</div>
                    <div className="text-xs font-bold text-slate-700">{wd.day}</div>
                  </th>
                ))}
                <th className="py-2.5 px-2 text-center bg-emerald-50 text-emerald-800 font-bold border-l border-r border-emerald-100 w-10">P</th>
                <th className="py-2.5 px-2 text-center bg-rose-50 text-rose-800 font-bold border-r border-rose-100 w-10">F</th>
                <th className="py-2.5 px-2 text-center bg-amber-50 text-amber-800 font-bold border-r border-amber-100 w-10">A</th>
                <th className="py-2.5 px-2 text-center bg-blue-50 text-blue-800 font-bold border-r border-blue-100 w-10">L</th>
                <th className="py-2.5 px-3 text-center bg-slate-200 font-black text-slate-800 w-14">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={workingDays.length + 7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <span className="font-semibold text-slate-700">No hay estudiantes matriculados en este curso.</span>
                      <p className="text-xs text-slate-400">Inscribe alumnos en la sección "Estudiantes & Matrícula" para controlar su asistencia.</p>
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
                students.map((student, studentIndex) => {
                  const stats = getStats(student.days);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-3 text-center font-mono text-slate-400 border-r border-slate-200 text-xs">
                        {studentIndex + 1}
                      </td>
                      <td className="py-2 px-4 border-r border-slate-200">
                        <div className="font-semibold text-slate-900">{student.nombreCompleto}</div>
                        <div className="text-[10px] text-slate-400 font-mono">RUDE: {student.rude}</div>
                      </td>

                      {/* Días del Mes */}
                      {workingDays.map((wd) => {
                        const status = student.days[wd.day] || 'PRESENTE';
                        let badge = 'bg-emerald-100 text-emerald-700 font-bold';
                        let letter = 'P';
                        if (status === 'FALTA') {
                          badge = 'bg-rose-100 text-rose-700 font-bold';
                          letter = 'F';
                        } else if (status === 'ATRASO') {
                          badge = 'bg-amber-100 text-amber-700 font-bold';
                          letter = 'A';
                        } else if (status === 'LICENCIA') {
                          badge = 'bg-blue-100 text-blue-700 font-bold';
                          letter = 'L';
                        }

                        return (
                          <td
                            key={wd.day}
                            onClick={() => toggleAttendance(studentIndex, wd.day)}
                            className="py-1 px-0.5 text-center border-r border-slate-200 cursor-pointer select-none hover:opacity-75 transition"
                            title={`Día ${wd.day}: ${status}. Haz clic para cambiar.`}
                          >
                            <div className={`w-6 h-6 mx-auto rounded flex items-center justify-center text-[10px] ${badge}`}>
                              {letter}
                            </div>
                          </td>
                        );
                      })}

                      {/* Resumen Total */}
                      <td className="py-2 px-2 text-center font-bold text-emerald-700 bg-emerald-50/40 border-l border-r border-emerald-100">
                        {stats.p}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-rose-700 bg-rose-50/40 border-r border-rose-100">
                        {stats.f}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-amber-700 bg-amber-50/40 border-r border-amber-100">
                        {stats.a}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-blue-700 bg-blue-50/40 border-r border-blue-100">
                        {stats.l}
                      </td>
                      <td className="py-2 px-3 text-center font-black bg-slate-100 text-slate-800">
                        <span className={stats.percentage >= 80 ? 'text-emerald-700' : 'text-rose-600'}>
                          {stats.percentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
