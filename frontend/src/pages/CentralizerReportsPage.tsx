import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getCoursesForInstitution,
  getStudentsForInstitution,
  saveCoursesForInstitution,
  resolveTenantKey,
  type TenantParalelo,
  type TenantStudent,
} from '../utils/multiTenantStore';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Printer,
  Sparkles,
  Award,
  Filter,
  CheckCircle2,
  User,
  School,
  ArrowRight,
  Users,
} from 'lucide-react';
import {
  exportCourseRosterToPdf,
  exportCourseRosterToExcel,
  exportCentralizerToExcel,
  exportBulletinPdf,
  exportSchoolReportCardPdf,
  exportActaCompromisoPdf,
  exportAutoevaluacionPrimariaPdf,
} from '../utils/exportHelpers';
import type { StudentExportRow, CentralizerRow } from '../utils/exportHelpers';
import { getEscalaCualitativa } from '../utils/formatters';

// Data por curso para los reportes
const DATA_POR_CURSO: Record<
  string,
  {
    estudiantes: StudentExportRow[];
    centralizador: CentralizerRow[];
  }
> = {
  SEC_1A: {
    estudiantes: [
      { numero: 1, rude: '807300452026001', ci: '10928374 LP', apellidosNombres: 'ALANOCA CRUZ ERICK ELIAS', genero: 'M', tutor: 'Marcos Alanoca Ticona', telefono: '71548923', estado: 'EFECTIVO' },
      { numero: 2, rude: '807300452026002', ci: '12847593 LP', apellidosNombres: 'ARAMAYO TOLEDO FABIOLA', genero: 'F', tutor: 'Sonia Toledo Quispe', telefono: '68923145', estado: 'EFECTIVO' },
      { numero: 3, rude: '807300452026003', ci: '11029485 LP', apellidosNombres: 'CAMACHO RENJIFO KAROL LUCERO', genero: 'F', tutor: 'Lucero Renjifo', telefono: '72034918', estado: 'EFECTIVO' },
      { numero: 4, rude: '807300452026004', ci: '10847291 LP', apellidosNombres: 'CARDOZO YEVARA CARLIN YARITA', genero: 'F', tutor: 'Elena Yevara', telefono: '71928301', estado: 'EFECTIVO' },
      { numero: 5, rude: '807300452026005', ci: '12948172 LP', apellidosNombres: 'COLQUE COLODRO JHOANNA MAYENNI', genero: 'F', tutor: 'Ramiro Colque', telefono: '67019284', estado: 'EFECTIVO' },
      { numero: 6, rude: '807300452026006', ci: '9847261 LP', apellidosNombres: 'FLORES CALLISAYA GABRIEL OMAR', genero: 'M', tutor: 'Omar Flores', telefono: '71829304', estado: 'EFECTIVO' },
    ],
    centralizador: [
      { numero: 1, estudiante: 'ALANOCA CRUZ, ERICK ELIAS', ci: '10928374', rude: '807300452026001', matematica: 90, lenguaje: 88, ciencias: 85, sociales: 89, artes: 92, guarani: 90, promedio: 89.0, situacion: 'APROBADO' },
      { numero: 2, estudiante: 'ARAMAYO TOLEDO, FABIOLA', ci: '12847593', rude: '807300452026002', matematica: 98, lenguaje: 95, ciencias: 94, sociales: 96, artes: 98, guarani: 97, promedio: 96.3, situacion: 'APROBADO' },
      { numero: 3, estudiante: 'CAMACHO RENJIFO, KAROL LUCERO', ci: '11029485', rude: '807300452026003', matematica: 63, lenguaje: 68, ciencias: 65, sociales: 70, artes: 75, guarani: 62, promedio: 67.2, situacion: 'APROBADO' },
      { numero: 4, estudiante: 'CARDOZO YEVARA, CARLIN YARITA', ci: '10847291', rude: '807300452026004', matematica: 83, lenguaje: 85, ciencias: 80, sociales: 82, artes: 88, guarani: 84, promedio: 83.7, situacion: 'APROBADO' },
      { numero: 5, estudiante: 'COLQUE COLODRO, JHOANNA MAYENNI', ci: '12948172', rude: '807300452026005', matematica: 89, lenguaje: 90, ciencias: 87, sociales: 91, artes: 93, guarani: 88, promedio: 89.7, situacion: 'APROBADO' },
      { numero: 6, estudiante: 'FLORES CALLISAYA, GABRIEL OMAR', ci: '9847261', rude: '807300452026006', matematica: 54, lenguaje: 58, ciencias: 52, sociales: 55, artes: 60, guarani: 53, promedio: 55.3, situacion: 'APROBADO' },
    ],
  },
  SEC_1B: {
    estudiantes: [
      { numero: 1, rude: '807300452026007', ci: '13948271 LP', apellidosNombres: 'ARCE CONDORI MATEO DANIEL', genero: 'M', tutor: 'Daniel Arce', telefono: '71548123', estado: 'EFECTIVO' },
      { numero: 2, rude: '807300452026008', ci: '12049182 LP', apellidosNombres: 'GUTIERREZ ROJAS SOFIA BELEN', genero: 'F', tutor: 'Belen Rojas', telefono: '68923456', estado: 'EFECTIVO' },
      { numero: 3, rude: '807300452026009', ci: '14920184 LP', apellidosNombres: 'MAMANI QUISPE LUCIA VALENTINA', genero: 'F', tutor: 'Juan Mamani', telefono: '72034111', estado: 'EFECTIVO' },
      { numero: 4, rude: '807300452026010', ci: '11049283 LP', apellidosNombres: 'TORREZ MENDOZA NICOLE ANDREA', genero: 'F', tutor: 'Andrea Mendoza', telefono: '71928222', estado: 'EFECTIVO' },
      { numero: 5, rude: '807300452026011', ci: '10948271 LP', apellidosNombres: 'VARGAS PAZ ALEJANDRO JOSE', genero: 'M', tutor: 'Jose Vargas', telefono: '67019333', estado: 'EFECTIVO' },
      { numero: 6, rude: '807300452026012', ci: '12948194 LP', apellidosNombres: 'CHOQUE HUANCA BRUNO JHOEL', genero: 'M', tutor: 'Rosa Huanca', telefono: '71829444', estado: 'EFECTIVO' },
    ],
    centralizador: [
      { numero: 1, estudiante: 'ARCE CONDORI, MATEO DANIEL', ci: '13948271', rude: '807300452026007', matematica: 91, lenguaje: 85, ciencias: 88, sociales: 90, artes: 92, guarani: 89, promedio: 89.2, situacion: 'APROBADO' },
      { numero: 2, estudiante: 'GUTIERREZ ROJAS, SOFIA BELEN', ci: '12049182', rude: '807300452026008', matematica: 95, lenguaje: 92, ciencias: 94, sociales: 96, artes: 95, guarani: 93, promedio: 94.2, situacion: 'APROBADO' },
      { numero: 3, estudiante: 'MAMANI QUISPE, LUCIA VALENTINA', ci: '14920184', rude: '807300452026009', matematica: 84, lenguaje: 88, ciencias: 86, sociales: 85, artes: 90, guarani: 82, promedio: 85.8, situacion: 'APROBADO' },
      { numero: 4, estudiante: 'TORREZ MENDOZA, NICOLE ANDREA', ci: '11049283', rude: '807300452026010', matematica: 78, lenguaje: 80, ciencias: 82, sociales: 84, artes: 85, guarani: 79, promedio: 81.3, situacion: 'APROBADO' },
      { numero: 5, estudiante: 'VARGAS PAZ, ALEJANDRO JOSE', ci: '10948271', rude: '807300452026011', matematica: 72, lenguaje: 75, ciencias: 70, sociales: 74, artes: 80, guarani: 71, promedio: 73.7, situacion: 'APROBADO' },
      { numero: 6, estudiante: 'CHOQUE HUANCA, BRUNO JHOEL', ci: '12948194', rude: '807300452026012', matematica: 48, lenguaje: 55, ciencias: 52, sociales: 50, artes: 62, guarani: 51, promedio: 53.0, situacion: 'APROBADO' },
    ],
  },
  SEC_2A: {
    estudiantes: [
      { numero: 1, rude: '807300452026013', ci: '11928471 LP', apellidosNombres: 'SALAZAR RAMOS DIEGO ARMANDO', genero: 'M', tutor: 'Armando Salazar', telefono: '71548555', estado: 'EFECTIVO' },
      { numero: 2, rude: '807300452026014', ci: '10948172 LP', apellidosNombres: 'PINTO MORALES CAMILA RENATA', genero: 'F', tutor: 'Renata Morales', telefono: '68923666', estado: 'EFECTIVO' },
      { numero: 3, rude: '807300452026015', ci: '12847192 LP', apellidosNombres: 'FERNANDEZ LUNA RODRIGO MARTIN', genero: 'M', tutor: 'Martin Fernandez', telefono: '72034777', estado: 'EFECTIVO' },
      { numero: 4, rude: '807300452026016', ci: '13948102 LP', apellidosNombres: 'CASTRO GUZMAN VALERIA PAOLA', genero: 'F', tutor: 'Paola Guzman', telefono: '71928888', estado: 'EFECTIVO' },
      { numero: 5, rude: '807300452026017', ci: '14829104 LP', apellidosNombres: 'ORTIZ PEREZ SEBASTIAN ANDRES', genero: 'M', tutor: 'Andres Ortiz', telefono: '67019999', estado: 'EFECTIVO' },
    ],
    centralizador: [
      { numero: 1, estudiante: 'SALAZAR RAMOS, DIEGO ARMANDO', ci: '11928471', rude: '807300452026013', matematica: 88, lenguaje: 86, ciencias: 85, sociales: 89, artes: 90, guarani: 87, promedio: 87.5, situacion: 'APROBADO' },
      { numero: 2, estudiante: 'PINTO MORALES, CAMILA RENATA', ci: '10948172', rude: '807300452026014', matematica: 94, lenguaje: 95, ciencias: 92, sociales: 96, artes: 98, guarani: 95, promedio: 95.0, situacion: 'APROBADO' },
      { numero: 3, estudiante: 'FERNANDEZ LUNA, RODRIGO MARTIN', ci: '12847192', rude: '807300452026015', matematica: 75, lenguaje: 78, ciencias: 74, sociales: 76, artes: 82, guarani: 73, promedio: 76.3, situacion: 'APROBADO' },
      { numero: 4, estudiante: 'CASTRO GUZMAN, VALERIA PAOLA', ci: '13948102', rude: '807300452026016', matematica: 86, lenguaje: 89, ciencias: 88, sociales: 90, artes: 92, guarani: 85, promedio: 88.3, situacion: 'APROBADO' },
      { numero: 5, estudiante: 'ORTIZ PEREZ, SEBASTIAN ANDRES', ci: '14829104', rude: '807300452026017', matematica: 62, lenguaje: 68, ciencias: 64, sociales: 66, artes: 70, guarani: 60, promedio: 65.0, situacion: 'APROBADO' },
    ],
  },
  PRIM_1A: {
    estudiantes: [
      { numero: 1, rude: '807300452026018', ci: '15928471 LP', apellidosNombres: 'MAMANI LOPEZ THIAGO GAEL', genero: 'M', tutor: 'Gael Mamani', telefono: '71548100', estado: 'EFECTIVO' },
      { numero: 2, rude: '807300452026019', ci: '16948172 LP', apellidosNombres: 'RIOS CONDORI VALENTINA PAZ', genero: 'F', tutor: 'Paz Rios', telefono: '68923200', estado: 'EFECTIVO' },
      { numero: 3, rude: '807300452026020', ci: '15847192 LP', apellidosNombres: 'CRUZ QUISPE LIAM SAMUEL', genero: 'M', tutor: 'Samuel Cruz', telefono: '72034300', estado: 'EFECTIVO' },
      { numero: 4, rude: '807300452026021', ci: '16948102 LP', apellidosNombres: 'FLORES ALVAREZ MIA ISABELLA', genero: 'F', tutor: 'Isabella Alvarez', telefono: '71928400', estado: 'EFECTIVO' },
      { numero: 5, rude: '807300452026022', ci: '15829104 LP', apellidosNombres: 'CHOQUE HUANCA LUCAS MATEO', genero: 'M', tutor: 'Mateo Choque', telefono: '67019500', estado: 'EFECTIVO' },
    ],
    centralizador: [
      { numero: 1, estudiante: 'MAMANI LOPEZ, THIAGO GAEL', ci: '15928471', rude: '807300452026018', matematica: 92, lenguaje: 94, ciencias: 90, sociales: 91, artes: 96, guarani: 89, promedio: 92.0, situacion: 'PROMOVIDO' },
      { numero: 2, estudiante: 'RIOS CONDORI, VALENTINA PAZ', ci: '16948172', rude: '807300452026019', matematica: 96, lenguaje: 98, ciencias: 95, sociales: 97, artes: 99, guarani: 96, promedio: 96.8, situacion: 'PROMOVIDO' },
      { numero: 3, estudiante: 'CRUZ QUISPE, LIAM SAMUEL', ci: '15847192', rude: '807300452026020', matematica: 82, lenguaje: 85, ciencias: 80, sociales: 84, artes: 88, guarani: 81, promedio: 83.3, situacion: 'PROMOVIDO' },
      { numero: 4, estudiante: 'FLORES ALVAREZ, MIA ISABELLA', ci: '16948102', rude: '807300452026021', matematica: 89, lenguaje: 91, ciencias: 87, sociales: 90, artes: 94, guarani: 88, promedio: 89.8, situacion: 'PROMOVIDO' },
      { numero: 5, estudiante: 'CHOQUE HUANCA, LUCAS MATEO', ci: '15829104', rude: '807300452026022', matematica: 75, lenguaje: 78, ciencias: 72, sociales: 74, artes: 80, guarani: 70, promedio: 74.8, situacion: 'PROMOVIDO' },
    ],
  },
  PRIM_2A: {
    estudiantes: [
      { numero: 1, rude: '807300452026023', ci: '15928473 LP', apellidosNombres: 'SANCHEZ NINA GAEL FACUNDO', genero: 'M', tutor: 'Facundo Sanchez', telefono: '71548600', estado: 'EFECTIVO' },
      { numero: 2, rude: '807300452026024', ci: '16948174 LP', apellidosNombres: 'GUTIERREZ LUNA EMMA VICTORIA', genero: 'F', tutor: 'Victoria Luna', telefono: '68923700', estado: 'EFECTIVO' },
      { numero: 3, rude: '807300452026025', ci: '15847195 LP', apellidosNombres: 'MENDOZA RAMOS IAN PATRICIO', genero: 'M', tutor: 'Patricio Mendoza', telefono: '72034800', estado: 'EFECTIVO' },
      { numero: 4, rude: '807300452026026', ci: '16948106 LP', apellidosNombres: 'MORALES PINTO ZOE VALERIA', genero: 'F', tutor: 'Valeria Pinto', telefono: '71928900', estado: 'EFECTIVO' },
    ],
    centralizador: [
      { numero: 1, estudiante: 'SANCHEZ NINA, GAEL FACUNDO', ci: '15928473', rude: '807300452026023', matematica: 88, lenguaje: 89, ciencias: 85, sociales: 87, artes: 92, guarani: 84, promedio: 87.5, situacion: 'PROMOVIDO' },
      { numero: 2, estudiante: 'GUTIERREZ LUNA, EMMA VICTORIA', ci: '16948174', rude: '807300452026024', matematica: 95, lenguaje: 97, ciencias: 93, sociales: 95, artes: 98, guarani: 92, promedio: 95.0, situacion: 'PROMOVIDO' },
      { numero: 3, estudiante: 'MENDOZA RAMOS, IAN PATRICIO', ci: '15847195', rude: '807300452026025', matematica: 80, lenguaje: 83, ciencias: 78, sociales: 81, artes: 86, guarani: 79, promedio: 81.2, situacion: 'PROMOVIDO' },
      { numero: 4, estudiante: 'MORALES PINTO, ZOE VALERIA', ci: '16948106', rude: '807300452026026', matematica: 91, lenguaje: 93, ciencias: 89, sociales: 92, artes: 95, guarani: 90, promedio: 91.7, situacion: 'PROMOVIDO' },
    ],
  },
};

const CURSOS_LISTA = [
  { id: 'SEC_1A', nombre: '1° de Secundaria Comunitaria Productiva - Paralelo A' },
  { id: 'SEC_1B', nombre: '1° de Secundaria Comunitaria Productiva - Paralelo B' },
  { id: 'SEC_2A', nombre: '2° de Secundaria Comunitaria Productiva - Paralelo A' },
  { id: 'PRIM_1A', nombre: '1° de Primaria Comunitaria Vocacional - Paralelo A' },
  { id: 'PRIM_2A', nombre: '2° de Primaria Comunitaria Vocacional - Paralelo A' },
];

export const CentralizerReportsPage: React.FC = () => {
  const { isMaestro, isDirector, isSuperAdmin, currentInstitutionId, user } = useAuth();
  const activeSie = resolveTenantKey(currentInstitutionId);
  const currentInst = user?.institutions?.find(i => (i.id || i.institutionId || i.sie) === currentInstitutionId) || user?.institutions?.[0];
  const institutionName = currentInst?.nombre || 'Unidad Educativa';

  const [coursesList, setCoursesList] = useState<TenantParalelo[]>(() => getCoursesForInstitution(activeSie));
  const [studentsListRaw, setStudentsListRaw] = useState<TenantStudent[]>(() => getStudentsForInstitution(activeSie));

  useEffect(() => {
    setCoursesList(getCoursesForInstitution(activeSie));
    setStudentsListRaw(getStudentsForInstitution(activeSie));
  }, [activeSie]);

  useEffect(() => {
    const handleCourses = () => setCoursesList(getCoursesForInstitution(activeSie));
    const handleStudents = () => setStudentsListRaw(getStudentsForInstitution(activeSie));
    window.addEventListener('sigma_courses_updated', handleCourses);
    window.addEventListener('sigma_students_updated', handleStudents);
    return () => {
      window.removeEventListener('sigma_courses_updated', handleCourses);
      window.removeEventListener('sigma_students_updated', handleStudents);
    };
  }, [activeSie]);

  const handleQuickInitStandardCourses = () => {
    const defaultCourses: TenantParalelo[] = [
      { id: `c-${Date.now()}-1`, cursoNombre: '1° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 1, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-2`, cursoNombre: '2° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 2, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-3`, cursoNombre: '3° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 3, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-4`, cursoNombre: '4° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 4, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-5`, cursoNombre: '5° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 5, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-6`, cursoNombre: '6° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 6, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
    ];
    saveCoursesForInstitution(activeSie, defaultCourses);
    setCoursesList(defaultCourses);
    setSelectedCurso(defaultCourses[0].id);
  };

  const cursosDisponibles = coursesList.map((c) => ({
    id: c.id,
    nombre: `${c.cursoNombre} - Paralelo "${c.letra}" (${c.turno})`,
    nivel: c.nivel,
    grado: c.grado,
    letra: c.letra,
  }));

  const [selectedCurso, setSelectedCurso] = useState('');
  const [selectedTrimestre, setSelectedTrimestre] = useState('1');
  const [selectedEstudianteId, setSelectedEstudianteId] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (cursosDisponibles.length > 0) {
      if (!selectedCurso || !cursosDisponibles.some((c) => c.id === selectedCurso)) {
        setSelectedCurso(cursosDisponibles[0].id);
      }
    } else {
      setSelectedCurso('');
    }
  }, [cursosDisponibles, selectedCurso]);

  const cursoInfo = cursosDisponibles.find((c) => c.id === selectedCurso);

  const matchingStudents = studentsListRaw.filter((s) => {
    if (!cursoInfo) return false;
    const matchGrado = s.curso.includes(`${cursoInfo.grado}°`);
    const matchLetra =
      s.curso.includes(`Paralelo ${cursoInfo.letra}`) ||
      s.curso.includes(`"${cursoInfo.letra}"`) ||
      s.curso.endsWith(` ${cursoInfo.letra}`);
    return matchGrado && matchLetra;
  });

  const studentsList: StudentExportRow[] =
    DATA_POR_CURSO[selectedCurso]?.estudiantes ||
    matchingStudents.map((s, idx) => ({
      numero: idx + 1,
      rude: s.rude,
      ci: s.ci,
      apellidosNombres: `${s.primerApellido} ${s.segundoApellido || ''} ${s.nombres}`.trim(),
      genero: s.genero,
      tutor: s.nombreTutor || 'No registrado',
      telefono: s.telefonoTutor || 'No registrado',
      estado: 'EFECTIVO',
    }));

  const centralizadorList: CentralizerRow[] =
    DATA_POR_CURSO[selectedCurso]?.centralizador ||
    studentsList.map((s, idx) => {
      const base = 70 + ((idx * 7) % 25);
      return {
        numero: s.numero,
        estudiante: s.apellidosNombres,
        ci: s.ci,
        rude: s.rude,
        matematica: Math.min(100, base + 5),
        lenguaje: Math.min(100, base + 2),
        ciencias: Math.min(100, base - 3),
        sociales: Math.min(100, base + 1),
        artes: Math.min(100, base + 8),
        guarani: Math.min(100, base),
        promedio: Number((base + 2.2).toFixed(1)),
        situacion: base + 2.2 >= 51 ? 'APROBADO' : 'REPROBADO',
      };
    });

  const dataActual = {
    estudiantes: studentsList,
    centralizador: centralizadorList,
  };

  useEffect(() => {
    if (dataActual.estudiantes.length > 0) {
      if (!selectedEstudianteId || !dataActual.estudiantes.some((e) => e.rude === selectedEstudianteId)) {
        setSelectedEstudianteId(dataActual.estudiantes[0].rude);
      }
    } else {
      setSelectedEstudianteId('');
    }
  }, [dataActual.estudiantes, selectedEstudianteId]);

  const trimLabel =
    selectedTrimestre === '1'
      ? 'Primer Trimestre'
      : selectedTrimestre === '2'
        ? 'Segundo Trimestre'
        : 'Tercer Trimestre';

  // Descarga directa e instantánea de la Lista en PDF
  const handleDownloadListaPdf = () => {
    if (dataActual.estudiantes.length === 0) {
      setFeedback('⚠️ No hay estudiantes matriculados en este curso para generar este documento.');
      return;
    }
    exportCourseRosterToPdf(cursoInfo?.nombre || selectedCurso, dataActual.estudiantes);
    setFeedback(`✅ Lista de curso en PDF generada exitosamente para ${cursoInfo?.nombre}.`);
  };

  // Descarga directa e instantánea de la Lista en Excel
  const handleDownloadListaExcel = () => {
    if (dataActual.estudiantes.length === 0) {
      setFeedback('⚠️ No hay estudiantes matriculados en este curso para generar este documento.');
      return;
    }
    exportCourseRosterToExcel(cursoInfo?.nombre || selectedCurso, dataActual.estudiantes);
    setFeedback(`✅ Lista de curso en Excel (.xlsx) generada exitosamente para ${cursoInfo?.nombre}.`);
  };

  // Descarga del Centralizador en Excel
  const handleDownloadCentralizadorExcel = () => {
    if (dataActual.estudiantes.length === 0) {
      setFeedback('⚠️ No hay estudiantes matriculados en este curso para generar este documento.');
      return;
    }
    exportCentralizerToExcel(cursoInfo?.nombre || selectedCurso, trimLabel, dataActual.centralizador);
    setFeedback(`✅ Centralizador oficial en Excel (.xlsx) generado exitosamente para ${cursoInfo?.nombre}.`);
  };

  // MODELO 1: Descarga del Boletín Trimestral Individual en PDF (Desglose de 4 Dimensiones de 1 solo trimestre)
  const handleDownloadBoletinPdf = () => {
    if (dataActual.estudiantes.length === 0) {
      setFeedback('⚠️ No hay estudiantes matriculados en este curso para emitir el boletín.');
      return;
    }
    const est =
      dataActual.estudiantes.find((s) => s.rude === selectedEstudianteId) || dataActual.estudiantes[0];
    const cent =
      dataActual.centralizador.find((c) => c.rude === est.rude) || dataActual.centralizador[0];

    const materiasTrimestrales = [
      {
        nombre: 'Matemática',
        ser: 9,
        saber: Math.min(35, Math.floor(cent.matematica * 0.35)),
        hacer: Math.min(35, Math.floor(cent.matematica * 0.35)),
        decidir: 9,
        auto: 10,
        extras: cent.matematica > 90 ? 2 : 0,
        total: cent.matematica,
      },
      {
        nombre: 'Comunicación y Lenguajes',
        ser: 9,
        saber: Math.min(35, Math.floor(cent.lenguaje * 0.35)),
        hacer: Math.min(35, Math.floor(cent.lenguaje * 0.35)),
        decidir: 8,
        auto: 10,
        extras: 0,
        total: cent.lenguaje,
      },
      {
        nombre: 'Ciencias Naturales (Biología-Geografía)',
        ser: 8,
        saber: Math.min(35, Math.floor(cent.ciencias * 0.35)),
        hacer: Math.min(35, Math.floor(cent.ciencias * 0.35)),
        decidir: 8,
        auto: 10,
        extras: 0,
        total: cent.ciencias,
      },
      {
        nombre: 'Ciencias Sociales',
        ser: 9,
        saber: Math.min(35, Math.floor(cent.sociales * 0.35)),
        hacer: Math.min(35, Math.floor(cent.sociales * 0.35)),
        decidir: 9,
        auto: 10,
        extras: 1,
        total: cent.sociales,
      },
      {
        nombre: 'Artes Plásticas y Visuales',
        ser: 10,
        saber: Math.min(35, Math.floor(cent.artes * 0.35)),
        hacer: Math.min(35, Math.floor(cent.artes * 0.35)),
        decidir: 9,
        auto: 10,
        extras: 0,
        total: cent.artes,
      },
      {
        nombre: 'Lengua Originaria Guaraní',
        ser: 9,
        saber: Math.min(35, Math.floor(cent.guarani * 0.35)),
        hacer: Math.min(35, Math.floor(cent.guarani * 0.35)),
        decidir: 8,
        auto: 10,
        extras: 0,
        total: cent.guarani,
      },
    ];

    const textoCualitativo = `En el ${trimLabel}, el/la estudiante ${est.apellidosNombres} demuestra excelente vocación y responsabilidad en la entrega de actividades (SER). Consolida destrezas de análisis crítico y razonamiento lógico-matemático (SABER y HACER). Fortalece el trabajo comunitario y asume liderazgo positivo con sus compañeros de curso (DECIDIR).`;

    exportBulletinPdf(
      est.apellidosNombres,
      est.rude,
      cursoInfo?.nombre || selectedCurso,
      trimLabel,
      materiasTrimestrales,
      textoCualitativo
    );
    setFeedback(`✅ Boletín Trimestral emitido con desglose de 4 Dimensiones para ${est.apellidosNombres}.`);
  };

  // MODELO 2: Descarga de la Libreta Escolar Electrónica Oficial (Anual por Campos de Saberes con Promoción)
  const handleDownloadLibretaPdf = () => {
    if (dataActual.estudiantes.length === 0) {
      setFeedback('⚠️ No hay estudiantes matriculados en este curso para emitir la libreta.');
      return;
    }
    const est =
      dataActual.estudiantes.find((s) => s.rude === selectedEstudianteId) || dataActual.estudiantes[0];
    const cent =
      dataActual.centralizador.find((c) => c.rude === est.rude) || dataActual.centralizador[0];

    const camposOrganizados = [
      {
        campo: 'Cosmos y Pensamiento',
        areas: [
          {
            nombre: 'Valores, Espiritualidades y Religiones',
            t1: 88,
            t2: 90,
            t3: 92,
            final: 90,
            estado: 'APROBADO',
          },
        ],
      },
      {
        campo: 'Comunidad y Sociedad',
        areas: [
          {
            nombre: 'Comunicación y Lenguajes: Lengua Castellana',
            t1: cent.lenguaje - 2,
            t2: cent.lenguaje,
            t3: cent.lenguaje + 2,
            final: cent.lenguaje,
            estado: 'APROBADO',
          },
          {
            nombre: 'Lengua Originaria (Guaraní)',
            t1: cent.guarani - 1,
            t2: cent.guarani,
            t3: cent.guarani + 1,
            final: cent.guarani,
            estado: 'APROBADO',
          },
          {
            nombre: 'Lengua Extranjera (Inglés)',
            t1: 82,
            t2: 85,
            t3: 88,
            final: 85,
            estado: 'APROBADO',
          },
          {
            nombre: 'Ciencias Sociales',
            t1: cent.sociales - 1,
            t2: cent.sociales,
            t3: cent.sociales + 2,
            final: cent.sociales,
            estado: 'APROBADO',
          },
          {
            nombre: 'Artes Plásticas y Visuales',
            t1: cent.artes,
            t2: cent.artes + 1,
            t3: cent.artes,
            final: cent.artes,
            estado: 'APROBADO',
          },
          {
            nombre: 'Educación Musical',
            t1: 86,
            t2: 88,
            t3: 90,
            final: 88,
            estado: 'APROBADO',
          },
          {
            nombre: 'Educación Física y Deportes',
            t1: 90,
            t2: 92,
            t3: 94,
            final: 92,
            estado: 'APROBADO',
          },
        ],
      },
      {
        campo: 'Vida, Tierra y Territorio',
        areas: [
          {
            nombre: 'Ciencias Naturales: Biología - Geografía',
            t1: cent.ciencias - 2,
            t2: cent.ciencias,
            t3: cent.ciencias + 2,
            final: cent.ciencias,
            estado: 'APROBADO',
          },
        ],
      },
      {
        campo: 'Ciencia, Tecnología y Producción',
        areas: [
          {
            nombre: 'Matemática',
            t1: cent.matematica - 2,
            t2: cent.matematica,
            t3: cent.matematica + 2,
            final: cent.matematica,
            estado: 'APROBADO',
          },
          {
            nombre: 'Técnica Tecnológica General',
            t1: 88,
            t2: 90,
            t3: 92,
            final: 90,
            estado: 'APROBADO',
          },
        ],
      },
    ];

    // Promedio ponderado de todas las materias del año escolar
    const allAreas = camposOrganizados.flatMap((g) => g.areas);
    const promGeneral = allAreas.reduce((acc, a) => acc + a.final, 0) / allAreas.length;
    const estadoProm: 'PROMOVIDO(A) AL SIGUIENTE AÑO DE ESCOLARIDAD' | 'RETENIDO(A) EN EL AÑO DE ESCOLARIDAD' =
      promGeneral >= 51
        ? 'PROMOVIDO(A) AL SIGUIENTE AÑO DE ESCOLARIDAD'
        : 'RETENIDO(A) EN EL AÑO DE ESCOLARIDAD';

    exportSchoolReportCardPdf(
      est.apellidosNombres,
      est.rude,
      est.ci,
      cursoInfo?.nombre || selectedCurso,
      camposOrganizados,
      promGeneral,
      estadoProm
    );

    setFeedback(`✅ Libreta Escolar Oficial Anual generada con Código SIE y QR para ${est.apellidosNombres}.`);
  };

  const handleDownloadActaCompromiso = () => {
    const est = dataActual.estudiantes.find((e) => e.rude === selectedEstudianteId) || dataActual.estudiantes[0];
    if (!est) return;
    const teacherName = user?.persona?.nombres
      ? `Prof. ${user.persona.nombres} ${user.persona.primerApellido}`
      : 'Maestro(a) / Tutor de Aula';
    exportActaCompromisoPdf(
      est.apellidosNombres,
      cursoInfo?.nombre || selectedCurso,
      est.tutor || 'Padre / Madre / Tutor',
      est.ci || '',
      teacherName
    );
    setFeedback(`✅ Acta de Compromiso oficial (Hoja COMP de Primaria) descargada en PDF.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDownloadAutoevaluacion = () => {
    const est = dataActual.estudiantes.find((e) => e.rude === selectedEstudianteId) || dataActual.estudiantes[0];
    if (!est) return;
    exportAutoevaluacionPrimariaPdf(
      est.apellidosNombres,
      cursoInfo?.nombre || selectedCurso,
      selectedTrimestre
    );
    setFeedback(`✅ Ficha Oficial de Autoevaluación Infantil (Hoja AUTO de Primaria) descargada en PDF.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  if (cursosDisponibles.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Centralizadores & Emisión de Reportes Oficiales</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {institutionName} • Gestión 2026
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <School className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Espacio en blanco: Aún no hay cursos creados
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Para generar centralizadores oficiales, nóminas en Excel y libretas escolares del SEP de <span className="font-semibold text-slate-700">{institutionName}</span>, primero debes registrar los cursos y paralelos.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleQuickInitStandardCourses}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>⚡ Habilitar 1° a 6° Secundaria Ahora</span>
              </button>

              <Link
                to="/academic?create=curso"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                <span>Gestión de Cursos & Docentes</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Centralizadores & Emisión de Reportes Oficiales</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {institutionName} • Consolidación de Evaluaciones Trimestrales y Generación de Documentos SEP
          </p>
        </div>

        {/* Global Excel Export Button */}
        <button
          onClick={handleDownloadCentralizadorExcel}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar Centralizador (.xlsx)</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{feedback}</span>
        </div>
      )}

      {/* Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Curso y Paralelo</span>
          </label>
          <select
            value={selectedCurso}
            onChange={(e) => {
              setSelectedCurso(e.target.value);
              const primerRude = DATA_POR_CURSO[e.target.value]?.estudiantes[0]?.rude;
              if (primerRude) setSelectedEstudianteId(primerRude);
            }}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
          >
            {cursosDisponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            Periodo Trimestral
          </label>
          <select
            value={selectedTrimestre}
            onChange={(e) => setSelectedTrimestre(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="1">Primer Trimestre (Gestión 2026)</option>
            <option value="2">Segundo Trimestre (Gestión 2026)</option>
            <option value="3">Tercer Trimestre (Gestión 2026)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center space-x-1">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>Estudiante para Boletín / Libreta</span>
          </label>
          <select
            value={selectedEstudianteId}
            onChange={(e) => setSelectedEstudianteId(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
          >
            {dataActual.estudiantes.map((e) => (
              <option key={e.rude} value={e.rude}>
                {e.apellidosNombres}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PDF & Excel Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Course Roster Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl inline-block mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Lista de Curso Oficial (SEP)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Nómina completa de {dataActual.estudiantes.length} estudiantes matriculados con RUDE, CI, firmas y registro de asistencia.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={handleDownloadListaPdf}
              className="flex items-center justify-center space-x-1.5 py-2 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Lista PDF</span>
            </button>
            <button
              onClick={handleDownloadListaExcel}
              className="flex items-center justify-center space-x-1.5 py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lista Excel</span>
            </button>
          </div>
        </div>

        {/* Trimester Bulletin Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl inline-block mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Boletín Trimestral Individual</h3>
            <p className="text-xs text-slate-500 mt-1">
              Informe individual con valoración en SER, SABER, HACER y DECIDIR para el estudiante seleccionado.
            </p>
          </div>
          <button
            onClick={handleDownloadBoletinPdf}
            className="mt-4 w-full flex items-center justify-center space-x-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Boletín en PDF</span>
          </button>
        </div>

        {/* School Report Card (Director / Superadmin) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl inline-block mb-3">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Libreta Escolar Anual Oficial</h3>
            <p className="text-xs text-slate-500 mt-1">
              Libreta de Fin de Gestión con los 3 trimestres consolidados, promedio anual y estado de promoción.
            </p>
          </div>
          <button
            onClick={handleDownloadLibretaPdf}
            className="mt-4 w-full flex items-center justify-center space-x-2 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Emitir Libreta Oficial en PDF</span>
          </button>
        </div>

        {/* Official Pedagogical Instruments (From Primaria.xlsm model) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl inline-block mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Instrumentos Pedagógicos SEP</h3>
            <p className="text-xs text-slate-500 mt-1">
              Actas de compromiso oficial (11 puntos en hogar) y ficha de autoevaluación (escala SER y DECIDIR).
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={handleDownloadActaCompromiso}
              className="flex items-center justify-center space-x-1 py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-[11px] font-bold transition cursor-pointer"
              title="Acta de Compromiso Oficial con los 11 puntos (Hoja COMP)"
            >
              <FileText className="w-3 h-3 text-amber-600" />
              <span>Acta COMP</span>
            </button>
            <button
              onClick={handleDownloadAutoevaluacion}
              className="flex items-center justify-center space-x-1 py-2 px-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-[11px] font-bold transition cursor-pointer"
              title="Ficha Oficial de Autoevaluación (Hoja AUTO)"
            >
              <Award className="w-3 h-3 text-purple-600" />
              <span>Ficha AUTO</span>
            </button>
          </div>
        </div>
      </div>

      {/* Centralizer Preview Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Centralizador Consolidado de Calificaciones ({trimLabel} - Gestión 2026)
            </h2>
            <p className="text-xs text-slate-500">
              {cursoInfo?.nombre} • {institutionName} (SIE {activeSie})
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
              {dataActual.centralizador.length} Estudiantes Registrados
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Nómina del Estudiante</th>
                <th className="py-2.5 px-2 text-center">Matemática</th>
                <th className="py-2.5 px-2 text-center">Lengua Castellana</th>
                <th className="py-2.5 px-2 text-center">Ciencias Naturales</th>
                <th className="py-2.5 px-2 text-center">Ciencias Sociales</th>
                <th className="py-2.5 px-2 text-center">Artes Plásticas</th>
                <th className="py-2.5 px-2 text-center">Lengua Guaraní</th>
                <th className="py-2.5 px-3 text-center bg-slate-200/70 font-black">PROMEDIO</th>
                <th className="py-2.5 px-3 text-center">VALORACIÓN CUALITATIVA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataActual.centralizador.map((r) => {
                const escala = getEscalaCualitativa(r.promedio);
                return (
                  <tr key={r.rude} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-400">{r.numero}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      <div>{r.estudiante}</div>
                      <div className="text-[10px] text-slate-400 font-mono">RUDE: {r.rude}</div>
                    </td>
                    <td className="py-2.5 px-2 text-center font-medium">{r.matematica}</td>
                    <td className="py-2.5 px-2 text-center font-medium">{r.lenguaje}</td>
                    <td className="py-2.5 px-2 text-center font-medium">{r.ciencias}</td>
                    <td className="py-2.5 px-2 text-center font-medium">{r.sociales}</td>
                    <td className="py-2.5 px-2 text-center font-medium">{r.artes}</td>
                    <td className="py-2.5 px-2 text-center font-medium">{r.guarani}</td>
                    <td className="py-2.5 px-3 text-center font-black text-emerald-700 bg-emerald-50/50">
                      {r.promedio.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        title={`${escala.label}: ${escala.descripcion}`}
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${escala.badgeClass}`}
                      >
                        <span className="font-extrabold">{escala.codigo}</span>
                        <span className="hidden sm:inline font-semibold">· {escala.label}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
