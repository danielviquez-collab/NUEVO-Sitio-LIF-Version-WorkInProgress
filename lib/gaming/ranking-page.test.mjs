import test from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
import {
  INITIAL_RANKING_SLOT,
  publicRanking,
  requestPublicRanking,
} from './initial-ranking.ts';
import {
  seedRankingHtml,
  seedRankingPayload,
  rankingPageResponse,
} from './ranking-page.ts';
import { previewLeaderboard } from './leaderboard-preview.ts';

const payload = `1:${JSON.stringify(['$', '$L11', null, { initialRanking: INITIAL_RANKING_SLOT }])}\n`;
const source = `<!DOCTYPE html><html><head><title>LIF</title></head><body><div data-lif-ranking-state aria-busy="true"><table><tbody data-lif-ranking="rows"><tr><td>Cargando ranking</td></tr></tbody></table></div><div data-lif-ranking-state aria-busy="true"><ol data-lif-ranking="podium"></ol></div><script>self.rsc.push(${JSON.stringify(payload)})</script></body></html>`;
const rank = previewLeaderboard({
  top: [{ position: 1, nickname: 'ClienteActual', game: 'snake', score: 5050 }],
  position: null,
  best: 0,
  total: 1,
  period: 'campaign',
});
const nodes = (root, predicate) =>
  [
    predicate(root) ? root : null,
    ...('childNodes' in root
      ? root.childNodes.flatMap((child) => nodes(child, predicate))
      : []),
  ].filter(Boolean);

test('The first HTML includes actual rows and podium, never the reference-only version', () => {
  const html = seedRankingHtml(source, rank);
  const document = parse(html);
  const rows = nodes(document, (n) =>
    n.attrs?.some((a) => a.name === 'data-position'),
  );
  assert.equal(rows.length, 20);
  assert.match(html, /ClienteActual/);
  assert.doesNotMatch(
    html,
    /NicoBonus|Cargando ranking|__LIF_REQUEST_RANKING__/,
  );
  const names = nodes(document, (n) =>
    n.attrs?.some((a) => a.name === 'data-nickname'),
  );
  assert.equal(names.length, 3);
  assert.equal(
    names[0].attrs.find((a) => a.name === 'data-nickname').value,
    'ClienteActual',
  );
  assert.equal(
    nodes(document, (n) =>
      n.attrs?.some((a) => a.name === 'aria-busy' && a.value === 'true'),
    ).length,
    0,
  );
  assert.match(html, /game-podium-score-figure[^>]*>0</);
});

test('HTML hydration and direct navigation payload receive the same snapshot', () => {
  const document = parse(seedRankingHtml(source, rank));
  const script = nodes(document, (n) => n.tagName === 'script')[0].childNodes[0]
    .value;
  const encoded = JSON.parse(script.slice('self.rsc.push('.length, -1));
  assert.equal(encoded, seedRankingPayload(payload, rank));
  assert.deepEqual(JSON.parse(encoded.slice(2))[3].initialRanking, rank);
});

test('Names cannot close script tags or add HTML and Flight dollar strings remain strings', () => {
  const unsafe = structuredClone(rank);
  unsafe.top[0].nickname = '$L11</script><img src=x onerror=evil()>&"';
  const html = seedRankingHtml(source, unsafe);
  const document = parse(html);
  assert.equal(nodes(document, (n) => n.tagName === 'script').length, 1);
  assert.equal(nodes(document, (n) => n.tagName === 'img').length, 0);
  const encoded = seedRankingPayload(payload, unsafe);
  assert.equal(
    JSON.parse(encoded.slice(2))[3].initialRanking.top[0].nickname,
    '$' + unsafe.top[0].nickname,
  );
});

test('A failed connection never restores initial fictional rows', async () => {
  const html = seedRankingHtml(source, null);
  assert.doesNotMatch(html, /Jess|ClienteActual|__LIF_REQUEST_RANKING__/);
  assert.match(html, /Cargando ranking/);
  assert.deepEqual(
    JSON.parse(seedRankingPayload(payload, null).slice(2))[3].initialRanking,
    null,
  );
  assert.equal(
    await requestPublicRanking('https://lif.example', async () => {
      throw new Error('offline');
    }),
    null,
  );
  assert.equal(
    await requestPublicRanking(
      'https://lif.example',
      async () => new Response('<html>'),
    ),
    null,
  );
});

test('Public snapshots are validated and exclude identity or registration information', async () => {
  assert.equal(
    publicRanking({ ...rank, top: [{ ...rank.top[0], position: 2 }] }),
    null,
  );
  assert.equal(
    publicRanking({ ...rank, top: [{ ...rank.top[0], score: -1 }] }),
    null,
  );
  assert.equal(publicRanking({ ...rank, total: 0 }), null);
  const actual = await requestPublicRanking(
    'https://lif.example',
    async (url, options) => {
      assert.equal(String(url), 'https://lif.example/api/games/ranking');
      assert.equal(options.cache, 'no-store');
      assert.equal(options.headers, undefined);
      return Response.json({
        ...rank,
        position: 1,
        best: 5050,
        email: 'private@example.test',
      });
    },
  );
  assert.deepEqual(actual, rank);
});

test('Every rendered page opts out of caches and supports HEAD and RSC', async () => {
  for (const kind of ['html', 'rsc']) {
    const response = rankingPageResponse(
      kind === 'html' ? source : payload,
      kind,
      rank,
    );
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('Netlify-CDN-Cache-Control'), 'no-store');
    assert.match(await response.text(), /ClienteActual/);
    assert.equal(
      await rankingPageResponse(source, kind, rank, true).text(),
      '',
    );
  }
});
