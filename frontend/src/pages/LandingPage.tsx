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
  ChevronRight,
  QrCode,
  Building,
  HelpCircle,
  Download,
} from 'lucide-react';
import qrImg from '../assets/qr.png';

export const LandingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [showQrModal, setShowQrModal] = useState(false);
  const navigate = useNavigate();

  const handleSelectPlan = (planCodigo: string) => {
    navigate(`/registro-colegio?plan=${planCodigo}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Bolivian Tricolor Accent Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 flex z-50">
        <div className="w-1/3 bg-[#D52B1E]" />
        <div className="w-1/3 bg-[#FCD116]" />
        <div className="w-1/3 bg-[#007934]" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-1.5 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-md shadow-emerald-200">
              <School className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900">SIGMA-SEP</span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                SaaS Bolivia
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <a href="#caracteristicas" className="hover:text-emerald-700 transition">Características</a>
            <a href="#planes" className="hover:text-emerald-700 transition">Planes & Precios</a>
            <a href="#normativa" className="hover:text-emerald-700 transition">Normativa SEP</a>
            <a href="#faq" className="hover:text-emerald-700 transition">Preguntas Frecuentes</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Ingresar al Sistema
            </Link>
            <Link
              to="/registro-colegio"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 rounded-xl flex items-center space-x-1.5 transition"
            >
              <span>Prueba Gratis 14 Días</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden bg-gradient-to-b from-emerald-50/50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-900 text-xs font-bold mb-6">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Actualizado a la Gestión Escolar 2026 • Estado Plurinacional de Bolivia</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            El Sistema Cloud de <span className="text-emerald-600 underline decoration-amber-400 decoration-wavy decoration-2">Gestión Educativa</span> y Cuaderno Pedagógico #1 de Bolivia
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Diseñado exclusivamente bajo el currículo del Ministerio de Educación (Ley 070). Calificaciones en las 4 dimensiones, boletines oficiales, centralizadores, kardex y asistencia en una sola plataforma multi-tenant.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/registro-colegio"
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-300/40 flex items-center justify-center space-x-2 transition text-sm cursor-pointer"
            >
              <span>Crear mi Colegio Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl shadow-sm transition text-sm cursor-pointer"
            >
              Ver Demo Interactiva
            </Link>
          </div>

          {/* Key Trust Badges */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
              <Award className="w-8 h-8 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">100% Ley 070</p>
                <p className="text-[11px] text-slate-500">SER, SABER, HACER, DECIDIR</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
              <FileSpreadsheet className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">Formatos Oficiales</p>
                <p className="text-[11px] text-slate-500">Boletines y Centralizadores</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
              <ShieldCheck className="w-8 h-8 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">Aislamiento Seguro</p>
                <p className="text-[11px] text-slate-500">Multi-Tenant por SIE</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
              <QrCode className="w-8 h-8 text-purple-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">Pagos con QR Simple</p>
                <p className="text-[11px] text-slate-500">Activación instantánea BOB</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="caracteristicas" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full inline-block mb-2">
              Funcionalidades Diseñadas para Maestros y Directores
            </h2>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              Todo lo que un Colegio Boliviano necesita para operar con excelencia
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mb-4 font-bold">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Cuaderno Pedagógico 4D</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cálculo automático con ponderaciones oficiales: SER (10 pts), SABER (35 pts), HACER (35 pts), DECIDIR (10 pts), Autoevaluación (10 pts) y casilla de Puntos Extras.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mb-4 font-bold">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Centralizadores & Boletines</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Genera libretas oficiales trimestrales y anuales en un clic. Descarga reportes completos en PDF listos para imprimir con firmas y sellos reglamentarios.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center mb-4 font-bold">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Kardex Disciplinario & Asistencia</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Control de faltas con o sin licencia, retrasos y seguimiento de conducta. Emite citaciones a padres de familia con fecha y hora programada.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center mb-4 font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Horarios & Aulas</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Distribución inteligente de periodos de 45 minutos por día de la semana y turno. Visualización por maestro y por paralelo escolar sin choques.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center mb-4 font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Multi-Colegio para Maestros</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Los docentes que dictan en dos unidades educativas (mañana y tarde) acceden con una sola cuenta y cambian de colegio con un solo clic.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center mb-4 font-bold">
                <Building className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Importación RUDE / RDA</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Carga la nómina oficial de alumnos y docentes directamente desde las planillas Excel del Ministerio de Educación (SIGED) en segundos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Matrix */}
      <section id="planes" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full inline-block mb-2">
              Planes Transparentes en Bolivianos (BOB)
            </h2>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              Precios justos adaptados a cada Unidad Educativa
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              Todos los planes incluyen 14 días de prueba gratis. Sin contratos forzosos. Paga fácilmente mediante QR Simple Interoperable de cualquier banco.
            </p>

            {/* Toggle Monthly / Annual */}
            <div className="mt-8 inline-flex items-center p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pago Mensual
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                  billingCycle === 'annual'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Pago Anual</span>
                <span className="text-[10px] bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full font-black uppercase">
                  Ahorra 20%
                </span>
              </button>
            </div>

            {/* Acceso Rápido a QR Simple Oficial */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-800 bg-emerald-100/90 hover:bg-emerald-200 px-4 py-2 rounded-xl transition cursor-pointer shadow-sm border border-emerald-200"
              >
                <QrCode className="w-4 h-4 text-emerald-700" />
                <span>Ver QR Simple Interoperable de Pago Directo</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {/* Plan 1: Básico */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Plan Básico / Rural</h4>
                <p className="text-xs text-slate-500 mt-1">Para maestros individuales o escuelas rurales pequeñas.</p>
                
                <div className="my-6">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-black text-slate-900">Bs. 0</span>
                    <span className="text-xs text-slate-500 font-medium">/ para siempre</span>
                  </div>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">Gratuito para comunidades rurales</p>
                </div>

                <div className="space-y-3 border-t border-slate-100 pt-6 text-xs text-slate-700">
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Hasta 100 estudiantes inscritos</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Hasta 8 maestros vinculados</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Evaluación 4D SER/SABER/HACER/DECIDIR</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Control de asistencia mensual</span>
                  </div>
                  <div className="flex items-center space-x-2.5 text-slate-400 line-through">
                    <CheckCircle2 className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    <span>Boletines oficiales sin marca de agua</span>
                  </div>
                  <div className="flex items-center space-x-2.5 text-slate-400 line-through">
                    <CheckCircle2 className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    <span>Logo y firmas institucionales</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => handleSelectPlan('PLAN_BASIC')}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Comenzar Gratis
                </button>
              </div>
            </div>

            {/* Plan 2: Colegio Profesional (Destacado) */}
            <div className="bg-white rounded-3xl border-2 border-emerald-600 p-8 shadow-xl shadow-emerald-100/70 flex flex-col justify-between relative">
              <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Más Elegido por Directores
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900">Colegio Profesional</h4>
                <p className="text-xs text-slate-500 mt-1">Para unidades educativas fiscales, de convenio y privadas.</p>
                
                <div className="my-6">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-4xl font-black text-slate-900">
                      Bs. {billingCycle === 'annual' ? '2.400' : '250'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {billingCycle === 'annual' ? '/ año completo' : '/ mes'}
                    </span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-[11px] text-emerald-700 font-bold mt-1">
                      Equivale a solo Bs. 200/mes (2 meses gratis)
                    </p>
                  )}
                </div>

                <div className="space-y-3 border-t border-slate-100 pt-6 text-xs text-slate-700">
                  <div className="flex items-center space-x-2.5 font-semibold text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Hasta 1.200 estudiantes y 60 maestros</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Libretas y Boletines Oficiales SEP sin marca de agua</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Kardex disciplinario pedagógico & Citaciones</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Horarios escolares y distribución de aulas</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Importación masiva desde Excel RUDE/SIGED</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Soporte prioritario por WhatsApp</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => handleSelectPlan('PLAN_PRO')}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-200 transition cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <span>Probar 14 días gratis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Plan 3: Red Educativa / Enterprise */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Red Educativa / Distrito</h4>
                <p className="text-xs text-slate-500 mt-1">Para órdenes religiosas, redes de convenio o distritos.</p>
                
                <div className="my-6">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-black text-slate-900">
                      Bs. {billingCycle === 'annual' ? '5.800' : '600'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {billingCycle === 'annual' ? '/ año' : '/ mes'}
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-600 font-semibold mt-1">Multi-colegio unificado</p>
                </div>

                <div className="space-y-3 border-t border-slate-100 pt-6 text-xs text-slate-700">
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span>Estudiantes y maestros ILIMITADOS</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span>Múltiples unidades educativas centralizadas</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span>Panel de supervisión distrital consolidado</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span>Personalización de dominio (ej. colegio.edu.bo)</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span>Capacitación virtual a todo el plantel docente</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => handleSelectPlan('PLAN_ENTERPRISE')}
                  className="w-full py-3 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Contactar Asesor
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Preguntas Frecuentes</h3>
            <p className="text-xs text-slate-500 mt-2">Respuestas claras sobre la adopción de SIGMA en tu colegio</p>
          </div>

          <div className="space-y-4">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>¿Cómo funciona el período de prueba de 14 días?</span>
              </h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed pl-6">
                Al registrar tu colegio recibes acceso completo al Plan Profesional por 14 días sin ingresar ninguna tarjeta de crédito. Puedes cargar tus cursos, notas y probar los boletines con tus docentes sin ningún compromiso.
              </p>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>¿Cómo realizo el pago de la suscripción en Bolivia?</span>
              </h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed pl-6">
                El sistema genera un código QR Simple interoperable oficial. Puedes escanearlo desde la aplicación de cualquier banco boliviano (Banco Unión, BMSC, BNB, BCP, Banco FIE, Banco Sol, etc.) o realizar transferencia directa.{' '}
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="text-emerald-700 font-bold hover:underline inline-flex items-center space-x-1 cursor-pointer"
                >
                  <span>[Ver Código QR de Pago Directo]</span>
                </button>
              </p>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>¿Cumple con el modelo de evaluación de la Ley 070?</span>
              </h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed pl-6">
                Totalmente. El sistema calcula exactamente las dimensiones SER (10), SABER (35), HACER (35), DECIDIR (10) y la Autoevaluación (10), con soporte reglamentario para los Puntos Extras y el boletín oficial de calificaciones del SEP.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
              <School className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-sm">SIGMA-SEP SaaS</span>
            <span>• Gestión Educativa para Bolivia</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link to="/login" className="hover:text-white transition">Acceso Maestros</Link>
            <Link to="/registro-colegio" className="hover:text-white transition">Crear Colegio</Link>
            <span>La Paz • Bolivia</span>
          </div>
        </div>
      </footer>

      {/* Modal QR Oficial en Landing Page */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Pago con QR Simple Interoperable</h3>
                  <p className="text-[11px] text-slate-500">Banca Móvil Oficial de Bolivia</p>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1.5 cursor-pointer rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 text-center space-y-4">
              <div className="relative inline-block mx-auto group">
                <img
                  src={qrImg}
                  alt="QR Simple"
                  className="w-60 h-60 mx-auto rounded-2xl shadow-lg border-4 border-white object-contain bg-white transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Destino / Beneficiario:</span>
                  <strong className="text-slate-900">SIGMA SaaS Bolivia</strong>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Bancos Habilitados:</span>
                  <span className="text-[11px] font-semibold text-emerald-800">Unión, BNB, BCP, BMSC, Sol, FIE</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Moneda:</span>
                  <span className="font-bold text-slate-900">Bolivianos (BOB)</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Glosa Sugerida:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">Suscripción - [Nombre Colegio]</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <a
                  href={qrImg}
                  download="qr-pago-sigma.png"
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar QR</span>
                </a>
                <a
                  href="https://wa.me/59170000000?text=Hola,%20acabo%20de%20realizar%20el%20pago%20con%20QR%20para%20activar%20mi%20colegio%20en%20SIGMA"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1 shadow-md shadow-emerald-200 transition"
                >
                  <span>Enviar Comprobante WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

