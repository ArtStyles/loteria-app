import { analyzeMethods, rankNumbers } from '../src/lib/loteria.js';
import { readActiveDrawings } from '../server/activeWorkbook.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ ok: false, error: 'Metodo no permitido.' });
  }

  try {
    const drawings = await readActiveDrawings();
    const requested = String(request.query.numbers || '').split(',').filter(Boolean);
    const latest = drawings.at(-1);
    const sourceNumbers = requested.length === 3
      ? requested
      : [latest.fijo, latest.first, latest.second];

    return response.status(200).json({
      ok: true,
      data: {
        ...analyzeMethods(drawings, sourceNumbers),
        rankings: rankNumbers(drawings),
      },
    });
  } catch (error) {
    return response.status(500).json({ ok: false, error: error.message });
  }
}
