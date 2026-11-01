import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  Calendar,
  Coffee,
  Printer,
  BookOpen,
  Building2,
  CheckCircle,
  Filter,
} from 'lucide-react';

interface ScheduleSlot {
  period: number;
  timeRange: string;
  isRecess?: boolean;
  days: {
    lunes?: { subject: string; grade: string; room: string; color: string };
    martes?: { subject: string; grade: string; room: string; color: string };
    miercoles?: { subject: string; grade: string; room: string; color: string };
    jueves?: { subject: string; grade: string; room: string; color: string };
    viernes?: { subject: string; grade: string; room: string; color: string };
  };
}

export const SchedulePage: React.FC = () => {
  const { isMaestro, isDirector, isSuperAdmin, user } = useAuth();
  const [selectedView, setSelectedView] = useState<'teacher' | 'classroom'>('teacher');
  const [selectedCourse, setSelectedCourse] = useState<string>('1A');

  // Exact period slots from sheet HOR in REGISTRO_MODERNO.xlsb
  const scheduleSlots: ScheduleSlot[] = [
    {
      period: 1,
      timeRange: '08:00 - 08:45',
      days: {
        lunes: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "A"', room: 'Aula 101', color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
        martes: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "B"', room: 'Aula 102', color: 'bg-indigo-50 border-indigo-300 text-indigo-900' },
        miercoles: { subject: 'Lengua Extranjera (Inglés)', grade: '2º Sec "A"', room: 'Aula 103', color: 'bg-sky-50 border-sky-300 text-sky-900' },
        jueves: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "A"', room: 'Aula 101', color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
        viernes: { subject: 'Literatura y Redacción', grade: '3º Sec "A"', room: 'Aula 201', color: 'bg-purple-50 border-purple-300 text-purple-900' },
      },
    },
    {
      period: 2,
      timeRange: '08:45 - 09:30',
      days: {
        lunes: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "A"', room: 'Aula 101', color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
        martes: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "B"', room: 'Aula 102', color: 'bg-indigo-50 border-indigo-300 text-indigo-900' },
        miercoles: { subject: 'Lengua Originaria (Guaraní)', grade: '1º Sec "A"', room: 'Aula 101', color: 'bg-amber-50 border-amber-300 text-amber-900' },
        jueves: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "A"', room: 'Aula 101', color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
        viernes: { subject: 'Literatura y Redacción', grade: '3º Sec "A"', room: 'Aula 201', color: 'bg-purple-50 border-purple-300 text-purple-900' },
      },
    },
    {
      period: 3,
      timeRange: '09:30 - 10:15',
      days: {
        lunes: { subject: 'Taller de Expresión Oral', grade: '2º Sec "B"', room: 'Aula 104', color: 'bg-rose-50 border-rose-300 text-rose-900' },
        martes: { subject: 'Lengua Originaria (Guaraní)', grade: '1º Sec "B"', room: 'Aula 102', color: 'bg-amber-50 border-amber-300 text-amber-900' },
        miercoles: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "B"', room: 'Aula 102', color: 'bg-indigo-50 border-indigo-300 text-indigo-900' },
        jueves: { subject: 'Taller de Lectura Crítica', grade: '1º Sec "A"', room: 'Aula 101', color: 'bg-teal-50 border-teal-300 text-teal-900' },
        viernes: { subject: 'Consejo de Evaluación', grade: 'Docentes', room: 'Sala Maestros', color: 'bg-slate-100 border-slate-300 text-slate-800' },
      },
    },
    {
      period: 4,
      timeRange: '10:15 - 11:00',
      days: {
        lunes: { subject: 'Taller de Expresión Oral', grade: '2º Sec "B"', room: 'Aula 104', color: 'bg-rose-50 border-rose-300 text-rose-900' },
        martes: { subject: 'Atención a Padres (Kardex)', grade: 'Comunidad', room: 'Dirección', color: 'bg-amber-100 border-amber-400 text-amber-900' },
        miercoles: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "B"', room: 'Aula 102', color: 'bg-indigo-50 border-indigo-300 text-indigo-900' },
        jueves: { subject: 'Taller de Lectura Crítica', grade: '1º Sec "A"', room: 'Aula 101', color: 'bg-teal-50 border-teal-300 text-teal-900' },
        viernes: { subject: 'Reforzamiento Pedagógico', grade: '1º Sec "A"', room: 'Aula 101', color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      },
    },
    {
      period: 0,
      timeRange: '11:00 - 11:15',
      isRecess: true,
      days: {},
    },
    {
      period: 5,
      timeRange: '11:15 - 12:00',
      days: {
        lunes: { subject: 'Ciencias Sociales e Historia', grade: '1º Sec "A"', room: 'Aula 101', color: 'bg-amber-50 border-amber-300 text-amber-900' },
        martes: { subject: 'Planificación Curricular', grade: 'Docente', room: 'Biblioteca', color: 'bg-slate-100 border-slate-300 text-slate-800' },
        miercoles: { subject: 'Ciencias Sociales e Historia', grade: '1º Sec "A"', room: 'Aula 101', color: 'bg-amber-50 border-amber-300 text-amber-900' },
        jueves: { subject: 'Lengua Extranjera (Inglés)', grade: '2º Sec "A"', room: 'Aula 103', color: 'bg-sky-50 border-sky-300 text-sky-900' },
        viernes: { subject: 'Actividades Sociocomunitarias', grade: 'Colegio', room: 'Cancha', color: 'bg-lime-50 border-lime-300 text-lime-900' },
      },
    },
    {
      period: 6,
      timeRange: '12:00 - 12:45',
      days: {
        lunes: { subject: 'Ciencias Sociales e Historia', grade: '1º Sec "A"', room: 'Aula 101', color: 'bg-amber-50 border-amber-300 text-amber-900' },
        martes: { subject: 'Planificación Curricular', grade: 'Docente', room: 'Biblioteca', color: 'bg-slate-100 border-slate-300 text-slate-800' },
        miercoles: { subject: 'Ciencias Sociales e Historia', grade: '1º Sec "A"', room: 'Aula 101', color: 'bg-amber-50 border-amber-300 text-amber-900' },
        jueves: { subject: 'Lengua Extranjera (Inglés)', grade: '2º Sec "A"', room: 'Aula 103', color: 'bg-sky-50 border-sky-300 text-sky-900' },
        viernes: { subject: 'Cierre de Jornada y Turno', grade: 'Institucional', room: 'Dirección', color: 'bg-slate-100 border-slate-300 text-slate-800' },
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-sky-50 rounded-xl text-sky-700">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Horario Semanal de Clases y Actividades Pedagógicas
            </h1>
            <p className="text-xs text-slate-500">
              Distribución de períodos lectivos y descansos (Hoja HOR - Registro Moderno)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Horario</span>
          </button>
        </div>
      </div>

      {/* Controls & Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
            Modalidad de Visualización:
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedView('teacher')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition ${
                selectedView === 'teacher'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Horario del Maestro
            </button>
            <button
              onClick={() => setSelectedView('classroom')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition ${
                selectedView === 'classroom'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Por Paralelo
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
            Información Institucional:
          </label>
          <div className="text-xs text-slate-700 space-y-1">
            <div><strong className="text-slate-900">Unidad Educativa:</strong> Emborozú</div>
            <div><strong className="text-slate-900">Turno:</strong> Mañana (08:00 a 12:45)</div>
            <div><strong className="text-slate-900">Gestión:</strong> 2026</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Carga Horaria Semanal
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              30 Horas
            </div>
            <div className="text-xs text-emerald-600 font-semibold">
              6 Períodos diarios completados
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Timetable Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
            Cronograma Pedagógico Semanal (Lunes a Viernes)
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Duración por período: 45 minutos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-3 text-center w-14 border-r border-slate-200">Período</th>
                <th className="py-3 px-3 text-center w-28 border-r border-slate-200">Horario</th>
                <th className="py-3 px-3 text-center w-1/5 border-r border-slate-200">LUNES</th>
                <th className="py-3 px-3 text-center w-1/5 border-r border-slate-200">MARTES</th>
                <th className="py-3 px-3 text-center w-1/5 border-r border-slate-200">MIÉRCOLES</th>
                <th className="py-3 px-3 text-center w-1/5 border-r border-slate-200">JUEVES</th>
                <th className="py-3 px-3 text-center w-1/5">VIERNES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {scheduleSlots.map((slot, index) => {
                if (slot.isRecess) {
                  return (
                    <tr key={`recess-${index}`} className="bg-amber-50/80 border-y-2 border-amber-200">
                      <td colSpan={7} className="py-2.5 px-4 text-center font-bold text-amber-800 tracking-wider text-xs">
                        <span className="inline-flex items-center space-x-2">
                          <Coffee className="w-4 h-4" />
                          <span>DESCANSO PEDAGÓGICO / RECREO ESCOLAR (11:00 - 11:15)</span>
                        </span>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={slot.period} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                      {slot.period}º
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600 border-r border-slate-200 whitespace-nowrap bg-slate-50/50">
                      {slot.timeRange}
                    </td>

                    {/* Lunes */}
                    <td className="p-2 border-r border-slate-200">
                      {slot.days.lunes ? (
                        <div className={`p-2 rounded-lg border ${slot.days.lunes.color}`}>
                          <div className="font-bold">{slot.days.lunes.subject}</div>
                          <div className="flex justify-between text-[11px] text-slate-600 mt-1">
                            <span>{slot.days.lunes.grade}</span>
                            <span className="font-mono">{slot.days.lunes.room}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-slate-300">-</div>
                      )}
                    </td>

                    {/* Martes */}
                    <td className="p-2 border-r border-slate-200">
                      {slot.days.martes ? (
                        <div className={`p-2 rounded-lg border ${slot.days.martes.color}`}>
                          <div className="font-bold">{slot.days.martes.subject}</div>
                          <div className="flex justify-between text-[11px] text-slate-600 mt-1">
                            <span>{slot.days.martes.grade}</span>
                            <span className="font-mono">{slot.days.martes.room}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-slate-300">-</div>
                      )}
                    </td>

                    {/* Miercoles */}
                    <td className="p-2 border-r border-slate-200">
                      {slot.days.miercoles ? (
                        <div className={`p-2 rounded-lg border ${slot.days.miercoles.color}`}>
                          <div className="font-bold">{slot.days.miercoles.subject}</div>
                          <div className="flex justify-between text-[11px] text-slate-600 mt-1">
                            <span>{slot.days.miercoles.grade}</span>
                            <span className="font-mono">{slot.days.miercoles.room}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-slate-300">-</div>
                      )}
                    </td>

                    {/* Jueves */}
                    <td className="p-2 border-r border-slate-200">
                      {slot.days.jueves ? (
                        <div className={`p-2 rounded-lg border ${slot.days.jueves.color}`}>
                          <div className="font-bold">{slot.days.jueves.subject}</div>
                          <div className="flex justify-between text-[11px] text-slate-600 mt-1">
                            <span>{slot.days.jueves.grade}</span>
                            <span className="font-mono">{slot.days.jueves.room}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-slate-300">-</div>
                      )}
                    </td>

                    {/* Viernes */}
                    <td className="p-2">
                      {slot.days.viernes ? (
                        <div className={`p-2 rounded-lg border ${slot.days.viernes.color}`}>
                          <div className="font-bold">{slot.days.viernes.subject}</div>
                          <div className="flex justify-between text-[11px] text-slate-600 mt-1">
                            <span>{slot.days.viernes.grade}</span>
                            <span className="font-mono">{slot.days.viernes.room}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-slate-300">-</div>
                      )}
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

