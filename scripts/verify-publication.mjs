import assert from 'node:assert/strict';
import { parse } from 'parse5';

const origin = process.argv[2];
const sites = process.argv[3] === '--sites';
assert.ok(process.argv[3] === undefined || sites, 'Usar --sites para contenido completo');
assert.equal(new URL(origin).protocol, 'https:');
async function get(path) {
  return fetch(new URL(path, origin), { cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(60000) });
}
function all(node, predicate) {
  return [...(predicate(node) ? [node] : []), ...('childNodes' in node ? node.childNodes.flatMap(child => all(child, predicate)) : [])];
}
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const text = node => 'value' in node ? node.value : (node.childNodes ?? []).map(text).join('');
const pages = ['/', '/sabores', '/recetario', '/confesiones', '/confesiones/todas',
  '/confesiones/andres-todo-bajo-control', '/confesiones/sofia-la-compra-responsable',
  '/confesiones/diego-dijo-que-si', '/confesiones/valeria-la-ceo-de-la-quincena'];
for (const path of pages) {
  const response = await get(path); assert.equal(response.status, 200, path);
  const document = parse(await response.text());
  assert.ok(all(document, node => node.tagName === 'meta' && attr(node, 'name') === 'author' && attr(node, 'content') === 'Daniel Víquez Azofeifa').length, `Autor ausente: ${path}`);
  assert.equal(all(document, node => node.tagName === 'meta' && ['generator', 'codex-preview'].includes(attr(node, 'name'))).length, 0);
  if (path.startsWith('/confesiones')) {
    assert.equal(all(document, node => attr(node, 'class') === 'section-in-progress').length, sites ? 0 : 1, path);
    assert.equal(all(document, node => attr(node, 'class') === 'confession-editorial').length, sites && path === '/confesiones' ? 1 : 0, path);
    if (sites && path === '/confesiones') {
      assert.equal(all(document, node => attr(node, 'class') === 'confession-community').length, 1);
      assert.ok(all(document, node => node.tagName === 'video' && attr(node, 'src') === '/campaign/renzo-lif.mp4').length);
      assert.ok(all(document, node => node.tagName === 'a' && attr(node, 'href') === '/confesiones/todas').length);
    }
  }
}
const excluded = ['/prueba-logo', '/pruebas/entrada', '/pruebas/entrada-cinematica', '/pruebas/menu',
  '/audio/intro-proposals/actual-refined.wav', ...(!sites ? ['/campaign/renzo-lif.mp4', '/campaign/comunidad/video-2.mp4'] : [])];
for (const path of excluded)
  assert.equal((await get(path)).status, 404, `No debe publicarse: ${path}`);
const response = await get('/api/games/ranking');
assert.equal(response.status, 200); assert.ok(response.headers.get('content-type')?.includes('application/json'));
const cookieNames = response.headers.getSetCookie().map(cookie => cookie.slice(0, cookie.indexOf('=')));
assert.deepEqual(sites ? cookieNames.filter(name => name !== '__cf_bm') : cookieNames, [],
  'Ranking no debe crear identidad de juego; Sites puede añadir su cookie de proteccion');
const ranking = await response.json(); assert.ok(Array.isArray(ranking.top)); assert.ok(ranking.top.length <= 20);
assert.ok(ranking.top.every(row => Object.keys(row).sort().join(',') === 'game,nickname,position,score'));
const page = await get('/juega'); assert.equal(page.status, 200); assert.equal(page.headers.get('cache-control'), 'no-store');
const document = parse(await page.text());
const rows = all(document, node => node.tagName === 'tr' && attr(node, 'data-position'));
assert.equal(rows.length, ranking.top.length);
for (const [index, row] of rows.entries()) {
  const cells = row.childNodes.filter(node => ['td', 'th'].includes(node.tagName));
  assert.equal(text(cells[1]).replace('(tú)', '').trim(), ranking.top[index].nickname);
  assert.equal(Number(text(cells[3]).replace(/\s/g, '')), ranking.top[index].score);
}
const flight = await get('/juega.rsc'); assert.equal(flight.status, 200);
assert.equal(flight.headers.get('cache-control'), 'no-store');
const payload = await flight.text(); assert.ok(!payload.includes('__LIF_REQUEST_RANKING__'));
for (const row of ranking.top) assert.ok(payload.includes(row.nickname), 'RSC debe incluir ranking inicial');
console.log(JSON.stringify({ origin, publicPages: pages.length, excludedPaths: excluded.length, fullConfessions: sites, rankingRows: rows.length,
  initialRankingMatches: true, htmlRscNoStore: true, creatorVerified: true, realSubmissions: 0 }));
