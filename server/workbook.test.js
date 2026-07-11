import assert from 'node:assert/strict';
import { copyFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, test } from 'node:test';
import { appendDrawing, readDrawings, replaceWorkbook } from './workbook.js';

const python = process.env.PYTHON_BIN
  || 'C:\\Users\\ACER NITRO\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';

describe('workbook persistence', () => {
  let tempDir;
  let workbookPath;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'loteria-workbook-'));
    workbookPath = path.join(tempDir, 'test.xlsx');
    await createWorkbook(workbookPath);
  });

  test('reads drawings from the BASE DATOS FLORIDA sheet', async () => {
    const drawings = await readDrawings(workbookPath);

    assert.deepEqual(drawings, [
      { date: '2026-04-05', shift: 'T', fijo: '07', first: '12', second: '31' },
    ]);
  });

  test('appends a drawing and rejects duplicate date and shift rows', async () => {
    await appendDrawing(workbookPath, {
      date: '2026-04-05',
      shift: 'N',
      fijo: '56',
      first: '79',
      second: '66',
    });

    const drawings = await readDrawings(workbookPath);
    assert.equal(drawings.length, 2);
    assert.equal(drawings[1].second, '66');

    await assert.rejects(
      () => appendDrawing(workbookPath, {
        date: '2026-04-05',
        shift: 'N',
        fijo: '01',
        first: '02',
        second: '03',
      }),
      /Ya existe una tirada/
    );

    await rm(tempDir, { recursive: true, force: true });
  });

  test('replaces the active workbook with a valid uploaded workbook and creates a backup', async () => {
    const uploadedPath = path.join(tempDir, 'uploaded.xlsx');
    const backupDir = path.join(tempDir, 'backups');
    await createWorkbook(uploadedPath, {
      date: '2026-04-06',
      shift: 'N',
      fijo: 93,
      first: 58,
      second: 3,
    });

    const result = await replaceWorkbook(workbookPath, uploadedPath, backupDir);
    const drawings = await readDrawings(workbookPath);

    assert.equal(result.count, 1);
    assert.equal(result.backupPath.includes(backupDir), true);
    assert.deepEqual(drawings, [
      { date: '2026-04-06', shift: 'N', fijo: '93', first: '58', second: '03' },
    ]);
  });

  test('rejects an invalid uploaded workbook without replacing the current database', async () => {
    const invalidPath = path.join(tempDir, 'invalid.xlsx');
    const backupDir = path.join(tempDir, 'backups');
    await copyFile(workbookPath, invalidPath);
    await createInvalidWorkbook(invalidPath);

    await assert.rejects(
      () => replaceWorkbook(workbookPath, invalidPath, backupDir),
      /BASE DATOS FLORIDA/
    );

    const drawings = await readDrawings(workbookPath);
    assert.equal(drawings[0].date, '2026-04-05');
    assert.equal(drawings[0].fijo, '07');
  });
});

async function createWorkbook(targetPath, drawing = {
  date: '2026-04-05',
  shift: 'T',
  fijo: 7,
  first: 12,
  second: 31,
}) {
  const code = `
from openpyxl import Workbook
from datetime import datetime
wb = Workbook()
ws = wb.active
ws.title = 'BASE DATOS FLORIDA'
ws.append(['Fecha', 'Tarde/Noche', 'Fijo', '1er Corrido', '2do Corrido'])
ws.append([datetime.fromisoformat('${drawing.date}'), '${drawing.shift}', ${drawing.fijo}, ${drawing.first}, ${drawing.second}])
wb.create_sheet('EXPLICACION DEL METODO')
wb.create_sheet('METODOS')
wb.save(r'''${targetPath}''')
`;

  const { spawn } = await import('node:child_process');
  await new Promise((resolve, reject) => {
    const child = spawn(python, ['-c', code], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('exit', (codeValue) => {
      if (codeValue === 0) {
        resolve();
      } else {
        reject(new Error(stderr));
      }
    });
  });
}

async function createInvalidWorkbook(targetPath) {
  const code = `
from openpyxl import Workbook
wb = Workbook()
ws = wb.active
ws.title = 'OTRA HOJA'
ws.append(['x'])
wb.save(r'''${targetPath}''')
`;

  const { spawn } = await import('node:child_process');
  await new Promise((resolve, reject) => {
    const child = spawn(python, ['-c', code], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('exit', (codeValue) => {
      if (codeValue === 0) {
        resolve();
      } else {
        reject(new Error(stderr));
      }
    });
  });
}
