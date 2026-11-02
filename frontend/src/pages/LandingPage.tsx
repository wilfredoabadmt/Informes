import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  School,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Award,
  Users,
  GraduationCap,
  ClipboardList,
  Clock,
  QrCode,
  Building,
  HelpCircle,
  Download,
  Lock,
  Unlock,
  Sliders,
  Check,
  ChevronDown,
  Layers,
  Terminal,
  Activity,
  Zap,
  Globe2,
  Database,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import qrImg from '../assets/qr.png';

export const LandingPage: React.FC = () => {
  const { user, effectiveRole } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeDemoTab, setActiveDemoTab] = useState<'4d' | 'libreta' | 'lock' | 'qr'>('4d');
  
  // Interactive 4D Simulator State
  const [simSer, setSimSer] = useState(9);
  const [simSaber, setSimSaber] = useState(30);
  const [simHacer, setSimHacer] = useState(28);
  const [simDecidir, setSimDecidir] = useState(9);
  const [simAuto, setSimAuto] = useState(9);
  const [simExtra, setSimExtra] = useState(2);

  // Interactive Trimestral Lock Simulator State
  const [trimestreBloqueado, setTrimestreBloqueado] = useState(true);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const navigate = useNavigate();

  const simNotaFinal = Math.min(100, simSer + simSaber + simHacer + simDecidir + simAuto + simExtra);
  const simAprobado = simNotaFinal >= 51;

  const handleSelectPlan = (planCodigo: string) => {
    navigate(`/registro-colegio?plan=${planCodigo}`);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Bolivian Tricolor Futuristic Cyber Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 flex z-50 shadow-lg shadow-emerald-950/40">
        <div className="w-1/3 bg-rose-600 shadow-sm shadow-rose-500" />
        <div className="w-1/3 bg-amber-400 shadow-sm shadow-amber-400" />
        <div className="w-1/3 bg-emerald-500 shadow-sm shadow-emerald-500" />
      </div>

      {/* Futuristic Navbar */}
      <header className="sticky top-1.5 z-40 bg-[#070b14]/85 backdrop-blur-xl border-b border-emerald-500/20 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur-sm opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <div className="relative bg-slate-900 border border-emerald-500/40 text-emerald-400 p-2.5 rounded-2xl flex items-center justify-center">
                <School className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-white font-mono">
                  SIGMA<span className="text-emerald-400">-SEP</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>SaaS v4.2</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Gestión Educativa Plurinacional • Bolivia
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold tracking-wider text-slate-300 uppercase">
            <a href="#simulador" className="hover:text-emerald-400 transition-colors flex items-center space-x-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulador 4D</span>
            </a>
            <a href="#arquitectura" className="hover:text-emerald-400 transition-colors flex items-center space-x-1">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Arquitectura</span>
            </a>
            <a href="#planes" className="hover:text-emerald-400 transition-colors flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Planes & Pagos</span>
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center space-x-3">
            {user ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 text-xs font-bold font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/40 rounded-xl transition flex items-center space-x-2 shadow-lg shadow-emerald-950/50"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Panel de Control ({effectiveRole})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition"
                >
                  Acceso Maestros
                </Link>
                <Link
                  to="/registro-colegio"
                  className="relative group px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl flex items-center space-x-1.5 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Crear Colegio</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 overflow-hidden">
        {/* Futuristic Background Mesh & Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b98115_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-emerald-600/20 via-cyan-600/20 to-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Holographic Notification Pill */}
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-mono mb-8 shadow-xl shadow-emerald-950/40 backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>R.M. 0001/2026 • SUBSISTEMA DE EDUCACIÓN REGULAR BOLIVIA</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight max-w-5xl mx-auto leading-[1.1] font-sans">
            La Plataforma Cloud <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              de Nueva Generación
            </span>{' '}
            para Colegios de Bolivia
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Centralice la gestión institucional, notas bajo el currículo de la <strong>Ley 070 (4 Dimensiones)</strong>, 
            asistencia biometrica, emisión instantánea de <strong>Libretas con Código QR</strong> y cobro mediante 
            <strong> QR Simple Interoperable</strong> de banca boliviana.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/registro-colegio"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center space-x-3 transition-all duration-200 transform hover:-translate-y-0.5 text-sm cursor-pointer"
            >
              <span>Activar Colegio con 14 Días Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <a
              href="#simulador"
              className="w-full sm:w-auto px-7 py-4 bg-slate-900/80 hover:bg-slate-800/80 border border-emerald-500/30 hover:border-emerald-500/60 text-slate-200 font-bold rounded-2xl backdrop-blur-md transition-all text-sm flex items-center justify-center space-x-2"
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Explorar Cockpit Interactivo</span>
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-emerald-500/20 backdrop-blur-xl">
              <div className="flex items-center space-x-2 text-emerald-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Aislamiento SIE</span>
              </div>
              <p className="text-xl font-black text-white font-mono">100% Multi-Tenant</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Bases de datos segregadas por unidad</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-xl">
              <div className="flex items-center space-x-2 text-cyan-400 mb-1">
                <FileSpreadsheet className="w-4 h-4" />
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Normativa SEP</span>
              </div>
              <p className="text-xl font-black text-white font-mono">Ley 070 (4D)</p>
              <p className="text-[11px] text-slate-400 mt-0.5">SER, SABER, HACER, DECIDIR</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-xl">
              <div className="flex items-center space-x-2 text-purple-400 mb-1">
                <QrCode className="w-4 h-4" />
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Pasarela Nacional</span>
              </div>
              <p className="text-xl font-black text-white font-mono">QR Simple BOB</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Activación bancaria en 60 segundos</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-amber-500/20 backdrop-blur-xl">
              <div className="flex items-center space-x-2 text-amber-400 mb-1">
                <Lock className="w-4 h-4" />
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Supervisión</span>
              </div>
              <p className="text-xl font-black text-white font-mono">Cierre Trimestral</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Bloqueo docente y visado de Director</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Futuristic Live Cockpit Simulator */}
      <section id="simulador" className="py-20 relative bg-gradient-to-b from-[#070b14] via-[#091122] to-[#070b14] border-t border-emerald-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold uppercase mb-3">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Demostración de Núcleo en Tiempo Real</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Cockpit Interactivo del Sistema SIGMA
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Experimente cómo operan los módulos en vivo antes de implementar el sistema en su Unidad Educativa.
            </p>
          </div>

          {/* Interactive Container Box */}
          <div className="max-w-5xl mx-auto bg-slate-950/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-950/60 backdrop-blur-2xl">
            {/* Simulator Tabs */}
            <div className="flex flex-wrap border-b border-slate-800 bg-slate-900/80 p-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveDemoTab('4d')}
                className={`flex-1 min-w-[200px] py-3 px-4 rounded-2xl text-xs font-bold font-mono transition flex items-center justify-center space-x-2 cursor-pointer ${
                  activeDemoTab === '4d'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>1. Motor de Cálculo 4D</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDemoTab('libreta')}
                className={`flex-1 min-w-[200px] py-3 px-4 rounded-2xl text-xs font-bold font-mono transition flex items-center justify-center space-x-2 cursor-pointer ${
                  activeDemoTab === 'libreta'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>2. Libreta Digital Oficial</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDemoTab('lock')}
                className={`flex-1 min-w-[200px] py-3 px-4 rounded-2xl text-xs font-bold font-mono transition flex items-center justify-center space-x-2 cursor-pointer ${
                  activeDemoTab === 'lock'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>3. Bloqueo de Trimestre</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDemoTab('qr')}
                className={`flex-1 min-w-[200px] py-3 px-4 rounded-2xl text-xs font-bold font-mono transition flex items-center justify-center space-x-2 cursor-pointer ${
                  activeDemoTab === 'qr'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>4. Activación QR Simple</span>
              </button>
            </div>

            {/* Tab 1: 4D Engine Simulator */}
            {activeDemoTab === '4d' && (
              <div className="p-6 sm:p-10">
                <div className="flex flex-col lg:flex-row gap-8 items-center">
                  <div className="w-full lg:w-3/5 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        DIMENSIÓN Y PONDERACIÓN LEY 070
                      </span>
                      <span className="text-xs text-slate-400">Ajusta los controles interactivos:</span>
                    </div>

                    {/* SER */}
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-slate-300">SER (Máx 10 pts):</span>
                        <span className="text-emerald-400 font-bold">{simSer} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={simSer}
                        onChange={(e) => setSimSer(Number(e.target.value))}
                        className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                      />
                    </div>

                    {/* SABER */}
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-slate-300">SABER (Máx 35 pts):</span>
                        <span className="text-cyan-400 font-bold">{simSaber} / 35</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="35"
                        value={simSaber}
                        onChange={(e) => setSimSaber(Number(e.target.value))}
                        className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                      />
                    </div>

                    {/* HACER */}
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-slate-300">HACER (Máx 35 pts):</span>
                        <span className="text-blue-400 font-bold">{simHacer} / 35</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="35"
                        value={simHacer}
                        onChange={(e) => setSimHacer(Number(e.target.value))}
                        className="w-full accent-blue-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                      />
                    </div>

                    {/* DECIDIR */}
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-slate-300">DECIDIR (Máx 10 pts):</span>
                        <span className="text-amber-400 font-bold">{simDecidir} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={simDecidir}
                        onChange={(e) => setSimDecidir(Number(e.target.value))}
                        className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                      />
                    </div>

                    {/* AUTOEVALUACION */}
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-slate-300">Autoevaluación SER+DECIDIR (Máx 10 pts):</span>
                        <span className="text-purple-400 font-bold">{simAuto} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={simAuto}
                        onChange={(e) => setSimAuto(Number(e.target.value))}
                        className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                      />
                    </div>

                    {/* EXTRAS */}
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-slate-300">Puntos Extras (Bonificación):</span>
                        <span className="text-rose-400 font-bold">+{simExtra} pts</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={simExtra}
                        onChange={(e) => setSimExtra(Number(e.target.value))}
                        className="w-full accent-rose-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                      />
                    </div>
                  </div>

                  {/* Real-time Result HUD Display */}
                  <div className="w-full lg:w-2/5 flex flex-col items-center justify-center p-8 bg-slate-900/90 rounded-3xl border border-slate-700/60 text-center relative overflow-hidden">
                    <div className="absolute top-2 right-3 font-mono text-[10px] text-slate-500">
                      LIVE CALC HUD
                    </div>
                    
                    <p className="text-xs uppercase tracking-wider font-mono text-slate-400">
                      Nota Trimestral Final
                    </p>
                    
                    <div className="my-3">
                      <span className={`text-6xl font-black font-mono tracking-tighter ${
                        simAprobado ? 'text-emerald-400' : 'text-rose-500'
                      }`}>
                        {simNotaFinal}
                      </span>
                      <span className="text-lg font-mono text-slate-500 font-bold"> / 100</span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-3 mb-4 overflow-hidden border border-slate-700">
                      <div
                        className={`h-full transition-all duration-300 ${
                          simAprobado
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, simNotaFinal)}%` }}
                      />
                    </div>

                    <div className={`px-4 py-1.5 rounded-full text-xs font-black font-mono border ${
                      simAprobado
                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-950/70 text-rose-300 border-rose-500/40'
                    }`}>
                      {simAprobado ? '● ESTADO: APROBADO (51+)' : '● ESTADO: RETENIDO (<51)'}
                    </div>

                    <p className="mt-4 text-[11px] text-slate-400 leading-tight">
                      Algoritmo homologado por la Resolución Ministerial 0001/2026 para Primaria y Secundaria.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Official Digital Libreta Preview */}
            {activeDemoTab === 'libreta' && (
              <div className="p-6 sm:p-10 space-y-6">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          LIBRETA ELECTRÓNICA ESCOLAR CON SELLO QR CRIPTOGRÁFICO
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">
                        Estudiante: Alanoca Cruz Erick Elias • RUDE: 807300452026001
                      </h4>
                      <p className="text-xs text-slate-400">
                        U.E. Franz Tamayo (SIE: 80730045) • Distrito: La Paz 1 • 1° Secundaria
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                      <QrCode className="w-6 h-6 text-emerald-400" />
                      <div className="text-left font-mono">
                        <p className="text-[10px] text-slate-400 leading-none">VALIDACIÓN QR</p>
                        <p className="text-xs font-bold text-white">OFICIAL SEP</p>
                      </div>
                    </div>
                  </div>

                  {/* Mini Table Simulation */}
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-800 text-slate-300 border-b border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3">Campo & Área Curricular</th>
                          <th className="py-2.5 px-3 text-center">1° Trim</th>
                          <th className="py-2.5 px-3 text-center">2° Trim</th>
                          <th className="py-2.5 px-3 text-center">3° Trim</th>
                          <th className="py-2.5 px-3 text-center text-emerald-400">Prom. Anual</th>
                          <th className="py-2.5 px-3 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        <tr>
                          <td className="py-2.5 px-3 font-sans font-semibold">Matemática</td>
                          <td className="py-2.5 px-3 text-center">75</td>
                          <td className="py-2.5 px-3 text-center">82</td>
                          <td className="py-2.5 px-3 text-center">88</td>
                          <td className="py-2.5 px-3 text-center font-bold text-emerald-400">82</td>
                          <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">APROBADO</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-sans font-semibold">Comunicación y Lenguajes</td>
                          <td className="py-2.5 px-3 text-center">72</td>
                          <td className="py-2.5 px-3 text-center">79</td>
                          <td className="py-2.5 px-3 text-center">85</td>
                          <td className="py-2.5 px-3 text-center font-bold text-emerald-400">79</td>
                          <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">APROBADO</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-sans font-semibold">Ciencias Naturales: Biología</td>
                          <td className="py-2.5 px-3 text-center">80</td>
                          <td className="py-2.5 px-3 text-center">84</td>
                          <td className="py-2.5 px-3 text-center">90</td>
                          <td className="py-2.5 px-3 text-center font-bold text-emerald-400">85</td>
                          <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">APROBADO</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800 gap-2">
                    <span className="font-mono text-[11px]">
                      Hash Criptográfico de Seguridad: SHA256:7f9a88c2...e81
                    </span>
                    <span className="text-emerald-400 font-bold">
                      Descarga instantánea en PDF con un clic
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Trimestral Lock Simulator */}
            {activeDemoTab === 'lock' && (
              <div className="p-6 sm:p-10 space-y-6">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-3 rounded-2xl ${
                      trimestreBloqueado ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {trimestreBloqueado ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">
                        {trimestreBloqueado ? 'Primer Trimestre: Bloqueado por Seguridad' : 'Primer Trimestre: Habilitado para Modificación'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {trimestreBloqueado
                          ? 'El docente dio su aprobación de notas. Para evitar alteraciones, las notas quedan congeladas.'
                          : 'El Director ha autorizado una ventana temporal de 24 horas para ajustar notas.'}
                      </p>
                    </div>
                  </div>

                  {/* Interactive Simulation Controls */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-xs text-slate-300">
                        <strong>Simulación de Rol Maestro:</strong> ¿Necesita rectificar una nota ya cerrada?
                      </div>

                      {trimestreBloqueado ? (
                        <button
                          type="button"
                          onClick={() => setSolicitudEnviada(true)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                            solicitudEnviada
                              ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                          }`}
                          disabled={solicitudEnviada}
                        >
                          {solicitudEnviada ? '✓ Solicitud enviada a Dirección' : 'Solicitar Desbloqueo a Dirección'}
                        </button>
                      ) : (
                        <span className="text-xs font-mono text-emerald-400 font-bold">
                          Edición de notas activa
                        </span>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-xs text-slate-300">
                        <strong>Simulación de Rol Director:</strong> Control de candado administrativo:
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setTrimestreBloqueado(!trimestreBloqueado);
                          setSolicitudEnviada(false);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-mono transition cursor-pointer flex items-center space-x-1.5"
                      >
                        {trimestreBloqueado ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Director: Autorizar Desbloqueo</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Director: Bloquear Definitivamente</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: QR Simple Instant Activation Simulator */}
            {activeDemoTab === 'qr' && (
              <div className="p-6 sm:p-10">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-full md:w-1/2 text-center">
                    <div className="p-4 bg-white rounded-2xl inline-block shadow-2xl border-4 border-emerald-500/30">
                      <img
                        src={qrImg}
                        alt="QR Simple Oficial"
                        className="w-56 h-56 object-contain mx-auto"
                      />
                    </div>
                    <p className="text-[11px] font-mono text-emerald-400 mt-2 font-bold">
                      QR SIMPLE OFICIAL • GESTIÓN EDUCATIVA BOLIVIA
                    </p>
                  </div>

                  <div className="w-full md:w-1/2 space-y-4">
                    <div className="inline-flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Suscripción en Moneda Nacional (BOB)</span>
                    </div>

                    <h4 className="text-xl font-bold text-white">
                      Activación Instantánea sin Tarjeta de Crédito
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Compatible con la aplicación de banca móvil de cualquier entidad supervisada por la ASFI:
                      <strong> Banco Unión, BNB, BCP, Banco Mercantil Santa Cruz, Banco Sol, Banco FIE, Bisa, Ganadero y Ecofuturo</strong>.
                    </p>

                    <div className="space-y-2 text-xs text-slate-300 font-mono">
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Genera comprobante oficial y activa el SIE de su colegio</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Soporte directo y verificación por WhatsApp (+591 71523780)</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs font-mono transition flex items-center space-x-2 cursor-pointer shadow-lg shadow-emerald-500/30"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Abrir Modal de Pago con QR</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Futuristic Architecture & Capabilities Section */}
      <section id="arquitectura" className="py-20 bg-[#070b14] border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30 inline-block mb-3">
              Módulos Especializados SEP
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ingeniería de Software adaptada a la Realidad Boliviana
            </h2>
            <p className="mt-4 text-sm text-slate-400">
              Desarrollado para suprimir el estrés del llenado manual de cuadernos y centralizadores a fin de trimestre.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-slate-900/60 rounded-3xl border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-950/30">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Cuaderno Pedagógico 4D</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ponderación precisa según Ley 070: SER (10 pts), SABER (35 pts), HACER (35 pts), DECIDIR (10 pts), 
                Autoevaluación (10 pts) y Bonificación Extra. Cálculo automático en tiempo real.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-slate-900/60 rounded-3xl border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-950/30">
              <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Centralizadores & Libretas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generación en un clic del Boletín Trimestral y la Libreta Escolar Electrónica anual con código QR 
                de autenticidad, listas para imprimir o enviar en PDF a los padres de familia.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-slate-900/60 rounded-3xl border border-slate-800 hover:border-purple-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-950/30">
              <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                <ClipboardList className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Kardex & Asistencia Escolar</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seguimiento disciplinario con faltas justificadas, retrasos y observaciones de conducta.
                Generación automática de citaciones a apoderados con fecha y horario programado.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 bg-slate-900/60 rounded-3xl border border-slate-800 hover:border-amber-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-amber-950/30">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Horarios & Aulas sin Choques</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Organizador inteligente de periodos pedagógicos de 45 minutos por turno (mañana/tarde).
                Detección automática de conflictos entre materias, paralelos y maestros asignados.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 bg-slate-900/60 rounded-3xl border border-slate-800 hover:border-rose-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-rose-950/30">
              <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Multi-Colegio para Maestros</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Los docentes con RDA que dictan clases en dos o más unidades educativas alternan de colegio 
                con un solo clic en la barra superior, sin cerrar sesión ni duplicar cuentas.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 bg-slate-900/60 rounded-3xl border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-950/30">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                <Database className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Importación RUDE / SIGED</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sube la lista de tus estudiantes directamente desde el Excel oficial del Ministerio de Educación.
                Reconocimiento inteligente de columnas: RUDE, C.I., Apellidos, Nombres y Fecha de Nacimiento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Matrix */}
      <section id="planes" className="py-24 bg-[#091122] border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30 inline-block mb-3">
              Precios Transparentes en Bolivianos
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Planes Adaptados a su Unidad Educativa
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              14 días de prueba gratis en todos los planes. Pague cómodamente mediante QR Simple de cualquier banco de Bolivia.
            </p>

            {/* Monthly vs Annual Toggle */}
            <div className="mt-8 inline-flex items-center p-1.5 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-xl">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pago Mensual
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition cursor-pointer ${
                  billingCycle === 'annual'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Pago Anual</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase">
                  Ahorra 20%
                </span>
              </button>
            </div>

            {/* Direct QR Quick View */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 px-4 py-2 rounded-xl transition cursor-pointer border border-emerald-500/30"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Ver Código QR Simple Interoperable Oficial</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {/* Plan 1: Rural / Básico */}
            <div className="bg-slate-900/70 rounded-3xl border border-slate-800 p-8 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Plan Comunitario
                </span>
                <h3 className="text-xl font-bold text-white mt-1">Rural / Inicial</h3>
                <p className="text-xs text-slate-400 mt-1">Para escuelas rurales y maestros particulares.</p>
                
                <div className="my-6">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-4xl font-black font-mono text-white">Bs. 0</span>
                    <span className="text-xs font-mono text-slate-500">/ permanente</span>
                  </div>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1">Para unidades con menos de 100 alumnos</p>
                </div>

                <div className="space-y-3 border-t border-slate-800 pt-6 text-xs text-slate-300">
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Hasta 100 estudiantes inscritos</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Hasta 8 maestros vinculados</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Evaluación 4D SER/SABER/HACER/DECIDIR</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Control de asistencia mensual</span>
                  </div>
                  <div className="flex items-center space-x-2.5 text-slate-500 line-through">
                    <CheckCircle2 className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    <span>Libretas oficiales sin marca de agua</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => handleSelectPlan('PLAN_BASIC')}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold font-mono rounded-xl text-xs transition cursor-pointer"
                >
                  Comenzar Gratis
                </button>
              </div>
            </div>

            {/* Plan 2: Colegio Profesional (Destacado) */}
            <div className="bg-slate-900/90 rounded-3xl border-2 border-emerald-500 p-8 shadow-2xl shadow-emerald-950/80 flex flex-col justify-between relative transform md:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-[11px] font-black font-mono px-4 py-1 rounded-full uppercase tracking-wider shadow-lg">
                ★ Recomendado para Directores
              </div>

              <div>
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  Unidad Educativa Completa
                </span>
                <h3 className="text-xl font-bold text-white mt-1">Colegio Profesional</h3>
                <p className="text-xs text-slate-400 mt-1">Fiscales, de convenio y unidades educativas privadas.</p>
                
                <div className="my-6">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-4xl font-black font-mono text-white">
                      Bs. {billingCycle === 'annual' ? '2.400' : '250'}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {billingCycle === 'annual' ? '/ año completo' : '/ mes'}
                    </span>
                  </div>
                  {billingCycle === 'annual' ? (
                    <p className="text-[11px] text-emerald-400 font-bold mt-1">
                      Equivale a Bs. 200/mes (2 meses de regalo)
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Sin contratos de permanencia obligatoria
                    </p>
                  )}
                </div>

                <div className="space-y-3 border-t border-slate-800 pt-6 text-xs text-slate-300">
                  <div className="flex items-center space-x-2.5 font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Hasta 1.500 estudiantes y 80 maestros</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Libretas oficiales SEP con sello QR de autenticidad</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Supervisión y Candado de Notas por Dirección</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Importación masiva desde Excel RUDE/SIGED</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Horarios de clases y distribución de aulas</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Soporte prioritario por WhatsApp (+591 71523780)</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-2">
                <button
                  type="button"
                  onClick={() => handleSelectPlan('PLAN_PRO')}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black font-mono rounded-xl text-xs shadow-lg shadow-emerald-500/30 transition cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <span>Probar 14 Días Gratis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="w-full py-2 bg-slate-800/80 hover:bg-slate-700/80 text-emerald-400 text-[11px] font-mono font-bold rounded-lg border border-emerald-500/30 transition cursor-pointer flex items-center justify-center space-x-1"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Pagar Ahora con QR Simple</span>
                </button>
              </div>
            </div>

            {/* Plan 3: Red Educativa / Distrito */}
            <div className="bg-slate-900/70 rounded-3xl border border-slate-800 p-8 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                  Red Institucional
                </span>
                <h3 className="text-xl font-bold text-white mt-1">Redes & Distritos</h3>
                <p className="text-xs text-slate-400 mt-1">Para órdenes religiosas, redes de convenio o distritos.</p>
                
                <div className="my-6">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-4xl font-black font-mono text-white">
                      Bs. {billingCycle === 'annual' ? '5.800' : '600'}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {billingCycle === 'annual' ? '/ año' : '/ mes'}
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-400 font-semibold mt-1">Multi-colegio centralizado</p>
                </div>

                <div className="space-y-3 border-t border-slate-800 pt-6 text-xs text-slate-300">
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>Estudiantes y maestros ILIMITADOS</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>Múltiples códigos SIE en un solo panel</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>Capacitación virtual a todo el plantel docente</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>Personalización de dominio propio</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>Auditoría distrital consolidada</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <a
                  href="https://wa.me/59171523780?text=Hola,%20deseo%20información%20sobre%20el%20Plan%20Red%20Educativa%20/Distrito%20para%20mis%20colegios"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 font-bold font-mono rounded-xl text-xs transition cursor-pointer flex items-center justify-center space-x-1"
                >
                  <span>Contactar Asesor Especializado</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Interactive Accordion */}
      <section id="faq" className="py-20 bg-[#070b14] border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30 inline-block mb-3">
              Resolución de Dudas
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight">Preguntas Frecuentes</h2>
            <p className="text-xs text-slate-400 mt-2">Todo lo que necesita saber sobre la adopción del sistema en su colegio</p>
          </div>

          <div className="space-y-4">
            {/* FAQ 1 */}
            <div className="p-5 bg-slate-900/70 rounded-2xl border border-slate-800 transition">
              <button
                type="button"
                onClick={() => toggleFaq(1)}
                className="w-full flex items-center justify-between text-left text-sm font-bold text-white cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <HelpCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>¿Cómo funciona el periodo de prueba de 14 días?</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === 1 ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === 1 && (
                <p className="mt-3 text-xs text-slate-400 leading-relaxed pl-7 border-t border-slate-800/60 pt-3">
                  Al registrar el código SIE de su unidad educativa, el sistema se activa inmediatamente con el Plan Profesional completo durante 14 días sin necesidad de introducir ninguna tarjeta de crédito. Puede cargar materias, asignar maestros y probar los boletines con total libertad.
                </p>
              )}
            </div>

            {/* FAQ 2 */}
            <div className="p-5 bg-slate-900/70 rounded-2xl border border-slate-800 transition">
              <button
                type="button"
                onClick={() => toggleFaq(2)}
                className="w-full flex items-center justify-between text-left text-sm font-bold text-white cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <HelpCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>¿Cómo se realiza el pago mediante QR Simple en Bolivia?</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === 2 ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === 2 && (
                <div className="mt-3 text-xs text-slate-400 leading-relaxed pl-7 border-t border-slate-800/60 pt-3 space-y-2">
                  <p>
                    El sistema cuenta con un código QR Simple oficial interoperable. Puede escanearlo desde la banca móvil de cualquier banco de Bolivia (Banco Unión, BCP, BNB, Banco Sol, Banco FIE, BMSC, etc.) en Bolivianos (BOB).
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="text-emerald-400 font-bold hover:underline inline-flex items-center space-x-1 cursor-pointer font-mono"
                  >
                    <span>[Click aquí para abrir el QR oficial de pago directo]</span>
                  </button>
                </div>
              )}
            </div>

            {/* FAQ 3 */}
            <div className="p-5 bg-slate-900/70 rounded-2xl border border-slate-800 transition">
              <button
                type="button"
                onClick={() => toggleFaq(3)}
                className="w-full flex items-center justify-between text-left text-sm font-bold text-white cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <HelpCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>¿Cómo funciona el bloqueo de notas y aprobación de Director?</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === 3 ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === 3 && (
                <p className="mt-3 text-xs text-slate-400 leading-relaxed pl-7 border-t border-slate-800/60 pt-3">
                  Una vez que el maestro concluye el llenado del trimestre y presiona "Aprobar y Finalizar", las notas se congelan automáticamente impidiendo alteraciones en trimestres posteriores. Si se requiere una rectificación, el Director de la Unidad Educativa es el único facultado para habilitar la edición de manera temporal y controlada.
                </p>
              )}
            </div>

            {/* FAQ 4 */}
            <div className="p-5 bg-slate-900/70 rounded-2xl border border-slate-800 transition">
              <button
                type="button"
                onClick={() => toggleFaq(4)}
                className="w-full flex items-center justify-between text-left text-sm font-bold text-white cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <HelpCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>¿Puedo importar mi lista de estudiantes desde el SIGED oficial?</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === 4 ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === 4 && (
                <p className="mt-3 text-xs text-slate-400 leading-relaxed pl-7 border-t border-slate-800/60 pt-3">
                  Sí. Nuestro módulo de Importación RUDE acepta directamente las planillas descargadas del sistema del Ministerio de Educación en formato Excel (.xlsx). Mapea de forma automática los códigos RUDE, Cédula de Identidad, nombres y apellidos sin requerir transcripciones manuales.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Futuristic Footer */}
      <footer className="mt-auto bg-slate-950 text-slate-400 py-14 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
            <div className="flex items-center space-x-3.5">
              <div className="bg-emerald-600 text-slate-950 p-2 rounded-xl">
                <School className="w-5 h-5" />
              </div>
              <div>
                <span className="font-mono font-bold text-white text-base">SIGMA-SEP SaaS</span>
                <p className="text-[11px] text-slate-400">Sistema Integral de Gestión de Maestros y Administración Educativa</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-mono font-semibold text-slate-300">
              <Link to="/login" className="hover:text-emerald-400 transition">Acceso Maestros</Link>
              <Link to="/registro-colegio" className="hover:text-emerald-400 transition">Crear Colegio</Link>
              <a href="#planes" className="hover:text-emerald-400 transition">Planes & Tarifas</a>
              <a
                href="https://wa.me/59171523780"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
              >
                <span>WhatsApp: +591 71523780</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4 font-mono">
            <div>
              © 2026 SIGMA-SEP Bolivia. Desarrollado con tecnología de alta disponibilidad para el Subsistema de Educación Regular.
            </div>
            <div className="flex items-center space-x-4">
              <span>La Paz • El Alto • Cochabamba • Santa Cruz</span>
              <span className="text-emerald-400">● 99.98% SLA</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal QR Simple Interoperable */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl shadow-emerald-950/80 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/30">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Pago con QR Simple Interoperable</h3>
                  <p className="text-[11px] font-mono text-emerald-400">Banca Móvil Oficial de Bolivia</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white text-sm font-mono font-bold p-1.5 cursor-pointer rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 text-center space-y-4">
              <div className="p-4 bg-white rounded-2xl inline-block shadow-lg border-2 border-slate-300">
                <img
                  src={qrImg}
                  alt="QR Simple Oficial"
                  className="w-56 h-56 object-contain mx-auto"
                />
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left text-xs font-mono space-y-2">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Destino / Beneficiario:</span>
                  <strong className="text-emerald-400">SIGMA SaaS Bolivia</strong>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Bancos Habilitados:</span>
                  <span className="text-[10px] text-slate-400">Unión, BNB, BCP, Sol, FIE, BMSC</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Moneda:</span>
                  <span className="font-bold text-white">Bolivianos (BOB)</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Monto Referencial:</span>
                  <span className="text-emerald-400 font-bold">Bs. 250 (Mes) / Bs. 2.400 (Año)</span>
                </div>
                <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800">
                  <span>Glosa Recomendada:</span>
                  <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-amber-300 border border-slate-700">
                    SIGMA - [Nombre Colegio]
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <a
                  href={qrImg}
                  download="qr-simple-sigma-bolivia.png"
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-xl flex items-center justify-center space-x-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar QR</span>
                </a>
                <a
                  href="https://wa.me/59171523780?text=Hola,%20acabo%20de%20realizar%20el%20pago%20con%20QR%20para%20activar%20mi%20colegio%20en%20SIGMA"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-black rounded-xl flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition"
                >
                  <span>Enviar Comprobante (+591 71523780)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
