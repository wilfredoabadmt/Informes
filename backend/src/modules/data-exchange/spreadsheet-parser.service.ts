import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

@Injectable()
export class SpreadsheetParserService {
  /**
   * Parsea un buffer de archivo Excel o CSV a un arreglo de objetos clave-valor
   */
  parseBuffer(buffer: Buffer): Array<Record<string, any>> {
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: true,
      raw: false,
    });

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return [];
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      defval: '',
      raw: false,
    });

    return rows;
  }

  /**
   * Genera un buffer de archivo en formato XLSX o CSV a partir de un arreglo de objetos
   */
  generateBuffer(
    data: Array<Record<string, any>>,
    format: 'xlsx' | 'csv' = 'xlsx',
    sheetName: string = 'Hoja1',
  ): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    if (format === 'csv') {
      const csvOutput = XLSX.write(workbook, {
        bookType: 'csv',
        type: 'buffer',
      });
      return Buffer.from(csvOutput);
    }

    const xlsxOutput = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    });
    return Buffer.from(xlsxOutput);
  }
}
