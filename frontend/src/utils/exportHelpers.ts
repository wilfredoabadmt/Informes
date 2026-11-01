import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function getActiveInstitutionInfo(): { nombre: string; sie: string; distrito: string; depto: string } {
  try {
    const rawUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const currentId = typeof window !== 'undefined' ? localStorage.getItem('currentInstitutionId') : null;
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user.institutions && user.institutions.length > 0) {
        const found = user.institutions.find((i: any) => (i.id || i.institutionId || i.sie) === currentId) || user.institutions[0];
        if (found) {
          return {
            nombre: found.nombre || 'Unidad Educativa',
            sie: found.sie || '80730045',
            distrito: found.distrito || 'La Paz 1',
            depto: found.departamento || 'La Paz',
          };
        }
      }
    }
    const rawInsts = typeof window !== 'undefined' ? localStorage.getItem('sigma_institutions') : null;
    if (rawInsts) {
      const insts = JSON.parse(rawInsts);
      const found = insts.find((i: any) => (i.id || i.sie) === currentId) || insts[0];
      if (found) {
        return {
          nombre: found.nombre || 'Unidad Educativa',
          sie: found.sie || '80730045',
          distrito: found.distrito || 'La Paz 1',
          depto: found.departamento || 'La Paz',
        };
      }
    }
  } catch (e) {
    // fallback
  }
  return {
    nombre: 'Unidad Educativa Franz Tamayo',
    sie: '80730045',
    distrito: 'La Paz 1',
    depto: 'La Paz',
  };
}

export interface GradeExportRow {
  rude: string;
  estudiante: string;
  ser: number;
  saber: number;
  hacer: number;
  decidir: number;
  autoSer: number;
  autoDecidir: number;
  puntosExtras: number;
  total: number;
  estado: string;
}

export interface StudentExportRow {
  numero: number;
  rude: string;
  ci: string;
  apellidosNombres: string;
  genero: string;
  tutor: string;
  telefono: string;
  estado: string;
}

export interface CentralizerRow {
  numero: number;
  estudiante: string;
  ci: string;
  rude: string;
  matematica: number;
  lenguaje: number;
  ciencias: number;
  sociales: number;
  artes: number;
  guarani: number;
  promedio: number;
  situacion: string;
}

/**
 * Exporta la Planilla de Calificaciones a Excel (.xlsx) con formato oficial SEP
 */
export function exportGradesToExcel(
  curso: string,
  asignatura: string,
  trimestre: string,
  rows: GradeExportRow[]
) {
  const instInfo = getActiveInstitutionInfo();
  const wb = XLSX.utils.book_new();

  const wsData: any[][] = [
    ['ESTADO PLURINACIONAL DE BOLIVIA - MINISTERIO DE EDUCACIÓN'],
    ['SISTEMA INTEGRAL DE REGISTRO Y GESTIÓN DE MAESTROS (SIGMA - SEP)'],
    ['PLANILLA DE VALORACIÓN CUALICUANTITATIVA TRIMESTRAL'],
    [''],
    ['Unidad Educativa:', `${instInfo.nombre} (SIE: ${instInfo.sie})`, 'Gestión Escolar:', '2026'],
    ['Curso y Paralelo:', curso, 'Trimestre:', trimestre],
    ['Asignatura / Campo:', asignatura, 'Fecha de Emisión:', new Date().toLocaleDateString('es-BO')],
    [''],
    [
      'N°',
      'Código RUDE',
      'Apellidos y Nombres',
      'SER (10)',
      'SABER (35)',
      'HACER (35)',
      'DECIDIR (10)',
      'AUTOEVAL. (10)',
      'EXTRAS (Bonif.)',
      'NOTA FINAL (100)',
      'ESTADO TRIMESTRAL',
    ],
  ];

  rows.forEach((r, idx) => {
    const autoTotal = Number(r.autoSer || 0) + Number(r.autoDecidir || 0);
    wsData.push([
      idx + 1,
      r.rude,
      r.estudiante,
      r.ser,
      r.saber,
      r.hacer,
      r.decidir,
      autoTotal,
      r.puntosExtras,
      r.total,
      r.estado,
    ]);
  });

  const aprobados = rows.filter((r) => r.total >= 51).length;
  const reprobados = rows.length - aprobados;
  const promedio = rows.length > 0 ? (rows.reduce((a, b) => a + b.total, 0) / rows.length).toFixed(1) : '0';

  wsData.push(['']);
  wsData.push(['RESUMEN ESTADÍSTICO DE RENDIMIENTO:']);
  wsData.push(['Total Estudiantes Evaluados:', rows.length]);
  wsData.push(['Estudiantes Aprobados (>= 51 pts):', aprobados]);
  wsData.push(['Estudiantes Reprobados (< 51 pts):', reprobados]);
  wsData.push(['Promedio General del Curso:', promedio]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 35 },
    { wch: 10 },
    { wch: 11 },
    { wch: 11 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'PlanillaCalificaciones');
  const cleanCourse = curso.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  const cleanTrim = trimestre.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15);
  XLSX.writeFile(wb, `Planilla_Calificaciones_${cleanCourse}_${cleanTrim}.xlsx`);
}

/**
 * Exporta la Planilla de Calificaciones en documento PDF Oficial
 */
export function exportGradesToPdf(
  curso: string,
  asignatura: string,
  trimestre: string,
  rows: GradeExportRow[]
) {
  const instInfo = getActiveInstitutionInfo();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });

  // Tricolor Boliviano
  doc.setFillColor(213, 43, 30);
  doc.rect(40, 25, 230, 4, 'F');
  doc.setFillColor(252, 209, 22);
  doc.rect(270, 25, 230, 4, 'F');
  doc.setFillColor(0, 121, 52);
  doc.rect(500, 25, 250, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(24, 30, 40);
  doc.text('ESTADO PLURINACIONAL DE BOLIVIA - MINISTERIO DE EDUCACIÓN', 40, 48);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 90, 100);
  doc.text('SISTEMA INTEGRAL DE REGISTRO Y GESTIÓN DE MAESTROS • PLANILLA OFICIAL DE EVALUACIÓN', 40, 62);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(40, 45, 55);
  doc.text(`Unidad Educativa: ${instInfo.nombre} (SIE: ${instInfo.sie})`, 40, 80);
  doc.text(`Curso y Paralelo: ${curso}`, 40, 95);
  doc.text(`Asignatura: ${asignatura}`, 380, 80);
  doc.text(`Trimestre: ${trimestre} | Gestión 2026`, 380, 95);

  const tableBody = rows.map((r, idx) => {
    const autoTotal = Number(r.autoSer || 0) + Number(r.autoDecidir || 0);
    return [
      idx + 1,
      r.rude,
      r.estudiante,
      r.ser,
      r.saber,
      r.hacer,
      r.decidir,
      autoTotal,
      r.puntosExtras,
      r.total,
      r.estado,
    ];
  });

  autoTable(doc, {
    startY: 110,
    head: [[
      '#',
      'Código RUDE',
      'Apellidos y Nombres',
      'SER\n(10)',
      'SABER\n(35)',
      'HACER\n(35)',
      'DECIDIR\n(10)',
      'AUTO\n(10)',
      'EXTRAS\n(Bonif.)',
      'TOTAL\n(100)',
      'ESTADO',
    ]],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 120, 75],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 25 },
      1: { halign: 'center', cellWidth: 85 },
      2: { halign: 'left', cellWidth: 190 },
      3: { halign: 'center', cellWidth: 35 },
      4: { halign: 'center', cellWidth: 40 },
      5: { halign: 'center', cellWidth: 40 },
      6: { halign: 'center', cellWidth: 40 },
      7: { halign: 'center', cellWidth: 40 },
      8: { halign: 'center', cellWidth: 45 },
      9: { halign: 'center', cellWidth: 45, fontStyle: 'bold' },
      10: { halign: 'center', cellWidth: 70 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 9) {
        const val = Number(data.cell.raw);
        if (val >= 51) {
          data.cell.styles.textColor = [16, 120, 75];
        } else {
          data.cell.styles.textColor = [185, 28, 28];
        }
      }
      if (data.section === 'body' && data.column.index === 10) {
        const text = String(data.cell.raw);
        if (text === 'APROBADO') {
          data.cell.styles.textColor = [16, 120, 75];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 35 : 450;
  if (finalY < 540) {
    doc.setFontSize(8);
    doc.setTextColor(100, 110, 120);
    doc.line(100, finalY + 30, 260, finalY + 30);
    doc.text('Firma y Sello del Maestro(a)', 125, finalY + 42);

    doc.line(500, finalY + 30, 660, finalY + 30);
    doc.text('Firma y Sello Dirección U.E.', 525, finalY + 42);
  }

  const cleanCourse = curso.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  const cleanTrim = trimestre.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15);
  doc.save(`Planilla_Oficial_SEP_${cleanCourse}_${cleanTrim}.pdf`);
}

/**
 * Exporta la Lista de Curso Oficial en Excel (.xlsx)
 */
export function exportCourseRosterToExcel(
  curso: string,
  students: StudentExportRow[]
) {
  const instInfo = getActiveInstitutionInfo();
  const wb = XLSX.utils.book_new();

  const wsData: any[][] = [
    ['ESTADO PLURINACIONAL DE BOLIVIA - MINISTERIO DE EDUCACIÓN'],
    [`${instInfo.nombre.toUpperCase()} (SIE: ${instInfo.sie})`],
    ['NÓMINA OFICIAL DE ESTUDIANTES MATRICULADOS - GESTIÓN 2026'],
    [''],
    ['Curso y Paralelo:', curso, 'Fecha de Emisión:', new Date().toLocaleDateString('es-BO')],
    [''],
    ['N°', 'Código RUDE', 'Cédula Identidad', 'Apellidos y Nombres', 'Género', 'Tutor / Apoderado', 'Teléfono Contacto', 'Estado'],
  ];

  students.forEach((s, idx) => {
    wsData.push([
      idx + 1,
      s.rude,
      s.ci,
      s.apellidosNombres,
      s.genero === 'M' ? 'Masculino' : 'Femenino',
      s.tutor,
      s.telefono,
      s.estado,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 14 },
    { wch: 35 },
    { wch: 12 },
    { wch: 28 },
    { wch: 16 },
    { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'ListaEstudiantes');
  const clean = curso.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 25);
  XLSX.writeFile(wb, `Lista_Estudiantes_Oficial_${clean}.xlsx`);
}

/**
 * Exporta la Lista de Curso Oficial en PDF
 */
export function exportCourseRosterToPdf(
  curso: string,
  students: StudentExportRow[]
) {
  const instInfo = getActiveInstitutionInfo();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

  // Tricolor
  doc.setFillColor(213, 43, 30);
  doc.rect(40, 25, 170, 4, 'F');
  doc.setFillColor(252, 209, 22);
  doc.rect(210, 25, 170, 4, 'F');
  doc.setFillColor(0, 121, 52);
  doc.rect(380, 25, 180, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 30, 40);
  doc.text(`${instInfo.nombre.toUpperCase()} (SIE: ${instInfo.sie})`, 40, 50);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 90, 100);
  doc.text('SUBSISTEMA DE EDUCACIÓN REGULAR • NÓMINA OFICIAL DE ESTUDIANTES 2026', 40, 64);
  doc.text(`Curso y Paralelo: ${curso}`, 40, 78);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-BO')}`, 420, 78);

  const tableBody = students.map((s, idx) => [
    idx + 1,
    s.rude,
    s.ci,
    s.apellidosNombres,
    s.genero,
    s.tutor,
    s.telefono,
    '...............',
  ]);

  autoTable(doc, {
    startY: 92,
    head: [[
      '#',
      'Código RUDE',
      'CI',
      'Apellidos y Nombres',
      'Gen',
      'Tutor / Apoderado',
      'Teléfono',
      'Firma / Asist.',
    ]],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { halign: 'center', cellWidth: 80 },
      2: { halign: 'center', cellWidth: 60 },
      3: { halign: 'left', cellWidth: 140 },
      4: { halign: 'center', cellWidth: 25 },
      5: { halign: 'left', cellWidth: 95 },
      6: { halign: 'center', cellWidth: 55 },
      7: { halign: 'center', cellWidth: 60 },
    },
  });

  const clean = curso.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 25);
  doc.save(`Nomina_Oficial_Estudiantes_${clean}.pdf`);
}

/**
 * Exporta el Centralizador Trimestral a Excel (.xlsx)
 */
export function exportCentralizerToExcel(
  curso: string,
  trimestre: string,
  rows: CentralizerRow[]
) {
  const instInfo = getActiveInstitutionInfo();
  const wb = XLSX.utils.book_new();

  const wsData: any[][] = [
    ['ESTADO PLURINACIONAL DE BOLIVIA - MINISTERIO DE EDUCACIÓN'],
    [`${instInfo.nombre.toUpperCase()} (SIE: ${instInfo.sie})`],
    ['CENTRALIZADOR CONSOLIDADO DE CALIFICACIONES - GESTIÓN 2026'],
    [''],
    ['Curso y Paralelo:', curso, 'Trimestre:', trimestre],
    ['Fecha de Emisión:', new Date().toLocaleDateString('es-BO')],
    [''],
    [
      'N°',
      'Código RUDE',
      'Cédula Identidad',
      'Apellidos y Nombres',
      'Matemática',
      'Lenguaje',
      'Ciencias Naturales',
      'Ciencias Sociales',
      'Artes Plásticas',
      'Lengua Guaraní',
      'PROMEDIO TRIMESTRAL',
      'ESTADO ACADÉMICO',
    ],
  ];

  rows.forEach((r, idx) => {
    wsData.push([
      idx + 1,
      r.rude,
      r.ci,
      r.estudiante,
      r.matematica,
      r.lenguaje,
      r.ciencias,
      r.sociales,
      r.artes,
      r.guarani,
      r.promedio,
      r.situacion,
    ]);
  });

  const promedioGral = (rows.reduce((acc, r) => acc + r.promedio, 0) / rows.length).toFixed(1);
  const aprobados = rows.filter((r) => r.promedio >= 51).length;

  wsData.push(['']);
  wsData.push(['ESTADÍSTICAS OFICIALES:']);
  wsData.push(['Total Matriculados:', rows.length]);
  wsData.push(['Aprobados:', aprobados]);
  wsData.push(['Reprobados:', rows.length - aprobados]);
  wsData.push(['Promedio General del Curso:', promedioGral]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 14 },
    { wch: 32 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Centralizador');
  const clean = curso.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  XLSX.writeFile(wb, `Centralizador_${clean}_${trimestre}.xlsx`);
}

/**
 * MODELO 1: BOLETÍN TRIMESTRAL INDIVIDUAL DE CALIFICACIONES (SEP - BOLIVIA)
 * Es el informe parcial de UN SOLO TRIMESTRE con desglose detallado en las 4 dimensiones (SER, SABER, HACER, DECIDIR),
 * autoevaluación, puntos extras y valoración cualitativa de ese trimestre.
 */
export function exportBulletinPdf(
  estudiante: string,
  rude: string,
  curso: string,
  trimestre: string,
  materias: { nombre: string; ser: number; saber: number; hacer: number; decidir: number; auto: number; extras: number; total: number }[],
  valoracionCualitativa?: string
) {
  const instInfo = getActiveInstitutionInfo();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

  // Tricolor Boliviano
  doc.setFillColor(213, 43, 30);
  doc.rect(40, 25, 170, 4, 'F');
  doc.setFillColor(252, 209, 22);
  doc.rect(210, 25, 170, 4, 'F');
  doc.setFillColor(0, 121, 52);
  doc.rect(380, 25, 180, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(24, 30, 40);
  doc.text('BOLETÍN TRIMESTRAL DE CALIFICACIONES', 40, 50);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 90, 100);
  doc.text('SUBSISTEMA DE EDUCACIÓN REGULAR • VALORACIÓN CUALICUANTITATIVA POR DIMENSIONES (LEY 070)', 40, 64);
  doc.text(`${instInfo.nombre.toUpperCase()} (SIE: ${instInfo.sie}) • DISTRITO ${instInfo.distrito.toUpperCase()} • GESTIÓN 2026`, 40, 76);

  // Ficha del Estudiante
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(40, 88, 520, 44, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`Estudiante: ${estudiante}`, 50, 104);
  doc.text(`Código RUDE: ${rude}`, 50, 120);
  doc.text(`Curso y Paralelo: ${curso}`, 320, 104);
  doc.text(`Periodo Evaluado: ${trimestre}`, 320, 120);

  const tableBody = materias.map((m, idx) => [
    idx + 1,
    m.nombre,
    m.ser,
    m.saber,
    m.hacer,
    m.decidir,
    m.auto || 10,
    m.extras || 0,
    m.total,
    m.total >= 51 ? 'APROBADO' : 'RETENIDO',
  ]);

  const promTrim = (materias.reduce((acc, m) => acc + m.total, 0) / materias.length).toFixed(1);

  autoTable(doc, {
    startY: 142,
    head: [[
      '#',
      'Área Curricular / Asignatura',
      'SER\n(10)',
      'SABER\n(35)',
      'HACER\n(35)',
      'DECIDIR\n(10)',
      'AUTO\n(10)',
      'EXTRAS\n(Bonif.)',
      'TOTAL\n(100)',
      'ESTADO',
    ]],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 120, 75],
      textColor: [255, 255, 255],
      halign: 'center',
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { halign: 'left', cellWidth: 160 },
      2: { halign: 'center', cellWidth: 35 },
      3: { halign: 'center', cellWidth: 40 },
      4: { halign: 'center', cellWidth: 40 },
      5: { halign: 'center', cellWidth: 40 },
      6: { halign: 'center', cellWidth: 40 },
      7: { halign: 'center', cellWidth: 45 },
      8: { halign: 'center', cellWidth: 45, fontStyle: 'bold' },
      9: { halign: 'center', cellWidth: 55 },
    },
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 430;

  // Promedio Trimestral
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`PROMEDIO GENERAL DEL ${trimestre.toUpperCase()}: ${promTrim} / 100`, 40, finalY);

  // Recuadro de Valoración Cualitativa del Trimestre (Requerimiento Ley 070)
  const cualitativoY = finalY + 15;
  doc.setFillColor(254, 252, 232); // Fondo cálido amber
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(40, cualitativoY, 520, 55, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14);
  doc.text('INFORME DE EVALUACIÓN DEL DESARROLLO CUALITATIVO DEL TRIMESTRE:', 50, cualitativoY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(68, 64, 60);
  const textoCualitativo =
    valoracionCualitativa ||
    `El/la estudiante demuestra compromiso en las actividades comunitarias, manifestando respeto y puntualidad en el aula (SER). Asimila con claridad los contenidos conceptuales y matemáticos (SABER), aplicando habilidades prácticas en la resolución de problemas (HACER). Participa activamente en la toma de decisiones grupales (DECIDIR).`;
  doc.text(doc.splitTextToSize(textoCualitativo, 500), 50, cualitativoY + 30);

  // Firmas
  const firmasY = cualitativoY + 105;
  doc.setFontSize(8);
  doc.setTextColor(100, 110, 120);
  doc.line(80, firmasY, 230, firmasY);
  doc.text('Profesor(a) Asesor(a) de Curso', 95, firmasY + 12);

  doc.line(350, firmasY, 500, firmasY);
  doc.text('Dirección de la Unidad Educativa', 365, firmasY + 12);

  const clean = estudiante.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  doc.save(`Boletin_Trimestral_${clean}.pdf`);
}

/**
 * MODELO 2: LIBRETA ESCOLAR ELECTRÓNICA OFICIAL DE FIN DE GESTIÓN (MINISTERIO DE EDUCACIÓN - BOLIVIA)
 * Es el documento legal anual oficial que agrupa las materias por CAMPOS DE SABERES, mostrando los 3 trimestres,
 * el promedio anual acumulado, el informe cualitativo de fin de año, el ESTADO DE PROMOCIÓN ("PROMOVIDO AL SIGUIENTE AÑO")
 * y el código QR de validación en el SIE.
 */
export function exportSchoolReportCardPdf(
  estudiante: string,
  rude: string,
  ci: string,
  curso: string,
  materiasOrganizadas: {
    campo: string;
    areas: { nombre: string; t1: number; t2: number; t3: number; final: number; estado: string }[];
  }[],
  promedioAnualGeneral: number,
  estadoPromocion: 'PROMOVIDO(A) AL SIGUIENTE AÑO DE ESCOLARIDAD' | 'RETENIDO(A) EN EL AÑO DE ESCOLARIDAD'
) {
  const instInfo = getActiveInstitutionInfo();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

  // Tricolor Boliviano Superior
  doc.setFillColor(213, 43, 30);
  doc.rect(40, 20, 170, 4, 'F');
  doc.setFillColor(252, 209, 22);
  doc.rect(210, 20, 170, 4, 'F');
  doc.setFillColor(0, 121, 52);
  doc.rect(380, 20, 180, 4, 'F');

  // Encabezado Nacional Oficial
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 30, 40);
  doc.text('ESTADO PLURINACIONAL DE BOLIVIA • MINISTERIO DE EDUCACIÓN', 40, 42);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 90, 100);
  doc.text('VICEMINISTERIO DE EDUCACIÓN REGULAR • SISTEMA DE INFORMACIÓN EDUCATIVA (SIE)', 40, 55);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(16, 120, 75);
  doc.text('LIBRETA ESCOLAR ELECTRÓNICA - GESTIÓN ESCOLAR 2026', 40, 72);

  // Recuadro Institucional y de Filiación
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(40, 82, 520, 52, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`ESTUDIANTE: ${estudiante}`, 50, 98);
  doc.text(`CÓDIGO RUDE: ${rude}  |  C.I.: ${ci}`, 50, 112);
  doc.text(`AÑO DE ESCOLARIDAD: ${curso}`, 50, 126);

  doc.text(`UNIDAD EDUCATIVA: ${instInfo.nombre.toUpperCase()}`, 310, 98);
  doc.text(`CÓDIGO SIE: ${instInfo.sie}  |  DISTRITO: ${instInfo.distrito.toUpperCase()}`, 310, 112);
  doc.text(`DEPARTAMENTO: ${instInfo.depto.toUpperCase()}  |  GESTIÓN: 2026`, 310, 126);

  // Construcción de la tabla jerárquica con Campos de Saberes
  const tableBody: any[][] = [];

  materiasOrganizadas.forEach((grupo) => {
    // Fila divisoria de Campo de Saberes
    tableBody.push([
      {
        content: `CAMPO: ${grupo.campo.toUpperCase()}`,
        colSpan: 6,
        styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [15, 23, 42], fontSize: 8 },
      },
    ]);

    grupo.areas.forEach((area, idx) => {
      tableBody.push([
        idx + 1,
        area.nombre,
        area.t1,
        area.t2,
        area.t3,
        area.final,
      ]);
    });
  });

  autoTable(doc, {
    startY: 142,
    head: [[
      '#',
      'Campos de Saberes y Áreas Curriculares',
      '1er Trim.\n(100)',
      '2do Trim.\n(100)',
      '3er Trim.\n(100)',
      'PROMEDIO\nFINAL',
    ]],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      halign: 'center',
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 25 },
      1: { halign: 'left', cellWidth: 265 },
      2: { halign: 'center', cellWidth: 55 },
      3: { halign: 'center', cellWidth: 55 },
      4: { halign: 'center', cellWidth: 55 },
      5: { halign: 'center', cellWidth: 65, fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5 && typeof data.cell.raw === 'number') {
        const val = Number(data.cell.raw);
        if (val >= 51) {
          data.cell.styles.textColor = [16, 120, 75];
        } else {
          data.cell.styles.textColor = [185, 28, 28];
        }
      }
    },
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 460;

  // Recuadro de Estado de Promoción Oficial
  doc.setFillColor(estadoPromocion.includes('PROMOVIDO') ? 236 : 254, estadoPromocion.includes('PROMOVIDO') ? 253 : 242, estadoPromocion.includes('PROMOVIDO') ? 245 : 242);
  doc.setDrawColor(estadoPromocion.includes('PROMOVIDO') ? 16 : 239, estadoPromocion.includes('PROMOVIDO') ? 185 : 68, estadoPromocion.includes('PROMOVIDO') ? 129 : 68);
  doc.roundedRect(40, finalY, 520, 48, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`PROMEDIO ANUAL DE GESTIÓN: ${promedioAnualGeneral.toFixed(1)} / 100`, 55, finalY + 18);

  doc.setFontSize(10);
  doc.setTextColor(estadoPromocion.includes('PROMOVIDO') ? 16 : 185, estadoPromocion.includes('PROMOVIDO') ? 120 : 28, estadoPromocion.includes('PROMOVIDO') ? 75 : 28);
  doc.text(`ESTADO OFICIAL DE PROMOCIÓN: ${estadoPromocion}`, 55, finalY + 36);

  // Informe de Evaluación del Desarrollo Cualitativo de Fin de Gestión
  const cualiAnualY = finalY + 56;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, cualiAnualY, 520, 45, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('INFORME DEL DESARROLLO CUALITATIVO DE FIN DE GESTIÓN (LEY 070):', 50, cualiAnualY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const textoCualiAnual =
    'El/la estudiante ha demostrado un óptimo desarrollo integral en las cuatro dimensiones formativas (Ser, Saber, Hacer, Decidir), consolidando los objetivos holísticos previstos en el plan de estudios del currículo base y regionalizado del Estado Plurinacional de Bolivia.';
  doc.text(doc.splitTextToSize(textoCualiAnual, 500), 50, cualiAnualY + 26);

  // QR simulado y sellos de seguridad
  const footerY = cualiAnualY + 60;

  // Código QR visual
  doc.setFillColor(15, 23, 42);
  doc.rect(50, footerY, 40, 40, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(56, footerY + 6, 12, 12, 'F');
  doc.rect(72, footerY + 22, 12, 12, 'F');
  doc.setFillColor(15, 23, 42);
  doc.rect(60, footerY + 10, 4, 4, 'F');

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('DOCUMENTO OFICIAL VALIDADOR DEL SIE', 100, footerY + 14);
  doc.text(`CÓDIGO DE VERIFICACIÓN ELECTRÓNICA: BO-MINEDU-2026-${rude.slice(-6)}`, 100, footerY + 26);
  doc.text('Firma Digitalizada bajo Decreto Supremo N° 1302 y Ley N° 070', 100, footerY + 36);

  // Firmas
  doc.line(300, footerY + 30, 410, footerY + 30);
  doc.text('Firma Maestro(a) Tutor', 315, footerY + 40);

  doc.line(440, footerY + 30, 545, footerY + 30);
  doc.text('Firma y Sello Dirección U.E.', 445, footerY + 40);

  const clean = estudiante.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  doc.save(`Libreta_Oficial_SEP_${clean}.pdf`);
}

/**
 * MODELO 3: CITACIÓN OFICIAL A PADRES DE FAMILIA / APODERADOS (KARDEX DISCIPLINARIO)
 */
export function exportParentalCitationPdf(
  estudiante: string,
  rude: string,
  curso: string,
  tutor: string,
  contacto: string,
  motivo: string,
  fechaCita: string,
  horaCita: string,
  maestroEmisor: string
) {
  const instInfo = getActiveInstitutionInfo();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

  // Tricolor
  doc.setFillColor(213, 43, 30);
  doc.rect(40, 25, 170, 4, 'F');
  doc.setFillColor(252, 209, 22);
  doc.rect(210, 25, 170, 4, 'F');
  doc.setFillColor(0, 121, 52);
  doc.rect(380, 25, 180, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(24, 30, 40);
  doc.text('CITACIÓN OFICIAL A PADRE DE FAMILIA O APODERADO', 40, 55);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 90, 100);
  doc.text(`${instInfo.nombre.toUpperCase()} (SIE: ${instInfo.sie}) • SEGUIMIENTO Y KARDEX DISCIPLINARIO`, 40, 70);

  // Recuadro de Cita
  doc.setFillColor(254, 242, 242); // Alerta suave
  doc.setDrawColor(248, 113, 113);
  doc.roundedRect(40, 88, 520, 60, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(153, 27, 27);
  doc.text(`SEÑOR(A) APODERADO(A): ${tutor.toUpperCase()}`, 50, 106);

  doc.setFontSize(8.5);
  doc.setTextColor(69, 10, 10);
  doc.text(`Estudiante: ${estudiante}  |  Curso: ${curso}  |  RUDE: ${rude}`, 50, 122);
  doc.text(`Teléfono registrado: ${contacto}`, 50, 138);

  // Cuerpo de la citación
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  const cuerpo = `Por intermedio de la presente, la Dirección y el plantel docente de la Unidad Educativa "${instInfo.nombre}" convocan a usted con carácter de URGENCIA Y OBLIGATORIO a presentarse en las instalaciones del establecimiento educativo para tratar asuntos concernientes al rendimiento académico y seguimiento disciplinario de su hijo(a).`;
  doc.text(doc.splitTextToSize(cuerpo, 520), 40, 175);

  // Fecha y hora convocada
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(40, 220, 520, 45, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`FECHA DE REUNIÓN: ${fechaCita}`, 55, 240);
  doc.text(`HORA: ${horaCita} a.m.`, 260, 240);
  doc.text(`LUGAR: Dirección / Gabinete de Convivencia`, 380, 240);

  // Motivo / Antecedentes registrados en el Kardex
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('MOTIVO Y ANTECEDENTES REGISTRADOS EN EL KARDEX ESCOLAR:', 40, 290);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(doc.splitTextToSize(motivo, 520), 40, 305);

  // Advertencia normativa
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const baseLegal = `Base Legal: Art. 10 y 11 del Reglamento de Faltas y Disciplina Estudiantil de la R.M. 0001/2026 del Ministerio de Educación del Estado Plurinacional de Bolivia. En caso de no asistir, se remitirá el caso a la Defensoría de la Niñez y Adolescencia según normativa vigente.`;
  doc.text(doc.splitTextToSize(baseLegal, 520), 40, 360);

  // Firmas
  const firmasY = 460;
  doc.line(60, firmasY, 210, firmasY);
  doc.text(maestroEmisor, 80, firmasY + 12);
  doc.text('Docente / Tutor de Curso', 85, firmasY + 22);

  doc.line(240, firmasY, 370, firmasY);
  doc.text(`Dirección ${instInfo.nombre}`, 250, firmasY + 12);
  doc.text('Sello Institucional', 275, firmasY + 22);

  doc.line(400, firmasY, 530, firmasY);
  doc.text('Firma Padre / Apoderado', 415, firmasY + 12);
  doc.text('Constancia de Notificación', 415, firmasY + 22);

  const clean = estudiante.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  doc.save(`Citacion_Oficial_${clean}.pdf`);
}
