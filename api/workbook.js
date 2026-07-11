export default async function handler(request, response) {
  return response.status(501).json({
    ok: false,
    error: 'En Vercel no se puede reemplazar el Excel de forma permanente. Usa la app local para cargar BD o conecta almacenamiento externo.',
  });
}
