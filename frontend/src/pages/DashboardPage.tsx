import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import {
  Building2,
  GraduationCap,
  Users,
  BookOpenCheck,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user, currentInstitutionId } = useAuth();
  const [institutionsCount, setInstitutionsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get('/institutions');
        setInstitutionsCount(res.data?.meta?.total || 0);
      } catch (e) {
        console.error('Error fetching dashboard stats', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [currentInstitutionId]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-900/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white/10 rounded-full text-xs font-semibold text-emerald-100 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Gestión Escolar Activa 2026</span>
            </div>
            <h1 className="text-2xl font-black">
              Bienvenido, {user?.persona?.nombres} {user?.persona?.primerApellido}
            </h1>
            <p className="text-sm text-emerald-100 mt-1 max-w-xl">
              Plataforma Centralizada de Gestión Académica, Identidad de Maestros y Evaluación Cuantitativa/Cualitativa (Ley Avelino Siñani - Elizardo Pérez).
            </p>
          </div>
          <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/20 text-right">
            <div className="text-[11px] uppercase tracking-wider text-emerald-200 font-semibold">
              Rol del Usuario
            </div>
            <div className="text-base font-bold text-white">{user?.globalRole}</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="text-xs font-medium text-slate-500">Niveles Educativos</div>
            <div className="text-xl font-bold text-slate-800">Primaria / Secundaria</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Aislamiento de Datos</div>
            <div className="text-xl font-bold text-slate-800">PostgreSQL RLS</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Trazabilidad</div>
            <div className="text-xl font-bold text-slate-800">Auditoría Inmutable</div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <h2 className="text-base font-bold text-slate-900 pt-2">Módulos del Sistema</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
              Registro cuantitativo en las 4 dimensiones (SER 10, SABER 35, HACER 35, DECIDIR 10) + Autoevaluación.
            </p>
          </div>
          <div className="flex items-center text-xs font-bold text-emerald-600 mt-4 group-hover:translate-x-1 transition">
            <span>Ingresar a planilla</span>
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
              Estudiantes & Matrícula Masiva
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Gestión de nóminas de estudiantes con código RUDE, importación y exportación en planillas Excel/CSV.
            </p>
          </div>
          <div className="flex items-center text-xs font-bold text-blue-600 mt-4 group-hover:translate-x-1 transition">
            <span>Gestionar alumnos</span>
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
              Centralizadores & Boletines Oficiales
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Generación de centralizadores trimestrales y emisión instantánea de boletines y libretas en formato PDF.
            </p>
          </div>
          <div className="flex items-center text-xs font-bold text-purple-600 mt-4 group-hover:translate-x-1 transition">
            <span>Ver reportes</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </Link>
      </div>
    </div>
  );
};
