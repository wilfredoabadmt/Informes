import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { formatRol } from '../utils/formatters';
import {
  Building2,
  GraduationCap,
  Users,
  BookOpenCheck,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user, currentInstitutionId, effectiveRole, isSuperAdmin, isDirector, isMaestro } = useAuth();
  const [institutionsCount, setInstitutionsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (isSuperAdmin) {
          const res = await apiClient.get('/institutions');
          setInstitutionsCount(res.data?.meta?.total || 0);
        }
      } catch (e) {
        console.error('Error fetching dashboard stats', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [currentInstitutionId, isSuperAdmin]);

  const currentInstitution = user?.institutions?.find(
    (i) => (i.institutionId || i.id) === currentInstitutionId
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-900/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white/10 rounded-full text-xs font-semibold text-emerald-100 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Gestión Escolar Activa 2026 • Estado Plurinacional de Bolivia</span>
            </div>
            <h1 className="text-2xl font-black">
              Bienvenido(a), {user?.persona?.nombres} {user?.persona?.primerApellido}
            </h1>
            <p className="text-sm text-emerald-100 mt-1 max-w-xl">
              {isSuperAdmin &&
                'Plataforma Centralizada de Administración de Unidades Educativas y Auditoría del Subsistema de Educación Regular.'}
              {isDirector &&
                `Supervisión y Gestión Integral de la ${currentInstitution?.nombre || 'Unidad Educativa'}.`}
              {isMaestro &&
                'Planilla Docente Digital para la Valoración Cualitativa y Cuantitativa de Dimensiones (Ley 070 Avelino Siñani).'}
            </p>
          </div>
          <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/20 text-right">
            <div className="text-[11px] uppercase tracking-wider text-emerald-200 font-semibold">
              Rol en el Sistema
            </div>
            <div className="text-sm font-bold text-white">{formatRol(effectiveRole)}</div>
          </div>
        </div>
      </div>

      {/* Stats Cards (Role specific) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isSuperAdmin ? (
          <>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Unidades Educativas</div>
                <div className="text-xl font-bold text-slate-800">
                  {loading ? '...' : institutionsCount}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Niveles Oficiales</div>
                <div className="text-sm font-bold text-slate-800">Primaria / Secundaria</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Seguridad de Datos</div>
                <div className="text-sm font-bold text-slate-800">Aislamiento RLS Activo</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Gestión Académica</div>
                <div className="text-sm font-bold text-slate-800">Periodo 2026 Vigente</div>
              </div>
            </div>
          </>
        ) : isDirector ? (
          <>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Código SIE Oficial</div>
                <div className="text-lg font-bold text-emerald-700">
                  {currentInstitution?.sie || '80730045'}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Estudiantes Inscritos</div>
                <div className="text-lg font-bold text-slate-800">4 Efectivos (Demo)</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Plantel Docente</div>
                <div className="text-lg font-bold text-slate-800">2 Maestros Vinculados</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Centralizador</div>
                <div className="text-sm font-bold text-slate-800">1° Trimestre en Curso</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <BookOpenCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Materias Asignadas</div>
                <div className="text-sm font-bold text-slate-800">Matemáticas / Primaria</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Cursos a Cargo</div>
                <div className="text-sm font-bold text-slate-800">1° Secundaria - Paralelo A</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Alumnos en Nómina</div>
                <div className="text-sm font-bold text-slate-800">4 Estudiantes</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Trimestre Activo</div>
                <div className="text-sm font-bold text-slate-800">1° Trimestre 2026</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Role-Specific Action Cards */}
      <h2 className="text-base font-bold text-slate-900 pt-2">
        {isSuperAdmin
          ? 'Módulos de Administración Nacional'
          : isDirector
          ? 'Gestión de la Unidad Educativa'
          : 'Herramientas de Trabajo Docente'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {isSuperAdmin && (
          <>
            <Link
              to="/institutions"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition group flex flex-col justify-between"
            >
              <div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl inline-block mb-3">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition">
                  Unidades Educativas (Tenants)
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Supervisión de colegios fiscales, de convenio y privados registrados en los 9 departamentos.
                </p>
              </div>
              <div className="flex items-center text-xs font-bold text-emerald-600 mt-4 group-hover:translate-x-1 transition">
                <span>Gestionar colegios</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>

            <Link
              to="/academic"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition group flex flex-col justify-between"
            >
              <div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl inline-block mb-3">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition">
                  Currículo Oficial & Estructura Base
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Catálogo nacional de cursos de Primaria y Secundaria, y las 20 materias oficiales por Campos de Saberes.
                </p>
              </div>
              <div className="flex items-center text-xs font-bold text-blue-600 mt-4 group-hover:translate-x-1 transition">
                <span>Ver currículo</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>

            <Link
              to="/audit"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition group flex flex-col justify-between"
            >
              <div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl inline-block mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition">
                  Auditoría del Sistema
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Trazabilidad inmutable de accesos, modificaciones de notas y operaciones de seguridad institucional.
                </p>
              </div>
              <div className="flex items-center text-xs font-bold text-purple-600 mt-4 group-hover:translate-x-1 transition">
                <span>Revisar bitácora</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          </>
        )}

        {isDirector && (
          <>
            <Link
              to="/students"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition group flex flex-col justify-between"
            >
              <div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl inline-block mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition">
                  Nómina de Estudiantes & Matrícula
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Matriculación de alumnos con código RUDE, carga masiva en Excel (.xlsx) y exportación de listas oficiales.
                </p>
              </div>
              <div className="flex items-center text-xs font-bold text-blue-600 mt-4 group-hover:translate-x-1 transition">
                <span>Administrar alumnos</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>

            <Link
              to="/academic"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition group flex flex-col justify-between"
            >
              <div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl inline-block mb-3">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition">
                  Paralelos & Asignaciones Docentes
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Distribución de cursos y designación de materias a maestros sin conflicto de horarios.
                </p>
              </div>
              <div className="flex items-center text-xs font-bold text-emerald-600 mt-4 group-hover:translate-x-1 transition">
                <span>Organizar docentes</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>

            <Link
              to="/reports"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition group flex flex-col justify-between"
            >
              <div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl inline-block mb-3">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition">
                  Centralizadores & Emisión de Libretas
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Consolidado trimestral de notas por curso y generación en 1 clic de Libretas Escolares oficiales en PDF.
                </p>
              </div>
              <div className="flex items-center text-xs font-bold text-purple-600 mt-4 group-hover:translate-x-1 transition">
                <span>Generar libretas</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          </>
        )}

        {isMaestro && (
          <>
            <Link
              to="/grades"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition group flex flex-col justify-between"
            >
              <div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl inline-block mb-3">
                  <BookOpenCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition">
                  Planilla de Calificaciones (Ley 070)
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Registro de notas en las 4 dimensiones (SER 10, SABER 35, HACER 35, DECIDIR 10) + Autoevaluación.
                </p>
              </div>
              <div className="flex items-center text-xs font-bold text-emerald-600 mt-4 group-hover:translate-x-1 transition">
                <span>Llenar planilla de notas</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>

            <Link
              to="/students"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition group flex flex-col justify-between"
            >
              <div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl inline-block mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition">
                  Nómina de Mis Estudiantes
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Consulta de lista de estudiantes inscritos en tus cursos asignados con código RUDE y CI.
                </p>
              </div>
              <div className="flex items-center text-xs font-bold text-blue-600 mt-4 group-hover:translate-x-1 transition">
                <span>Ver lista de curso</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>

            <Link
              to="/reports"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition group flex flex-col justify-between"
            >
              <div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl inline-block mb-3">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition">
                  Boletín Trimestral & Reportes PDF
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Descarga del boletín de notas de tus asignaturas y la lista oficial de asistencia en formato PDF.
                </p>
              </div>
              <div className="flex items-center text-xs font-bold text-purple-600 mt-4 group-hover:translate-x-1 transition">
                <span>Descargar boletines</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
