import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatRol } from '../utils/formatters';
import { ErrorBoundary } from './ErrorBoundary';
import {
  getStoredInstitutions,
  syncApiInstitutions,
  resolveTenantKey,
  type TenantInstitution,
} from '../utils/multiTenantStore';
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Users,
  BookOpenCheck,
  FileSpreadsheet,
  ShieldCheck,
  LogOut,
  School,
  ChevronDown,
  CalendarCheck,
  ClipboardList,
  Clock,
  CreditCard,
} from 'lucide-react';

export const Layout: React.FC = () => {
  const {
    user,
    logout,
    currentInstitutionId,
    setCurrentInstitutionId,
    effectiveRole,
    isSuperAdmin,
    isDirector,
    isMaestro,
  } = useAuth();
  const location = useLocation();

  const [storedInstitutions, setStoredInstitutions] = useState<TenantInstitution[]>(() =>
    getStoredInstitutions()
  );

  useEffect(() => {
    // 1. Escuchar actualizaciones locales de instituciones
    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setStoredInstitutions(e.detail);
      }
    };
    window.addEventListener('sigma_institutions_updated', handleUpdate);

    // 2. Sincronizar padrón oficial de colegios desde la Base de Datos PostgreSQL
    apiClient
      .get('/institutions')
      .then((res) => {
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const synced = syncApiInstitutions(res.data.data);
          setStoredInstitutions(synced);
        }
      })
      .catch((err) => {
        console.warn('Layout: usando padrón en caché local', err);
      });

    return () => {
      window.removeEventListener('sigma_institutions_updated', handleUpdate);
    };
  }, []);

  // Define role-specific navigation menus
  let navItems: Array<{ label: string; path: string; icon: any }> = [];

  if (isSuperAdmin) {
    navItems = [
      { label: 'Panel Nacional', path: '/', icon: LayoutDashboard },
      { label: 'Unidades Educativas (Colegios)', path: '/institutions', icon: Building2 },
      { label: 'Cursos, Docentes & Materias', path: '/academic', icon: GraduationCap },
      { label: 'Estudiantes & Matrícula RUDE', path: '/students', icon: Users },
      { label: 'Supervisión de Calificaciones', path: '/grades', icon: BookOpenCheck },
      { label: 'Control de Asistencia', path: '/attendance', icon: CalendarCheck },
      { label: 'Kardex Disciplinario', path: '/kardex', icon: ClipboardList },
      { label: 'Horarios & Aulas', path: '/schedule', icon: Clock },
      { label: 'Centralizadores & Reportes', path: '/reports', icon: FileSpreadsheet },
      { label: 'Suscripción & Facturación SaaS', path: '/billing', icon: CreditCard },
      { label: 'Auditoría del Sistema', path: '/audit', icon: ShieldCheck },
    ];
  } else if (isDirector) {
    navItems = [
      { label: 'Panel Institucional', path: '/', icon: LayoutDashboard },
      { label: 'Cursos & Docentes', path: '/academic', icon: GraduationCap },
      { label: 'Estudiantes & Matrícula', path: '/students', icon: Users },
      { label: 'Supervisión de Calificaciones', path: '/grades', icon: BookOpenCheck },
      { label: 'Control de Asistencia', path: '/attendance', icon: CalendarCheck },
      { label: 'Kardex Disciplinario', path: '/kardex', icon: ClipboardList },
      { label: 'Horario Institucional', path: '/schedule', icon: Clock },
      { label: 'Centralizadores & Boletines', path: '/reports', icon: FileSpreadsheet },
      { label: 'Suscripción & Facturación', path: '/billing', icon: CreditCard },
      { label: 'Trazabilidad de Colegio', path: '/audit', icon: ShieldCheck },
    ];
  } else if (isMaestro) {
    navItems = [
      { label: 'Mis Asignaciones', path: '/', icon: LayoutDashboard },
      { label: 'Planilla de Calificaciones (Ley 070)', path: '/grades', icon: BookOpenCheck },
      { label: 'Control de Asistencia Mensual', path: '/attendance', icon: CalendarCheck },
      { label: 'Kardex Escolar de Seguimiento', path: '/kardex', icon: ClipboardList },
      { label: 'Mi Horario Semanal', path: '/schedule', icon: Clock },
      { label: 'Nómina y Filiación de Alumnos', path: '/students', icon: Users },
      { label: 'Centralizadores & Boletines', path: '/reports', icon: FileSpreadsheet },
    ];
  } else {
    navItems = [
      { label: 'Panel de Usuario', path: '/', icon: LayoutDashboard },
    ];
  }

  // Instituciones estrictamente accesibles para el usuario actual:
  // Si es Superadmin o Administrador Central -> Ve todas las instituciones registradas.
  // Si es Director o Maestro -> ÚNICAMENTE ve las instituciones a las que pertenece (user.institutions o /institutions del backend).
  const authorizedInstitutions = React.useMemo(() => {
    if (isSuperAdmin) {
      return storedInstitutions;
    }

    if (user?.institutions && user.institutions.length > 0) {
      return user.institutions.map((ui) => {
        const full = storedInstitutions.find(
          (s) => s.id === (ui.institutionId || ui.id) || s.sie === ui.sie
        );
        return (
          full || {
            id: ui.institutionId || ui.id || '',
            sie: ui.sie,
            nombre: ui.nombre,
            departamento: (ui as any).departamento || '',
            provincia: '',
            municipio: '',
            distrito: '',
            tipo: 'FISCAL' as any,
            nivel: 'INTEGRADO' as any,
            activo: true,
            totalMaestrosVinculados: 0,
          }
        );
      });
    }

    const current = storedInstitutions.find(
      (s) => s.id === currentInstitutionId || s.sie === resolveTenantKey(currentInstitutionId)
    );
    return current ? [current] : [];
  }, [isSuperAdmin, user, storedInstitutions, currentInstitutionId]);

  // Resolver institución activa alineando UUID con código SIE
  const resolvedSie = resolveTenantKey(currentInstitutionId);
  const currentInstitution =
    authorizedInstitutions.find((i) => i.id === currentInstitutionId || i.sie === resolvedSie) ||
    authorizedInstitutions[0];

  const activeInstitutionIdValue = currentInstitution?.id || currentInstitutionId || authorizedInstitutions[0]?.id;

  // Si currentInstitutionId era un ID obsoleto o inexistente para este usuario, normalizarlo
  useEffect(() => {
    if (currentInstitution && currentInstitutionId !== currentInstitution.id && !authorizedInstitutions.some((i) => i.id === currentInstitutionId)) {
      setCurrentInstitutionId(currentInstitution.id);
    }
  }, [currentInstitution, currentInstitutionId, authorizedInstitutions, setCurrentInstitutionId]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Bolivian Tricolor Accent Bar */}
      <div className="h-1.5 w-full flex">
        <div className="w-1/3 bg-[#D52B1E]" />
        <div className="w-1/3 bg-[#FCD116]" />
        <div className="w-1/3 bg-[#007934]" />
      </div>

      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 p-2 rounded-lg text-white shadow-md">
              <School className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight block leading-tight">
                SIGMA-SEP
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:block">
                Sistema Integral de Gestión de Maestros - Bolivia
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Si es Superadmin o tiene múltiples colegios asignados, mostrar selector */}
            {(isSuperAdmin || authorizedInstitutions.length > 1) ? (
              <div className="relative hidden md:block">
                <div className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-lg text-xs font-medium text-slate-700 transition">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <select
                    value={activeInstitutionIdValue}
                    onChange={(e) => setCurrentInstitutionId(e.target.value)}
                    className="bg-transparent border-none text-slate-800 text-xs font-bold focus:outline-none cursor-pointer max-w-[260px] truncate"
                  >
                    {authorizedInstitutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        SIE: {inst.sie} - {inst.nombre}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
              </div>
            ) : currentInstitution ? (
              /* Si tiene un único colegio (ej. director SaaS), mostrar badge institucional estático */
              <div className="hidden md:flex items-center space-x-2 bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-lg text-xs font-bold text-emerald-900">
                <School className="w-4 h-4 text-emerald-600" />
                <span className="max-w-[280px] truncate">
                  SIE: {currentInstitution.sie} - {currentInstitution.nombre}
                </span>
              </div>
            ) : null}

            {/* User profile badge with descriptive translated role */}
            <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-800">
                  {user?.persona?.nombres} {user?.persona?.primerApellido}
                </div>
                <div className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full inline-block">
                  {formatRol(effectiveRole)}
                </div>
              </div>
              <button
                onClick={logout}
                title="Cerrar Sesión"
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-64 flex-shrink-0 hidden md:block">
          <nav className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm space-y-1 sticky top-24">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isSuperAdmin
                ? 'Administración Nacional'
                : isDirector
                ? 'Gestión Institucional'
                : 'Gestión Docente de Aula'}
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Context summary box */}
            {currentInstitution && (
              <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <div className="text-slate-400 font-semibold mb-1">Unidad Educativa Activa:</div>
                <div className="font-bold text-slate-800 truncate">{currentInstitution.nombre}</div>
                <div className="text-slate-500 mt-0.5">Código SIE: {currentInstitution.sie}</div>
                <div className="text-emerald-700 font-semibold mt-1">
                  Rol: {formatRol((currentInstitution as any).role || (currentInstitution as any).rol || effectiveRole)}
                </div>
              </div>
            )}
          </nav>
        </aside>

        {/* Content Outlet */}
        <main className="flex-1 min-w-0">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          Estado Plurinacional de Bolivia • Sistema Integral de Registro y Gestión de Maestros (SEP) • Constitución Ley 070
        </div>
      </footer>
    </div>
  );
};
