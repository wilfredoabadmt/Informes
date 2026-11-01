import React, { useState } from 'react';

export const AcademicPage: React.FC = () => {
  const [tab, setTab] = useState<'cursos' | 'materias' | 'asignaciones'>('cursos');

  const cursos = [
    { nivel: 'SECUNDARIA', grado: 1, nombre: '1° de Secundaria Comunitaria Productiva', paralelos: ['A (Mañana)', 'B (Tarde)'] },
    { nivel: 'SECUNDARIA', grado: 2, nombre: '2° de Secundaria Comunitaria Productiva', paralelos: ['A (Mañana)'] },
    { nivel: 'PRIMARIA', grado: 1, nombre: '1° de Primaria Comunitaria Vocacional', paralelos: ['A (Mañana)'] },
    { nivel: 'PRIMARIA', grado: 2, nombre: '2° de Primaria Comunitaria Vocacional', paralelos: ['A (Mañana)'] },
  ];

  const materias = [
    { codigo: 'MAT-SEC-1', nombre: 'Matemática', campo: 'CIENCIA_TECNOLOGIA_PRODUCCION', nivel: 'SECUNDARIA' },
    { codigo: 'LEN-SEC-1', nombre: 'Lengua Castellana y Originaria', campo: 'COMUNIDAD_Y_SOCIEDAD', nivel: 'SECUNDARIA' },
    { codigo: 'BIO-SEC-1', nombre: 'Ciencias Naturales: Biología - Geografía', campo: 'VIDA_TIERRA_TERRITORIO', nivel: 'SECUNDARIA' },
    { codigo: 'VAL-SEC-1', nombre: 'Valores, Espiritualidades y Religiones', campo: 'COSMOS_Y_PENSAMIENTO', nivel: 'SECUNDARIA' },
  ];

  const asignaciones = [
    { maestro: 'Lic. Patricia Mamani', materia: 'Matemática (MAT-SEC-1)', paralelo: '1° de Secundaria - A', horas: 16 },
    { maestro: 'Prof. Carlos Rodriguez', materia: 'Comunidad y Sociedad Integrada', paralelo: '1° de Primaria - A', horas: 24 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Estructura Académica & Asignaciones</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de Cursos Oficiales, Materias del Currículo Base y Asignación de Maestros
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setTab('cursos')}
          className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 ${
            tab === 'cursos'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Cursos y Paralelos
        </button>
        <button
          onClick={() => setTab('materias')}
          className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 ${
            tab === 'materias'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Materias (Campos de Saberes)
        </button>
        <button
          onClick={() => setTab('asignaciones')}
          className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 ${
            tab === 'asignaciones'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Asignaciones Docentes
        </button>
      </div>

      {/* Tab 1: Cursos */}
      {tab === 'cursos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cursos.map((c, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {c.nivel}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1.5">{c.nombre}</h3>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Paralelos Habilitados:</div>
                <div className="flex flex-wrap gap-1.5">
                  {c.paralelos.map((p, idx) => (
                    <span key={idx} className="px-2 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold">
                      Paralelo {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Materias */}
      {tab === 'materias' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Nombre de la Asignatura</th>
                <th className="py-3 px-4">Campo de Saberes y Conocimientos</th>
                <th className="py-3 px-4">Nivel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materias.map((m) => (
                <tr key={m.codigo} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">{m.codigo}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{m.nombre}</td>
                  <td className="py-3 px-4 text-slate-600">{m.campo}</td>
                  <td className="py-3 px-4 text-slate-500">{m.nivel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Asignaciones */}
      {tab === 'asignaciones' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Docente Asignado</th>
                <th className="py-3 px-4">Materia / Asignatura</th>
                <th className="py-3 px-4">Curso y Paralelo</th>
                <th className="py-3 px-4 text-center">Carga Horaria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {asignaciones.map((a, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-800">{a.maestro}</td>
                  <td className="py-3 px-4 text-slate-700">{a.materia}</td>
                  <td className="py-3 px-4 text-emerald-700 font-medium">{a.paralelo}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">{a.horas} hrs/mes</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
