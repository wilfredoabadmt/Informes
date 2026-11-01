import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
} from 'lucide-react';
import { exportGradesToExcel, exportGradesToPdf } from '../utils/exportHelpers';
import type { GradeExportRow } from '../utils/exportHelpers';

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
function generateInitialRows(cursoId: string, subjectId: string, trim: string): StudentGradeRow[] {
  const students = ESTUDIANTES_POR_CURSO[cursoId] || ESTUDIANTES_POR_CURSO.SEC_1A;
  const trimNum = Number(trim) || 1;

  // Semilla según combinación
  const seed = cursoId.charCodeAt(0) + subjectId.charCodeAt(0) + trimNum * 7;

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
  const { isMaestro, isDirector, isSuperAdmin } = useAuth();

  // Rol Maestro: Solo ve los cursos y materias que tiene asignados en su carga horaria
  const isMaestroOnly = isMaestro && !isDirector && !isSuperAdmin;
  const cursosVisibles = isMaestroOnly
    ? CURSOS_DISPONIBLES.filter((c) => ['SEC_1A', 'SEC_1B', 'SEC_2A'].includes(c.id))
    : CURSOS_DISPONIBLES;

  const asignaturasVisibles = isMaestroOnly
    ? ASIGNATURAS_DISPONIBLES.filter((a) => ['LEN', 'MAT'].includes(a.id))
    : ASIGNATURAS_DISPONIBLES;

  // Selectores de Navegación Dinámica
  const [selectedCurso, setSelectedCurso] = useState('SEC_1A');
  const [selectedAsignatura, setSelectedAsignatura] = useState(isMaestroOnly ? 'LEN' : 'MAT');
  const [selectedTrimestre, setSelectedTrimestre] = useState('1');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  // Almacén reactivo de planillas por llave: curso_materia_trimestre
  const [gradesStore, setGradesStore] = useState<Record<string, StudentGradeRow[]>>({});
  const [rows, setRows] = useState<StudentGradeRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const currentKey = `${selectedCurso}_${selectedAsignatura}_${selectedTrimestre}`;

  // Carga o regenera las notas cuando cambia cualquier selector
  useEffect(() => {
    if (gradesStore[currentKey]) {
      setRows(gradesStore[currentKey]);
    } else {
      const generated = generateInitialRows(selectedCurso, selectedAsignatura, selectedTrimestre);
      setRows(generated);
      setGradesStore((prev) => ({ ...prev, [currentKey]: generated }));
    }
    setMessage(null);
  }, [selectedCurso, selectedAsignatura, selectedTrimestre]);

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

  const currentCursoObj = CURSOS_DISPONIBLES.find((c) => c.id === selectedCurso);
  const currentAsigObj = ASIGNATURAS_DISPONIBLES.find((a) => a.id === selectedAsignatura);
  const trimLabel =
    selectedTrimestre === '1'
      ? 'Primer Trimestre'
      : selectedTrimestre === '2'
      ? 'Segundo Trimestre'
      : 'Tercer Trimestre';

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // Guardar en store local
      setGradesStore((prev) => ({ ...prev, [currentKey]: rows }));
      await new Promise((res) => setTimeout(res, 400));
      setMessage(
        `✅ Planilla guardada exitosamente para ${currentCursoObj?.nombre} - ${currentAsigObj?.nombre} (${trimLabel} 2026).`
      );
    } catch (e: any) {
      setMessage('❌ Error al guardar las calificaciones.');
    } finally {
      setSaving(false);
    }
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
            <option value="1">Primer Trimestre (Gestión 2026)</option>
            <option value="2">Segundo Trimestre (Gestión 2026)</option>
            <option value="3">Tercer Trimestre (Gestión 2026)</option>
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

      {/* Explanatory legend of dimensions */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold text-slate-800">Cálculo Oficial SEP:</span>
          <span>SER (10) + SABER (35) + HACER (35) + DECIDIR (10) + AUTOEVALUACIÓN (10) + PUNTOS EXTRAS = NOTA FINAL</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-semibold">
          <span className="text-emerald-700">● Mínimo Aprobatorio: 51 pts</span>
          <span className="text-amber-700">● Máximo Trimestral: 100 pts</span>
          <span className="px-2 py-0.5 bg-slate-200 rounded text-slate-800 font-mono">
            {rows.length} estudiantes
          </span>
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
