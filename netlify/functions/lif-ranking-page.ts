import { createNetlifyApi } from '../../lib/gaming/netlify-api.ts';
import { dependencies } from './connection.ts';
import { requestPublicRanking } from '../../lib/gaming/initial-ranking.ts';
import { rankingPageResponse } from '../../lib/gaming/ranking-page.ts';

declare const __LIF_GAMES_HTML__: string;
declare const __LIF_GAMES_RSC__: string;

export default async function rankingPage(request: Request) {
  if (!['GET', 'HEAD'].includes(request.method))
    return new Response(null, { status: 405 });
  const url = new URL(request.url);
  const kind =
    url.pathname.endsWith('.rsc') || url.searchParams.get('format') === 'rsc'
      ? 'rsc'
      : 'html';
  let ranking = null;
  try {
    const api = createNetlifyApi(dependencies());
    ranking = await requestPublicRanking(url.origin, (input, init) =>
      api(new Request(input, init)),
    );
  } catch {
    /* A service failure must not resurrect the old reference-only ranking. */
  }
  return rankingPageResponse(
    kind === 'rsc' ? __LIF_GAMES_RSC__ : __LIF_GAMES_HTML__,
    kind,
    ranking,
    request.method === 'HEAD',
  );
}
