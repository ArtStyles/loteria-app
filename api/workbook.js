import { saveActiveWorkbook } from '../server/activeWorkbook.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ ok: false, error: 'Metodo no permitido.' });
  }

  try {
    const buffer = await readRequestBuffer(request);
    if (buffer.length === 0) {
      return response.status(400).json({ ok: false, error: 'Selecciona un archivo .xlsx valido.' });
    }

    const result = await saveActiveWorkbook(buffer);
    return response.status(200).json({ ok: true, data: result });
  } catch (error) {
    return response.status(400).json({ ok: false, error: error.message });
  }
}

function readRequestBuffer(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}
