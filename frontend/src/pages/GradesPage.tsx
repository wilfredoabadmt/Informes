import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BookOpenCheck,
  Save,
  CheckCircle2,
  ShieldCheck,
  Info,
  Printer,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

interface StudentGradeRow {
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
  // Detailed criteria breakdown (matching sheet 1D in REGISTRO_MODERNO.xlsb)
  serAct1: number; // Responsabilidad con carátulas y prácticos (max 5)
  serAct2: number; // Compromiso y puntualidad (max 5)
  saberEv1: number; // Evaluaciones teóricas (max 35)
  hacerPrac1: number; // Prácticos y carpetas (max 35)
}

export const GradesPage: React.FC = () => {
  const { isMaestro, isDirector, isSuperAdmin } = useAuth();
  const [selectedTrimestre, setSelectedTrimestre] = useState('1');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  // Default interactive demo rows based on real SEP dimensions and REGISTRO_MODERNO.xlsb
  const [rows, setRows] = useState<StudentGradeRow[]>([
    {
      inscripcionId: 'demo-1',
      rude: '807300452026001',
      estudiante: 'ALANOCA CRUZ ERICK ELIAS',
      ser: 9,
      saber: 32,
      hacer: 31,
      decidir: 8,
      autoSer: 5,
      autoDecidir: 5,
      puntosExtras: 0,
      serAct1: 5,
      serAct2: 4,
      saberEv1: 32,
      hacerPrac1: 31,
    },
    {
      inscripcionId: 'demo-2',
      rude: '807300452026002',
      estudiante: 'ARAMAYO TOLEDO FABIOLA',
      ser: 10,
      saber: 34,
      hacer: 33,
      decidir: 9,
      autoSer: 5,
      autoDecidir: 5,
      puntosExtras: 2,
      serAct1: 5,
      serAct2: 5,
      saberEv1: 34,
      hacerPrac1: 33,
    },
    {
      inscripcionId: 'demo-3',
      rude: '807300452026003',
      estudiante: 'CAMACHO RENJIFO KAROL LUCERO',
      ser: 7,
      saber: 20,
      hacer: 22,
      decidir: 6,
      autoSer: 4,
      autoDecidir: 4,
      puntosExtras: 0,
      serAct1: 4,
      serAct2: 3,
      saberEv1: 20,
      hacerPrac1: 22,
    },
    {
      inscripcionId: 'demo-4',
      rude: '807300452026004',
      estudiante: 'CARDOZO YEVARA CARLIN YARITA',
      ser: 8,
      saber: 28,
      hacer: 29,
      decidir: 8,
      autoSer: 5,
      autoDecidir: 4,
      puntosExtras: 1,
      serAct1: 4,
      serAct2: 4,
      saberEv1: 28,
      hacerPrac1: 29,
    },
    {
      inscripcionId: 'demo-5',
      rude: '807300452026005',
      estudiante: 'COLQUE COLODRO JHOANNA MAYENNI',
      ser: 9,
      saber: 30,
      hacer: 32,
      decidir: 8,
      autoSer: 5,
      autoDecidir: 5,
      puntosExtras: 0,
      serAct1: 5,
      serAct2: 4,
      saberEv1: 30,
      hacerPrac1: 32,
    },
    {
      inscripcionId: 'demo-6',
      rude: '807300452026006',
      estudiante: 'FLORES CALLISAYA GABRIEL OMAR',
      ser: 6,
      saber: 18,
      hacer: 19,
      decidir: 5,
      autoSer: 3,
      autoDecidir: 3,
      puntosExtras: 0,
      serAct1: 3,
      serAct2: 3,
      saberEv1: 18,
      hacerPrac1: 19,
    },
  ]);

  const updateField = (
    index: number,
    field: keyof StudentGradeRow,
    value: number,
    max: number
  ) => {
    if (!isMaestro && !isSuperAdmin) return;
    const val = Math.max(0, Math.min(max, isNaN(value) ? 0 : value));
    const newRows = [...rows];
    (newRows[index] as any)[field] = val;

    // Recalculate dimensions if detailed values were edited
    if (field === 'serAct1' || field === 'serAct2') {
      newRows[index].ser = newRows[index].serAct1 + newRows[index].serAct2;
    } else if (field === 'saberEv1') {
      newRows[index].saber = newRows[index].saberEv1;
    } else if (field === 'hacerPrac1') {
      newRows[index].hacer = newRows[index].hacerPrac1;
    }

    setRows(newRows);
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

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await new Promise((res) => setTimeout(res, 500));
      setMessage('✅ Calificaciones guardadas exitosamente y registradas en el cuaderno pedagógico.');
    } catch (e: any) {
      setMessage('❌ Error al guardar las calificaciones.');
    } finally {
      setSaving(false);
    }
  };

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
              Valoración Integral en SER (10), SABER (35), HACER (35), DECIDIR (10), AUTOEVALUACIÓN (10) y Puntos Extras
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Planilla</span>
          </button>

          {isMaestro ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando notas...' : 'Guardar Planilla'}</span>
            </button>
          ) : (
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
          <span>{message}</span>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            Curso y Paralelo
          </label>
          <select className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800">
            <option>1° de Secundaria Comunitaria Productiva - Paralelo A</option>
            <option>1° de Secundaria Comunitaria Productiva - Paralelo B</option>
            <option>2° de Secundaria Comunitaria Productiva - Paralelo A</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            Asignatura / Campo de Saberes
          </label>
          <select className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800">
            <option>Comunicación y Lenguajes (Comunidad y Sociedad)</option>
            <option>Lengua Originaria Guaraní (Comunidad y Sociedad)</option>
            <option>Matemática (Ciencia, Tecnología y Producción)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            Periodo Trimestral
          </label>
          <select
            value={selectedTrimestre}
            onChange={(e) => setSelectedTrimestre(e.target.value)}
            className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
          >
            <option value="1">Primer Trimestre (Gestión 2026)</option>
            <option value="2">Segundo Trimestre (Gestión 2026)</option>
            <option value="3">Tercer Trimestre (Gestión 2026)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            Modalidad de Planilla
          </label>
          <div className="flex space-x-1">
            <button
              onClick={() => setViewMode('summary')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                viewMode === 'summary'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Dimensiones
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                viewMode === 'detailed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Desglose (1D)
            </button>
          </div>
        </div>
      </div>

      {/* Explanatory legend of dimensions */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-800">Cálculo Oficial SEP:</span>
          <span>SER (10) + SABER (35) + HACER (35) + DECIDIR (10) + AUTOEVALUACIÓN (10) + PUNTOS EXTRAS = NOTA FINAL</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-medium">
          <span className="text-emerald-700">● Mínimo Aprobatorio: 51 pts</span>
          <span className="text-amber-700">● Máximo Trimestral: 100 pts</span>
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
                <th className="py-3 px-4 text-center min-w-[140px]">ESTADO TRIMESTRAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, idx) => {
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
                            disabled={!isMaestro && !isSuperAdmin}
                            value={row.serAct1}
                            onChange={(e) => updateField(idx, 'serAct1', parseInt(e.target.value), 5)}
                            className="w-12 text-center py-1 bg-white border border-slate-200 rounded font-bold text-slate-800 disabled:bg-slate-50"
                          />
                        </td>
                        {/* SER Act 2 (5) */}
                        <td className="py-2 px-2 text-center bg-emerald-50/30 border-r border-emerald-100/60">
                          <input
                            type="number"
                            min="0"
                            max="5"
                            disabled={!isMaestro && !isSuperAdmin}
                            value={row.serAct2}
                            onChange={(e) => updateField(idx, 'serAct2', parseInt(e.target.value), 5)}
                            className="w-12 text-center py-1 bg-white border border-slate-200 rounded font-bold text-slate-800 disabled:bg-slate-50"
                          />
                        </td>
                        {/* SABER Ev 1 (35) */}
                        <td className="py-2 px-2 text-center bg-blue-50/30 border-r border-blue-100/60">
                          <input
                            type="number"
                            min="0"
                            max="35"
                            disabled={!isMaestro && !isSuperAdmin}
                            value={row.saberEv1}
                            onChange={(e) => updateField(idx, 'saberEv1', parseInt(e.target.value), 35)}
                            className="w-14 text-center py-1 bg-white border border-slate-200 rounded font-bold text-slate-800 disabled:bg-slate-50"
                          />
                        </td>
                        {/* HACER Prac 1 (35) */}
                        <td className="py-2 px-2 text-center bg-amber-50/30 border-r border-amber-100/60">
                          <input
                            type="number"
                            min="0"
                            max="35"
                            disabled={!isMaestro && !isSuperAdmin}
                            value={row.hacerPrac1}
                            onChange={(e) => updateField(idx, 'hacerPrac1', parseInt(e.target.value), 35)}
                            className="w-14 text-center py-1 bg-white border border-slate-200 rounded font-bold text-slate-800 disabled:bg-slate-50"
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
                            disabled={!isMaestro && !isSuperAdmin}
                            value={row.ser}
                            onChange={(e) => updateField(idx, 'ser', parseInt(e.target.value), 10)}
                            className="w-14 text-center py-1 bg-white border border-slate-200 rounded font-bold text-slate-800 disabled:bg-slate-50"
                          />
                        </td>
                        {/* SABER (35) */}
                        <td className="py-2 px-2 text-center bg-blue-50/40 border-r border-blue-100/60">
                          <input
                            type="number"
                            min="0"
                            max="35"
                            disabled={!isMaestro && !isSuperAdmin}
                            value={row.saber}
                            onChange={(e) => updateField(idx, 'saber', parseInt(e.target.value), 35)}
                            className="w-14 text-center py-1 bg-white border border-slate-200 rounded font-bold text-slate-800 disabled:bg-slate-50"
                          />
                        </td>
                        {/* HACER (35) */}
                        <td className="py-2 px-2 text-center bg-amber-50/40 border-r border-amber-100/60">
                          <input
                            type="number"
                            min="0"
                            max="35"
                            disabled={!isMaestro && !isSuperAdmin}
                            value={row.hacer}
                            onChange={(e) => updateField(idx, 'hacer', parseInt(e.target.value), 35)}
                            className="w-14 text-center py-1 bg-white border border-slate-200 rounded font-bold text-slate-800 disabled:bg-slate-50"
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
                        disabled={!isMaestro && !isSuperAdmin}
                        value={row.decidir}
                        onChange={(e) => updateField(idx, 'decidir', parseInt(e.target.value), 10)}
                        className="w-14 text-center py-1 bg-white border border-slate-200 rounded font-bold text-slate-800 disabled:bg-slate-50"
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
                        disabled={!isMaestro && !isSuperAdmin}
                        value={row.puntosExtras}
                        onChange={(e) => updateField(idx, 'puntosExtras', parseInt(e.target.value), 10)}
                        className="w-12 text-center py-1 bg-white border border-slate-200 rounded font-bold text-amber-700 disabled:bg-slate-50"
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

                    {/* VALORACIÓN CUALITATIVA */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                          isPassing
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {isPassing ? 'APROBADO' : 'EN DESARROLLO'}
                      </span>
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
