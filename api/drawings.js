import { appendActiveDrawing, readActiveDrawings } from '../server/activeWorkbook.js';

export function createDrawingsHandler({
  appendDrawing = appendActiveDrawing,
  readDrawings = readActiveDrawings,
} = {}) {
  return async function handler(request, response) {
    if (request.method === 'GET') {
      try {
        const drawings = await readDrawings();
        return response.status(200).json({ ok: true, data: drawings });
      } catch (error) {
        return response.status(500).json({ ok: false, error: error.message });
      }
    }

    if (request.method === 'POST') {
      try {
        const drawing = await readJsonBody(request);
        const result = await appendDrawing(drawing);
        return response.status(200).json({ ok: true, data: result });
      } catch (error) {
        return response.status(400).json({ ok: false, error: error.message });
      }
    }

    return response.status(405).json({ ok: false, error: 'Metodo no permitido en Vercel.' });
  };
}

async function readJsonBody(request) {
  if (request.body && typeof request.body === 'object' && !Buffer.isBuffer(request.body)) {
    return request.body;
  }

  if (typeof request.body === 'string' || Buffer.isBuffer(request.body)) {
    return JSON.parse(String(request.body));
  }

  const text = await readRequestText(request);
  if (!text) {
    throw new Error('No se recibio la tirada.');
  }

  return JSON.parse(text);
}

function readRequestText(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

export default createDrawingsHandler();
