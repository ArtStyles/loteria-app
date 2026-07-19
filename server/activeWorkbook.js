import { get, put } from '@vercel/blob';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { appendDrawingToBuffer, readDrawingsFromBuffer } from './workbookNode.js';

export const ACTIVE_WORKBOOK_PATH = 'database/METODOS 3.xlsx';

export async function readActiveDrawings(rootDir = process.cwd()) {
  const buffer = await readActiveWorkbookBuffer(rootDir);
  return readDrawingsFromBuffer(buffer);
}

export async function readActiveWorkbookBuffer(rootDir = process.cwd()) {
  const localWorkbookPath = path.join(rootDir, 'METODOS 3.xlsx');

  if (!hasBlobCredentials()) {
    return readFile(localWorkbookPath);
  }

  try {
    const result = await get(ACTIVE_WORKBOOK_PATH, {
      access: 'private',
      useCache: false,
    });
    if (!result?.stream) {
      throw new Error('No se encontro la BD activa en Blob.');
    }

    return streamToBuffer(result.stream);
  } catch (error) {
    if (isMissingBlob(error)) {
      return readFile(localWorkbookPath);
    }

    throw error;
  }
}

export async function saveActiveWorkbook(buffer) {
  if (!hasBlobCredentials()) {
    throw new Error('Vercel Blob no esta conectado al proyecto.');
  }

  const drawings = await readDrawingsFromBuffer(buffer);
  if (drawings.length === 0) {
    throw new Error('El Excel no contiene tiradas en BASE DATOS FLORIDA.');
  }

  const blob = await put(ACTIVE_WORKBOOK_PATH, buffer, {
    access: 'private',
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

export async function appendActiveDrawing(drawing, rootDir = process.cwd()) {
  if (!hasBlobCredentials()) {
    throw new Error('Vercel Blob no esta conectado al proyecto.');
  }

  const currentBuffer = await readActiveWorkbookBuffer(rootDir);
  const result = await appendDrawingToBuffer(currentBuffer, drawing);
  const blob = await put(ACTIVE_WORKBOOK_PATH, result.buffer, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  return {
    count: result.drawings.length,
    drawing: result.drawing,
    url: blob.url,
    pathname: blob.pathname,
  };
}

export async function seedBlobFromLocalWorkbook(rootDir = process.cwd()) {
  const localWorkbookPath = path.join(rootDir, 'METODOS 3.xlsx');
  const buffer = await readFile(localWorkbookPath);
  return saveActiveWorkbook(buffer);
}

export function hasBlobCredentials() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

function isMissingBlob(error) {
  const message = String(error?.message || error);
  return message.includes('not found')
    || message.includes('404')
    || message.includes('NoSuchBlob')
    || message.includes('No se encontro la BD activa');
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}
