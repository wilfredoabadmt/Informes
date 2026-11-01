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

/**
 * MODELO 4: ACTA OFICIAL DE COMPROMISO DEL PADRE/MADRE DE FAMILIA O TUTOR
 * Extraído fielmente de la Hoja 'COMP' del Cuaderno Pedagógico de Primaria (SEP)
 */
export function exportActaCompromisoPdf(
  estudiante: string,
  curso: string,
  tutor: string,
  ciTutor: string,
  maestroNombre?: string
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

  // Encabezado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(24, 30, 40);
  doc.text('ACTA DE COMPROMISO DE PADRE / MADRE DE FAMILIA', 40, 55);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 90, 100);
  doc.text(`UNIDAD EDUCATIVA: ${instInfo.nombre.toUpperCase()} (SIE: ${instInfo.sie}) • SUBSISTEMA DE EDUCACIÓN REGULAR`, 40, 70);

  // Recuadro de datos
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(40, 85, 520, 50, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Padre / Madre / Tutor: ${tutor.toUpperCase()} (C.I. ${ciTutor || 'S/N'})`, 50, 103);
  doc.text(`Estudiante: ${estudiante.toUpperCase()}  |  Curso: ${curso}`, 50, 120);

  // Declaración formal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const textoCompromiso = `Por medio de la presente, yo ${tutor || 'padre/tutor legal'}, padre/madre de familia o tutor de el/la estudiante ${estudiante}, del curso ${curso}, consciente de que la educación implica la acción conjunta de la familia y la Unidad Educativa, me comprometo a realizar el seguimiento permanente de mi hijo/a para que pueda superar las falencias en su proceso de aprendizaje y mejorar su nivel académico en las diferentes áreas de estudio.`;
  doc.text(doc.splitTextToSize(textoCompromiso, 520), 40, 155);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(16, 120, 75);
  doc.text('ESTRATEGIAS COMPROMETIDAS EN EL HOGAR (MODELO OFICIAL SEP):', 40, 205);

  const compromisos = [
    'a) Brindar y fijar horarios de estudio en la casa de forma regular y estructurada.',
    'b) Hacer seguimiento a los horarios de estudio para que los mismos se cumplan estrictamente.',
    'c) Conocer el horario de materias (áreas de conocimiento) de mi hijo/a.',
    'd) Controlar los cuadernos periódicamente (idealmente a diario) para verificar tareas y deberes.',
    'e) Verificar la hora de regreso a casa de mi hijo/a luego del horario de salida de clases.',
    'f) Dialogar diariamente con mi hijo/a sobre sus estudios antes de tomar decisiones.',
    'g) Inculcar siempre una actitud positiva hacia la realización de las tareas escolares.',
    'h) Escuchar a los hijos para conocer sus dificultades o éxitos académicos.',
    'i) Expresar cariño, afecto verbal y físico que fortalezca su autoestima y seguridad escolar.',
    'j) Valorar el esfuerzo y superación de limitaciones en sus trabajos escolares.',
    'k) Entrevistarse periódicamente con los maestros y la Comisión Técnico-Pedagógica.',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  let yPos = 222;
  compromisos.forEach((comp) => {
    doc.text(comp, 45, yPos);
    yPos += 16;
  });

  const textoCierre = `Estas propuestas tienen el firme propósito de que el o la estudiante supere las debilidades en su formación académica, fortaleciendo sus dimensiones del SER, SABER, HACER y DECIDIR en el marco de la Ley 070 Avelino Siñani - Elizardo Pérez.`;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(doc.splitTextToSize(textoCierre, 520), 40, yPos + 10);

  // Firmas oficiales
  const firmasY = 500;
  doc.setDrawColor(148, 163, 184);
  doc.line(50, firmasY, 190, firmasY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Firma Padre / Madre / Tutor', 58, firmasY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(`C.I.: ${ciTutor || '....................'}`, 75, firmasY + 22);

  doc.line(220, firmasY, 360, firmasY);
  doc.setFont('helvetica', 'bold');
  doc.text(maestroNombre || 'Maestro(a) / Tutor de Aula', 230, firmasY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text('Docente Asignado', 260, firmasY + 22);

  doc.line(390, firmasY, 530, firmasY);
  doc.setFont('helvetica', 'bold');
  doc.text(`Dirección ${instInfo.nombre}`, 405, firmasY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text('Sello y Visto Bueno Institucional', 400, firmasY + 22);

  const clean = estudiante.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  doc.save(`Acta_Compromiso_${clean}.pdf`);
}

/**
 * MODELO 5: FICHA DE AUTOEVALUACIÓN DEL ESTUDIANTE (SEP - PRIMARIA)
 * Extraído fielmente de la Hoja 'AUTO' del Cuaderno Pedagógico de Primaria
 */
export function exportAutoevaluacionPrimariaPdf(
  estudiante: string,
  curso: string,
  trimestre: string
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
  doc.setFontSize(13);
  doc.setTextColor(24, 30, 40);
  doc.text('FICHA OFICIAL DE AUTOEVALUACIÓN DEL ESTUDIANTE', 40, 55);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 90, 100);
  doc.text(`${instInfo.nombre.toUpperCase()} • EDUCACIÓN PRIMARIA COMUNITARIA VOCACIONAL (LEY 070)`, 40, 70);

  // Datos
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, 85, 520, 45, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`ESTUDIANTE: ${estudiante.toUpperCase()}`, 50, 102);
  doc.text(`CURSO: ${curso}  |  PERIODO: ${trimestre}º Trimestre (Gestión 2026)`, 50, 118);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Instrucción: Lee cada pregunta y marca con una "X": Sí (1 pto), A veces (0.5 pts), No (0 pts). Luego suma el total.', 40, 145);

  autoTable(doc, {
    startY: 155,
    head: [[
      'Nº',
      'CRITERIOS - DIMENSIÓN DEL SER (Valores y Principios)',
      'SÍ\n(1 pto)',
      'A VECES\n(0.5 pts)',
      'NO\n(0 pts)',
    ]],
    body: [
      ['1', '¿Asisto puntualmente a clases y cumplo mis responsabilidades?', '', '', ''],
      ['2', '¿Soy responsable con todas mis tareas y actividades académicas?', '', '', ''],
      ['3', '¿Demuestro respeto hacia mis maestros, compañeros y entorno escolar?', '', '', ''],
      ['4', '¿Demuestro interés, curiosidad y motivación constante por aprender?', '', '', ''],
      ['5', '¿Evito poner apodos o palabras ofensivas a mis compañeros(as)?', '', '', ''],
      ['', 'PUNTAJE TOTAL DIMENSIÓN DEL SER (Máx. 5 puntos):', '', '', '____ / 5'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 120, 75], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 355 },
      2: { cellWidth: 45, halign: 'center' },
      3: { cellWidth: 50, halign: 'center' },
      4: { cellWidth: 45, halign: 'center' },
    },
  });

  const lastY = (doc as any).lastAutoTable?.finalY || 300;

  autoTable(doc, {
    startY: lastY + 15,
    head: [[
      'Nº',
      'CRITERIOS - DIMENSIÓN DEL DECIDIR (Impacto y Comunidad)',
      'SÍ\n(1 pto)',
      'A VECES\n(0.5 pts)',
      'NO\n(0 pts)',
    ]],
    body: [
      ['1', '¿Contribuyo al trabajo en equipo y comparto materiales con mis compañeros?', '', '', ''],
      ['2', '¿Propongo soluciones creativas para resolver problemas en el aula?', '', '', ''],
      ['3', '¿Cuido el mobiliario, los libros y la limpieza de mi aula y colegio?', '', '', ''],
      ['4', '¿Aplico lo aprendido en la escuela en mi hogar y con mi familia?', '', '', ''],
      ['5', '¿Participo activamente en las actividades culturales y cívicas de la U.E.?', '', '', ''],
      ['', 'PUNTAJE TOTAL DIMENSIÓN DEL DECIDIR (Máx. 5 puntos):', '', '', '____ / 5'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 355 },
      2: { cellWidth: 45, halign: 'center' },
      3: { cellWidth: 50, halign: 'center' },
      4: { cellWidth: 45, halign: 'center' },
    },
  });

  const finalTableY = (doc as any).lastAutoTable?.finalY || 450;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('NOTA FINAL CONSOLIDADA DE AUTOEVALUACIÓN (SER + DECIDIR):  ________ / 10 PUNTOS', 40, finalTableY + 30);

  // Firmas
  const firmasY = finalTableY + 80;
  doc.line(70, firmasY, 230, firmasY);
  doc.text('Firma del Estudiante', 110, firmasY + 14);

  doc.line(330, firmasY, 490, firmasY);
  doc.text('Firma Padre / Madre de Familia', 350, firmasY + 14);

  const clean = estudiante.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  doc.save(`Autoevaluacion_${clean}.pdf`);
}

