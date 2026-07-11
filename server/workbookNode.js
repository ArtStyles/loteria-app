import ExcelJS from 'exceljs';

const SHEET_NAME = 'BASE DATOS FLORIDA';

export async function readDrawingsFromWorkbook(workbookPath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);
  return readDrawingsFromLoadedWorkbook(workbook);
}

export async function readDrawingsFromBuffer(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return readDrawingsFromLoadedWorkbook(workbook);
}

function readDrawingsFromLoadedWorkbook(workbook) {
  const worksheet = workbook.getWorksheet(SHEET_NAME);

  if (!worksheet) {
    throw new Error(`El Excel debe tener la hoja ${SHEET_NAME}.`);
  }

  const drawings = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const values = [
      row.getCell(1).value,
      row.getCell(2).value,
      row.getCell(3).value,
      row.getCell(4).value,
      row.getCell(5).value,
    ];

    if (values.every((value) => value === null || value === undefined || value === '')) {
      return;
    }

    drawings.push({
      date: normalizeDate(values[0]),
      shift: String(values[1]).trim().toUpperCase(),
      fijo: normalizeNumber(values[2]),
      first: normalizeNumber(values[3]),
      second: normalizeNumber(values[4]),
    });
  });

  return drawings;
}

function normalizeDate(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'object' && value?.result instanceof Date) {
    return value.result.toISOString().slice(0, 10);
  }

  return new Date(String(value).slice(0, 10)).toISOString().slice(0, 10);
}

function normalizeNumber(value) {
  const number = Number(typeof value === 'object' && value?.result !== undefined ? value.result : value);
  if (!Number.isInteger(number) || number < 0 || number > 99) {
    throw new Error('El numero debe estar entre 00 y 99.');
  }

  return String(number).padStart(2, '0');
}
