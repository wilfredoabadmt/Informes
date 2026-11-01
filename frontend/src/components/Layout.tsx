import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatRol } from '../utils/formatters';
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

  // Define role-specific navigation menus
  let navItems: Array<{ label: string; path: string; icon: any }> = [];

  if (isSuperAdmin) {
    navItems = [
      { label: 'Panel Nacional', path: '/', icon: LayoutDashboard },
      { label: 'Unidades Educativas (Tenants)', path: '/institutions', icon: Building2 },
      { label: 'Currículo & Estructura Base', path: '/academic', icon: GraduationCap },
      { label: 'Auditoría del Sistema', path: '/audit', icon: ShieldCheck },
    ];
  } else if (isDirector) {
    navItems = [
      { label: 'Panel Institucional', path: '/', icon: LayoutDashboard },
      { label: 'Cursos & Docentes', path: '/academic', icon: GraduationCap },
      { label: 'Estudiantes & Matrícula', path: '/students', icon: Users },
      { label: 'Supervisión de Calificaciones', path: '/grades', icon: BookOpenCheck },
      { label: 'Centralizadores & Boletines', path: '/reports', icon: FileSpreadsheet },
      { label: 'Trazabilidad de Colegio', path: '/audit', icon: ShieldCheck },
    ];
  } else if (isMaestro) {
    navItems = [
      { label: 'Mis Asignaciones', path: '/', icon: LayoutDashboard },
      { label: 'Planilla de Calificaciones (Ley 070)', path: '/grades', icon: BookOpenCheck },
      { label: 'Nómina de Mis Cursos', path: '/students', icon: Users },
      { label: 'Boletines & Listas Oficiales', path: '/reports', icon: FileSpreadsheet },
    ];
  } else {
    navItems = [
      { label: 'Panel de Usuario', path: '/', icon: LayoutDashboard },
    ];
  }

  const currentInstitution = user?.institutions?.find(
    (i) => (i.institutionId || i.id) === currentInstitutionId
  );

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
            {/* Institution Switcher (Only if user has institutions linked) */}
            {user?.institutions && user.institutions.length > 0 && (
              <div className="relative hidden md:block">
                <div className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-lg text-xs font-medium text-slate-700 transition">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <select
                    value={currentInstitutionId || ''}
                    onChange={(e) => setCurrentInstitutionId(e.target.value)}
                    className="bg-transparent border-none text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {user.institutions.map((inst) => {
                      const instId = inst.institutionId || inst.id;
                      const instRol = formatRol(inst.role || inst.rol);
                      return (
                        <option key={instId} value={instId}>
                          SIE: {inst.sie} - {inst.nombre} ({instRol})
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
              </div>
            )}

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
                  Rol: {formatRol(currentInstitution.role || currentInstitution.rol)}
                </div>
              </div>
            )}
          </nav>
        </aside>

        {/* Content Outlet */}
        <main className="flex-1 min-w-0">
          <Outlet />
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
