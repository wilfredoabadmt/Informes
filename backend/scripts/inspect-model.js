const xlsx = require('../node_modules/xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../../modelo/REGISTRO_MODERNO.xlsb');
console.log('Cargando archivo:', filePath);

const wb = xlsx.readFile(filePath);
console.log('Total de hojas:', wb.SheetNames.length);
console.log('Nombres de hojas:', JSON.stringify(wb.SheetNames));

// Función para inspeccionar una hoja
function inspectSheet(sheetName, maxRows = 25, maxCols = 15) {
  const ws = wb.Sheets[sheetName];
  if (!ws) {
    console.log(`Hoja ${sheetName} no existe.`);
    return;
  }
  console.log(`\n=================== HOJA: ${sheetName} ===================`);
  const range = xlsx.utils.decode_range(ws['!ref'] || 'A1:A1');
  console.log(`Rango: ${ws['!ref']} (Filas: ${range.e.r + 1}, Cols: ${range.e.c + 1})`);
  
  const data = xlsx.utils.sheet_to_json(ws, { header: 1, blankrows: false });
  console.log(`Muestra de primeras ${Math.min(data.length, maxRows)} filas:`);
  for (let r = 0; r < Math.min(data.length, maxRows); r++) {
    const row = data[r];
    if (row && row.some(cell => cell !== undefined && cell !== null && cell !== '')) {
      const display = row.slice(0, maxCols).map(c => (c !== undefined && c !== null ? String(c).trim() : ''));
      console.log(`[Fila ${r + 1}]:`, display.join(' | '));
    }
  }
}

// Inspeccionar hojas clave
['MENU', 'CARATULA', 'CARATULA 2', 'X', '11', 'RR1', '1D', '1-1'].forEach(s => {
  if (wb.SheetNames.includes(s)) {
    inspectSheet(s, 20, 12);
  }
});
