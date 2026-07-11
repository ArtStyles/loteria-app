import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { readDrawingsFromBuffer, readDrawingsFromWorkbook } from './workbookNode.js';

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
});
