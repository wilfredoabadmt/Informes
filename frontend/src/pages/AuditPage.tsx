import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatAccionAuditoria } from '../utils/formatters';
import { ShieldCheck, Lock, Search } from 'lucide-react';

interface AuditLog {
  id: string;
  usuarioId: string;
  usuarioEmail: string;
  usuarioNombre: string;
  accion: string;
  entidad: string;
  entidadId: string;
  ip: string;
  createdAt: string;
}

export const AuditPage: React.FC = () => {
  const { isSuperAdmin, isDirector } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const [logs] = useState<AuditLog[]>([
    {
      id: 'aud-1',
      usuarioId: 'admin-id',
      usuarioEmail: 'carlos.mamani@minedu.gob.bo',
      usuarioNombre: 'Prof. Carlos Mamani Condori',
      accion: 'REGISTRO_CALIFICACION',
      entidad: 'Calificación de Dimensión',
      entidadId: 'cal-101',
      ip: '190.129.88.42 (La Paz, Bolivia)',
      createdAt: '2026-11-01T01:15:30Z',
    },
    {
      id: 'aud-2',
      usuarioId: 'directora-id',
      usuarioEmail: 'elena.flores@minedu.gob.bo',
      usuarioNombre: 'Lic. Elena Flores Quispe (Directora)',
      accion: 'MATRICULA_ESTUDIANTE',
      entidad: 'Matrícula RUDE Escolar',
      entidadId: 'ins-504',
      ip: '190.129.88.42 (La Paz, Bolivia)',
      createdAt: '2026-11-01T01:12:10Z',
    },
    {
      id: 'aud-3',
      usuarioId: 'superadmin-id',
      usuarioEmail: 'admin@minedu.gob.bo',
      usuarioNombre: 'Administrador Central Nacional',
      accion: 'CREACION_INSTITUCION',
      entidad: 'Unidad Educativa Franz Tamayo',
      entidadId: 'inst-80730045',
      ip: '89.116.29.168 (Servidor Central)',
      createdAt: '2026-11-01T01:07:36Z',
    },
    {
      id: 'aud-4',
      usuarioId: 'directora-id',
      usuarioEmail: 'elena.flores@minedu.gob.bo',
      usuarioNombre: 'Lic. Elena Flores Quispe (Directora)',
      accion: 'ASIGNACION_DOCENTE',
      entidad: 'Carga Horaria Matemática 1° Sec',
      entidadId: 'asig-302',
      ip: '190.129.88.42 (La Paz, Bolivia)',
      createdAt: '2026-11-01T01:09:15Z',
    },
  ]);

  const filtered = logs.filter(
    (l) =>
      l.usuarioNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.usuarioEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.entidad.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {isSuperAdmin ? 'Auditoría y Seguridad del Sistema Nacional' : 'Bitácora de Trazabilidad Institucional'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro Inmutable de Seguridad y Trazabilidad de Operaciones (Principio 7 de la Constitución del Sistema)
          </p>
        </div>

        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Registros Criptográficamente Inmutables</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por usuario responsable, tipo de acción realizada o entidad afectada..."
          className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Fecha y Hora Oficial</th>
                <th className="py-3 px-4">Usuario Responsable</th>
                <th className="py-3 px-4">Operación Realizada</th>
                <th className="py-3 px-4">Entidad del Sistema</th>
                <th className="py-3 px-4">Origen / Dirección IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                    {new Date(log.createdAt).toLocaleString('es-BO', {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{log.usuarioNombre}</div>
                    <div className="text-[11px] text-slate-400">{log.usuarioEmail}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                      {formatAccionAuditoria(log.accion)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{log.entidad}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
