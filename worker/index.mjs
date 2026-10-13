import { publicRanking } from '../lib/gaming/initial-ranking.ts';
import { rankingPageResponse } from '../lib/gaming/ranking-page.ts';

const serviceOrigin = 'https://lifnewsitev1.netlify.app';
const apiRoutes = new Map([
  ['/api/games/bootstrap', 'GET'], ['/api/games/leaderboard', 'GET'],
  ['/api/games/ranking', 'GET'],
  ['/api/games/start', 'POST'], ['/api/games/checkpoint', 'POST'],
  ['/api/games/finish', 'POST'], ['/api/games/abandon', 'POST'],
  ['/api/games/register', 'POST'], ['/api/contact', 'POST'],
]);
const json = (status, error) => Response.json({ error }, {
  status, headers: { 'Cache-Control': 'no-store' },
});

async function readPublicRanking(serviceFetch) {
  try {
    const response = await serviceFetch(new Request(`${serviceOrigin}/api/games/ranking`, {
      headers: { Accept: 'application/json', Origin: serviceOrigin,
        'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      redirect: 'manual', signal: AbortSignal.timeout(10000),
    }));
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      console.error('LIF_INITIAL_RANKING_RESPONSE_INVALID', response.status);
      return null;
    }
    const ranking = publicRanking(await response.json());
    if (!ranking) console.error('LIF_INITIAL_RANKING_DATA_INVALID');
    return ranking;
  } catch (error) {
    console.error('LIF_INITIAL_RANKING_FETCH_FAILED', error instanceof Error ? error.name : 'REQUEST');
    return null;
  }
}

export function createHandler(serviceFetch = fetch, gamesTemplates = null) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api/')) {
        const method = apiRoutes.get(url.pathname);
        if (!method) return json(404, 'NOT_FOUND');
        if (request.method !== method) return json(405, 'METHOD_INVALID');
        const origin = request.headers.get('origin');
        if (origin && origin !== url.origin) return json(403, 'ORIGIN_INVALID');
        if (request.headers.get('sec-fetch-site') === 'cross-site') return json(403, 'ORIGIN_INVALID');
        if (method === 'POST' && !request.headers.get('content-type')?.startsWith('application/json'))
          return json(415, 'CONTENT_TYPE_INVALID');
        if (Number(request.headers.get('content-length')) > 1000000) return json(413, 'PAYLOAD_TOO_LARGE');
        const body = method === 'POST' ? await request.arrayBuffer() : undefined;
        if (body && body.byteLength > 1000000) return json(413, 'PAYLOAD_TOO_LARGE');
        const headers = new Headers({ Accept: 'application/json' });
        if (body) headers.set('Content-Type', 'application/json');
        headers.set('Origin', serviceOrigin);
        // Sites keeps its own host-only identity cookie; no unrelated cookies leave the Site.
        const cookie = /(?:^|;\s*)(lif_game_device=[a-f0-9]{64})(?=;|$)/.exec(request.headers.get('cookie') || '')?.[1];
        if (cookie) headers.set('Cookie', cookie);
        try {
          const response = await serviceFetch(new Request(new URL(url.pathname + url.search, serviceOrigin), {
            method, headers, body, redirect: 'manual', signal: AbortSignal.timeout(65000),
          }));
          if (!response.headers.get('content-type')?.includes('application/json') || response.status >= 300 && response.status < 400)
            return json(503, 'STORAGE_UNAVAILABLE');
          const output = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          const identity = response.headers.get('set-cookie');
          if (identity && /^lif_game_device=[a-f0-9]{64};/i.test(identity) && !/;\s*domain=/i.test(identity))
            output.set('Set-Cookie', identity);
          return new Response(response.body, { status: response.status, headers: output });
        } catch {
          return json(503, 'STORAGE_UNAVAILABLE');
        }
      }
      if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405 });
      let path;
      try { path = decodeURIComponent(url.pathname); }
      catch { return new Response(null, { status: 400 }); }
      if (path.split('/').some(part => part.startsWith('.')) || path.includes('\\'))
        return new Response(null, { status: 404 });
      const name = path === '/' ? '/index.html' : /\.[a-z0-9]+$/i.test(path) ? path : `${path.replace(/\/$/, '')}.html`;
      const rankingPage = name === '/juega.html' || name === '/juega.rsc';
      if (rankingPage) {
        if (!gamesTemplates) return new Response(null, { status: 503 });
        const ranking = request.method === 'HEAD' ? null : await readPublicRanking(serviceFetch);
        return rankingPageResponse(name.endsWith('.rsc') ? gamesTemplates.rsc : gamesTemplates.html,
          name.endsWith('.rsc') ? 'rsc' : 'html', ranking, request.method === 'HEAD');
      }
      const assetUrl = new URL(url);
      let response = await env.ASSETS.fetch(request);
      if (response.status === 404 && name !== path) {
        assetUrl.pathname = name;
        response = await env.ASSETS.fetch(new Request(assetUrl, request));
      }
      if (response.status === 404) {
        assetUrl.pathname = '/404.html';
        const notFound = await env.ASSETS.fetch(new Request(assetUrl, request));
        return new Response(notFound.body, { status: 404, headers: notFound.headers });
      }
      if (/\.(?:html|rsc)$/.test(name)) {
        const headers = new Headers(response.headers);
        headers.set('Cache-Control', 'no-store');
        return new Response(response.body, { status: response.status, headers });
      }
      return response;
    },
  };
}

export default createHandler(fetch, typeof __LIF_GAMES_HTML__ === 'string' ? {
  html: __LIF_GAMES_HTML__, rsc: __LIF_GAMES_RSC__,
} : null);
