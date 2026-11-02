import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { School, KeyRound, User, AlertCircle, Sparkles, ShieldAlert, PhoneCall, HelpCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('admin@minedu.gob.bo');
  const [password, setPassword] = useState('Bolivia2026!');
  const [error, setError] = useState<string | null>(null);
  const [suspensionInfo, setSuspensionInfo] = useState<{
    colegio?: string;
    sie?: string;
    motivo?: string;
    fecha?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuspensionInfo(null);
    setLoading(true);

    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Credenciales inválidas. Por favor verifica tu correo oficial o carnet de identidad.';

      setError(msg);

      if (err.isSuspended || msg.toUpperCase().includes('SUSPENDID')) {
        setSuspensionInfo(
          err.suspensionData || {
            motivo: msg,
          }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (userType: 'admin' | 'directora' | 'maestro') => {
    if (userType === 'admin') {
      setIdentifier('admin@minedu.gob.bo');
      setPassword('Bolivia2026!');
    } else if (userType === 'directora') {
      setIdentifier('elena.flores@minedu.gob.bo');
      setPassword('Bolivia2026!');
    } else if (userType === 'maestro') {
      setIdentifier('carlos.mamani@minedu.gob.bo');
      setPassword('Bolivia2026!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4">
      {/* Top Bolivian Tricolor Accent Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 flex">
        <div className="w-1/3 bg-[#D52B1E]" />
        <div className="w-1/3 bg-[#FCD116]" />
        <div className="w-1/3 bg-[#007934]" />
      </div>

      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-emerald-600 text-white w-14 h-14 rounded-2xl shadow-lg shadow-emerald-200 mb-4">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">SIGMA - BOLIVIA</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Sistema Integral de Registro y Gestión de Maestros • Subsistema de Educación Regular
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl shadow-slate-200/50">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Iniciar Sesión</h2>
          <p className="text-xs text-slate-500 mb-6">
            Acceso institucional seguro mediante Correo Oficial o Cédula de Identidad (CI)
          </p>

          {error && (
            suspensionInfo || error.toUpperCase().includes('SUSPENDID') ? (
              <div className="mb-5 p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl shadow-sm text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center space-x-2 text-rose-800 font-extrabold text-sm">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>Acceso Institucional Suspendido</span>
                </div>

                <p className="text-slate-700 leading-relaxed font-medium">
                  {error}
                </p>

                <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between text-[11px] text-rose-800">
                  <span className="font-bold flex items-center space-x-1">
                    <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>¿Necesitas reactivar tu Unidad Educativa?</span>
                  </span>
                  <a
                    href="https://wa.me/59171523780?text=Hola,%20deseo%20regularizar%20la%20suscripci%C3%B3n%20y%20reactivar%20mi%20colegio%20en%20SIGMA-SEP"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-rose-700 hover:text-rose-900 underline flex items-center space-x-1"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Contactar Administración (+591 71523780)</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Identificador Oficial (Correo del Ministerio o C.I.)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ej. admin@minedu.gob.bo o 7214589"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contraseña de Acceso
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Validando credenciales...' : 'Ingresar al Sistema'}
            </button>
          </form>

          {/* Quick Login Pills for Demo Testing */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Accesos Rápidos según Perfil de Usuario:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="py-2 px-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-transparent rounded-lg text-[11px] font-bold text-slate-700 transition cursor-pointer text-center"
              >
                Superadmin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('directora')}
                className="py-2 px-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-transparent rounded-lg text-[11px] font-bold text-slate-700 transition cursor-pointer text-center"
              >
                Directora
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('maestro')}
                className="py-2 px-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-transparent rounded-lg text-[11px] font-bold text-slate-700 transition cursor-pointer text-center"
              >
                Maestro
              </button>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center space-y-1">
              <div>
                <span className="font-semibold text-slate-700">Contraseña única: </span>
                <span className="font-mono font-bold text-emerald-700">Bolivia2026!</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Directora acepta <span className="font-mono">directora@franztamayo.edu.bo</span> o <span className="font-mono">elena.flores@minedu.gob.bo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Banner SaaS Onboarding */}
        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-xs font-bold text-emerald-900">¿Deseas implementar SIGMA en tu Unidad Educativa?</p>
          <p className="text-[11px] text-slate-600 mt-1">
            Comienza una prueba gratuita de 14 días con calificaciones 4D, boletines oficiales y RUDE.
          </p>
          <div className="mt-3 flex items-center justify-center space-x-3">
            <Link
              to="/landing"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Ver Planes & Precios
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              to="/registro-colegio"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              Crear Colegio Gratis
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-400">
          Ministerio de Educación • Estado Plurinacional de Bolivia
        </div>
      </div>
    </div>
  );
};
