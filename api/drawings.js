import path from 'node:path';
import { readDrawingsFromWorkbook } from '../server/workbookNode.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ ok: false, error: 'Metodo no permitido en Vercel.' });
  }

  try {
    const workbookPath = path.join(process.cwd(), 'METODOS 3.xlsx');
    const drawings = await readDrawingsFromWorkbook(workbookPath);
    return response.status(200).json({ ok: true, data: drawings });
  } catch (error) {
    return response.status(500).json({ ok: false, error: error.message });
  }
}
