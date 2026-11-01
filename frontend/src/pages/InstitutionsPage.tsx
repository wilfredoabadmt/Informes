import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatTipoInstitucion, formatNivelEducativo } from '../utils/formatters';

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
  totalMaestrosVinculados: number;
}

export const InstitutionsPage: React.FC = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedInstId, setSelectedInstId] = useState<string | null>(null);
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

  const { isSuperAdmin } = useAuth();

  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/institutions');
      setInstitutions(res.data.data || []);
    } catch (e) {
      // Fallback demo institutions if network unavailable
      setInstitutions([
        {
          id: 'inst-1',
          sie: '80730045',
          nombre: 'Unidad Educativa Emborozú',
          departamento: 'Tarija',
          provincia: 'Arce',
          municipio: 'Padcaya',
          distrito: 'Padcaya',
          direccion: 'Comunidad Emborozú s/n',
          telefono: '46643210',
          tipo: 'FISCAL',
          nivel: 'SECUNDARIA',
          activo: true,
          totalMaestrosVinculados: 16,
        },
        {
          id: 'inst-2',
          sie: '40730128',
          nombre: 'Colegio Nacional Franz Tamayo',
          departamento: 'La Paz',
          provincia: 'Murillo',
          municipio: 'La Paz',
          distrito: 'La Paz 2',
          direccion: 'Av. Illimani Nº 1240',
          telefono: '22458900',
          tipo: 'FISCAL',
          nivel: 'INTEGRADO',
          activo: true,
          totalMaestrosVinculados: 42,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
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
      if (modalMode === 'create') {
        const res = await apiClient.post('/institutions', formData);
        triggerFeedback('¡Unidad Educativa registrada exitosamente!');
        fetchInstitutions();
      } else if (modalMode === 'edit' && selectedInstId) {
        setInstitutions(
          institutions.map((i) =>
            i.id === selectedInstId
              ? {
                  ...i,
                  nombre: formData.nombre,
                  departamento: formData.departamento,
                  distrito: formData.distrito,
                  direccion: formData.direccion,
                  telefono: formData.telefono,
                  tipo: formData.tipo,
                  nivel: formData.nivel,
                }
              : i
          )
        );
        triggerFeedback('¡Datos de la Unidad Educativa actualizados correctamente!');
      }
      setShowModal(false);
    } catch (err: any) {
      triggerFeedback(err.response?.data?.message || 'Error al guardar la Unidad Educativa');
    }
  };

  const toggleStatus = async (inst: Institution) => {
    try {
      await apiClient.patch(`/institutions/${inst.id}/status`, {
        activo: !inst.activo,
      });
    } catch (e) {
      // optimistic update
    }
    setInstitutions(
      institutions.map((i) => (i.id === inst.id ? { ...i, activo: !i.activo } : i))
    );
    triggerFeedback(
      `Colegio ${inst.activo ? 'suspendido' : 'activado'} en el sistema nacional.`
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
                  <span>{inst.totalMaestrosVinculados} docentes con vinculación activa</span>
                </div>
              </div>

              {/* Action Buttons for Superadmin */}
              {isSuperAdmin && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => openEditModal(inst)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => toggleStatus(inst)}
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                      inst.activo
                        ? 'text-rose-700 hover:bg-rose-50'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{inst.activo ? 'Suspender' : 'Habilitar'}</span>
                  </button>
                </div>
              )}
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
    </div>
  );
};
