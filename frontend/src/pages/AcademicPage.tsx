import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatNivelEducativo, formatCampoSaberes } from '../utils/formatters';
import { GraduationCap, BookOpen, Clock, Users } from 'lucide-react';

export const AcademicPage: React.FC = () => {
  const { isMaestro, isDirector, isSuperAdmin } = useAuth();
  const [tab, setTab] = useState<'cursos' | 'materias' | 'asignaciones'>('cursos');

  const cursos = [
    {
      nivel: 'SECUNDARIA',
      grado: 1,
      nombre: '1° de Secundaria Comunitaria Productiva',
      paralelos: [
        { letra: 'A', turno: 'Turno Mañana', cupo: 35, inscritos: 32 },
        { letra: 'B', turno: 'Turno Tarde', cupo: 35, inscritos: 28 },
      ],
    },
    {
      nivel: 'SECUNDARIA',
      grado: 2,
      nombre: '2° de Secundaria Comunitaria Productiva',
      paralelos: [
        { letra: 'A', turno: 'Turno Mañana', cupo: 35, inscritos: 30 },
      ],
    },
    {
      nivel: 'PRIMARIA',
      grado: 1,
      nombre: '1° de Primaria Comunitaria Vocacional',
      paralelos: [
        { letra: 'A', turno: 'Turno Mañana', cupo: 30, inscritos: 29 },
      ],
    },
    {
      nivel: 'PRIMARIA',
      grado: 2,
      nombre: '2° de Primaria Comunitaria Vocacional',
      paralelos: [
        { letra: 'A', turno: 'Turno Mañana', cupo: 30, inscritos: 27 },
      ],
    },
  ];

  const materias = [
    {
      codigo: 'MAT-SEC-1',
      nombre: 'Matemática',
      campo: 'CIENCIA_TECNOLOGIA_PRODUCCION',
      nivel: 'SECUNDARIA',
      esTroncal: true,
    },
    {
      codigo: 'LEN-SEC-1',
      nombre: 'Lengua Castellana y Originaria',
      campo: 'COMUNIDAD_Y_SOCIEDAD',
      nivel: 'SECUNDARIA',
      esTroncal: true,
    },
    {
      codigo: 'BIO-SEC-1',
      nombre: 'Ciencias Naturales: Biología - Geografía',
      campo: 'VIDA_TIERRA_TERRITORIO',
      nivel: 'SECUNDARIA',
      esTroncal: true,
    },
    {
      codigo: 'VAL-SEC-1',
      nombre: 'Valores, Espiritualidades y Religiones',
      campo: 'COSMOS_Y_PENSAMIENTO',
      nivel: 'SECUNDARIA',
      esTroncal: true,
    },
    {
      codigo: 'SOC-SEC-1',
      nombre: 'Ciencias Sociales',
      campo: 'COMUNIDAD_Y_SOCIEDAD',
      nivel: 'SECUNDARIA',
      esTroncal: true,
    },
    {
      codigo: 'ART-SEC-1',
      nombre: 'Artes Plásticas y Visuales',
      campo: 'COMUNIDAD_Y_SOCIEDAD',
      nivel: 'SECUNDARIA',
      esTroncal: false,
    },
  ];

  const asignaciones = [
    {
      maestro: 'Lic. Elena Flores Quispe (Directora)',
      materia: 'Gestión Institucional y Supervisión Pedagógica',
      paralelo: 'Toda la Unidad Educativa',
      horas: 48,
      estado: 'Activa / Vigente',
    },
    {
      maestro: 'Prof. Carlos Mamani Condori',
      materia: 'Matemática (MAT-SEC-1)',
      paralelo: '1° de Secundaria - Paralelo A',
      horas: 16,
      estado: 'Activa / Vigente',
    },
    {
      maestro: 'Prof. Carlos Mamani Condori',
      materia: 'Álgebra y Razonamiento Lógico',
      paralelo: '2° de Secundaria - Paralelo A',
      horas: 16,
      estado: 'Activa / Vigente',
    },
    {
      maestro: 'Lic. Patricia Mamani',
      materia: 'Comunidad y Sociedad Integrada',
      paralelo: '1° de Primaria - Paralelo A',
      horas: 24,
      estado: 'Activa / Vigente',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Estructura Académica & Currículo Oficial</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cursos, Paralelos por Turno, Áreas de Saberes (Ley 070) y Designación de Maestros
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setTab('cursos')}
          className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
            tab === 'cursos'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Cursos y Paralelos Habilitados
        </button>
        <button
          onClick={() => setTab('materias')}
          className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
            tab === 'materias'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Materias (Campos de Saberes y Conocimientos)
        </button>
        <button
          onClick={() => setTab('asignaciones')}
          className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
            tab === 'asignaciones'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Asignaciones Docentes (Carga Horaria)
        </button>
      </div>

      {/* Tab 1: Cursos */}
      {tab === 'cursos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cursos.map((c, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {formatNivelEducativo(c.nivel)}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-2">{c.nombre}</h3>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 mb-2">Paralelos Disponibles:</div>
                <div className="space-y-2">
                  {c.paralelos.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                          {p.letra}
                        </span>
                        <span className="font-semibold text-slate-800">Paralelo {p.letra}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">{p.turno}</span>
                      </div>
                      <div className="text-[11px] font-medium text-slate-500">
                        Cupo: {p.cupo} estudiantes
                      </div>
                    </div>
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
                <th className="py-3 px-4">Código Oficial</th>
                <th className="py-3 px-4">Asignatura del Currículo Base</th>
                <th className="py-3 px-4">Campo de Saberes y Conocimientos (SEP)</th>
                <th className="py-3 px-4">Nivel Educativo</th>
                <th className="py-3 px-4 text-center">Tipo de Materia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materias.map((m) => (
                <tr key={m.codigo} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">{m.codigo}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{m.nombre}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {formatCampoSaberes(m.campo)}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {formatNivelEducativo(m.nivel)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        m.esTroncal
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {m.esTroncal ? 'Área Troncal Obligatoria' : 'Área Complementaria'}
                    </span>
                  </td>
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
                <th className="py-3 px-4">Maestro(a) Responsable</th>
                <th className="py-3 px-4">Asignatura Designada</th>
                <th className="py-3 px-4">Curso y Paralelo Asignado</th>
                <th className="py-3 px-4 text-center">Carga Horaria Mensual</th>
                <th className="py-3 px-4 text-center">Estado de Asignación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {asignaciones.map((a, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-800">{a.maestro}</td>
                  <td className="py-3 px-4 text-slate-700">{a.materia}</td>
                  <td className="py-3 px-4 text-emerald-700 font-medium">{a.paralelo}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                    {a.horas} horas pedagógicas
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {a.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
