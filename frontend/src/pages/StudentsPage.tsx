import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatEstadoInscripcion } from '../utils/formatters';
import {
  Users,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  CheckCircle2,
  UserPlus,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  X,
  Phone,
  Calendar,
  Filter,
} from 'lucide-react';

interface StudentItem {
  id: string;
  rude: string;
  ci: string;
  nombres: string;
  primerApellido: string;
  segundoApellido: string;
  fechaNacimiento: string;
  genero: 'M' | 'F';
  curso: string;
  nombreTutor: string;
  parentescoTutor: string;
  telefonoTutor: string;
  estado: string;
}

export const StudentsPage: React.FC = () => {
  const { isMaestro, isDirector, isSuperAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCurso, setFilterCurso] = useState('ALL');
  const [filterEstado, setFilterEstado] = useState('ALL');

  const [students, setStudents] = useState<StudentItem[]>([
    {
      id: '1',
      rude: '807300452026001',
      ci: '10928374',
      nombres: 'Erick Elias',
      primerApellido: 'Alanoca',
      segundoApellido: 'Cruz',
      fechaNacimiento: '2012-05-14',
      genero: 'M',
      curso: '1° de Secundaria - Paralelo A',
      nombreTutor: 'Marcos Alanoca Ticona',
      parentescoTutor: 'Padre',
      telefonoTutor: '71548923',
      estado: 'EFECTIVO',
    },
    {
      id: '2',
      rude: '807300452026002',
      ci: '12847593',
      nombres: 'Fabiola',
      primerApellido: 'Aramayo',
      segundoApellido: 'Toledo',
      fechaNacimiento: '2012-09-22',
      genero: 'F',
      curso: '1° de Secundaria - Paralelo A',
      nombreTutor: 'Sonia Toledo Quispe',
      parentescoTutor: 'Madre',
      telefonoTutor: '68923145',
      estado: 'EFECTIVO',
    },
    {
      id: '3',
      rude: '807300452026003',
      ci: '11029485',
      nombres: 'Karol Lucero',
      primerApellido: 'Camacho',
      segundoApellido: 'Renjifo',
      fechaNacimiento: '2012-11-03',
      genero: 'F',
      curso: '1° de Secundaria - Paralelo A',
      nombreTutor: 'Lucero Renjifo',
      parentescoTutor: 'Madre',
      telefonoTutor: '72034918',
      estado: 'EFECTIVO',
    },
    {
      id: '4',
      rude: '807300452026004',
      ci: '9847261',
      nombres: 'Gabriel Omar',
      primerApellido: 'Flores',
      segundoApellido: 'Callisaya',
      fechaNacimiento: '2012-02-03',
      genero: 'M',
      curso: '1° de Secundaria - Paralelo A',
      nombreTutor: 'Ramiro Flores Choque',
      parentescoTutor: 'Padre',
      telefonoTutor: '73091824',
      estado: 'EFECTIVO',
    },
    {
      id: '5',
      rude: '807300452026005',
      ci: '13948271',
      nombres: 'Lucia Beatriz',
      primerApellido: 'Quispe',
      segundoApellido: 'Mamani',
      fechaNacimiento: '2012-07-19',
      genero: 'F',
      curso: '1° de Secundaria - Paralelo B',
      nombreTutor: 'Rosa Mamani Condori',
      parentescoTutor: 'Madre',
      telefonoTutor: '78492019',
      estado: 'EFECTIVO',
    },
  ]);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<StudentItem, 'id'>>({
    rude: '',
    ci: '',
    nombres: '',
    primerApellido: '',
    segundoApellido: '',
    fechaNacimiento: '2012-01-01',
    genero: 'M',
    curso: '1° de Secundaria - Paralelo A',
    nombreTutor: '',
    parentescoTutor: 'Padre',
    telefonoTutor: '',
    estado: 'EFECTIVO',
  });

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      rude: `807300452026${String(students.length + 1).padStart(3, '0')}`,
      ci: '',
      nombres: '',
      primerApellido: '',
      segundoApellido: '',
      fechaNacimiento: '2012-01-01',
      genero: 'M',
      curso: '1° de Secundaria - Paralelo A',
      nombreTutor: '',
      parentescoTutor: 'Padre',
      telefonoTutor: '',
      estado: 'EFECTIVO',
    });
    setShowModal(true);
  };

  const openEditModal = (student: StudentItem) => {
    setModalMode('edit');
    setSelectedStudent(student);
    setFormData({
      rude: student.rude,
      ci: student.ci,
      nombres: student.nombres,
      primerApellido: student.primerApellido,
      segundoApellido: student.segundoApellido,
      fechaNacimiento: student.fechaNacimiento,
      genero: student.genero,
      curso: student.curso,
      nombreTutor: student.nombreTutor,
      parentescoTutor: student.parentescoTutor,
      telefonoTutor: student.telefonoTutor,
      estado: student.estado,
    });
    setShowModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'create') {
      const newStudent: StudentItem = {
        ...formData,
        id: `st-${Date.now()}`,
      };
      setStudents([newStudent, ...students]);
      setFeedbackMessage('¡Estudiante inscrito y matriculado exitosamente con código RUDE oficial!');
    } else if (modalMode === 'edit' && selectedStudent) {
      setStudents(
        students.map((s) => (s.id === selectedStudent.id ? { ...formData, id: s.id } : s))
      );
      setFeedbackMessage('¡Ficha del estudiante actualizada correctamente!');
    }
    setShowModal(false);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleDelete = (id: string) => {
    setStudents(students.filter((s) => s.id !== id));
    setShowDeleteConfirm(null);
    setFeedbackMessage('Estudiante retirado de la nómina escolar.');
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await apiClient.get('/data-exchange/templates/students', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Plantilla_Oficial_Matricula_Estudiantes_Bolivia.xlsx');
      document.body.appendChild(link);
      link.click();
    } catch (e) {
      alert('Descargando plantilla oficial de estudiantes en Excel...');
    }
  };

  const handleExportStudents = async () => {
    try {
      const res = await apiClient.get('/data-exchange/export/students?format=xlsx', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Nomina_Oficial_Estudiantes_Matriculados.xlsx');
      document.body.appendChild(link);
      link.click();
    } catch (e) {
      alert('Generando exportación de nómina de estudiantes...');
    }
  };

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.rude.includes(searchTerm) ||
      s.primerApellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ci.includes(searchTerm);

    const matchesCurso = filterCurso === 'ALL' || s.curso.includes(filterCurso);
    const matchesEstado = filterEstado === 'ALL' || s.estado === filterEstado;

    return matchesSearch && matchesCurso && matchesEstado;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isMaestro ? 'Nómina y Filiación de Mis Estudiantes' : 'Estudiantes Matriculados & Registro RUDE'}
            </h1>
            <p className="text-xs text-slate-500">
              Gestión de inscripción, datos de apoderados y matrícula oficial (Gestión 2026)
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isMaestro && (
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Plantilla</span>
            </button>
          )}

          <button
            onClick={handleExportStudents}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar (.xlsx)</span>
          </button>

          {!isMaestro && (
            <>
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importar RUDE</span>
              </button>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Inscribir Estudiante</span>
              </button>
            </>
          )}
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código RUDE, carnet de identidad o apellidos..."
            className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400"
          />
        </div>

        <div>
          <select
            value={filterCurso}
            onChange={(e) => setFilterCurso(e.target.value)}
            className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
          >
            <option value="ALL">Todos los Cursos</option>
            <option value="1° de Secundaria">1° de Secundaria</option>
            <option value="2° de Secundaria">2° de Secundaria</option>
          </select>
        </div>

        <div>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="EFECTIVO">Efectivo (Activo)</option>
            <option value="RETIRADO_TRASLADO">Retirado por Traslado</option>
            <option value="RETIRADO_ABANDONO">Retirado por Abandono</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
            Nómina Oficial de Estudiantes ({filtered.length} Registros)
          </h2>
          <span className="text-xs text-slate-500">Unidad Educativa Emborozú (Gestión 2026)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-3 w-8">#</th>
                <th className="py-3 px-3 w-36">Código RUDE</th>
                <th className="py-3 px-3 w-28">Carnet Identidad</th>
                <th className="py-3 px-4 min-w-[200px]">Apellidos y Nombres</th>
                <th className="py-3 px-3 min-w-[180px]">Curso y Paralelo</th>
                <th className="py-3 px-4 min-w-[180px]">Tutor / Apoderado</th>
                <th className="py-3 px-3 text-center w-28">Estado</th>
                {!isMaestro && <th className="py-3 px-3 text-center w-24">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((student, idx) => (
                <tr key={student.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-800">{student.rude}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{student.ci || 'S/CI'}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900 uppercase">
                    {student.primerApellido} {student.segundoApellido} {student.nombres}
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">{student.curso}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{student.nombreTutor}</div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                      <span>({student.parentescoTutor})</span>
                      {student.telefonoTutor && (
                        <span className="text-emerald-700 flex items-center space-x-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{student.telefonoTutor}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        formatEstadoInscripcion(student.estado).color
                      }`}
                    >
                      {formatEstadoInscripcion(student.estado).label}
                    </span>
                  </td>
                  {!isMaestro && (
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => openEditModal(student)}
                          title="Editar Ficha"
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(student.id)}
                          title="Dar de Baja"
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {modalMode === 'create' ? 'Inscribir Nuevo Estudiante (RUDE)' : 'Modificar Ficha de Estudiante'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Código RUDE Oficial:</label>
                  <input
                    type="text"
                    required
                    value={formData.rude}
                    onChange={(e) => setFormData({ ...formData, rude: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold text-emerald-800"
                    placeholder="807300452026..."
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Carnet de Identidad:</label>
                  <input
                    type="text"
                    value={formData.ci}
                    onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                    placeholder="ej. 10928374 LP"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombres:</label>
                  <input
                    type="text"
                    required
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Primer Apellido:</label>
                  <input
                    type="text"
                    required
                    value={formData.primerApellido}
                    onChange={(e) => setFormData({ ...formData, primerApellido: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Segundo Apellido:</label>
                  <input
                    type="text"
                    value={formData.segundoApellido}
                    onChange={(e) => setFormData({ ...formData, segundoApellido: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Curso y Paralelo:</label>
                  <select
                    value={formData.curso}
                    onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  >
                    <option value="1° de Secundaria - Paralelo A">1° de Secundaria - Paralelo A</option>
                    <option value="1° de Secundaria - Paralelo B">1° de Secundaria - Paralelo B</option>
                    <option value="2° de Secundaria - Paralelo A">2° de Secundaria - Paralelo A</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fecha de Nacimiento:</label>
                  <input
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estado de Matrícula:</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  >
                    <option value="EFECTIVO">Efectivo (Regular)</option>
                    <option value="RETIRADO_TRASLADO">Retirado (Traslado)</option>
                    <option value="RETIRADO_ABANDONO">Retirado (Abandono)</option>
                  </select>
                </div>
              </div>

              {/* Tutor Information */}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Datos del Apoderado / Tutor Legal
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="font-medium text-slate-600 block mb-1">Nombre Completo Tutor:</label>
                    <input
                      type="text"
                      required
                      value={formData.nombreTutor}
                      onChange={(e) => setFormData({ ...formData, nombreTutor: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                      placeholder="ej. Juan Carlos Mamani"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-600 block mb-1">Parentesco:</label>
                    <select
                      value={formData.parentescoTutor}
                      onChange={(e) => setFormData({ ...formData, parentescoTutor: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    >
                      <option value="Padre">Padre</option>
                      <option value="Madre">Madre</option>
                      <option value="Tutor Legal">Tutor Legal</option>
                      <option value="Abuelo/a">Abuelo / Abuela</option>
                      <option value="Hermano/a">Hermano / Hermana Mayor</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-medium text-slate-600 block mb-1">Teléfono / Celular:</label>
                    <input
                      type="text"
                      value={formData.telefonoTutor}
                      onChange={(e) => setFormData({ ...formData, telefonoTutor: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                      placeholder="ej. 71548923"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                >
                  {modalMode === 'create' ? 'Completar Matrícula' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-sm text-slate-900">¿Dar de baja al estudiante?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Esta acción dará de baja la matrícula del estudiante en la gestión escolar activa.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
              >
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
