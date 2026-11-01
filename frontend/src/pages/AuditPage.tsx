import React, { useState } from 'react';

interface AuditLog {
  id: string;
  usuarioId: string;
  usuarioEmail: string;
  accion: string;
  entidad: string;
  entidadId: string;
  ip: string;
  createdAt: string;
}

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([
    {
      id: 'aud-1',
      usuarioId: 'admin-id',
      usuarioEmail: 'admin@minedu.gob.bo',
      accion: 'REGISTRO_CALIFICACION',
      entidad: 'Calificacion',
      entidadId: 'cal-101',
      ip: '190.129.88.42',
      createdAt: '2026-11-01T01:15:30Z',
    },
    {
      id: 'aud-2',
      usuarioId: 'admin-id',
      usuarioEmail: 'directora@franztamayo.edu.bo',
      accion: 'MATRICULA_ESTUDIANTE',
      entidad: 'Inscripcion',
      entidadId: 'ins-504',
      ip: '190.129.88.42',
      createdAt: '2026-11-01T01:12:10Z',
    },
    {
      id: 'aud-3',
      usuarioId: 'admin-id',
      usuarioEmail: 'admin@minedu.gob.bo',
      accion: 'CREACION_INSTITUCION',
      entidad: 'UnidadEducativa',
      entidadId: 'inst-80730045',
      ip: '89.116.29.168',
      createdAt: '2026-11-01T01:07:36Z',
    },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Auditoría del Sistema</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Registro inmutable de trazabilidad y seguridad (Principio 7 de la Constitución del Sistema)
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Usuario Responsable</th>
                <th className="py-3 px-4">Acción Realizada</th>
                <th className="py-3 px-4">Entidad Afectada</th>
                <th className="py-3 px-4">Dirección IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 text-slate-500 font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{log.usuarioEmail}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {log.accion}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{log.entidad}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
