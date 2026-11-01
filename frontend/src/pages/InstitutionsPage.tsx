import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Building2, Plus, Search, MapPin, Phone, Users } from 'lucide-react';
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
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/institutions', formData);
      setShowModal(false);
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
      fetchInstitutions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear la Unidad Educativa');
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Unidades Educativas del Subsistema Regular</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro Centralizado de Colegios y Unidades Educativas Fiscales, de Convenio y Privadas
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Unidad Educativa</span>
          </button>
        )}
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
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
          No se encontraron unidades educativas con ese criterio.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((inst) => (
            <div
              key={inst.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{inst.nombre}</h3>
                    <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                      Código SIE: <span className="font-mono">{inst.sie}</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {formatTipoInstitucion(inst.tipo)}
                </span>
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
                  <span>{inst.telefono ? `Telf: ${inst.telefono}` : 'Sin teléfono registrado'}</span>
                </div>
                <div className="flex items-center space-x-1.5 col-span-2 pt-1 text-slate-700 font-medium">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{inst.totalMaestrosVinculados} docentes con vinculación activa</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for creating an Institution (Superadmin only) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-900 mb-1">Registrar Nueva Unidad Educativa</h2>
            <p className="text-xs text-slate-500 mb-4">
              Ingreso de un nuevo colegio al sistema con código SIE emitido por el Ministerio de Educación
            </p>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Código SIE (8 dígitos)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={formData.sie}
                    onChange={(e) => setFormData({ ...formData, sie: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    placeholder="ej. 80730099"
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
                    <option value="Oruro">Oruro</option>
                    <option value="Potosí">Potosí</option>
                    <option value="Chuquisaca">Chuquisaca</option>
                    <option value="Tarija">Tarija</option>
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

              <div className="flex justify-end space-x-2 pt-4">
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
                  Registrar Colegio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
