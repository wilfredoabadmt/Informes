import React, { useState } from 'react';
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
} from 'lucide-react';

interface ParaleloItem {
  id: string;
  cursoNombre: string;
  nivel: string;
  letra: string;
  turno: string;
  cupo: number;
  inscritos: number;
}

interface MateriaItem {
  id: string;
  codigo: string;
  nombre: string;
  campo: string;
  nivel: string;
  esTroncal: boolean;
}

interface AsignacionItem {
  id: string;
  maestroNombre: string;
  cursoParalelo: string;
  materiaNombre: string;
  horasSemanales: number;
  esTutor: boolean;
}

export const AcademicPage: React.FC = () => {
  const { isMaestro, isDirector, isSuperAdmin } = useAuth();
  const [tab, setTab] = useState<'cursos' | 'materias' | 'asignaciones'>('cursos');
  const [feedback, setFeedback] = useState<string | null>(null);

  // 1. Cursos y Paralelos State
  const [paralelos, setParalelos] = useState<ParaleloItem[]>([
    {
      id: 'p-1',
      cursoNombre: '1° de Secundaria Comunitaria Productiva',
      nivel: 'SECUNDARIA',
      letra: 'A',
      turno: 'Mañana',
      cupo: 35,
      inscritos: 32,
    },
    {
      id: 'p-2',
      cursoNombre: '1° de Secundaria Comunitaria Productiva',
      nivel: 'SECUNDARIA',
      letra: 'B',
      turno: 'Tarde',
      cupo: 35,
      inscritos: 28,
    },
    {
      id: 'p-3',
      cursoNombre: '2° de Secundaria Comunitaria Productiva',
      nivel: 'SECUNDARIA',
      letra: 'A',
      turno: 'Mañana',
      cupo: 35,
      inscritos: 30,
    },
    {
      id: 'p-4',
      cursoNombre: '1° de Primaria Comunitaria Vocacional',
      nivel: 'PRIMARIA',
      letra: 'A',
      turno: 'Mañana',
      cupo: 30,
      inscritos: 29,
    },
  ]);

  // 2. Materias State
  const [materias, setMaterias] = useState<MateriaItem[]>([
    {
      id: 'm-1',
      codigo: 'LEN-SEC-1',
      nombre: 'Comunicación y Lenguajes',
      campo: 'COMUNIDAD_Y_SOCIEDAD',
      nivel: 'SECUNDARIA',
      esTroncal: true,
    },
    {
      id: 'm-2',
      codigo: 'MAT-SEC-1',
      nombre: 'Matemática y Lógica',
      campo: 'CIENCIA_TECNOLOGIA_PRODUCCION',
      nivel: 'SECUNDARIA',
      esTroncal: true,
    },
    {
      id: 'm-3',
      codigo: 'BIO-SEC-1',
      nombre: 'Ciencias Naturales: Biología - Geografía',
      campo: 'VIDA_TIERRA_TERRITORIO',
      nivel: 'SECUNDARIA',
      esTroncal: true,
    },
    {
      id: 'm-4',
      codigo: 'SOC-SEC-1',
      nombre: 'Ciencias Sociales e Historia',
      campo: 'COMUNIDAD_Y_SOCIEDAD',
      nivel: 'SECUNDARIA',
      esTroncal: true,
    },
    {
      id: 'm-5',
      codigo: 'VAL-SEC-1',
      nombre: 'Valores, Espiritualidades y Religiones',
      campo: 'COSMOS_Y_PENSAMIENTO',
      nivel: 'SECUNDARIA',
      esTroncal: true,
    },
  ]);

  // 3. Asignaciones Docentes State
  const [asignaciones, setAsignaciones] = useState<AsignacionItem[]>([
    {
      id: 'as-1',
      maestroNombre: 'Prof. Carlos Mamani Choque',
      cursoParalelo: '1° de Secundaria - Paralelo A',
      materiaNombre: 'Comunicación y Lenguajes',
      horasSemanales: 6,
      esTutor: true,
    },
    {
      id: 'as-2',
      maestroNombre: 'Prof. Carlos Mamani Choque',
      cursoParalelo: '1° de Secundaria - Paralelo B',
      materiaNombre: 'Comunicación y Lenguajes',
      horasSemanales: 6,
      esTutor: false,
    },
    {
      id: 'as-3',
      maestroNombre: 'Prof. Alberto Simón Mercado',
      cursoParalelo: '2° de Secundaria - Paralelo A',
      materiaNombre: 'Matemática y Lógica',
      horasSemanales: 6,
      esTutor: false,
    },
  ]);

  // Modals for CRUD
  const [showParaleloModal, setShowParaleloModal] = useState(false);
  const [newParalelo, setNewParalelo] = useState({
    cursoNombre: '1° de Secundaria Comunitaria Productiva',
    nivel: 'SECUNDARIA',
    letra: 'C',
    turno: 'Mañana',
    cupo: 35,
  });

  const [showMateriaModal, setShowMateriaModal] = useState(false);
  const [newMateria, setNewMateria] = useState({
    codigo: '',
    nombre: '',
    campo: 'COMUNIDAD_Y_SOCIEDAD',
    nivel: 'SECUNDARIA',
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

  // Handlers for Paralelos CRUD
  const handleAddParalelo = (e: React.FormEvent) => {
    e.preventDefault();
    const item: ParaleloItem = {
      id: `p-${Date.now()}`,
      ...newParalelo,
      inscritos: 0,
    };
    setParalelos([...paralelos, item]);
    setShowParaleloModal(false);
    triggerFeedback('¡Paralelo creado exitosamente en la estructura académica!');
  };

  const handleDeleteParalelo = (id: string) => {
    setParalelos(paralelos.filter((p) => p.id !== id));
    triggerFeedback('Paralelo eliminado de la gestión escolar.');
  };

  // Handlers for Materias CRUD
  const handleAddMateria = (e: React.FormEvent) => {
    e.preventDefault();
    const item: MateriaItem = {
      id: `m-${Date.now()}`,
      ...newMateria,
    };
    setMaterias([...materias, item]);
    setShowMateriaModal(false);
    triggerFeedback('¡Materia curricular registrada en el plan de estudios!');
  };

  const handleDeleteMateria = (id: string) => {
    setMaterias(materias.filter((m) => m.id !== id));
    triggerFeedback('Materia dada de baja de la malla curricular.');
  };

  // Handlers for Asignaciones CRUD
  const handleAddAsignacion = (e: React.FormEvent) => {
    e.preventDefault();
    const item: AsignacionItem = {
      id: `as-${Date.now()}`,
      ...newAsignacion,
    };
    setAsignaciones([...asignaciones, item]);
    setShowAsignacionModal(false);
    triggerFeedback('¡Asignación académica vinculada al docente exitosamente!');
  };

  const handleDeleteAsignacion = (id: string) => {
    setAsignaciones(asignaciones.filter((a) => a.id !== id));
    triggerFeedback('Asignación docente desvinculada.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Estructura Curricular y Asignaciones Académicas
            </h1>
            <p className="text-xs text-slate-500">
              Administración de grados, paralelos, campos de saberes y carga horaria docente (Ley 070)
            </p>
          </div>
        </div>

        {/* Global Action Button per Tab */}
        {!isMaestro && (
          <div>
            {tab === 'cursos' && (
              <button
                onClick={() => setShowParaleloModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nuevo Paralelo</span>
              </button>
            )}
            {tab === 'materias' && (
              <button
                onClick={() => setShowMateriaModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nueva Materia</span>
              </button>
            )}
            {tab === 'asignaciones' && (
              <button
                onClick={() => setShowAsignacionModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Asignar Maestro</span>
              </button>
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-8 text-xs font-bold text-slate-600">
        <button
          onClick={() => setTab('cursos')}
          className={`pb-3 border-b-2 flex items-center space-x-2 cursor-pointer transition ${
            tab === 'cursos'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Cursos & Paralelos ({paralelos.length})</span>
        </button>

        <button
          onClick={() => setTab('materias')}
          className={`pb-3 border-b-2 flex items-center space-x-2 cursor-pointer transition ${
            tab === 'materias'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Malla Curricular ({materias.length})</span>
        </button>

        <button
          onClick={() => setTab('asignaciones')}
          className={`pb-3 border-b-2 flex items-center space-x-2 cursor-pointer transition ${
            tab === 'asignaciones'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Asignaciones Docentes ({asignaciones.length})</span>
        </button>
      </div>

      {/* TAB 1: CURSOS Y PARALELOS */}
      {tab === 'cursos' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Catálogo de Paralelos Habilitados
            </h2>
            <span className="text-xs text-slate-500">Gestión Escolar 2026</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3 px-4">Curso / Grado Oficial</th>
                  <th className="py-3 px-3 text-center">Nivel</th>
                  <th className="py-3 px-3 text-center">Paralelo</th>
                  <th className="py-3 px-3 text-center">Turno</th>
                  <th className="py-3 px-3 text-center">Cupo Máximo</th>
                  <th className="py-3 px-3 text-center">Estudiantes Inscritos</th>
                  {!isMaestro && <th className="py-3 px-3 text-center w-24">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paralelos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.cursoNombre}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {formatNivelEducativo(p.nivel)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-700">"{p.letra}"</td>
                    <td className="py-3 px-3 text-center text-slate-600">{p.turno}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">{p.cupo}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MALLA CURRICULAR */}
      {tab === 'materias' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Malla Curricular por Campos de Saberes
            </h2>
            <span className="text-xs text-slate-500">Currículo Base del SEP</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3 px-3 w-28">Código</th>
                  <th className="py-3 px-4 min-w-[200px]">Asignatura / Área</th>
                  <th className="py-3 px-4 min-w-[220px]">Campo de Saberes y Conocimientos</th>
                  <th className="py-3 px-3 text-center">Nivel</th>
                  <th className="py-3 px-3 text-center">Tipo</th>
                  {!isMaestro && <th className="py-3 px-3 text-center w-24">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materias.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-600">{m.codigo}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{m.nombre}</td>
                    <td className="py-3 px-4 text-slate-700">{formatCampoSaberes(m.campo)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {formatNivelEducativo(m.nivel)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-[10px]">
                        {m.esTroncal ? 'Área Troncal' : 'Complementaria'}
                      </span>
                    </td>
                    {!isMaestro && (
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleDeleteMateria(m.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                          title="Eliminar Materia"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ASIGNACIONES DOCENTES */}
      {tab === 'asignaciones' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Distribución de Asignaciones y Carga Horaria
            </h2>
            <span className="text-xs text-slate-500">Gestión Escolar 2026</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3 px-4">Maestro / Docente Responsable</th>
                  <th className="py-3 px-4">Curso y Paralelo</th>
                  <th className="py-3 px-4">Asignatura</th>
                  <th className="py-3 px-3 text-center">Carga Horaria</th>
                  <th className="py-3 px-3 text-center">Tutoría</th>
                  {!isMaestro && <th className="py-3 px-3 text-center w-24">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {asignaciones.map((as) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: NUEVO PARALELO */}
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
                  <option value="1° de Primaria Comunitaria Vocacional">1° de Primaria Comunitaria Vocacional</option>
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
                    placeholder="A, B, C..."
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
                <label className="font-bold text-slate-700 block mb-1">Cupo Máximo de Estudiantes:</label>
                <input
                  type="number"
                  min="1"
                  max="45"
                  value={newParalelo.cupo}
                  onChange={(e) => setNewParalelo({ ...newParalelo, cupo: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
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

      {/* MODAL 2: NUEVA MATERIA */}
      {showMateriaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase">Añadir Asignatura a la Malla</h2>
              <button onClick={() => setShowMateriaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddMateria} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Código de Materia:</label>
                  <input
                    type="text"
                    required
                    value={newMateria.codigo}
                    onChange={(e) => setNewMateria({ ...newMateria, codigo: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono uppercase"
                    placeholder="ej. FIS-SEC-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nivel Educativo:</label>
                  <select
                    value={newMateria.nivel}
                    onChange={(e) => setNewMateria({ ...newMateria, nivel: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  >
                    <option value="SECUNDARIA">Secundaria</option>
                    <option value="PRIMARIA">Primaria</option>
                    <option value="INICIAL">Inicial</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre Oficial:</label>
                <input
                  type="text"
                  required
                  value={newMateria.nombre}
                  onChange={(e) => setNewMateria({ ...newMateria, nombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  placeholder="ej. Física y Química"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Campo de Saberes:</label>
                <select
                  value={newMateria.campo}
                  onChange={(e) => setNewMateria({ ...newMateria, campo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                >
                  <option value="CIENCIA_TECNOLOGIA_PRODUCCION">Ciencia, Tecnología y Producción</option>
                  <option value="COMUNIDAD_Y_SOCIEDAD">Comunidad y Sociedad</option>
                  <option value="VIDA_TIERRA_TERRITORIO">Vida, Tierra y Territorio</option>
                  <option value="COSMOS_Y_PENSAMIENTO">Cosmos y Pensamiento</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMateriaModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Registrar Asignatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ASIGNAR MAESTRO */}
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
                  <option value="Prof. Carlos Mamani Choque">Prof. Carlos Mamani Choque (RDA: 6849302)</option>
                  <option value="Prof. Alberto Simón Mercado">Prof. Alberto Simón Mercado (RDA: 5748291)</option>
                  <option value="Prof. Elena Flores Mamani">Prof. Elena Flores Mamani (RDA: 7214589)</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Curso y Paralelo:</label>
                <select
                  value={newAsignacion.cursoParalelo}
                  onChange={(e) => setNewAsignacion({ ...newAsignacion, cursoParalelo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                >
                  <option value="1° de Secundaria - Paralelo A">1° de Secundaria - Paralelo A</option>
                  <option value="1° de Secundaria - Paralelo B">1° de Secundaria - Paralelo B</option>
                  <option value="2° de Secundaria - Paralelo A">2° de Secundaria - Paralelo A</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Asignatura:</label>
                <select
                  value={newAsignacion.materiaNombre}
                  onChange={(e) => setNewAsignacion({ ...newAsignacion, materiaNombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                >
                  <option value="Comunicación y Lenguajes">Comunicación y Lenguajes</option>
                  <option value="Matemática y Lógica">Matemática y Lógica</option>
                  <option value="Ciencias Naturales">Ciencias Naturales</option>
                  <option value="Ciencias Sociales">Ciencias Sociales</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Horas Semanales:</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
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
    </div>
  );
};
