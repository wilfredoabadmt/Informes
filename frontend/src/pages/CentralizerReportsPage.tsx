import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { FileSpreadsheet, FileText, Download, Printer, CheckCircle2 } from 'lucide-react';

export const CentralizerReportsPage: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownloadPdf = async (type: 'roster' | 'bulletin' | 'card') => {
    setDownloading(type);
    try {
      let endpoint = '';
      let filename = '';

      if (type === 'roster') {
        endpoint = '/reports/course-roster/pdf';
        filename = 'Lista_de_Curso_Oficial.pdf';
      } else if (type === 'bulletin') {
        endpoint = '/reports/trimester-bulletin/pdf';
        filename = 'Boletin_Trimestral.pdf';
      } else if (type === 'card') {
        endpoint = '/reports/school-report-card/pdf';
        filename = 'Libreta_Escolar_Oficial_SEP.pdf';
      }

      const res = await apiClient.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
    } catch (e) {
      alert(`Generando documento PDF (${type})...`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Centralizadores & Emisión de Reportes</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generación oficial de Centralizadores Trimestrales y Documentos PDF con formato del Ministerio de Educación
        </p>
      </div>

      {/* PDF Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Course Roster Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl inline-block mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Lista de Curso Oficial</h3>
            <p className="text-xs text-slate-500 mt-1">
              Nómina completa de estudiantes matriculados, RUDE, CI y casillas de control.
            </p>
          </div>
          <button
            onClick={() => handleDownloadPdf('roster')}
            disabled={downloading === 'roster'}
            className="mt-4 w-full flex items-center justify-center space-x-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading === 'roster' ? 'Generando...' : 'Descargar PDF'}</span>
          </button>
        </div>

        {/* Trimester Bulletin Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl inline-block mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Boletín Trimestral</h3>
            <p className="text-xs text-slate-500 mt-1">
              Informe trimestral de aprovechamiento por materias con valoración cualitativa del estudiante.
            </p>
          </div>
          <button
            onClick={() => handleDownloadPdf('bulletin')}
            disabled={downloading === 'bulletin'}
            className="mt-4 w-full flex items-center justify-center space-x-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading === 'bulletin' ? 'Generando...' : 'Descargar PDF'}</span>
          </button>
        </div>

        {/* School Report Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl inline-block mb-3">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Libreta Escolar Anual</h3>
            <p className="text-xs text-slate-500 mt-1">
              Libreta oficial con los 3 trimestres, promedio anual final y estado PROMOVIDO/RETENIDO.
            </p>
          </div>
          <button
            onClick={() => handleDownloadPdf('card')}
            disabled={downloading === 'card'}
            className="mt-4 w-full flex items-center justify-center space-x-2 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading === 'card' ? 'Generando...' : 'Descargar PDF'}</span>
          </button>
        </div>
      </div>

      {/* Centralizer Preview Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3">
          Vista Previa de Centralizador General (1° Trimestre 2026)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Estudiante</th>
                <th className="py-2.5 px-2 text-center">Matemática</th>
                <th className="py-2.5 px-2 text-center">Lenguaje</th>
                <th className="py-2.5 px-2 text-center">Ciencias</th>
                <th className="py-2.5 px-2 text-center">Sociales</th>
                <th className="py-2.5 px-3 text-center bg-slate-200/60 font-black">PROMEDIO</th>
                <th className="py-2.5 px-3 text-center">ESTADO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-semibold text-slate-400">1</td>
                <td className="py-2.5 px-3 font-semibold text-slate-800">ARCE CONDORI, MATEO</td>
                <td className="py-2.5 px-2 text-center font-medium">91</td>
                <td className="py-2.5 px-2 text-center font-medium">85</td>
                <td className="py-2.5 px-2 text-center font-medium">88</td>
                <td className="py-2.5 px-2 text-center font-medium">90</td>
                <td className="py-2.5 px-3 text-center font-black text-emerald-700 bg-emerald-50/50">88.5</td>
                <td className="py-2.5 px-3 text-center">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    APROBADO
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-semibold text-slate-400">2</td>
                <td className="py-2.5 px-3 font-semibold text-slate-800">QUISPE MAMANI, LUCIA</td>
                <td className="py-2.5 px-2 text-center font-medium">95</td>
                <td className="py-2.5 px-2 text-center font-medium">92</td>
                <td className="py-2.5 px-2 text-center font-medium">94</td>
                <td className="py-2.5 px-2 text-center font-medium">96</td>
                <td className="py-2.5 px-3 text-center font-black text-emerald-700 bg-emerald-50/50">94.2</td>
                <td className="py-2.5 px-3 text-center">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    APROBADO
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-semibold text-slate-400">3</td>
                <td className="py-2.5 px-3 font-semibold text-slate-800">FLORES CALLISAYA, GABRIEL</td>
                <td className="py-2.5 px-2 text-center font-medium text-red-600 font-bold">48</td>
                <td className="py-2.5 px-2 text-center font-medium">55</td>
                <td className="py-2.5 px-2 text-center font-medium">60</td>
                <td className="py-2.5 px-2 text-center font-medium">52</td>
                <td className="py-2.5 px-3 text-center font-black text-amber-700 bg-amber-50/50">53.7</td>
                <td className="py-2.5 px-3 text-center">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    APROBADO
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

