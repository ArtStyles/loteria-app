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

export async function appendDrawingToBuffer(buffer, drawing) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = getWorksheet(workbook);
  const normalizedDrawing = normalizeDrawing(drawing);
  const drawings = readDrawingsFromLoadedWorkbook(workbook);

  if (drawings.some((existing) => (
    existing.date === normalizedDrawing.date && existing.shift === normalizedDrawing.shift
  ))) {
    throw new Error('Ya existe una tirada para esa fecha y turno.');
  }

  worksheet.addRow([
    new Date(`${normalizedDrawing.date}T00:00:00.000Z`),
    normalizedDrawing.shift,
    Number(normalizedDrawing.fijo),
    Number(normalizedDrawing.first),
    Number(normalizedDrawing.second),
  ]);

  const nextDrawings = readDrawingsFromLoadedWorkbook(workbook);
  const nextBuffer = await workbook.xlsx.writeBuffer();

  return {
    buffer: Buffer.from(nextBuffer),
    drawing: nextDrawings.at(-1),
    drawings: nextDrawings,
  };
}

function readDrawingsFromLoadedWorkbook(workbook) {
  const worksheet = getWorksheet(workbook);

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

function getWorksheet(workbook) {
  const worksheet = workbook.getWorksheet(SHEET_NAME);

  if (!worksheet) {
    throw new Error(`El Excel debe tener la hoja ${SHEET_NAME}.`);
  }

  return worksheet;
}

function normalizeDrawing(drawing) {
  const normalized = {
    date: normalizeDate(drawing.date),
    shift: String(drawing.shift || '').trim().toUpperCase(),
    fijo: normalizeNumber(drawing.fijo),
    first: normalizeNumber(drawing.first),
    second: normalizeNumber(drawing.second),
  };

  if (!['T', 'N'].includes(normalized.shift)) {
    throw new Error('El turno debe ser T o N.');
  }

  return normalized;
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
