import { createNetlifyApi } from '../../lib/gaming/netlify-api.ts';
import { dependencies } from './connection.ts';

export default async function lifApi(request: Request) {
  try { return await createNetlifyApi(dependencies())(request); }
  catch {
    return new Response(JSON.stringify({ error: 'SERVICE_NOT_CONFIGURED' }), {
      status: 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
}
