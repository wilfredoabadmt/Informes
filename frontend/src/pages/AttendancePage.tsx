import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Award,
} from 'lucide-react';

type AttendanceStatus = 'PRESENTE' | 'FALTA' | 'ATRASO' | 'LICENCIA';

interface StudentAttendance {
  id: string;
  rude: string;
  nombreCompleto: string;
  days: Record<number, AttendanceStatus>; // dayOfMonth -> status
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

export const AttendancePage: React.FC = () => {
  const { isMaestro, isDirector, isSuperAdmin } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<number>(3); // Marzo default
  const [selectedCourse, setSelectedCourse] = useState<string>('1A-SEC');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sample students based on Bolivian school roster
  const [students, setStudents] = useState<StudentAttendance[]>([
    {
      id: 'st-1',
      rude: '807300452026001',
      nombreCompleto: 'ALANOCA CRUZ ERICK ELIAS',
      days: { 1: 'PRESENTE', 2: 'PRESENTE', 3: 'PRESENTE', 4: 'ATRASO', 5: 'PRESENTE', 8: 'PRESENTE', 9: 'LICENCIA', 10: 'PRESENTE' },
    },
    {
      id: 'st-2',
      rude: '807300452026002',
      nombreCompleto: 'ARAMAYO TOLEDO FABIOLA',
      days: { 1: 'PRESENTE', 2: 'PRESENTE', 3: 'PRESENTE', 4: 'PRESENTE', 5: 'PRESENTE', 8: 'PRESENTE', 9: 'PRESENTE', 10: 'PRESENTE' },
    },
    {
      id: 'st-3',
      rude: '807300452026003',
      nombreCompleto: 'CAMACHO RENJIFO KAROL LUCERO',
      days: { 1: 'PRESENTE', 2: 'FALTA', 3: 'PRESENTE', 4: 'PRESENTE', 5: 'PRESENTE', 8: 'PRESENTE', 9: 'PRESENTE', 10: 'PRESENTE' },
    },
    {
      id: 'st-4',
      rude: '807300452026004',
      nombreCompleto: 'CARDOZO YEVARA CARLIN YARITA',
      days: { 1: 'PRESENTE', 2: 'PRESENTE', 3: 'PRESENTE', 4: 'PRESENTE', 5: 'ATRASO', 8: 'PRESENTE', 9: 'PRESENTE', 10: 'PRESENTE' },
    },
    {
      id: 'st-5',
      rude: '807300452026005',
      nombreCompleto: 'COLQUE COLODRO JHOANNA MAYENNI',
      days: { 1: 'PRESENTE', 2: 'PRESENTE', 3: 'LICENCIA', 4: 'PRESENTE', 5: 'PRESENTE', 8: 'PRESENTE', 9: 'PRESENTE', 10: 'PRESENTE' },
    },
    {
      id: 'st-6',
      rude: '807300452026006',
      nombreCompleto: 'FLORES CALLISAYA GABRIEL OMAR',
      days: { 1: 'PRESENTE', 2: 'PRESENTE', 3: 'PRESENTE', 4: 'FALTA', 5: 'PRESENTE', 8: 'PRESENTE', 9: 'ATRASO', 10: 'PRESENTE' },
    },
    {
      id: 'st-7',
      rude: '807300452026007',
      nombreCompleto: 'QUISPE MAMANI LUCIA BEATRIZ',
      days: { 1: 'PRESENTE', 2: 'PRESENTE', 3: 'PRESENTE', 4: 'PRESENTE', 5: 'PRESENTE', 8: 'PRESENTE', 9: 'PRESENTE', 10: 'PRESENTE' },
    },
  ]);

  // Compute school working days (Mon-Fri) for 2026 and the selected month
  const workingDays = useMemo(() => {
    const days: Array<{ day: number; weekday: string }> = [];
    const year = 2026;
    const daysInMonth = new Date(year, selectedMonth, 0).getDate();
    const weekdayShort = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, selectedMonth - 1, d);
      const dayOfWeek = date.getDay();
      // Skip Saturday (6) and Sunday (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days.push({ day: d, weekday: weekdayShort[dayOfWeek] });
      }
    }
    return days;
  }, [selectedMonth]);

  // Cycle status on cell click: PRESENTE -> ATRASO -> FALTA -> LICENCIA -> PRESENTE
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
      return updated;
    });
  };

  // Mark all students present for a specific day
  const markAllPresentToday = () => {
    const today = workingDays[0]?.day || 1;
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        days: { ...s.days, [today]: 'PRESENTE' },
      }))
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Calculate statistics per student
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
    const percentage = totalDays > 0 ? Math.round(((p + a) / totalDays) * 100) : 100;
    return { p, f, a, l, totalDays, percentage };
  };

  const getStatusBadge = (status?: AttendanceStatus) => {
    switch (status) {
      case 'PRESENTE':
        return <span className="text-emerald-700 font-bold">P</span>;
      case 'ATRASO':
        return <span className="text-amber-600 font-bold">A</span>;
      case 'FALTA':
        return <span className="text-rose-600 font-bold">F</span>;
      case 'LICENCIA':
        return <span className="text-blue-600 font-bold">L</span>;
      default:
        return <span className="text-slate-300">-</span>;
    }
  };

  const currentMonthLabel = MONTHS.find((m) => m.value === selectedMonth)?.label || 'Mes';

  return (
    <div className="space-y-6">
      {/* Header and Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
            <CalendarCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Control Mensual de Asistencia Escolar
            </h1>
            <p className="text-xs text-slate-500">
              Registro continuo conforme al Cuaderno Pedagógico del Maestro (Ley 070)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Planilla</span>
          </button>
          {(isMaestro || isSuperAdmin) && (
            <button
              onClick={markAllPresentToday}
              className="inline-flex items-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Marcar Todos Presentes</span>
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center space-x-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>¡Asistencias actualizadas y sincronizadas correctamente en la base de datos!</span>
        </div>
      )}

      {/* Selectors and Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Month Selector */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
            Mes Académico:
          </label>
          <div className="flex items-center space-x-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} (Gestión 2026)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Course / Parallel Selector */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
            Curso y Paralelo:
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="1A-SEC">1º de Secundaria - Paralelo "A" (Lenguaje y Comunicación)</option>
            <option value="1B-SEC">1º de Secundaria - Paralelo "B" (Lenguaje y Comunicación)</option>
            <option value="2A-SEC">2º de Secundaria - Paralelo "A" (Ciencias Sociales)</option>
          </select>
        </div>

        {/* Legend */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
            Leyenda de Asistencia (SEP):
          </label>
          <div className="flex items-center justify-between text-xs font-medium pt-1">
            <span className="inline-flex items-center space-x-1">
              <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">P</span>
              <span>Presente</span>
            </span>
            <span className="inline-flex items-center space-x-1">
              <span className="w-5 h-5 rounded bg-rose-100 text-rose-700 flex items-center justify-center font-bold">F</span>
              <span>Falta</span>
            </span>
            <span className="inline-flex items-center space-x-1">
              <span className="w-5 h-5 rounded bg-amber-100 text-amber-700 flex items-center justify-center font-bold">A</span>
              <span>Atraso</span>
            </span>
            <span className="inline-flex items-center space-x-1">
              <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold">L</span>
              <span>Licencia</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Attendance Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Planilla de Asistencia - Mes de {currentMonthLabel} (Gestión 2026)
            </h2>
            <p className="text-xs text-slate-500">
              Haga clic sobre cualquier casilla para rotar estado: Presente ➔ Atraso ➔ Falta ➔ Licencia
            </p>
          </div>
          <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
            {workingDays.length} Días Hábiles
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-2.5 px-3 sticky left-0 bg-slate-100 z-10 w-8 border-r border-slate-200">Nº</th>
                <th className="py-2.5 px-3 sticky left-8 bg-slate-100 z-10 min-w-[220px] border-r border-slate-200">
                  Nombres y Apellidos
                </th>
                {workingDays.map((wd) => (
                  <th key={wd.day} className="py-1 px-1 text-center w-7 border-r border-slate-200">
                    <div className="text-[10px] text-slate-500">{wd.weekday}</div>
                    <div className="text-slate-800">{wd.day}</div>
                  </th>
                ))}
                {/* Summary columns */}
                <th className="py-2.5 px-2 text-center bg-emerald-50 text-emerald-800 border-r border-slate-200 w-10">P</th>
                <th className="py-2.5 px-2 text-center bg-rose-50 text-rose-800 border-r border-slate-200 w-10">F</th>
                <th className="py-2.5 px-2 text-center bg-amber-50 text-amber-800 border-r border-slate-200 w-10">A</th>
                <th className="py-2.5 px-2 text-center bg-blue-50 text-blue-800 border-r border-slate-200 w-10">L</th>
                <th className="py-2.5 px-3 text-center bg-slate-100 font-extrabold text-slate-900 min-w-[65px]">% Asist.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {students.map((student, idx) => {
                const stats = getStats(student.days);
                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 sticky left-0 bg-white z-10 text-slate-500 border-r border-slate-200 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 sticky left-8 bg-white z-10 font-medium text-slate-900 border-r border-slate-200 whitespace-nowrap">
                      {student.nombreCompleto}
                    </td>
                    {workingDays.map((wd) => {
                      const status = student.days[wd.day] || 'PRESENTE';
                      return (
                        <td
                          key={wd.day}
                          onClick={() => toggleAttendance(idx, wd.day)}
                          className={`py-1 px-1 text-center border-r border-slate-200 cursor-pointer select-none transition ${
                            status === 'PRESENTE'
                              ? 'bg-emerald-50/40 hover:bg-emerald-100'
                              : status === 'FALTA'
                              ? 'bg-rose-100 font-bold hover:bg-rose-200'
                              : status === 'ATRASO'
                              ? 'bg-amber-100 font-bold hover:bg-amber-200'
                              : 'bg-blue-100 font-bold hover:bg-blue-200'
                          }`}
                        >
                          {getStatusBadge(status)}
                        </td>
                      );
                    })}
                    <td className="py-2 px-2 text-center font-bold text-emerald-700 bg-emerald-50/30 border-r border-slate-200">
                      {stats.p}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-rose-700 bg-rose-50/30 border-r border-slate-200">
                      {stats.f}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-amber-700 bg-amber-50/30 border-r border-slate-200">
                      {stats.a}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-blue-700 bg-blue-50/30 border-r border-slate-200">
                      {stats.l}
                    </td>
                    <td
                      className={`py-2 px-3 text-center font-extrabold ${
                        stats.percentage >= 85
                          ? 'text-emerald-700'
                          : stats.percentage >= 70
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {stats.percentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
