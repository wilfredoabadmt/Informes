import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
} from 'lucide-react';

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

export const KardexPage: React.FC = () => {
  const { isMaestro, isDirector, isSuperAdmin, user } = useAuth();

  // Mock Students with Kardex history matching REGISTRO_MODERNO.xlsb
  const [students, setStudents] = useState<StudentKardexInfo[]>([
    {
      id: 'k-1',
      rude: '807300452026001',
      ci: '10928374 LP',
      nombreCompleto: 'ALANOCA CRUZ ERICK ELIAS',
      curso: '1º de Secundaria - Paralelo A',
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
          observacionDetalle: 'Llegó con 20 minutos de retraso y no entregó la tarea de Lenguaje sobre sintaxis.',
          compromisoEstudiante: 'El estudiante se compromete a regularizar su tarea el día lunes a primera hora.',
          firmaMaestro: 'Prof. Carlos Mamani C.',
          citacionPadres: false,
        },
      ],
    },
    {
      id: 'k-2',
      rude: '807300452026002',
      ci: '12847593 LP',
      nombreCompleto: 'ARAMAYO TOLEDO FABIOLA',
      curso: '1º de Secundaria - Paralelo A',
      fechaNacimiento: '22/09/2012',
      tutorNombre: 'Sonia Toledo Quispe',
      tutorContacto: '68923145',
      parentesco: 'Madre',
      entries: [],
    },
    {
      id: 'k-3',
      rude: '807300452026006',
      ci: '9847261 LP',
      nombreCompleto: 'FLORES CALLISAYA GABRIEL OMAR',
      curso: '1º de Secundaria - Paralelo A',
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
          observacionDetalle: 'Uso de teléfono móvil durante la explicación y discusión con compañero de banco.',
          compromisoEstudiante: 'No volver a sacar el dispositivo en horas lectivas.',
          firmaMaestro: 'Prof. Carlos Mamani C.',
          citacionPadres: true,
        },
      ],
    },
  ]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>('k-1');
  const [showCitationModal, setShowCitationModal] = useState<boolean>(false);
  const [citationDate, setCitationDate] = useState<string>('2026-04-05');
  const [citationTime, setCitationTime] = useState<string>('10:30');

  // Form state for creating a new Kardex observation
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

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!observacionDetalle.trim()) return;

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

    setStudents((prev) =>
      prev.map((s) =>
        s.id === selectedStudentId
          ? { ...s, entries: [newEntry, ...s.entries] }
          : s
      )
    );

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
    setStudents((prev) =>
      prev.map((s) =>
        s.id === selectedStudentId
          ? { ...s, entries: s.entries.filter((e) => e.id !== entryId) }
          : s
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-700">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Kardex Escolar de Seguimiento y Disciplina
            </h1>
            <p className="text-xs text-slate-500">
              Bitácora disciplinaria y pedagógica oficial (Registro Moderno - Ley 070)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Kardex</span>
          </button>
          <button
            onClick={() => setShowCitationModal(true)}
            className="inline-flex items-center space-x-2 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Generar Citación a Padres</span>
          </button>
        </div>
      </div>

      {/* Student Selector & Demographics Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Selector */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Seleccionar Estudiante:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombreCompleto} ({s.rude})
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span className="font-semibold">Curso:</span>
              <span>{selectedStudent.curso}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="font-semibold">Fecha de Nac.:</span>
              <span>{selectedStudent.fechaNacimiento}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="font-semibold">Carnet de Identidad:</span>
              <span className="font-mono">{selectedStudent.ci}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="font-semibold">Código RUDE:</span>
              <span className="font-mono text-indigo-700 font-bold">{selectedStudent.rude}</span>
            </div>
          </div>
        </div>

        {/* Parent / Tutor Information Card (Exact from sheet KARDEX) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wide border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-indigo-600" />
            <span>Datos del Padre, Madre o Tutor</span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-500 block">Nombres y Apellidos del Tutor:</span>
              <span className="font-bold text-slate-800 text-sm">{selectedStudent.tutorNombre}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-slate-500 block">Parentesco:</span>
                <span className="font-semibold text-slate-700">{selectedStudent.parentesco}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Teléfono / Celular:</span>
                <span className="font-bold text-emerald-700 flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{selectedStudent.tutorContacto}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-600">
            Conforme a normativa, el apoderado legal debe estar registrado para el seguimiento de rendimiento y citaciones presenciales.
          </div>
        </div>

        {/* Incidents Summary Metric */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-indigo-200 font-semibold mb-1">
              Estado Disciplinario Acumulado
            </div>
            <div className="text-2xl font-black">
              {selectedStudent.entries.length} {selectedStudent.entries.length === 1 ? 'Incidencia' : 'Incidencias'}
            </div>
            <p className="text-xs text-indigo-200 mt-1">
              Registro del periodo escolar vigente 2026
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-indigo-800/60 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">CITACIONES:</span>
              <span className="font-bold text-amber-300">
                {selectedStudent.entries.filter((e) => e.citacionPadres).length} Emitidas
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">CONDUCTA:</span>
              <span className="font-bold text-emerald-400">
                {selectedStudent.entries.length === 0 ? 'Excelente' : 'Bajo Seguimiento'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* New Kardex Entry Form (Only for Teachers and Admins) */}
      {(isMaestro || isSuperAdmin) && (
        <form
          onSubmit={handleAddEntry}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-2">
              <ClipboardList className="w-4 h-4 text-emerald-600" />
              <span>Registrar Nueva Observación Pedagógica / Disciplinaria</span>
            </h2>
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-slate-600">Fecha del Hecho:</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 4 Categorized Checkboxes (Exact from Sheet KARDEX) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Asistencia */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-rose-800 flex items-center space-x-1">
                <span>1. Asistencia</span>
              </h3>
              <div className="space-y-1.5 text-xs text-slate-700">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={asistencia.faltaConLicencia}
                    onChange={(e) => setAsistencia({ ...asistencia, faltaConLicencia: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Falta con licencia</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={asistencia.faltaSinLicencia}
                    onChange={(e) => setAsistencia({ ...asistencia, faltaSinLicencia: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Falta sin licencia</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={asistencia.fueraDeHorario}
                    onChange={(e) => setAsistencia({ ...asistencia, fueraDeHorario: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Fuera de horario (Atraso)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={asistencia.abandonoClase}
                    onChange={(e) => setAsistencia({ ...asistencia, abandonoClase: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Abandono de la clase</span>
                </label>
              </div>
            </div>

            {/* 2. Responsabilidad */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-amber-800 flex items-center space-x-1">
                <span>2. Responsabilidad</span>
              </h3>
              <div className="space-y-1.5 text-xs text-slate-700">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={responsabilidad.noPresentoDeber}
                    onChange={(e) => setResponsabilidad({ ...responsabilidad, noPresentoDeber: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>No presentó deber / tarea</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={responsabilidad.noDioEvaluacion}
                    onChange={(e) => setResponsabilidad({ ...responsabilidad, noDioEvaluacion: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>No dio su evaluación</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={responsabilidad.noExpuso}
                    onChange={(e) => setResponsabilidad({ ...responsabilidad, noExpuso: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>No expuso en disertación</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={responsabilidad.noTrajoMateriales}
                    onChange={(e) => setResponsabilidad({ ...responsabilidad, noTrajoMateriales: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>No trajo materiales</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={responsabilidad.danoMobiliario}
                    onChange={(e) => setResponsabilidad({ ...responsabilidad, danoMobiliario: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Dañó el inmobiliario</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={responsabilidad.trajoCelularSinPermiso}
                    onChange={(e) => setResponsabilidad({ ...responsabilidad, trajoCelularSinPermiso: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Trajo celular sin permiso</span>
                </label>
              </div>
            </div>

            {/* 3. Participación */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-blue-800 flex items-center space-x-1">
                <span>3. Participación</span>
              </h3>
              <div className="space-y-1.5 text-xs text-slate-700">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={participacion.noParticipa}
                    onChange={(e) => setParticipacion({ ...participacion, noParticipa: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>No participa en clases</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={participacion.noPrestaAtencion}
                    onChange={(e) => setParticipacion({ ...participacion, noPrestaAtencion: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>No presta atención en clases</span>
                </label>
              </div>
            </div>

            {/* 4. Conducta */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-purple-800 flex items-center space-x-1">
                <span>4. Conducta</span>
              </h3>
              <div className="space-y-1.5 text-xs text-slate-700">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={conducta.faltoRespetoDocente}
                    onChange={(e) => setConducta({ ...conducta, faltoRespetoDocente: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Faltó el respeto al docente</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={conducta.faltoRespetoCompaneros}
                    onChange={(e) => setConducta({ ...conducta, faltoRespetoCompaneros: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Faltó el respeto a compañeros</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={conducta.lenguajeInapropiado}
                    onChange={(e) => setConducta({ ...conducta, lenguajeInapropiado: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Utilizó lenguaje inapropiado</span>
                </label>
              </div>
            </div>
          </div>

          {/* Written Observations and Commitments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Detalle de la Observación y Hechos:
              </label>
              <textarea
                value={observacionDetalle}
                onChange={(e) => setObservacionDetalle(e.target.value)}
                placeholder="Describa puntualmente lo sucedido en aula o predio educativo..."
                rows={3}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Compromiso del Estudiante:
              </label>
              <textarea
                value={compromisoEstudiante}
                onChange={(e) => setCompromisoEstudiante(e.target.value)}
                placeholder="Compromiso asumido por el estudiante para subsanar la observación..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center space-x-2 text-xs font-bold text-rose-700 cursor-pointer">
              <input
                type="checkbox"
                checked={citacionPadres}
                onChange={(e) => setCitacionPadres(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span>Requiere Citación Formal a Padres de Familia</span>
            </label>

            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Guardar en Kardex</span>
            </button>
          </div>
        </form>
      )}

      {/* Historical Kardex Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
            Historial de Incidencias en Kardex - {selectedStudent.nombreCompleto}
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {selectedStudent.entries.length} registro(s)
          </span>
        </div>

        {selectedStudent.entries.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            El estudiante no registra faltas ni observaciones disciplinarias. Su conducta es intachable.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-2.5 px-3 w-28">Fecha</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Aspectos Observados</th>
                  <th className="py-2.5 px-3 min-w-[240px]">Detalle y Compromiso</th>
                  <th className="py-2.5 px-3 w-28 text-center">Citación</th>
                  <th className="py-2.5 px-3 min-w-[150px]">Firma / Docente</th>
                  {(isMaestro || isSuperAdmin) && (
                    <th className="py-2.5 px-3 text-center w-16">Acción</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {selectedStudent.entries.map((ent) => {
                  const markedAspects: string[] = [];
                  if (ent.asistencia.faltaConLicencia) markedAspects.push('Falta c/licencia');
                  if (ent.asistencia.faltaSinLicencia) markedAspects.push('Falta s/licencia');
                  if (ent.asistencia.fueraDeHorario) markedAspects.push('Atraso');
                  if (ent.asistencia.abandonoClase) markedAspects.push('Abandono clase');
                  if (ent.responsabilidad.noPresentoDeber) markedAspects.push('Sin tarea/deber');
                  if (ent.responsabilidad.noDioEvaluacion) markedAspects.push('No dio examen');
                  if (ent.responsabilidad.noExpuso) markedAspects.push('No expuso');
                  if (ent.responsabilidad.noTrajoMateriales) markedAspects.push('Sin materiales');
                  if (ent.responsabilidad.danoMobiliario) markedAspects.push('Dañó mobiliario');
                  if (ent.responsabilidad.trajoCelularSinPermiso) markedAspects.push('Celular sin permiso');
                  if (ent.participacion.noParticipa) markedAspects.push('No participa');
                  if (ent.participacion.noPrestaAtencion) markedAspects.push('Desatención');
                  if (ent.conducta.faltoRespetoDocente) markedAspects.push('Falta respeto docente');
                  if (ent.conducta.faltoRespetoCompaneros) markedAspects.push('Falta respeto pares');
                  if (ent.conducta.lenguajeInapropiado) markedAspects.push('Lenguaje inadecuado');

                  return (
                    <tr key={ent.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {ent.fecha}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {markedAspects.map((aspect, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-[10px] font-semibold"
                            >
                              {aspect}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-slate-800 font-medium">{ent.observacionDetalle}</p>
                        {ent.compromisoEstudiante && (
                          <p className="text-indigo-700 text-[11px] mt-1 italic">
                            Compromiso: "{ent.compromisoEstudiante}"
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {ent.citacionPadres ? (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                            EMITIDA
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">No</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {ent.firmaMaestro}
                      </td>
                      {(isMaestro || isSuperAdmin) && (
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleDeleteEntry(ent.id)}
                            title="Eliminar observación"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Parental Citation Modal (Printable) */}
      {showCitationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            {/* Official Header */}
            <div className="text-center border-b border-slate-200 pb-3">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                ESTADO PLURINACIONAL DE BOLIVIA - MINISTERIO DE EDUCACIÓN
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                CITACIÓN A PADRES DE FAMILIA / APODERADO LEGAL
              </h2>
              <div className="text-xs font-semibold text-emerald-800">
                UNIDAD EDUCATIVA EMBOROZU
              </div>
            </div>

            {/* Citation Body */}
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                Señor(a): <strong className="text-slate-900">{selectedStudent.tutorNombre}</strong> ({selectedStudent.parentesco})
              </p>
              <p>
                Presente.-
              </p>
              <p>
                Por medio de la presente, la Dirección y el cuerpo docente de la Unidad Educativa citan a su persona a una reunión de carácter urgente respecto al seguimiento conductual y pedagógico del estudiante:
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-medium text-slate-900">
                Estudiante: <strong>{selectedStudent.nombreCompleto}</strong> <br />
                Curso: <strong>{selectedStudent.curso}</strong> <br />
                Código RUDE: <strong className="font-mono">{selectedStudent.rude}</strong>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Fecha de Reunión:
                  </label>
                  <input
                    type="date"
                    value={citationDate}
                    onChange={(e) => setCitationDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Hora Convocada:
                  </label>
                  <input
                    type="time"
                    value={citationTime}
                    onChange={(e) => setCitationTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic pt-2">
                Su puntual asistencia es fundamental para coordinar acciones formativas en favor del estudiante, conforme a reglamentación del Subsistema de Educación Regular.
              </p>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center">
                <div className="border-t border-slate-400 pt-1 text-[11px] font-bold text-slate-700">
                  Prof. Carlos Mamani C. <br />
                  <span className="text-[10px] font-normal text-slate-500">Docente de Asignatura</span>
                </div>
                <div className="border-t border-slate-400 pt-1 text-[11px] font-bold text-slate-700">
                  Firma / Sello del Tutor <br />
                  <span className="text-[10px] font-normal text-slate-500">Notificado en fecha: ____/____/2026</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCitationModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Citación Oficial</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
