import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { parse } from 'parse5';

const root = 'dist/client';
const hosting = JSON.parse(await readFile('dist/.openai/hosting.json', 'utf8'));
assert.equal(hosting.project_id, 'appgprj_6a99761be3608191b3fbfdef4a5777dd');
assert.equal(hosting.static, undefined, 'Sites requiere worker para ranking y API');
function all(node, predicate) {
  return [...(predicate(node) ? [node] : []), ...(node.childNodes ?? []).flatMap(child => all(child, predicate))];
}
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const main = parse(await readFile(join(root, 'confesiones.html'), 'utf8'));
assert.equal(all(main, node => attr(node, 'class') === 'confession-editorial').length, 1);
assert.equal(all(main, node => attr(node, 'class') === 'confession-community').length, 1);
assert.ok(all(main, node => node.tagName === 'video' && attr(node, 'src') === '/campaign/renzo-lif.mp4').length);
for (const route of ['index', 'confesiones', 'confesiones/todas', 'recetario', 'sabores',
  'confesiones/andres-todo-bajo-control', 'confesiones/sofia-la-compra-responsable',
  'confesiones/diego-dijo-que-si', 'confesiones/valeria-la-ceo-de-la-quincena']) {
  const document = parse(await readFile(join(root, `${route}.html`), 'utf8'));
  assert.equal(all(document, node => attr(node, 'class') === 'section-in-progress').length, 0, route);
  assert.ok(all(document, node => node.tagName === 'meta' && attr(node, 'name') === 'author' && attr(node, 'content') === 'Daniel Víquez Azofeifa').length, route);
}
const games = await readFile('dist/.templates/juega.html', 'utf8');
assert.match(games, /__LIF_REQUEST_RANKING__/);
assert.match(games, /data-lif-ranking="rows"/);
assert.match(games, /data-lif-ranking="podium"/);
assert.equal((games.match(/data-position="/g) || []).length, 0, 'Ranking se obtiene al servir');
for (const file of ['juega.html', 'juega.rsc', 'prueba-logo.html', 'pruebas', 'audio/intro-proposals'])
  assert.equal(await stat(join(root, file)).then(() => true).catch(() => false), false, file);
const worker = await import(new URL('../dist/server/index.js', import.meta.url));
assert.equal(typeof worker.default.fetch, 'function');
assert.doesNotMatch(await readFile('dist/server/index.js', 'utf8'), /from ["']node:/);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
let count = 0;
async function verifyAssets(path = '') {
  for (const item of await readdir(join('public', path), { withFileTypes: true })) {
    const name = join(path, item.name);
    if (item.isDirectory()) await verifyAssets(name);
    else {
      assert.equal(hash(await readFile(join('public', name))), hash(await readFile(join(root, name))), `Asset changed: ${name}`);
      count++;
    }
  }
}
await verifyAssets();
console.log(JSON.stringify({ fullConfessions: true, workerReady: true, identicalAssets: count, experimentsExcluded: true }));
