import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { formatRol, formatTipoInstitucion, formatNivelEducativo } from '../utils/formatters';
import {
  Building2,
  School,
  GraduationCap,
  Users,
  BookOpenCheck,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  CreditCard,
  Search,
  Plus,
  Edit2,
  Trash2,
  Power,
  Lock,
  Unlock,
  AlertTriangle,
  X,
  Clock,
  Sparkles,
  Download,
  Eye,
  Check,
  Phone,
  MapPin,
  QrCode,
  ShieldAlert,
  Bell,
  RefreshCw,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getStoredInstitutions,
  addStoredInstitution,
  updateStoredInstitution,
  deleteStoredInstitution,
  suspendInstitution,
  activateInstitution,
  getStoredPayments,
  approvePayment,
  rejectPayment,
  registerManualPayment,
  getGlobalAnnouncement,
  saveGlobalAnnouncement,
  type TenantInstitution,
  type TenantPayment,
  type GlobalAnnouncement,
} from '../utils/multiTenantStore';

export const DashboardPage: React.FC = () => {
  const { user, currentInstitutionId, setCurrentInstitutionId, effectiveRole, isSuperAdmin, isDirector, isMaestro } = useAuth();
  const navigate = useNavigate();

  // Estados generales
  const [institutions, setInstitutions] = useState<TenantInstitution[]>(() => getStoredInstitutions());
  const [payments, setPayments] = useState<TenantPayment[]>(() => getStoredPayments());
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(() => getGlobalAnnouncement());
  const [feedback, setFeedback] = useState<string | null>(null);

  // Tab activo del Superadmin: 'colegios' | 'pagos' | 'comunicados' | 'metricas'
  const [activeTab, setActiveTab] = useState<'colegios' | 'pagos' | 'comunicados' | 'metricas'>('colegios');

  // Filtros de colegios
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepto, setFilterDepto] = useState('TODOS');
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'ACTIVO' | 'SUSPENDIDO'>('TODOS');

  // Modales
  const [showInstModal, setShowInstModal] = useState(false);
  const [instModalMode, setInstModalMode] = useState<'create' | 'edit'>('create');
  const [selectedInst, setSelectedInst] = useState<TenantInstitution | null>(null);

  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<TenantInstitution | null>(null);
  const [suspendReasonPreset, setSuspendReasonPreset] = useState('Regularización de Suscripción SaaS (Plan pendiente de pago o vencido)');
  const [suspendReasonCustom, setSuspendReasonCustom] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);

  // Formulario Colegio
  const [instForm, setInstForm] = useState({
    sie: '',
    nombre: '',
    departamento: 'La Paz',
    provincia: 'Murillo',
    municipio: 'La Paz',
    distrito: 'La Paz 1',
    direccion: '',
    telefono: '',
    tipo: 'FISCAL',
    nivel: 'INTEGRADO',
  });

  // Formulario Pago Manual
  const [paymentForm, setPaymentForm] = useState({
    sie: '',
    colegioNombre: '',
    plan: 'Colegio Profesional (SaaS Cloud)',
    periodo: 'ANUAL' as 'MENSUAL' | 'ANUAL',
    monto: 2400,
    metodo: 'QR_SIMPLE' as 'QR_SIMPLE' | 'TRANSFERENCIA_BANCARIA' | 'EFECTIVO',
    referenciaBancaria: '',
    observaciones: 'Activación manual por administración.',
  });

  // Formulario Comunicado
  const [announceForm, setAnnounceForm] = useState({
    tipo: (announcement?.tipo || 'IMPORTANTE') as 'INFO' | 'ALERTA' | 'IMPORTANTE',
    titulo: announcement?.titulo || '',
    mensaje: announcement?.mensaje || '',
  });
  const [announceFeedback, setAnnounceFeedback] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Sincronizar formulario si cambia el anuncio almacenado
  useEffect(() => {
    if (announcement) {
      setAnnounceForm({
        tipo: announcement.tipo,
        titulo: announcement.titulo,
        mensaje: announcement.mensaje,
      });
    }
  }, [announcement]);

  // Carga reactiva de eventos
  useEffect(() => {
    const handleInstUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setInstitutions(e.detail);
      else setInstitutions(getStoredInstitutions());
    };
    const handlePayUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setPayments(e.detail);
      else setPayments(getStoredPayments());
    };
    const handleAnnUpdate = (e: any) => {
      setAnnouncement(e.detail);
    };

    window.addEventListener('sigma_institutions_updated', handleInstUpdate);
    window.addEventListener('sigma_payments_updated', handlePayUpdate);
    window.addEventListener('sigma_announcement_updated', handleAnnUpdate);

    return () => {
      window.removeEventListener('sigma_institutions_updated', handleInstUpdate);
      window.removeEventListener('sigma_payments_updated', handlePayUpdate);
      window.removeEventListener('sigma_announcement_updated', handleAnnUpdate);
    };
  }, []);

  // Cálculos estadísticos
  const totalColegios = institutions.length;
  const colegiosActivos = institutions.filter((i) => i.activo !== false).length;
  const colegiosSuspendidos = totalColegios - colegiosActivos;

  const pagosPendientes = payments.filter((p) => p.estado === 'PENDIENTE');
  const pagosAprobados = payments.filter((p) => p.estado === 'APROBADO');
  const totalRecaudado = pagosAprobados.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);

  // Filtrado de colegios
  const filteredInstitutions = institutions.filter((inst) => {
    const matchSearch =
      inst.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.sie.includes(searchTerm) ||
      inst.departamento.toLowerCase().includes(searchTerm.toLowerCase());

    const matchDepto = filterDepto === 'TODOS' || inst.departamento.toUpperCase() === filterDepto.toUpperCase();
    const matchStatus =
      filterStatus === 'TODOS' ||
      (filterStatus === 'ACTIVO' && inst.activo !== false) ||
      (filterStatus === 'SUSPENDIDO' && inst.activo === false);

    return matchSearch && matchDepto && matchStatus;
  });

  // Handlers CRUD Colegios
  const handleOpenCreateInst = () => {
    setInstModalMode('create');
    setSelectedInst(null);
    setInstForm({
      sie: '',
      nombre: '',
      departamento: 'La Paz',
      provincia: 'Murillo',
      municipio: 'La Paz',
      distrito: 'La Paz 1',
      direccion: '',
      telefono: '',
      tipo: 'FISCAL',
      nivel: 'INTEGRADO',
    });
    setShowInstModal(true);
  };

  const handleOpenEditInst = (inst: TenantInstitution) => {
    setInstModalMode('edit');
    setSelectedInst(inst);
    setInstForm({
      sie: inst.sie,
      nombre: inst.nombre,
      departamento: inst.departamento || 'La Paz',
      provincia: inst.provincia || 'Murillo',
      municipio: inst.municipio || 'La Paz',
      distrito: inst.distrito || 'La Paz 1',
      direccion: inst.direccion || '',
      telefono: inst.telefono || '',
      tipo: inst.tipo || 'FISCAL',
      nivel: inst.nivel || 'INTEGRADO',
    });
    setShowInstModal(true);
  };

  const handleSaveInst = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instForm.sie.trim() || !instForm.nombre.trim()) {
      alert('El código SIE y el Nombre son campos obligatorios.');
      return;
    }

    if (instModalMode === 'create') {
      const newInst: TenantInstitution = {
        id: `inst-${instForm.sie.trim()}`,
        sie: instForm.sie.trim(),
        nombre: instForm.nombre.trim(),
        departamento: instForm.departamento,
        provincia: instForm.provincia,
        municipio: instForm.municipio,
        distrito: instForm.distrito,
        direccion: instForm.direccion,
        telefono: instForm.telefono,
        tipo: instForm.tipo,
        nivel: instForm.nivel,
        activo: true,
        totalMaestrosVinculados: 0,
      };
      addStoredInstitution(newInst);
      setFeedback(`✅ Unidad Educativa "${newInst.nombre}" (SIE: ${newInst.sie}) registrada exitosamente.`);
    } else if (selectedInst) {
      const updated: TenantInstitution = {
        ...selectedInst,
        sie: instForm.sie.trim(),
        nombre: instForm.nombre.trim(),
        departamento: instForm.departamento,
        provincia: instForm.provincia,
        municipio: instForm.municipio,
        distrito: instForm.distrito,
        direccion: instForm.direccion,
        telefono: instForm.telefono,
        tipo: instForm.tipo,
        nivel: instForm.nivel,
      };
      updateStoredInstitution(updated);
      setFeedback(`✅ Unidad Educativa "${updated.nombre}" actualizada correctamente.`);
    }

    setShowInstModal(false);
  };

  const handleDeleteInst = (inst: TenantInstitution) => {
    const confirmName = prompt(
      `⚠️ ¿Estás completamente seguro de eliminar el colegio "${inst.nombre}" (SIE: ${inst.sie})?\nEscribe "ELIMINAR" para confirmar:`
    );
    if (confirmName === 'ELIMINAR') {
      deleteStoredInstitution(inst.id);
      setFeedback(`🗑️ Unidad Educativa "${inst.nombre}" eliminada del sistema.`);
    }
  };

  // Suspensión / Activación
  const handleOpenSuspendModal = (inst: TenantInstitution) => {
    setSuspendTarget(inst);
    setSuspendReasonPreset('Regularización de Suscripción SaaS (Plan pendiente de pago o vencido)');
    setSuspendReasonCustom('');
    setShowSuspendModal(true);
  };

  const handleConfirmSuspend = () => {
    if (!suspendTarget) return;
    const finalReason =
      suspendReasonPreset === 'Otro motivo justificado' && suspendReasonCustom.trim()
        ? suspendReasonCustom.trim()
        : suspendReasonPreset + (suspendReasonCustom.trim() ? `: ${suspendReasonCustom.trim()}` : '');

    suspendInstitution(suspendTarget.sie, finalReason);
    setShowSuspendModal(false);
    setFeedback(`🔒 "${suspendTarget.nombre}" ha sido SUSPENDIDA formalmente.`);
  };

  const handleQuickActivate = (inst: TenantInstitution) => {
    activateInstitution(inst.sie);
    setFeedback(`🔓 "${inst.nombre}" ha sido REACTIVADA exitosamente para operar.`);
  };

  const handleImpersonate = (inst: TenantInstitution) => {
    setCurrentInstitutionId(inst.id);
    navigate('/academic');
  };

  // Handlers Pagos
  const handleApprovePay = (payId: string) => {
    const ok = approvePayment(payId, user?.persona?.nombres ? `${user.persona.nombres} ${user.persona.primerApellido}` : 'Superadministrador Nacional');
    if (ok) {
      setFeedback('✅ Pago verificado y aprobado. El colegio ha sido activado inmediatamente.');
    }
  };

  const handleRejectPay = (payId: string) => {
    const motivo = prompt('Ingresa el motivo del rechazo del comprobante de pago:');
    if (motivo) {
      rejectPayment(payId, 'Superadministrador Nacional', motivo);
      setFeedback('❌ Pago rechazado y notificación registrada.');
    }
  };

  const handleOpenManualPay = (inst?: TenantInstitution) => {
    setPaymentForm({
      sie: inst ? inst.sie : (institutions[0]?.sie || ''),
      colegioNombre: inst ? inst.nombre : (institutions[0]?.nombre || ''),
      plan: 'Colegio Profesional (SaaS Cloud)',
      periodo: 'ANUAL',
      monto: 2400,
      metodo: 'QR_SIMPLE',
      referenciaBancaria: `BNB-AUT-${Date.now().toString().slice(-6)}`,
      observaciones: 'Activación y renovación formal de acceso.',
    });
    setShowPaymentModal(true);
  };

  const handleSaveManualPay = (e: React.FormEvent) => {
    e.preventDefault();
    const inst = institutions.find((i) => i.sie === paymentForm.sie);
    const colName = inst?.nombre || paymentForm.colegioNombre || 'Unidad Educativa';

    registerManualPayment({
      codigoTransaccion: `SIGMA-${paymentForm.sie}-${Date.now().toString().slice(-4)}`,
      sie: paymentForm.sie,
      colegioNombre: colName,
      plan: paymentForm.plan,
      periodo: paymentForm.periodo,
      monto: Number(paymentForm.monto),
      metodo: paymentForm.metodo,
      referenciaBancaria: paymentForm.referenciaBancaria || 'VALIDADO_POR_ADMIN',
      estado: 'APROBADO',
      fechaVerificacion: new Date().toLocaleDateString('es-BO'),
      verificadoPor: 'Superadministrador Nacional',
      observaciones: paymentForm.observaciones,
    });

    setShowPaymentModal(false);
    setFeedback(`✅ Pago registrado exitosamente de Bs. ${paymentForm.monto} para "${colName}". Colegio habilitado.`);
  };

  // Handlers Comunicado Global
  const handleOpenAnnounce = () => {
    setAnnounceForm({
      tipo: announcement?.tipo || 'IMPORTANTE',
      titulo: announcement?.titulo || '',
      mensaje: announcement?.mensaje || '',
    });
    setShowAnnounceModal(true);
  };

  const handleSaveAnnounce = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceForm.titulo.trim() || !announceForm.mensaje.trim()) {
      saveGlobalAnnouncement(null);
      setAnnouncement(null);
      setAnnounceFeedback({
        type: 'info',
        text: 'ℹ️ Comunicado global desactivado. Ya no se mostrará en los colegios.',
      });
      setFeedback('ℹ️ Comunicado global desactivado.');
    } else {
      const newAnn: GlobalAnnouncement = {
        id: `ann-${Date.now()}`,
        activo: true,
        tipo: announceForm.tipo,
        titulo: announceForm.titulo.trim(),
        mensaje: announceForm.mensaje.trim(),
        fecha: new Date().toLocaleDateString('es-BO'),
        autor: 'Superadministrador Nacional',
      };
      saveGlobalAnnouncement(newAnn);
      setAnnouncement(newAnn);
      setAnnounceFeedback({
        type: 'success',
        text: '✅ ¡Aviso guardado y publicado con éxito! Ahora es visible en la parte superior de las pantallas de todos los Directores y Docentes.',
      });
      setFeedback('📢 Comunicado global publicado y visible para todos los colegios.');
    }
    setShowAnnounceModal(false);
  };

  // Descarga de Respaldo Completo de Base de Datos
  const handleDownloadFullBackup = () => {
    const backupData = {
      sistema: 'SIGMA-SEP SaaS Bolivia',
      version: '2026.4',
      fechaRespaldo: new Date().toISOString(),
      instituciones: institutions,
      pagos: payments,
      comunicado: announcement,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIGMA_RESPALDO_GLOBAL_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback('💾 Respaldo JSON de toda la base de datos generado y descargado.');
  };

  return (
    <div className="space-y-6">
      {/* Comunicado Global Activo si existe */}
      {announcement && announcement.activo && (
        <div className={`p-4 rounded-2xl border flex items-start justify-between gap-3 shadow-sm ${announcement.tipo === 'ALERTA'
            ? 'bg-rose-50 border-rose-300 text-rose-950'
            : announcement.tipo === 'IMPORTANTE'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-blue-50 border-blue-300 text-blue-950'
          }`}>
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-white/80 shadow-xs shrink-0 mt-0.5">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="font-bold text-sm flex items-center gap-2">
                <span>{announcement.titulo}</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-white/80">
                  {announcement.tipo}
                </span>
              </div>
              <p className="text-xs mt-1 leading-relaxed text-slate-700">{announcement.mensaje}</p>
              <div className="text-[10px] text-slate-400 mt-1">
                Publicado por: {announcement.autor} • {announcement.fecha}
              </div>
            </div>
          </div>
          {isSuperAdmin && (
            <button
              onClick={handleOpenAnnounce}
              className="px-3 py-1 bg-white hover:bg-slate-100 border text-slate-700 text-xs font-bold rounded-lg shadow-2xs shrink-0 cursor-pointer"
            >
              Editar
            </button>
          )}
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Banner Superadmin */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-bold text-emerald-300 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Centro de Control Nacional • SIGMA-SEP SaaS Cloud Bolivia</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isSuperAdmin
                ? 'Panel de Control del Superadministrador'
                : `Bienvenido(a), ${user?.persona?.nombres || 'Docente'}`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {isSuperAdmin
                ? 'Supervisión integral de colegios de los 9 departamentos, verificación de pagos QR, suspensión y activación en tiempo real.'
                : 'Gestión institucional y seguimiento académico del Subsistema de Educación Regular.'}
            </p>
          </div>

          {isSuperAdmin && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleOpenCreateInst}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/30 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nuevo Colegio</span>
              </button>

              <button
                onClick={() => handleOpenManualPay()}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-amber-500/30 transition cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Registrar Pago / Activar</span>
              </button>

              <button
                onClick={handleDownloadFullBackup}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 border border-slate-600 transition cursor-pointer"
                title="Descargar copia de seguridad completa en JSON"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Respaldo JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Métricas Principales del SaaS (Dashboard Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Colegios */}
        <div
          onClick={() => isSuperAdmin && setActiveTab('colegios')}
          className={`bg-white p-5 rounded-2xl border transition shadow-sm cursor-pointer ${activeTab === 'colegios' && isSuperAdmin ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unidades Educativas</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalColegios}</div>
          <div className="flex items-center space-x-2 text-xs font-semibold mt-1">
            <span className="text-emerald-700">{colegiosActivos} Activas</span>
            <span className="text-slate-300">•</span>
            <span className="text-rose-600">{colegiosSuspendidos} Suspendidas</span>
          </div>
        </div>

        {/* Verificación de Pagos */}
        <div
          onClick={() => isSuperAdmin && setActiveTab('pagos')}
          className={`bg-white p-5 rounded-2xl border transition shadow-sm cursor-pointer relative ${activeTab === 'pagos' && isSuperAdmin ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}
        >
          {pagosPendientes.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full animate-bounce">
              {pagosPendientes.length} pendientes
            </span>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cola de Pagos</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{payments.length} transacciones</div>
          <div className="flex items-center space-x-2 text-xs font-semibold mt-1">
            <span className="text-amber-700">{pagosPendientes.length} por verificar</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700">{pagosAprobados.length} aprobados</span>
          </div>
        </div>

        {/* Recaudación Total en Bs. */}
        <div
          onClick={() => isSuperAdmin && setActiveTab('metricas')}
          className={`bg-white p-5 rounded-2xl border transition shadow-sm cursor-pointer ${activeTab === 'metricas' && isSuperAdmin ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ingresos Facturados</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-900 mt-2">Bs. {totalRecaudado.toLocaleString()}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">Suscripciones Mensuales y Anuales</div>
        </div>

        {/* Seguridad & Sistema */}
        <div
          onClick={() => isSuperAdmin && setActiveTab('comunicados')}
          className={`bg-white p-5 rounded-2xl border transition shadow-sm cursor-pointer ${activeTab === 'comunicados' && isSuperAdmin ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Comunicados & Aviso</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-800 mt-2 truncate">
            {announcement?.activo ? announcement.titulo : 'Sin aviso activo'}
          </div>
          <div className="text-xs font-semibold text-emerald-700 mt-1">
            {announcement?.activo ? '📢 Difusión global activa' : 'Click para emitir aviso'}
          </div>
        </div>
      </div>

      {/* SUPERADMIN COMMAND TABS */}
      {isSuperAdmin && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('colegios')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${activeTab === 'colegios'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Control Total de Colegios ({institutions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('pagos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer relative ${activeTab === 'pagos'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Verificación de Pagos ({payments.length})</span>
              {pagosPendientes.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('comunicados')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${activeTab === 'comunicados'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <Bell className="w-4 h-4" />
              <span>Comunicado Global</span>
            </button>

            <button
              onClick={() => setActiveTab('metricas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${activeTab === 'metricas'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Estadísticas de Ingresos</span>
            </button>
          </div>

          {/* TAB 1: CONTROL TOTAL DE COLEGIOS (CRUD) */}
          {activeTab === 'colegios' && (
            <div className="space-y-4">
              {/* Filtros */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar por SIE, nombre o departamento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <select
                    value={filterDepto}
                    onChange={(e) => setFilterDepto(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="TODOS">Todos los Departamentos</option>
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

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="TODOS">Todos los Estados</option>
                    <option value="ACTIVO">Solo Activos</option>
                    <option value="SUSPENDIDO">Solo Suspendidos</option>
                  </select>

                  <button
                    onClick={handleOpenCreateInst}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center space-x-1.5 transition whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Colegio</span>
                  </button>
                </div>
              </div>

              {/* Lista de Colegios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredInstitutions.map((inst) => {
                  const isSuspended = inst.activo === false;
                  return (
                    <div
                      key={inst.id}
                      className={`bg-white rounded-2xl border p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between ${isSuspended ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
                        }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`p-2.5 rounded-xl ${isSuspended ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                                }`}
                            >
                              <School className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 text-sm">{inst.nombre}</h3>
                              <p className="text-xs text-slate-500 font-mono">Código SIE: {inst.sie}</p>
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isSuspended ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                              }`}
                          >
                            {isSuspended ? 'SUSPENDIDA' : 'ACTIVA'}
                          </span>
                        </div>

                        {isSuspended && inst.motivoSuspension && (
                          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800">
                            <strong>Motivo de suspensión:</strong> {inst.motivoSuspension}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-600">
                          <div className="flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{inst.departamento} • {inst.distrito}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{inst.telefono || 'Sin teléfono'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Botones de acción CRUD para Superadmin */}
                      <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <button
                          onClick={() => handleImpersonate(inst)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs flex items-center space-x-1 cursor-pointer transition"
                          title="Entrar a este colegio para supervisar materias, calificaciones y centralizadores"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Supervisar</span>
                        </button>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenManualPay(inst)}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg text-xs flex items-center space-x-1 cursor-pointer transition"
                            title="Registrar pago o renovar suscripción del colegio"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Plan</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditInst(inst)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Editar datos del colegio"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {isSuspended ? (
                            <button
                              onClick={() => handleQuickActivate(inst)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1 cursor-pointer transition"
                              title="Activar Unidad Educativa"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Activar</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenSuspendModal(inst)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-xs flex items-center space-x-1 cursor-pointer transition"
                              title="Suspender acceso por falta de pago u orden ministerial"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Suspender</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteInst(inst)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Eliminar colegio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: VERIFICACIÓN Y APROBACIÓN DE PAGOS */}
          {activeTab === 'pagos' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Cola de Pagos y Activación de Colegios
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verifica transacciones por QR Simple Interoperable o transferencia bancaria y activa colegios al instante.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenManualPay()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Registrar Pago Manual</span>
                </button>
              </div>

              {payments.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No hay pagos registrados en la plataforma.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-3 px-3">Código</th>
                        <th className="py-3 px-3">Colegio & SIE</th>
                        <th className="py-3 px-3">Plan / Periodo</th>
                        <th className="py-3 px-3">Monto (Bs.)</th>
                        <th className="py-3 px-3">Método / Ref.</th>
                        <th className="py-3 px-3">Estado</th>
                        <th className="py-3 px-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((p) => {
                        const isPendiente = p.estado === 'PENDIENTE';
                        const isAprobado = p.estado === 'APROBADO';
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-3 font-mono font-bold text-slate-700">{p.codigoTransaccion}</td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{p.colegioNombre}</div>
                              <div className="text-[11px] text-slate-400 font-mono">SIE: {p.sie}</div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-medium text-slate-800">{p.plan}</div>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                                {p.periodo}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-extrabold text-slate-900 text-sm">
                              Bs. {p.monto}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-700">{p.metodo}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{p.referenciaBancaria || 'Sin ref.'}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isPendiente
                                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                                    : isAprobado
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                              >
                                {p.estado}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {isPendiente ? (
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    onClick={() => handleApprovePay(p.id)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-sm transition cursor-pointer"
                                    title="Aprobar pago y reactivar colegio"
                                  >
                                    Verificar & Activar
                                  </button>
                                  <button
                                    onClick={() => handleRejectPay(p.id)}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-[11px] transition cursor-pointer"
                                  >
                                    Rechazar
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  {p.verificadoPor || 'Verificado'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMUNICADO GLOBAL */}
          {activeTab === 'comunicados' && (
            <div className="space-y-6 max-w-3xl">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <Bell className="w-5 h-5 text-emerald-600" />
                      <span>Aviso y Comunicado Oficial del Sistema</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Emite un banner de notificación prioritario que aparecerá en la parte superior de todas las pantallas de Directores y Docentes.
                    </p>
                  </div>
                  <div>
                    {announcement && announcement.activo ? (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>DIFUSIÓN ACTIVA EN COLEGIOS</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-full border border-slate-200">
                        <span>SIN AVISO ACTIVO</span>
                      </span>
                    )}
                  </div>
                </div>

                {announceFeedback && (
                  <div
                    className={`p-4 rounded-xl border text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-200 ${
                      announceFeedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-blue-50 border-blue-300 text-blue-900'
                    }`}
                  >
                    <span>{announceFeedback.text}</span>
                  </div>
                )}

                <form onSubmit={handleSaveAnnounce} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Notificación</label>
                    <select
                      value={announceForm.tipo}
                      onChange={(e) => setAnnounceForm({ ...announceForm, tipo: e.target.value as any })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="IMPORTANTE">Importante (Ámbar / Oficial)</option>
                      <option value="ALERTA">Alerta de Seguridad (Rojo)</option>
                      <option value="INFO">Informativo (Azul)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Título del Comunicado</label>
                    <input
                      type="text"
                      value={announceForm.titulo}
                      onChange={(e) => setAnnounceForm({ ...announceForm, titulo: e.target.value })}
                      placeholder="Ej. Plazo impostergable de entrega de calificaciones 1° Trimestre"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mensaje Detallado</label>
                    <textarea
                      rows={4}
                      value={announceForm.mensaje}
                      onChange={(e) => setAnnounceForm({ ...announceForm, mensaje: e.target.value })}
                      placeholder="Escribe el texto oficial de la disposición ministerial..."
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-slate-100">
                    <p className="text-[11px] text-slate-400">
                      💡 Al guardar, se sincroniza automáticamente con todos los colegios conectados.
                    </p>
                    <div className="flex space-x-2">
                      {announcement && announcement.activo && (
                        <button
                          type="button"
                          onClick={() => {
                            saveGlobalAnnouncement(null);
                            setAnnouncement(null);
                            setAnnounceFeedback({
                              type: 'info',
                              text: 'ℹ️ Comunicado desactivado y retirado de todos los colegios.',
                            });
                            setFeedback('Aviso eliminado.');
                          }}
                          className="px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Desactivar Aviso
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer flex items-center space-x-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Guardar y Publicar</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Vista Previa en Vivo de cómo lo verán los Colegios */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span>Vista Previa: Cómo lo visualizan los Colegios (Directores y Docentes)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">En la parte superior de cada página</span>
                </div>

                {announceForm.titulo || announceForm.mensaje ? (
                  <div
                    className={`p-4 rounded-2xl border flex items-start justify-between gap-3 shadow-xs ${
                      announceForm.tipo === 'ALERTA'
                        ? 'bg-rose-50 border-rose-300 text-rose-950'
                        : announceForm.tipo === 'IMPORTANTE'
                        ? 'bg-amber-50 border-amber-300 text-amber-950'
                        : 'bg-blue-50 border-blue-300 text-blue-950'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`p-2 rounded-xl shrink-0 mt-0.5 shadow-xs ${
                          announceForm.tipo === 'ALERTA'
                            ? 'bg-rose-100 text-rose-700'
                            : announceForm.tipo === 'IMPORTANTE'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm flex items-center gap-2">
                          <span>{announceForm.titulo || 'Título del Comunicado'}</span>
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-white/90 border border-current/20">
                            {announceForm.tipo}
                          </span>
                        </div>
                        <p className="text-xs mt-1 leading-relaxed text-slate-700 font-medium">
                          {announceForm.mensaje || 'Mensaje del comunicado...'}
                        </p>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">
                          Emitido por: Superadministrador Nacional • {new Date().toLocaleDateString('es-BO')}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                    No hay texto para previsualizar. Escribe un título y mensaje arriba.
                  </div>
                )}

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">
                    📍 ¿Dónde se muestra este aviso a los usuarios de los colegios?
                  </p>
                  <p>
                    Aparece como una barra destacada en la parte superior de <strong>todas las pantallas</strong> para Directores y Maestros (Planilla de Calificaciones, Centralizadores, Asistencia, Horarios, Matrícula RUDE, etc.).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ESTADÍSTICAS DE INGRESOS */}
          {activeTab === 'metricas' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Resumen de Facturación & Suscripciones SaaS
                </h3>
                <p className="text-xs text-slate-500">
                  Desglose financiero por planes y recaudación de Unidades Educativas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-800">Recaudación Confirmada</span>
                  <div className="text-2xl font-black text-emerald-950 mt-1">Bs. {totalRecaudado.toLocaleString()}</div>
                  <div className="text-[11px] text-emerald-700 mt-1">Total abonado en cuentas</div>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                  <span className="text-xs font-bold text-blue-800">Plan Profesional (Bs. 2.400 / año)</span>
                  <div className="text-2xl font-black text-blue-950 mt-1">
                    {payments.filter((p) => p.plan.includes('Profesional')).length} Colegios
                  </div>
                  <div className="text-[11px] text-blue-700 mt-1">Mayor adopción en Bolivia</div>
                </div>

                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                  <span className="text-xs font-bold text-purple-800">Plan Red Educativa / Distrito</span>
                  <div className="text-2xl font-black text-purple-950 mt-1">
                    {payments.filter((p) => p.plan.includes('Red')).length} Multisedes
                  </div>
                  <div className="text-[11px] text-purple-700 mt-1">Suscripciones corporativas</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DASHBOARD PARA DIRECTORES Y MAESTROS */}
      {!isSuperAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                    Nómina de Estudiantes & Matrícula RUDE
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
      )}

      {/* MODAL CREAR / EDITAR COLEGIO (SUPERADMIN CRUD) */}
      {showInstModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {instModalMode === 'create' ? 'Registrar Nueva Unidad Educativa' : 'Editar Unidad Educativa'}
                </h3>
              </div>
              <button onClick={() => setShowInstModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInst} className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código SIE Oficial *</label>
                  <input
                    type="text"
                    required
                    value={instForm.sie}
                    onChange={(e) => setInstForm({ ...instForm, sie: e.target.value })}
                    placeholder="Ej. 80730045"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Unidad Educativa *</label>
                  <input
                    type="text"
                    required
                    value={instForm.nombre}
                    onChange={(e) => setInstForm({ ...instForm, nombre: e.target.value })}
                    placeholder="Ej. San Simón de Ayacucho"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Departamento</label>
                  <select
                    value={instForm.departamento}
                    onChange={(e) => setInstForm({ ...instForm, departamento: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Distrito Educativo</label>
                  <input
                    type="text"
                    value={instForm.distrito}
                    onChange={(e) => setInstForm({ ...instForm, distrito: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Colegio</label>
                  <select
                    value={instForm.tipo}
                    onChange={(e) => setInstForm({ ...instForm, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="FISCAL">Fiscal (Pública)</option>
                    <option value="CONVENIO">De Convenio</option>
                    <option value="PRIVADA">Privada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nivel Educativo</label>
                  <select
                    value={instForm.nivel}
                    onChange={(e) => setInstForm({ ...instForm, nivel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="INTEGRADO">Integrado (Primaria y Secundaria)</option>
                    <option value="PRIMARIA">Primaria Comunitaria Vocacional</option>
                    <option value="SECUNDARIA">Secundaria Comunitaria Productiva</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono de Contacto</label>
                  <input
                    type="text"
                    value={instForm.telefono}
                    onChange={(e) => setInstForm({ ...instForm, telefono: e.target.value })}
                    placeholder="Ej. 22823110"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dirección Oficial</label>
                <input
                  type="text"
                  value={instForm.direccion}
                  onChange={(e) => setInstForm({ ...instForm, direccion: e.target.value })}
                  placeholder="Calle, avenida o zona del establecimiento"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInstModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  {instModalMode === 'create' ? 'Registrar Unidad Educativa' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUSPENSIÓN CON MOTIVO */}
      {showSuspendModal && suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-rose-700 font-bold">
                <ShieldAlert className="w-5 h-5" />
                <span>Suspender Unidad Educativa</span>
              </div>
              <button onClick={() => setShowSuspendModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 leading-relaxed">
                Al suspender <strong>{suspendTarget.nombre} (SIE: {suspendTarget.sie})</strong>, los directores y maestros no podrán acceder a las planillas hasta que se regularice la situación.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo Oficial:</label>
                <select
                  value={suspendReasonPreset}
                  onChange={(e) => setSuspendReasonPreset(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none"
                >
                  <option value="Regularización de Suscripción SaaS (Plan pendiente de pago o vencido)">
                    Regularización de Suscripción SaaS (Plan pendiente de pago o vencido)
                  </option>
                  <option value="Disposición Ministerial / Auditoría en curso del Distrito">
                    Disposición Ministerial / Auditoría en curso del Distrito
                  </option>
                  <option value="Falta de actualización de datos institucionales RUDE">
                    Falta de actualización de datos institucionales RUDE
                  </option>
                  <option value="Otro motivo justificado">Otro motivo justificado...</option>
                </select>
              </div>

              {suspendReasonPreset === 'Otro motivo justificado' && (
                <textarea
                  rows={2}
                  value={suspendReasonCustom}
                  onChange={(e) => setSuspendReasonCustom(e.target.value)}
                  placeholder="Detalla el motivo de la suspensión..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none"
                />
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSuspendModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspend}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Confirmar Suspensión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR PAGO MANUAL / RENOVAR */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold">
                <CreditCard className="w-5 h-5" />
                <span>Registrar Pago & Activar Suscripción</span>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualPay} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unidad Educativa Beneficiaria</label>
                <select
                  value={paymentForm.sie}
                  onChange={(e) => {
                    const found = institutions.find((i) => i.sie === e.target.value);
                    setPaymentForm({
                      ...paymentForm,
                      sie: e.target.value,
                      colegioNombre: found?.nombre || '',
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                >
                  {institutions.map((i) => (
                    <option key={i.sie} value={i.sie}>
                      {i.nombre} (SIE: {i.sie}) {i.activo === false ? '🔒 [SUSPENDIDA]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Plan SaaS</label>
                  <select
                    value={paymentForm.plan}
                    onChange={(e) => setPaymentForm({ ...paymentForm, plan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="Colegio Profesional (SaaS Cloud)">Colegio Profesional</option>
                    <option value="Red Educativa / Multisede">Red Educativa / Multisede</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Periodo</label>
                  <select
                    value={paymentForm.periodo}
                    onChange={(e) => {
                      const per = e.target.value as any;
                      setPaymentForm({
                        ...paymentForm,
                        periodo: per,
                        monto: per === 'ANUAL' ? 2400 : 250,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="ANUAL">Anual (Ahorro 20%)</option>
                    <option value="MENSUAL">Mensual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monto en Bolivianos (Bs.)</label>
                  <input
                    type="number"
                    value={paymentForm.monto}
                    onChange={(e) => setPaymentForm({ ...paymentForm, monto: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Método de Pago</label>
                  <select
                    value={paymentForm.metodo}
                    onChange={(e) => setPaymentForm({ ...paymentForm, metodo: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="QR_SIMPLE">QR Simple Interoperable</option>
                    <option value="TRANSFERENCIA_BANCARIA">Transferencia Banco Unión</option>
                    <option value="EFECTIVO">Efectivo / Caja Central</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Referencia Bancaria / N° Comprobante</label>
                <input
                  type="text"
                  value={paymentForm.referenciaBancaria}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenciaBancaria: e.target.value })}
                  placeholder="Ej. BUN-TRF-0091823"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                >
                  Aprobar & Activar Colegio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
