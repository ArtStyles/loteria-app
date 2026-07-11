import { head, put } from '@vercel/blob';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { readDrawingsFromBuffer, readDrawingsFromWorkbook } from './workbookNode.js';

export const ACTIVE_WORKBOOK_PATH = 'database/METODOS 3.xlsx';

export async function readActiveDrawings(rootDir = process.cwd()) {
  const localWorkbookPath = path.join(rootDir, 'METODOS 3.xlsx');

  if (!hasBlobToken()) {
    return readDrawingsFromWorkbook(localWorkbookPath);
  }

  try {
    const blob = await head(ACTIVE_WORKBOOK_PATH);
    const response = await fetch(blob.downloadUrl);
    if (!response.ok) {
      throw new Error(`No se pudo descargar la BD desde Blob: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return readDrawingsFromBuffer(buffer);
  } catch (error) {
    if (isMissingBlob(error)) {
      return readDrawingsFromWorkbook(localWorkbookPath);
    }

    throw error;
  }
}

export async function saveActiveWorkbook(buffer) {
  if (!hasBlobToken()) {
    throw new Error('BLOB_READ_WRITE_TOKEN no esta configurado.');
  }

  const drawings = await readDrawingsFromBuffer(buffer);
  if (drawings.length === 0) {
    throw new Error('El Excel no contiene tiradas en BASE DATOS FLORIDA.');
  }

  const blob = await put(ACTIVE_WORKBOOK_PATH, buffer, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  return {
    count: drawings.length,
    url: blob.url,
    pathname: blob.pathname,
  };
}

export async function seedBlobFromLocalWorkbook(rootDir = process.cwd()) {
  const localWorkbookPath = path.join(rootDir, 'METODOS 3.xlsx');
  const buffer = await readFile(localWorkbookPath);
  return saveActiveWorkbook(buffer);
}

function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isMissingBlob(error) {
  const message = String(error?.message || error);
  return message.includes('not found') || message.includes('404') || message.includes('NoSuchBlob');
}
