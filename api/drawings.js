import { readActiveDrawings } from '../server/activeWorkbook.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ ok: false, error: 'Metodo no permitido en Vercel.' });
  }

  try {
    const drawings = await readActiveDrawings();
    return response.status(200).json({ ok: true, data: drawings });
  } catch (error) {
    return response.status(500).json({ ok: false, error: error.message });
  }
}
