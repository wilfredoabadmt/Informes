import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Users,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Power,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  Lock,
  Unlock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatTipoInstitucion, formatNivelEducativo } from '../utils/formatters';
import {
  getStoredInstitutions,
  addStoredInstitution,
  saveStoredInstitutions,
  syncApiInstitutions,
  suspendInstitution,
  activateInstitution,
  getCoursesForInstitution,
  getTeachersForInstitution,
  getStudentsForInstitution,
  type TenantInstitution,
} from '../utils/multiTenantStore';

interface Institution {
  id: string;
  sie: string;
  nombre: string;
  departamento: string;
  provincia: string;
  municipio: string;
  distrito: string;
  direccion: string;
  telefono: string;
  tipo: string;
  nivel: string;
  activo: boolean;
  motivoSuspension?: string;
  fechaSuspension?: string;
  totalMaestrosVinculados: number;
}

export const InstitutionsPage: React.FC = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedInstId, setSelectedInstId] = useState<string | null>(null);

  // Estados para Modal de Suspensión con Motivo
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<Institution | null>(null);
  const [suspendPreset, setSuspendPreset] = useState(
    'Regularización de Suscripción SaaS (Plan pendiente de pago o vencido)'
  );
  const [suspendCustomText, setSuspendCustomText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const [formData, setFormData] = useState({
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

  const { isSuperAdmin, setCurrentInstitutionId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/academic', { replace: true });
    }
  }, [isSuperAdmin, navigate]);

  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/institutions');
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const synced = syncApiInstitutions(res.data.data);
        setInstitutions(synced);
      } else {
        setInstitutions(getStoredInstitutions());
      }
    } catch (e) {
      setInstitutions(getStoredInstitutions());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setInstitutions(e.detail);
      }
    };
    window.addEventListener('sigma_institutions_updated', handleUpdate);
    fetchInstitutions();

    return () => {
      window.removeEventListener('sigma_institutions_updated', handleUpdate);
    };
  }, []);

  const triggerFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedInstId(null);
    setFormData({
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
    setShowModal(true);
  };

  const openEditModal = (inst: Institution) => {
    setModalMode('edit');
    setSelectedInstId(inst.id);
    setFormData({
      sie: inst.sie,
      nombre: inst.nombre,
      departamento: inst.departamento,
      provincia: inst.provincia,
      municipio: inst.municipio,
      distrito: inst.distrito,
      direccion: inst.direccion || '',
      telefono: inst.telefono || '',
      tipo: inst.tipo,
      nivel: inst.nivel,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const generatedId = `inst-${formData.sie}`;
      if (modalMode === 'create') {
        try {
          await apiClient.post('/institutions', formData);
        } catch (apiErr) {
          console.warn('API sync warning:', apiErr);
        }
        const newInst: TenantInstitution = {
          id: generatedId,
          sie: formData.sie,
          nombre: formData.nombre,
          departamento: formData.departamento,
          provincia: formData.provincia,
          municipio: formData.municipio,
          distrito: formData.distrito,
          direccion: formData.direccion,
          telefono: formData.telefono,
          tipo: formData.tipo,
          nivel: formData.nivel,
          activo: true,
          totalMaestrosVinculados: 0,
        };
        addStoredInstitution(newInst);
        triggerFeedback('¡Unidad Educativa registrada exitosamente en el sistema!');
        fetchInstitutions();
      } else if (modalMode === 'edit' && selectedInstId) {
        try {
          await apiClient.patch(`/institutions/${selectedInstId}`, formData);
        } catch (apiErr) {
          console.warn('API sync warning:', apiErr);
        }
        const stored = getStoredInstitutions();
        const updated = stored.map((i) =>
          i.id === selectedInstId ? { ...i, ...formData } : i
        );
        saveStoredInstitutions(updated);
        setInstitutions(updated);
        triggerFeedback('¡Datos de la Unidad Educativa actualizados correctamente!');
      }
      setShowModal(false);
    } catch (err: any) {
      triggerFeedback(err.response?.data?.message || err.message || 'Error al guardar la Unidad Educativa');
    }
  };

  const handleToggleStatus = (inst: Institution) => {
    if (inst.activo) {
      // Abrir modal para definir motivo de suspensión
      setSuspendTarget(inst);
      setSuspendPreset('Regularización de Suscripción SaaS (Plan pendiente de pago o vencido)');
      setSuspendCustomText('');
      setShowSuspendModal(true);
    } else {
      // Reactivar inmediatamente
      handleReactivate(inst);
    }
  };

  const handleConfirmSuspend = async () => {
    if (!suspendTarget) return;

    const finalMotivo = suspendCustomText.trim()
      ? `${suspendPreset} - ${suspendCustomText.trim()}`
      : suspendPreset;

    try {
      await apiClient.patch(`/institutions/${suspendTarget.id}/status`, {
        activo: false,
        motivo: finalMotivo,
      });
    } catch (e) {
      // optimistic update
    }

    suspendInstitution(suspendTarget.id, finalMotivo);
    setInstitutions(getStoredInstitutions());
    setShowSuspendModal(false);
    triggerFeedback(
      `🔒 Unidad Educativa "${suspendTarget.nombre}" suspendida. El Director y los Maestros ya no podrán iniciar sesión.`
    );
    setSuspendTarget(null);
  };

  const handleReactivate = async (inst: Institution) => {
    try {
      await apiClient.patch(`/institutions/${inst.id}/status`, {
        activo: true,
      });
    } catch (e) {
      // optimistic update
    }

    activateInstitution(inst.id);
    setInstitutions(getStoredInstitutions());
    triggerFeedback(
      `✅ Unidad Educativa "${inst.nombre}" reactivada. Se ha restablecido el acceso para el Director y los Maestros.`
    );
  };

  const filtered = institutions.filter(
    (i) =>
      i.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.sie.includes(searchTerm) ||
      i.departamento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Unidades Educativas del Subsistema Regular
            </h1>
            <p className="text-xs text-slate-500">
              Registro Centralizado de Colegios y Unidades Educativas Fiscales, de Convenio y Privadas
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Unidad Educativa</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Workflow Explanatory Card for Superadmin */}
      <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-950">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-slate-900">
              Guía de Flujo Multi-Tenant: ¿Dónde se asignan docentes, materias y estudiantes?
            </div>
            <div className="text-slate-600 mt-1 leading-relaxed">
              1. <strong>Registrar Unidad Educativa:</strong> Registra el nuevo colegio con su código SIE oficial.<br />
              2. <strong>Habilitar Cursos y Vincular Docentes:</strong> Haz clic en <span className="font-bold text-emerald-700">"Docentes & Cursos ➔"</span> en la tarjeta del colegio para ir a <span className="font-mono">/academic</span>, crear paralelos y vincular maestros con su RDA.<br />
              3. <strong>Matricular Estudiantes:</strong> Haz clic en <span className="font-bold text-blue-700">"Estudiantes ➔"</span> en la tarjeta del colegio para inscribir alumnos con código RUDE en sus respectivos paralelos.
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por código SIE oficial, nombre del colegio o departamento..."
          className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Grid of Institutions */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Cargando Unidades Educativas...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
          No se encontraron unidades educativas con ese criterio.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((inst) => (
            <div
              key={inst.id}
              className={`bg-white p-5 rounded-xl border shadow-sm transition ${
                inst.activo ? 'border-slate-200 hover:border-emerald-300' : 'border-rose-200 bg-slate-50/60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      inst.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{inst.nombre}</h3>
                    <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                      Código SIE: <span className="font-mono">{inst.sie}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      inst.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {inst.activo ? 'ACTIVA' : 'SUSPENDIDA'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {formatTipoInstitucion(inst.tipo)}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-600">Nivel Educativo: </span>
                {formatNivelEducativo(inst.nivel)}
              </div>

              {/* Alerta de Suspensión con Motivo Visible */}
              {!inst.activo && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1.5 text-rose-950 animate-in fade-in">
                  <div className="flex items-center space-x-1.5 font-bold text-rose-900">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Acceso Institucional Suspendido</span>
                  </div>
                  <div className="text-[11px] text-slate-700 leading-snug">
                    <span className="font-semibold text-rose-950">Motivo:</span>{' '}
                    <span>{inst.motivoSuspension || 'Regularización de suscripción SaaS o disposición administrativa.'}</span>
                  </div>
                  <p className="text-[10px] text-rose-700 font-semibold flex items-center space-x-1">
                    <Lock className="w-3 h-3 text-rose-500 inline" />
                    <span>El Director y los Maestros están bloqueados del sistema.</span>
                  </p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{inst.departamento} • {inst.distrito}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{inst.telefono ? `Telf: ${inst.telefono}` : 'Sin teléfono'}</span>
                </div>
                <div className="flex items-center space-x-1.5 col-span-2 pt-1 text-slate-700 font-medium">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {getTeachersForInstitution(inst.sie || inst.id).length} docentes vinculados • {getCoursesForInstitution(inst.sie || inst.id).length} cursos • {getStudentsForInstitution(inst.sie || inst.id).length} estudiantes
                  </span>
                </div>
              </div>

              {/* Quick Actions & Management */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => {
                      setCurrentInstitutionId(inst.id);
                      navigate('/academic');
                    }}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer"
                    title="Asignar cursos, paralelos, docentes y materias para este colegio"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Docentes & Cursos ➔</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentInstitutionId(inst.id);
                      navigate('/students');
                    }}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition cursor-pointer"
                    title="Inscribir y matricular estudiantes para este colegio"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Estudiantes ➔</span>
                  </button>
                </div>

                {isSuperAdmin && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(inst)}
                      className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleToggleStatus(inst)}
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                        inst.activo
                          ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                      title={inst.activo ? 'Suspender acceso a Director y Maestros' : 'Habilitar acceso'}
                    >
                      {inst.activo ? (
                        <>
                          <Lock className="w-3 h-3 text-rose-600" />
                          <span>Suspender</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3 text-emerald-600" />
                          <span>Habilitar</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Creating / Editing Institution */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {modalMode === 'create' ? 'Registrar Nueva Unidad Educativa' : 'Editar Ficha Institucional'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Código SIE Único (8 dígitos)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'edit'}
                    value={formData.sie}
                    onChange={(e) => setFormData({ ...formData, sie: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-60 font-mono font-bold"
                    placeholder="ej. 80730045"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tipo de Dependencia
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="FISCAL">Fiscal (Pública del Estado)</option>
                    <option value="CONVENIO">Convenio (Iglesia / Institucional)</option>
                    <option value="PRIVADA">Privada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nombre Oficial de la Unidad Educativa
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  placeholder="ej. Unidad Educativa Simón Bolívar"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Departamento
                  </label>
                  <select
                    value={formData.departamento}
                    onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="La Paz">La Paz</option>
                    <option value="Cochabamba">Cochabamba</option>
                    <option value="Santa Cruz">Santa Cruz</option>
                    <option value="Tarija">Tarija</option>
                    <option value="Oruro">Oruro</option>
                    <option value="Potosí">Potosí</option>
                    <option value="Chuquisaca">Chuquisaca</option>
                    <option value="Beni">Beni</option>
                    <option value="Pando">Pando</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Distrito Educativo
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.distrito}
                    onChange={(e) => setFormData({ ...formData, distrito: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Dirección / Ubicación
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    placeholder="Comunidad / Zona / Calle"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Teléfono Institucional
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    placeholder="ej. 22458900"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg cursor-pointer"
                >
                  {modalMode === 'create' ? 'Registrar Colegio' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Suspender con Registro de Motivo */}
      {showSuspendModal && suspendTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border-2 border-rose-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Suspender Acceso a Unidad Educativa
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    SIE {suspendTarget.sie} • {suspendTarget.nombre}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSuspendModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                <strong>⚠️ Consecuencia Inmediata:</strong> Al suspender esta Unidad Educativa, el <strong>Director</strong> y todos los <strong>Maestros</strong> vinculados quedarán inmediatamente bloqueados y no podrán iniciar sesión. Al intentar ingresar verán el motivo que selecciones aquí.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo Principal de Suspensión:
                </label>
                <select
                  value={suspendPreset}
                  onChange={(e) => setSuspendPreset(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Regularización de Suscripción SaaS (Plan mensual o anual vencido)">
                    Regularización de Suscripción SaaS (Plan pendiente de pago o vencido)
                  </option>
                  <option value="Suspensión administrativa por disposición distrital o departamental">
                    Suspensión administrativa por disposición distrital o departamental
                  </option>
                  <option value="Auditoría preventiva y actualización de datos institucionales">
                    Auditoría preventiva y actualización de datos institucionales
                  </option>
                  <option value="Mantenimiento general del sistema y migración de datos">
                    Mantenimiento general del sistema y migración de datos
                  </option>
                  <option value="Otro motivo personalizado">
                    Otro motivo (especificar abajo)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Detalles u Observaciones para la Institución (Opcional):
                </label>
                <textarea
                  rows={3}
                  value={suspendCustomText}
                  onChange={(e) => setSuspendCustomText(e.target.value)}
                  placeholder="Ej: Favor comunicarse con administración para regularizar el comprobante del mes en curso y habilitar sus planillas."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSuspendModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSuspend}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confirmar y Suspender Acceso</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
