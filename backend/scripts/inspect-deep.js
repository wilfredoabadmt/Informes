const xlsx = require('../node_modules/xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../../modelo/REGISTRO_MODERNO.xlsb');
const wb = xlsx.readFile(filePath);

function inspectHeaders(sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) return;
  console.log(`\n=================== DETALLE DE HOJA: ${sheetName} ===================`);
  const data = xlsx.utils.sheet_to_json(ws, { header: 1, blankrows: false });
  for (let r = 0; r < Math.min(data.length, 12); r++) {
    const row = data[r];
    if (row && row.some(c => c !== undefined && c !== null && c !== '')) {
      const nonEmpties = row.map((c, colIdx) => ({ col: xlsx.utils.encode_col(colIdx), val: c })).filter(x => x.val !== undefined && x.val !== null && x.val !== '');
      console.log(`Fila ${r + 1} (${nonEmpties.length} celdas):`, nonEmpties.slice(0, 15).map(x => `${x.col}:${String(x.val).trim()}`).join(' | '));
    }
  }
}

['1D', 'CENTRALIZADOR_1', 'KARDEX', 'COTEJOS', 'HOR'].forEach(s => inspectHeaders(s));

