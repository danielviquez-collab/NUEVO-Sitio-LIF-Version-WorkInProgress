import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'));
async function files(dir) {
  const result = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) result.push(...await files(path));
    else if (item.isFile()) result.push(path);
    else throw new Error('No se permiten enlaces de archivos en el paquete.');
  }
  return result;
}
const expected = new Set(manifest.files.map(file => file.path));
for (const file of manifest.files) {
  assert.ok(!file.path.includes('..') && !file.path.startsWith('/'));
  const content = await readFile(join(root, file.path));
  assert.equal(content.length, file.bytes, `Tamano incorrecto: ${file.path}`);
  assert.equal(createHash('sha256').update(content).digest('hex'), file.sha256, `Archivo modificado: ${file.path}`);
}
for (const path of [...await files(join(root, 'public')), ...await files(join(root, 'functions'))]) {
  const name = relative(root, path);
  assert.ok(expected.has(name), `Archivo no previsto: ${name}`);
  assert.ok(!/(^|\/)\.env|\.sqlite|\.map$|\.gs$/.test(name), `Archivo privado no permitido: ${name}`);
}
assert.deepEqual((await readdir(join(root, 'functions'))).sort(), ['lif-api.mjs', 'lif-ranking-page.mjs', 'lif-sync.mjs']);
const sync = await import('./functions/lif-sync.mjs');
assert.equal(sync.config.schedule, '*/5 * * * *');
console.log(`Paquete integro: ${manifest.files.length} archivos verificados. Listo para actualizar con sus funciones.`);
