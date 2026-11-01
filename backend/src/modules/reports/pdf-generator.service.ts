import { Injectable } from '@nestjs/common';
const PDFDocument = require('pdfkit');

@Injectable()
export class PdfGeneratorService {
  async generateCourseRosterPdf(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header Institucional
      doc.fontSize(14).font('Helvetica-Bold').text(data.institucion.nombre.toUpperCase(), { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(`CÓDIGO SIE: ${data.institucion.sie} | DISTRITO: ${data.institucion.distrito} - ${data.institucion.departamento}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica-Bold').text('NÓMINA OFICIAL DE ESTUDIANTES EFECTIVOS', { align: 'center' });
      doc.moveDown(0.3);

      // Metadatos Académicos
      doc.fontSize(9).font('Helvetica');
      const startY = doc.y;
      doc.text(`Gestión: ${data.academico.gestion}`, 40, startY);
      doc.text(`Nivel: ${data.academico.nivel}`, 150, startY);
      doc.text(`Curso: ${data.academico.curso} "${data.academico.paralelo}"`, 300, startY);
      doc.text(`Turno: ${data.academico.turno}`, 450, startY);
      doc.moveDown(1.5);

      // Tabla de estudiantes
      const tableTop = doc.y;
      doc.rect(40, tableTop, 532, 20).fill('#2c3e50');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('Nº', 45, tableTop + 6, { width: 25 });
      doc.text('RUDE', 75, tableTop + 6, { width: 90 });
      doc.text('APELLIDOS Y NOMBRES', 170, tableTop + 6, { width: 180 });
      doc.text('CI', 355, tableTop + 6, { width: 65 });
      doc.text('GÉN.', 425, tableTop + 6, { width: 30 });
      doc.text('TUTOR / CONTACTO', 460, tableTop + 6, { width: 110 });

      let yPos = tableTop + 20;
      doc.fillColor('#333333').font('Helvetica').fontSize(8);

      data.estudiantes.forEach((est: any, idx: number) => {
        if (yPos > 680) {
          doc.addPage();
          yPos = 40;
        }

        const isEven = idx % 2 === 0;
        if (isEven) {
          doc.rect(40, yPos, 532, 18).fill('#f8f9fa');
        }
        doc.fillColor('#333333');
        doc.text(String(est.numero), 45, yPos + 5, { width: 25 });
        doc.text(est.rude, 75, yPos + 5, { width: 90 });
        doc.text(`${est.apellidos} ${est.nombres}`, 170, yPos + 5, { width: 180 });
        doc.text(est.ci, 355, yPos + 5, { width: 65 });
        doc.text(est.genero.charAt(0).toUpperCase(), 425, yPos + 5, { width: 30 });
        const tutor = est.tutorNombre ? `${est.tutorNombre} (${est.tutorTelefono || '-'})` : 'No registrado';
        doc.text(tutor, 460, yPos + 5, { width: 110 });

        yPos += 18;
      });

      // Pie de página
      doc.moveDown(2);
      const footerY = Math.max(doc.y + 30, 680);
      doc.strokeColor('#cccccc').moveTo(80, footerY).lineTo(220, footerY).stroke();
      doc.strokeColor('#cccccc').moveTo(350, footerY).lineTo(490, footerY).stroke();
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#555555');
      doc.text('FIRMA DEL MAESTRO / ASESOR', 80, footerY + 5, { width: 140, align: 'center' });
      doc.text('DIRECCIÓN / SELLO OFICIAL', 350, footerY + 5, { width: 140, align: 'center' });

      doc.end();
    });
  }

  async generateTrimesterBulletinPdf(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header
      doc.fontSize(14).font('Helvetica-Bold').text(data.institucion.nombre.toUpperCase(), { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(`BOLETÍN TRIMESTRAL DE CALIFICACIONES — ${data.periodo.nombre.toUpperCase()}`, { align: 'center' });
      doc.moveDown(0.5);

      // Datos Estudiante
      doc.rect(40, doc.y, 532, 45).fill('#f1f5f9');
      const boxY = doc.y;
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold');
      doc.text(`ESTUDIANTE: ${data.estudiante.apellidos} ${data.estudiante.nombres}`, 50, boxY + 8);
      doc.text(`RUDE: ${data.estudiante.rude}`, 380, boxY + 8);
      doc.font('Helvetica');
      doc.text(`CURSO / PARALELO: ${data.estudiante.curso} "${data.estudiante.paralelo}"`, 50, boxY + 25);
      doc.text(`GESTIÓN: ${data.periodo.gestion}`, 380, boxY + 25);
      doc.moveDown(2.5);

      // Tabla de Calificaciones
      const tableTop = doc.y;
      doc.rect(40, tableTop, 532, 20).fill('#1e3a8a');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('ÁREA / MATERIA', 45, tableTop + 6, { width: 160 });
      doc.text('SER', 210, tableTop + 6, { width: 35, align: 'center' });
      doc.text('SABER', 250, tableTop + 6, { width: 45, align: 'center' });
      doc.text('HACER', 300, tableTop + 6, { width: 45, align: 'center' });
      doc.text('DEC.', 350, tableTop + 6, { width: 35, align: 'center' });
      doc.text('AUTO.', 390, tableTop + 6, { width: 40, align: 'center' });
      doc.text('FINAL', 435, tableTop + 6, { width: 40, align: 'center' });
      doc.text('ESTADO', 485, tableTop + 6, { width: 80, align: 'center' });

      let yPos = tableTop + 20;
      doc.fillColor('#333333').font('Helvetica').fontSize(8);

      data.materias.forEach((mat: any, idx: number) => {
        const isEven = idx % 2 === 0;
        if (isEven) {
          doc.rect(40, yPos, 532, 18).fill('#f8fafc');
        }
        doc.fillColor('#333333');
        doc.text(`${mat.codigo} - ${mat.nombre}`, 45, yPos + 5, { width: 160 });
        doc.text(String(mat.dimensiones.ser), 210, yPos + 5, { width: 35, align: 'center' });
        doc.text(String(mat.dimensiones.saber), 250, yPos + 5, { width: 45, align: 'center' });
        doc.text(String(mat.dimensiones.hacer), 300, yPos + 5, { width: 45, align: 'center' });
        doc.text(String(mat.dimensiones.decidir), 350, yPos + 5, { width: 35, align: 'center' });
        doc.text(String(mat.dimensiones.autoevaluacion), 390, yPos + 5, { width: 40, align: 'center' });

        const isApproved = mat.notaFinal >= 51;
        doc.font('Helvetica-Bold');
        doc.fillColor(isApproved ? '#047857' : '#b91c1c');
        doc.text(String(mat.notaFinal), 435, yPos + 5, { width: 40, align: 'center' });
        doc.text(mat.estado, 485, yPos + 5, { width: 80, align: 'center' });
        doc.font('Helvetica').fillColor('#333333');

        yPos += 18;
      });

      // Resumen Asistencia y Promedio
      yPos += 15;
      doc.rect(40, yPos, 532, 50).fill('#e2e8f0');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
      doc.text('RESUMEN DE ASISTENCIA Y RENDIMIENTO', 50, yPos + 8);
      doc.font('Helvetica').fontSize(8);
      doc.text(`Días Presente: ${data.resumenAsistencia.presente} | Atrasos: ${data.resumenAsistencia.atraso} | Licencias: ${data.resumenAsistencia.licencia} | Faltas: ${data.resumenAsistencia.falta}`, 50, yPos + 22);
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text(`Promedio Trimestral: ${data.promedioTrimestral.toFixed(1)} / 100`, 380, yPos + 22);
      doc.text(`Aprobadas: ${data.materiasAprobadas} | Reprobadas: ${data.materiasReprobadas}`, 50, yPos + 35);

      // Firmas
      const footerY = Math.max(yPos + 85, 680);
      doc.strokeColor('#cccccc').moveTo(80, footerY).lineTo(220, footerY).stroke();
      doc.strokeColor('#cccccc').moveTo(350, footerY).lineTo(490, footerY).stroke();
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#555555');
      doc.text('FIRMA PROFESOR ASESOR', 80, footerY + 5, { width: 140, align: 'center' });
      doc.text('DIRECCIÓN UNIDAD EDUCATIVA', 350, footerY + 5, { width: 140, align: 'center' });

      doc.end();
    });
  }

  async generateSchoolReportCardPdf(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header Oficial
      doc.fontSize(14).font('Helvetica-Bold').text(data.institucion.nombre.toUpperCase(), { align: 'center' });
      doc.fontSize(11).font('Helvetica-Bold').text('LIBRETA ESCOLAR ELECTRÓNICA OFICIAL', { align: 'center' });
      doc.fontSize(9).font('Helvetica').text(`CÓDIGO SIE: ${data.institucion.sie} | DISTRITO: ${data.institucion.distrito}`, { align: 'center' });
      doc.moveDown(0.5);

      // Datos
      doc.rect(40, doc.y, 532, 45).fill('#f1f5f9');
      const boxY = doc.y;
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold');
      doc.text(`ESTUDIANTE: ${data.estudiante.apellidos} ${data.estudiante.nombres}`, 50, boxY + 8);
      doc.text(`CÓDIGO RUDE: ${data.estudiante.rude}`, 370, boxY + 8);
      doc.font('Helvetica');
      doc.text(`CURSO / PARALELO: ${data.estudiante.curso} "${data.estudiante.paralelo}"`, 50, boxY + 25);
      doc.text(`GESTIÓN ESCOLAR: ${data.estudiante.gestion}`, 370, boxY + 25);
      doc.moveDown(2.5);

      // Tabla de Calificaciones Anual
      const tableTop = doc.y;
      doc.rect(40, tableTop, 532, 20).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('CAMPOS Y ÁREAS CURRICULARES', 45, tableTop + 6, { width: 190 });
      doc.text('1T', 240, tableTop + 6, { width: 45, align: 'center' });
      doc.text('2T', 290, tableTop + 6, { width: 45, align: 'center' });
      doc.text('3T', 340, tableTop + 6, { width: 45, align: 'center' });
      doc.text('PROM. ANUAL', 390, tableTop + 6, { width: 75, align: 'center' });
      doc.text('ESTADO', 475, tableTop + 6, { width: 90, align: 'center' });

      let yPos = tableTop + 20;
      doc.fillColor('#333333').font('Helvetica').fontSize(8);

      data.materias.forEach((mat: any, idx: number) => {
        const isEven = idx % 2 === 0;
        if (isEven) {
          doc.rect(40, yPos, 532, 18).fill('#f8fafc');
        }
        doc.fillColor('#333333');
        doc.text(`${mat.codigo} - ${mat.nombre}`, 45, yPos + 5, { width: 190 });
        doc.text(String(mat.primerTrimestre), 240, yPos + 5, { width: 45, align: 'center' });
        doc.text(String(mat.segundoTrimestre), 290, yPos + 5, { width: 45, align: 'center' });
        doc.text(String(mat.tercerTrimestre), 340, yPos + 5, { width: 45, align: 'center' });

        const isApproved = mat.promedioAnual >= 51;
        doc.font('Helvetica-Bold');
        doc.fillColor(isApproved ? '#047857' : '#b91c1c');
        doc.text(String(mat.promedioAnual), 390, yPos + 5, { width: 75, align: 'center' });
        doc.text(mat.estado, 475, yPos + 5, { width: 90, align: 'center' });
        doc.font('Helvetica').fillColor('#333333');

        yPos += 18;
      });

      // Bloque de Situación Final Oficial
      yPos += 15;
      const sitColor = data.situacionFinal === 'PROMOVIDO' ? '#065f46' : '#991b1b';
      doc.rect(40, yPos, 532, 50).fill(sitColor);
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
      doc.text(`PROMEDIO GENERAL ANUAL: ${data.promedioGeneralAnual.toFixed(1)} / 100`, 50, yPos + 10);
      doc.text(`SITUACIÓN FINAL OFICIAL: ${data.situacionFinal}`, 50, yPos + 28);

      // Firmas
      const footerY = Math.max(yPos + 85, 680);
      doc.strokeColor('#cccccc').moveTo(80, footerY).lineTo(220, footerY).stroke();
      doc.strokeColor('#cccccc').moveTo(350, footerY).lineTo(490, footerY).stroke();
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#555555');
      doc.text('FIRMA PROFESOR ASESOR', 80, footerY + 5, { width: 140, align: 'center' });
      doc.text('DIRECCIÓN UNIDAD EDUCATIVA', 350, footerY + 5, { width: 140, align: 'center' });

      doc.end();
    });
  }
}
