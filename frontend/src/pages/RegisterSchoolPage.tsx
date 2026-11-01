import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  School,
  User,
  Building,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Lock,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

export const RegisterSchoolPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get('plan') || 'PLAN_PRO';
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Director
    nombres: '',
    primerApellido: '',
    segundoApellido: '',
    ci: '',
    email: '',
    password: '',
    telefono: '',

    // Step 2: Unidad Educativa
    sie: '',
    nombreColegio: '',
    departamento: 'La Paz',
    provincia: 'Murillo',
    municipio: 'La Paz',
    distrito: 'La Paz 1',
    tipo: 'FISCAL',
    nivel: 'INTEGRADO',

    // Step 3: Plan
    planCodigo: initialPlan,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateStep1 = () => {
    if (!formData.nombres || !formData.primerApellido || !formData.ci || !formData.email || !formData.password) {
      setError('Por favor completa todos los campos requeridos del Director.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!formData.sie || !formData.nombreColegio || !formData.departamento || !formData.provincia || !formData.municipio) {
      setError('Por favor completa los datos oficiales de la Unidad Educativa.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/register-school', formData);
      const data = res.data;

      // Guardar tokens y contexto
      if (data.tokens?.accessToken) {
        localStorage.setItem('sigma_access_token', data.tokens.accessToken);
        localStorage.setItem('sigma_refresh_token', data.tokens.refreshToken);
        localStorage.setItem('sigma_current_institution_id', data.institution.id);
        localStorage.setItem('sigma_user', JSON.stringify(data.user));

        // Auto login en el cliente
        await login(formData.email, formData.password);
        navigate('/');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Ocurrió un error al registrar la Unidad Educativa. Por favor verifica que el código SIE o el correo no estén repetidos.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Bolivian Tricolor Accent Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 flex z-50">
        <div className="w-1/3 bg-[#D52B1E]" />
        <div className="w-1/3 bg-[#FCD116]" />
        <div className="w-1/3 bg-[#007934]" />
      </div>

      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/landing" className="inline-flex items-center space-x-2 text-emerald-700 hover:text-emerald-800 text-xs font-bold mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a la página principal</span>
          </Link>
          <div className="inline-flex items-center justify-center bg-emerald-600 text-white w-12 h-12 rounded-2xl shadow-md shadow-emerald-200 mb-3">
            <School className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Registro de Nueva Unidad Educativa</h1>
          <p className="text-xs text-slate-500 mt-1">
            Comienza tu prueba gratuita de 14 días en SIGMA-SEP • Gestión Escolar 2026
          </p>

          {/* Stepper Wizard Indicator */}
          <div className="flex items-center justify-center space-x-4 mt-6">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>
                1
              </div>
              <span className="text-xs hidden sm:inline">Director(a)</span>
            </div>
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>
                2
              </div>
              <span className="text-xs hidden sm:inline">Colegio & SIE</span>
            </div>
            <div className={`w-8 h-0.5 ${step >= 3 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>
                3
              </div>
              <span className="text-xs hidden sm:inline">Plan & Trial</span>
            </div>
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-red-700 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* STEP 1: DATOS DEL DIRECTOR */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Paso 1: Datos de la Autoridad o Director</h3>
                  <p className="text-xs text-slate-500">Esta cuenta tendrá rol de Administrador Institucional en el sistema.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombres *</label>
                    <input
                      type="text"
                      name="nombres"
                      required
                      value={formData.nombres}
                      onChange={handleChange}
                      placeholder="ej. Elena"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Primer Apellido *</label>
                    <input
                      type="text"
                      name="primerApellido"
                      required
                      value={formData.primerApellido}
                      onChange={handleChange}
                      placeholder="ej. Flores"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Segundo Apellido</label>
                    <input
                      type="text"
                      name="segundoApellido"
                      value={formData.segundoApellido}
                      onChange={handleChange}
                      placeholder="ej. Mamani"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cédula de Identidad (CI) *</label>
                    <input
                      type="text"
                      name="ci"
                      required
                      value={formData.ci}
                      onChange={handleChange}
                      placeholder="ej. 6849302"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Institucional *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="ej. direccion@colegio.edu.bo"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="ej. 71542389"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña de Acceso *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-200 flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <span>Siguiente: Datos del Colegio</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DATOS DEL COLEGIO */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Paso 2: Datos Oficiales de la Unidad Educativa</h3>
                  <p className="text-xs text-slate-500">Información reconocida por el Ministerio de Educación de Bolivia (SEP).</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Código SIE Oficial *</label>
                    <input
                      type="text"
                      name="sie"
                      required
                      value={formData.sie}
                      onChange={handleChange}
                      placeholder="ej. 80730099"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de la Unidad Educativa *</label>
                    <input
                      type="text"
                      name="nombreColegio"
                      required
                      value={formData.nombreColegio}
                      onChange={handleChange}
                      placeholder="ej. Unidad Educativa San Simón de Ayacucho"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Departamento *</label>
                    <select
                      name="departamento"
                      value={formData.departamento}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    >
                      <option value="La Paz">La Paz</option>
                      <option value="Cochabamba">Cochabamba</option>
                      <option value="Santa Cruz">Santa Cruz</option>
                      <option value="Oruro">Oruro</option>
                      <option value="Potosí">Potosí</option>
                      <option value="Chuquisaca">Chuquisaca</option>
                      <option value="Tarija">Tarija</option>
                      <option value="Beni">Beni</option>
                      <option value="Pando">Pando</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Provincia *</label>
                    <input
                      type="text"
                      name="provincia"
                      required
                      value={formData.provincia}
                      onChange={handleChange}
                      placeholder="ej. Murillo"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Municipio *</label>
                    <input
                      type="text"
                      name="municipio"
                      required
                      value={formData.municipio}
                      onChange={handleChange}
                      placeholder="ej. La Paz"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Distrito Educativo</label>
                    <input
                      type="text"
                      name="distrito"
                      value={formData.distrito}
                      onChange={handleChange}
                      placeholder="ej. La Paz 1"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dependencia / Tipo</label>
                    <select
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    >
                      <option value="FISCAL">Fiscal (Pública del Estado)</option>
                      <option value="CONVENIO">De Convenio</option>
                      <option value="PRIVADA">Privada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Niveles Educativos</label>
                    <select
                      name="nivel"
                      value={formData.nivel}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    >
                      <option value="INTEGRADO">Integrado (Primaria y Secundaria)</option>
                      <option value="SECUNDARIA">Solo Secundaria</option>
                      <option value="PRIMARIA">Solo Primaria</option>
                      <option value="INICIAL">Solo Inicial</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-200 flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <span>Siguiente: Selección de Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PLAN & ACTIVACIÓN TRIAL */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800">Paso 3: Plan de Suscripción & Prueba Gratuita</h3>
                  <p className="text-xs text-slate-500">Selecciona el plan para iniciar tus 14 días de prueba completa.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                    formData.planCodigo === 'PLAN_BASIC' ? 'border-emerald-600 bg-emerald-50/40' : 'border-slate-200 bg-white'
                  }`}>
                    <div>
                      <input
                        type="radio"
                        name="planCodigo"
                        value="PLAN_BASIC"
                        checked={formData.planCodigo === 'PLAN_BASIC'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="text-xs font-bold text-slate-900 block">Básico / Rural</span>
                      <span className="text-lg font-black text-slate-800 mt-1 block">Bs. 0</span>
                      <span className="text-[11px] text-slate-500 mt-2 block">Hasta 100 alumnos y 8 profesores.</span>
                    </div>
                  </label>

                  <label className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between relative ${
                    formData.planCodigo === 'PLAN_PRO' ? 'border-emerald-600 bg-emerald-50/40' : 'border-slate-200 bg-white'
                  }`}>
                    <div className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                      Recomendado
                    </div>
                    <div>
                      <input
                        type="radio"
                        name="planCodigo"
                        value="PLAN_PRO"
                        checked={formData.planCodigo === 'PLAN_PRO'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="text-xs font-bold text-slate-900 block">Colegio Pro</span>
                      <span className="text-lg font-black text-emerald-700 mt-1 block">Bs. 250 / mes</span>
                      <span className="text-[11px] text-slate-500 mt-2 block">Hasta 1.200 alumnos, libretas oficiales y kardex.</span>
                    </div>
                  </label>

                  <label className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                    formData.planCodigo === 'PLAN_ENTERPRISE' ? 'border-emerald-600 bg-emerald-50/40' : 'border-slate-200 bg-white'
                  }`}>
                    <div>
                      <input
                        type="radio"
                        name="planCodigo"
                        value="PLAN_ENTERPRISE"
                        checked={formData.planCodigo === 'PLAN_ENTERPRISE'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="text-xs font-bold text-slate-900 block">Red / Distrito</span>
                      <span className="text-lg font-black text-purple-700 mt-1 block">Bs. 600 / mes</span>
                      <span className="text-[11px] text-slate-500 mt-2 block">Alumnos ilimitados y multi-colegio centralizado.</span>
                    </div>
                  </label>
                </div>

                {/* Trial Guarantee Callout */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-emerald-900">
                  <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold">Garantía de Prueba Gratuita (14 Días)</p>
                    <p className="text-slate-600 leading-relaxed">
                      Tu colegio se activará de forma inmediata. No te pediremos tarjeta de crédito ni compromiso de pago. Durante el período de prueba podrás cargar alumnos, evaluar en las 4 dimensiones y generar boletines oficiales.
                    </p>
                  </div>
                </div>

                {/* Resumen */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                  <p className="font-bold text-slate-800">Resumen de Registro:</p>
                  <p className="text-slate-600">• Colegio: <span className="font-semibold text-slate-800">{formData.nombreColegio}</span> (SIE: {formData.sie})</p>
                  <p className="text-slate-600">• Ubicación: {formData.municipio}, {formData.provincia} - {formData.departamento}</p>
                  <p className="text-slate-600">• Director: {formData.nombres} {formData.primerApellido} (CI: {formData.ci})</p>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-200 flex items-center space-x-2 transition cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Creando Unidad Educativa...</span>
                    ) : (
                      <>
                        <span>Activar Colegio & Comenzar</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-slate-400">
          ¿Ya tienes una cuenta registrada?{' '}
          <Link to="/login" className="font-bold text-emerald-600 hover:underline">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
};
