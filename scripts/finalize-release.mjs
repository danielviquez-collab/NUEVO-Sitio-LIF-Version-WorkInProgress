import assert from 'node:assert/strict';
import { cp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { parseEnv } from 'node:util';
import { sourceAllowed } from './release-policy.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
const name = process.argv[2];
assert.match(name ?? '', /^LIF-LAICA-[A-Za-z0-9-]+$/);
const root = join(project, 'outputs', name);
await stat(root);
// The publisher creates checkout-local caches; they are never delivery contents.
await rm(join(root, 'netlify', '.netlify'), { recursive: true, force: true });
for (const name of ['scripts', 'package.json', 'package-lock.json'])
  await cp(join(project, name), join(root, 'fuente', name), { recursive: true,
    filter: path => sourceAllowed(relative(project, path)) });
for (const file of ['README.md', 'PUBLICACION.md']) {
  await cp(join(project, file), join(root, file));
  await cp(join(project, file), join(root, 'fuente', file));
}
async function files(dir) {
  const result = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) result.push(...await files(path));
    else { assert.ok(item.isFile(), 'No se admiten symlinks'); result.push(path); }
  }
  return result;
}
const privateEnv = await readFile(join(project, '.env.local'), 'utf8').then(parseEnv).catch(error => {
  if (error.code !== 'ENOENT') throw error; return {};
});
const secrets = Object.entries(privateEnv).filter(([key, value]) => /PASSWORD|SYNC_KEY|TOKEN/.test(key) && value.length >= 16).map(([, value]) => value);
async function manifest(dir) {
  const entries = [];
  for (const path of (await files(dir)).sort()) {
    if (relative(dir, path) === 'manifest.json') continue;
    const name = relative(dir, path), bytes = await readFile(path);
    assert.ok(!/(^|\/)\.env|\.sqlite|\.pem$|\.DS_Store|(^|\/)(?:node_modules|\.git|\.netlify|\.openai)\//.test(name), `Archivo privado: ${name}`);
    for (const secret of secrets) assert.ok(!bytes.includes(Buffer.from(secret)), `Secreto en ${name}`);
    entries.push({ path: name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  await writeFile(join(dir, 'manifest.json'), JSON.stringify({
    version: 1, author: 'Daniel Víquez Azofeifa para LAICA 2026', files: entries,
  }, null, 2) + '\n');
  return entries.length;
}
await manifest(join(root, 'netlify'));
const check = spawnSync(process.execPath, ['verificar-paquete.mjs'], { cwd: join(root, 'netlify'), stdio: 'inherit' });
assert.equal(check.status, 0);
const count = await manifest(root);
const zip = join(project, 'outputs', `${name}.zip`);
assert.equal(await stat(zip).then(() => true).catch(() => false), false, 'ZIP existente; no sobrescribir');
assert.equal(spawnSync('/usr/bin/zip', ['-q', '-r', zip, name], { cwd: join(project, 'outputs'), stdio: 'inherit' }).status, 0);
assert.equal(spawnSync('/usr/bin/unzip', ['-tq', zip], { stdio: 'inherit' }).status, 0);
console.log(JSON.stringify({ zip, files: count, bytes: (await stat(zip)).size,
  sha256: createHash('sha256').update(await readFile(zip)).digest('hex'), secretsExcluded: true }));
