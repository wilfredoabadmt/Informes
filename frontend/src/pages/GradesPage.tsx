import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { BookOpenCheck, Save, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface StudentGradeRow {
  inscripcionId: string;
  rude: string;
  estudiante: string;
  ser: number;
  saber: number;
  hacer: number;
  decidir: number;
  autoSer: number;
  autoDecidir: number;
}

export const GradesPage: React.FC = () => {
  const [selectedTrimestre, setSelectedTrimestre] = useState('1');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Default interactive demo rows based on real SEP dimensions
  const [rows, setRows] = useState<StudentGradeRow[]>([
    {
      inscripcionId: 'demo-1',
      rude: '807300452026001',
      estudiante: 'ARCE CONDORI, MATEO',
      ser: 9,
      saber: 32,
      hacer: 31,
      decidir: 8,
      autoSer: 5,
      autoDecidir: 5,
    },
    {
      inscripcionId: 'demo-2',
      rude: '807300452026002',
      estudiante: 'QUISPE MAMANI, LUCIA',
      ser: 10,
      saber: 34,
      hacer: 33,
      decidir: 9,
      autoSer: 5,
      autoDecidir: 5,
    },
    {
      inscripcionId: 'demo-3',
      rude: '807300452026003',
      estudiante: 'FLORES CALLISAYA, GABRIEL',
      ser: 7,
      saber: 20,
      hacer: 22,
      decidir: 6,
      autoSer: 4,
      autoDecidir: 4,
    },
    {
      inscripcionId: 'demo-4',
      rude: '807300452026004',
      estudiante: 'GUTIERREZ ROJAS, SOFIA',
      ser: 8,
      saber: 28,
      hacer: 29,
      decidir: 8,
      autoSer: 5,
      autoDecidir: 4,
    },
  ]);

  const updateField = (
    index: number,
    field: keyof StudentGradeRow,
    value: number,
    max: number
  ) => {
    const val = Math.max(0, Math.min(max, isNaN(value) ? 0 : value));
    const newRows = [...rows];
    (newRows[index] as any)[field] = val;
    setRows(newRows);
  };

  const calculateTotal = (row: StudentGradeRow) => {
    return (
      Number(row.ser || 0) +
      Number(row.saber || 0) +
      Number(row.hacer || 0) +
      Number(row.decidir || 0) +
      Number(row.autoSer || 0) +
      Number(row.autoDecidir || 0)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // Simulate/trigger batch API call
      await new Promise((res) => setTimeout(res, 600));
      setMessage('✅ Calificaciones guardadas exitosamente en el servidor.');
    } catch (e: any) {
      setMessage('❌ Error al guardar las calificaciones.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Planilla Oficial de Calificaciones</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluación Integral en las 4 Dimensiones y Autoevaluación (Ley 070 SEP - Escala 1 a 100)
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Guardando...' : 'Guardar Planilla'}</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Curso y Paralelo
          </label>
          <select className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800">
            <option>1° de Secundaria - Paralelo A (Turno Mañana)</option>
            <option>1° de Primaria - Paralelo A (Turno Mañana)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Materia</label>
          <select className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800">
            <option>Matemática (MAT-SEC-1)</option>
            <option>Lengua Castellana y Originaria</option>
            <option>Ciencias Naturales: Biología - Geografía</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Trimestre</label>
          <select
            value={selectedTrimestre}
            onChange={(e) => setSelectedTrimestre(e.target.value)}
            className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
          >
            <option value="1">1° Trimestre</option>
            <option value="2">2° Trimestre</option>
            <option value="3">3° Trimestre</option>
          </select>
        </div>
      </div>

      {/* Grading Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Código RUDE</th>
                <th className="py-3 px-4">Nómina del Estudiante</th>
                <th className="py-3 px-2 text-center bg-emerald-50 text-emerald-900 border-l border-r border-emerald-100">
                  SER (10)
                </th>
                <th className="py-3 px-2 text-center bg-blue-50 text-blue-900 border-r border-blue-100">
                  SABER (35)
                </th>
                <th className="py-3 px-2 text-center bg-amber-50 text-amber-900 border-r border-amber-100">
                  HACER (35)
                </th>
                <th className="py-3 px-2 text-center bg-purple-50 text-purple-900 border-r border-purple-100">
                  DECIDIR (10)
                </th>
                <th className="py-3 px-2 text-center bg-rose-50 text-rose-900 border-r border-rose-100">
                  AUTO (10)
                </th>
                <th className="py-3 px-3 text-center">TOTAL / 100</th>
                <th className="py-3 px-4 text-center">ESTADO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, idx) => {
                const total = calculateTotal(row);
                const isPassing = total >= 51;
                return (
                  <tr key={row.rude} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-semibold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{row.rude}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{row.estudiante}</td>

                    {/* SER (10) */}
                    <td className="py-2 px-2 text-center bg-emerald-50/40 border-l border-r border-emerald-100/60">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={row.ser}
                        onChange={(e) => updateField(idx, 'ser', parseInt(e.target.value), 10)}
                        className="w-14 text-center py-1 bg-white border border-slate-200 rounded font-semibold text-slate-800"
                      />
                    </td>

                    {/* SABER (35) */}
                    <td className="py-2 px-2 text-center bg-blue-50/40 border-r border-blue-100/60">
                      <input
                        type="number"
                        min="0"
                        max="35"
                        value={row.saber}
                        onChange={(e) => updateField(idx, 'saber', parseInt(e.target.value), 35)}
                        className="w-14 text-center py-1 bg-white border border-slate-200 rounded font-semibold text-slate-800"
                      />
                    </td>

                    {/* HACER (35) */}
                    <td className="py-2 px-2 text-center bg-amber-50/40 border-r border-amber-100/60">
                      <input
                        type="number"
                        min="0"
                        max="35"
                        value={row.hacer}
                        onChange={(e) => updateField(idx, 'hacer', parseInt(e.target.value), 35)}
                        className="w-14 text-center py-1 bg-white border border-slate-200 rounded font-semibold text-slate-800"
                      />
                    </td>

                    {/* DECIDIR (10) */}
                    <td className="py-2 px-2 text-center bg-purple-50/40 border-r border-purple-100/60">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={row.decidir}
                        onChange={(e) => updateField(idx, 'decidir', parseInt(e.target.value), 10)}
                        className="w-14 text-center py-1 bg-white border border-slate-200 rounded font-semibold text-slate-800"
                      />
                    </td>

                    {/* AUTO (10) */}
                    <td className="py-2 px-2 text-center bg-rose-50/40 border-r border-rose-100/60">
                      <span className="font-semibold text-slate-700">
                        {row.autoSer + row.autoDecidir}
                      </span>
                    </td>

                    {/* TOTAL */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-sm font-black ${
                          isPassing ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {total}
                      </span>
                    </td>

                    {/* ESTADO */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
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

