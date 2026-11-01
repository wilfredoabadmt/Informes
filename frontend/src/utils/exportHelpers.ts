import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const wb = XLSX.utils.book_new();

  const wsData: any[][] = [
    ['ESTADO PLURINACIONAL DE BOLIVIA - MINISTERIO DE EDUCACIÓN'],
    ['SISTEMA INTEGRAL DE REGISTRO Y GESTIÓN DE MAESTROS (SIGMA - SEP)'],
    ['PLANILLA DE VALORACIÓN CUALICUANTITATIVA TRIMESTRAL'],
    [''],
    ['Unidad Educativa:', 'Franz Tamayo (SIE: 80730045)', 'Gestión Escolar:', '2026'],
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
  doc.text(`Unidad Educativa: Franz Tamayo (SIE: 80730045)`, 40, 80);
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
  const wb = XLSX.utils.book_new();

  const wsData: any[][] = [
    ['ESTADO PLURINACIONAL DE BOLIVIA - MINISTERIO DE EDUCACIÓN'],
    ['UNIDAD EDUCATIVA FRANZ TAMAYO (SIE: 80730045)'],
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
  doc.text('UNIDAD EDUCATIVA FRANZ TAMAYO (SIE: 80730045)', 40, 50);

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
  const wb = XLSX.utils.book_new();

  const wsData: any[][] = [
    ['ESTADO PLURINACIONAL DE BOLIVIA - MINISTERIO DE EDUCACIÓN'],
    ['UNIDAD EDUCATIVA FRANZ TAMAYO (SIE: 80730045)'],
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
 * Exporta el Boletín Trimestral de un Estudiante en PDF
 */
export function exportBulletinPdf(
  estudiante: string,
  rude: string,
  curso: string,
  trimestre: string,
  materias: { nombre: string; ser: number; saber: number; hacer: number; decidir: number; total: number; obs: string }[]
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

  // Tricolor
  doc.setFillColor(213, 43, 30);
  doc.rect(40, 25, 170, 4, 'F');
  doc.setFillColor(252, 209, 22);
  doc.rect(210, 25, 170, 4, 'F');
  doc.setFillColor(0, 121, 52);
  doc.rect(380, 25, 180, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(24, 30, 40);
  doc.text('BOLETÍN TRIMESTRAL DE CALIFICACIONES (SEP - BOLIVIA)', 40, 50);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 90, 100);
  doc.text(`Unidad Educativa Franz Tamayo (SIE 80730045) • Gestión 2026`, 40, 65);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Estudiante: ${estudiante}`, 40, 85);
  doc.text(`Código RUDE: ${rude}`, 40, 98);
  doc.text(`Curso: ${curso}`, 350, 85);
  doc.text(`Periodo: ${trimestre}`, 350, 98);

  const tableBody = materias.map((m, idx) => [
    idx + 1,
    m.nombre,
    m.ser,
    m.saber,
    m.hacer,
    m.decidir,
    m.total,
    m.total >= 51 ? 'APROBADO' : 'RETENIDO',
  ]);

  autoTable(doc, {
    startY: 110,
    head: [[
      '#',
      'Área Curricular / Materia',
      'SER\n(10)',
      'SABER\n(35)',
      'HACER\n(35)',
      'DECIDIR\n(10)',
      'NOTA\n(100)',
      'ESTADO',
    ]],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 120, 75],
      textColor: [255, 255, 255],
      halign: 'center',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 25 },
      1: { halign: 'left', cellWidth: 180 },
      2: { halign: 'center', cellWidth: 40 },
      3: { halign: 'center', cellWidth: 45 },
      4: { halign: 'center', cellWidth: 45 },
      5: { halign: 'center', cellWidth: 45 },
      6: { halign: 'center', cellWidth: 50, fontStyle: 'bold' },
      7: { halign: 'center', cellWidth: 70 },
    },
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 40 : 450;
  doc.setFontSize(8);
  doc.setTextColor(100, 110, 120);
  doc.line(80, finalY + 40, 220, finalY + 40);
  doc.text('Profesor(a) Asesor', 110, finalY + 52);

  doc.line(360, finalY + 40, 500, finalY + 40);
  doc.text('Dirección Institucional', 390, finalY + 52);

  const clean = estudiante.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  doc.save(`Boletin_Trimestral_${clean}.pdf`);
}

/**
 * Exporta la Libreta Escolar Anual Oficial en PDF
 */
export function exportSchoolReportCardPdf(
  estudiante: string,
  rude: string,
  curso: string,
  materias: { nombre: string; t1: number; t2: number; t3: number; final: number; estado: string }[]
) {
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
  doc.text('LIBRETA ESCOLAR ELECTRÓNICA OFICIAL', 40, 48);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 90, 100);
  doc.text('SUBSISTEMA DE EDUCACIÓN REGULAR • LEY DE LA EDUCACIÓN N° 070 AVELINO SIÑANI', 40, 62);
  doc.text('ESTADO PLURINACIONAL DE BOLIVIA • MINISTERIO DE EDUCACIÓN', 40, 74);

  // Recuadro de Estudiante
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, 84, 520, 45, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`Estudiante: ${estudiante}`, 50, 100);
  doc.text(`Código RUDE: ${rude}`, 50, 116);
  doc.text(`Unidad Educativa: Franz Tamayo (SIE: 80730045)`, 300, 100);
  doc.text(`Curso: ${curso} | Gestión: 2026`, 300, 116);

  const tableBody = materias.map((m, idx) => [
    idx + 1,
    m.nombre,
    m.t1,
    m.t2,
    m.t3,
    m.final,
    m.estado,
  ]);

  const promedioGral = (materias.reduce((acc, m) => acc + m.final, 0) / materias.length).toFixed(1);
  const estadoFinal = Number(promedioGral) >= 51 ? 'PROMOVIDO(A)' : 'RETENIDO(A)';

  autoTable(doc, {
    startY: 140,
    head: [[
      '#',
      'Campos de Saberes y Áreas Curriculares',
      '1er Trim.\n(100)',
      '2do Trim.\n(100)',
      '3er Trim.\n(100)',
      'PROMEDIO\nANUAL',
      'SITUACIÓN FINAL',
    ]],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 120, 75],
      textColor: [255, 255, 255],
      halign: 'center',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 25 },
      1: { halign: 'left', cellWidth: 185 },
      2: { halign: 'center', cellWidth: 50 },
      3: { halign: 'center', cellWidth: 50 },
      4: { halign: 'center', cellWidth: 50 },
      5: { halign: 'center', cellWidth: 60, fontStyle: 'bold' },
      6: { halign: 'center', cellWidth: 80 },
    },
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 20 : 450;

  // Resumen final
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`PROMEDIO ANUAL GENERAL: ${promedioGral} / 100`, 40, finalY + 15);
  doc.text(`ESTADO DE PROMOCIÓN: ${estadoFinal}`, 320, finalY + 15);

  // Código QR decorativo institucional y firmas
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 120);
  doc.text('DOCUMENTO FIRMADO DIGITALMENTE Y REGISTRADO EN EL SISTEMA DE INFORMACIÓN EDUCATIVA (SIE)', 40, finalY + 45);

  doc.line(80, finalY + 95, 230, finalY + 95);
  doc.text('Firma Maestro(a) Asesor', 105, finalY + 107);

  doc.line(350, finalY + 95, 500, finalY + 95);
  doc.text('Sello y Firma Dirección U.E.', 375, finalY + 107);

  const clean = estudiante.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  doc.save(`Libreta_Escolar_Oficial_${clean}.pdf`);
}
