import http from 'node:http';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyzeMethods,
  rankNumbers,
} from '../src/lib/loteria.js';
import { resolveStaticRequest } from './staticRoutes.js';
import { appendDrawing, readDrawings, replaceWorkbook } from './workbook.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const workbookPath = path.join(rootDir, 'METODOS 3.xlsx');
const uploadsDir = path.join(rootDir, 'uploads');
const backupsDir = path.join(rootDir, 'backups');
const port = Number(process.env.PORT || 5174);

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname === '/api/drawings' && request.method === 'GET') {
      return sendJson(response, { ok: true, data: await readDrawings(workbookPath) });
    }

    if (url.pathname === '/api/drawings' && request.method === 'POST') {
      const body = await readTextBody(request);
      const data = await appendDrawing(workbookPath, JSON.parse(body));
      return sendJson(response, { ok: true, data });
    }

    if (url.pathname === '/api/workbook' && request.method === 'POST') {
      const upload = await readWorkbookUpload(request);
      const result = await replaceWorkbook(workbookPath, upload.path, backupsDir);
      await unlink(upload.path).catch(() => {});
      return sendJson(response, { ok: true, data: result });
    }

    if (url.pathname === '/api/analysis' && request.method === 'GET') {
      const drawings = await readDrawings(workbookPath);
      const requested = (url.searchParams.get('numbers') || '').split(',').filter(Boolean);
      const latest = drawings.at(-1);
      const sourceNumbers = requested.length === 3
        ? requested
        : [latest.fijo, latest.first, latest.second];
      return sendJson(response, {
        ok: true,
        data: {
          ...analyzeMethods(drawings, sourceNumbers),
          rankings: rankNumbers(drawings),
        },
      });
    }

    return serveStatic(url.pathname, response);
  } catch (error) {
    return sendJson(response, { ok: false, error: error.message }, 400);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Loteria app lista en http://127.0.0.1:${port}`);
});

async function serveStatic(urlPath, response) {
  const staticRequest = resolveStaticRequest(rootDir, urlPath);

  if (staticRequest.type === 'forbidden') {
    return sendText(response, 'No permitido', 403);
  }

  if (staticRequest.type === 'not-found') {
    return sendText(response, 'No encontrado', 404);
  }

  try {
    const content = await readFile(staticRequest.filePath);
    response.writeHead(200, { 'Content-Type': staticRequest.contentType });
    response.end(content);
  } catch {
    sendText(response, 'No encontrado', 404);
  }
}

function sendJson(response, payload, status = 200) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function sendText(response, text, status) {
  response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(text);
}

function readTextBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

async function readWorkbookUpload(request) {
  const contentType = request.headers['content-type'] || '';
  if (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
    const fileBuffer = await readBinaryBody(request);
    await mkdir(uploadsDir, { recursive: true });
    const uploadPath = path.join(uploadsDir, `uploaded-${Date.now()}.xlsx`);
    await writeFile(uploadPath, fileBuffer);
    return { path: uploadPath };
  }

  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!boundaryMatch) {
    throw new Error('La carga debe enviarse como formulario multipart.');
  }

  const body = await readBinaryBody(request);
  const boundary = Buffer.from(`--${boundaryMatch[1]}`);
  const start = body.indexOf(Buffer.from('\r\n\r\n'));
  if (start === -1) {
    throw new Error('No se encontro el archivo Excel en la carga.');
  }

  const headers = body.slice(0, start).toString('utf8');
  if (!headers.includes('name="workbook"') || !headers.match(/filename=".+\.xlsx"/i)) {
    throw new Error('Selecciona un archivo .xlsx valido.');
  }

  const contentStart = start + 4;
  const nextBoundary = body.indexOf(Buffer.concat([Buffer.from('\r\n'), boundary]), contentStart);
  if (nextBoundary === -1) {
    throw new Error('No se pudo leer el contenido del Excel.');
  }

  const fileBuffer = body.slice(contentStart, nextBoundary);
  await mkdir(uploadsDir, { recursive: true });
  const uploadPath = path.join(uploadsDir, `uploaded-${Date.now()}.xlsx`);
  await writeFile(uploadPath, fileBuffer);
  return { path: uploadPath };
}

function readBinaryBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => {
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}
