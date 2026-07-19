import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import ExcelJS from 'exceljs';
import { appendDrawingToBuffer, readDrawingsFromBuffer, readDrawingsFromWorkbook } from './workbookNode.js';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('serverless workbook reader', () => {
  test('reads the bundled workbook without the local Python bridge', async () => {
    const drawings = await readDrawingsFromWorkbook(path.join(rootDir, 'METODOS 3.xlsx'));

    assert.equal(drawings.length, 13066);
    assert.deepEqual(drawings[drawings.length - 1], {
      date: '2026-04-07',
      shift: 'N',
      fijo: '75',
      first: '66',
      second: '26',
    });
  });

  test('reads workbook data from a Blob-style buffer', async () => {
    const buffer = await readFile(path.join(rootDir, 'METODOS 3.xlsx'));
    const drawings = await readDrawingsFromBuffer(buffer);

    assert.equal(drawings.length, 13066);
    assert.equal(drawings[0].date, '2008-05-19');
  });

  test('appends a drawing to a Blob-style workbook buffer', async () => {
    const buffer = await createWorkbookBuffer();

    const result = await appendDrawingToBuffer(buffer, {
      date: '2026-07-19',
      shift: 'n',
      fijo: '7',
      first: '12',
      second: '3',
    });

    assert.equal(result.drawings.length, 2);
    assert.deepEqual(result.drawings.at(-1), {
      date: '2026-07-19',
      shift: 'N',
      fijo: '07',
      first: '12',
      second: '03',
    });
    assert.deepEqual(await readDrawingsFromBuffer(result.buffer), result.drawings);
  });

  test('rejects duplicate drawings in a Blob-style workbook buffer', async () => {
    const buffer = await createWorkbookBuffer();

    await assert.rejects(
      () => appendDrawingToBuffer(buffer, {
        date: '2026-07-18',
        shift: 'T',
        fijo: '1',
        first: '2',
        second: '3',
      }),
      /Ya existe una tirada/
    );
  });
});

async function createWorkbookBuffer() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('BASE DATOS FLORIDA');
  worksheet.addRow(['Fecha', 'Tarde/Noche', 'Fijo', '1er Corrido', '2do Corrido']);
  worksheet.addRow([new Date('2026-07-18T00:00:00.000Z'), 'T', 7, 12, 31]);
  return workbook.xlsx.writeBuffer();
}
