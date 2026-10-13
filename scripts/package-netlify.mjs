import { cp, mkdir, readdir, readFile, writeFile, chmod, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseEnv } from 'node:util';
import assert from 'node:assert/strict';

const name = process.argv[2] ?? 'LIF-Netlify-2026-10-07';
assert.match(name, /^LIF-(?:Netlify|LAICA)-[A-Za-z0-9-]+$/);
const output = resolve('outputs');
const root = join(output, name);
await mkdir(output, { recursive: true });
try { await stat(root); throw new Error('El paquete ya existe; no se sobreescribe.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(root);
await cp('dist/client', join(root, 'public'), { recursive: true });
await cp('dist/netlify-functions', join(root, 'functions'), { recursive: true });
await cp('integrations/netlify/LEEME.md', join(root, 'LEEME.md'));
await cp('integrations/netlify/package.toml', join(root, 'netlify.toml'));
await cp('integrations/netlify/Actualizar Netlify.command', join(root, 'Actualizar Netlify.command'));
await cp('integrations/netlify/verificar-paquete.mjs', join(root, 'verificar-paquete.mjs'));
await cp('README.md', join(root, 'README.md'));
if (await stat('ESTADO-PAQUETE.md').catch(() => null))
  await cp('ESTADO-PAQUETE.md', join(root, 'ESTADO-PAQUETE.md'));
await chmod(join(root, 'Actualizar Netlify.command'), 0o755);
const env = await readFile('.env.local', 'utf8').then(parseEnv).catch(error => {
  if (error.code !== 'ENOENT') throw error;
  return {};
});
const secrets = Object.entries(env).filter(([key, value]) => /PASSWORD|SYNC_KEY|TOKEN/.test(key) && value.length >= 16).map(([, value]) => value);
async function files(dir) {
  const result = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) result.push(...await files(path));
    else if (item.isFile()) result.push(path);
    else throw new Error('Symlinks are not allowed');
  }
  return result;
}
const manifest = [];
for (const path of (await files(root)).sort()) {
  const content = await readFile(path);
  const name = relative(root, path);
  for (const secret of secrets) assert.ok(!content.includes(Buffer.from(secret)), `Private key found in ${name}`);
  assert.ok(!/(^|\/)\.env|\.sqlite|\.gs$/.test(name), `Private file found: ${name}`);
  manifest.push({ path: name, bytes: content.length, sha256: createHash('sha256').update(content).digest('hex') });
}
await writeFile(join(root, 'manifest.json'), JSON.stringify({ version: 1, builtFor: 'Netlify', files: manifest }, null, 2) + '\n');
const verify = spawnSync(process.execPath, ['verificar-paquete.mjs'], { cwd: root, stdio: 'inherit' });
assert.equal(verify.status, 0);
const zip = join(output, `${name}.zip`);
const archive = spawnSync('/usr/bin/zip', ['-q', '-r', zip, name], { cwd: output, stdio: 'inherit' });
assert.equal(archive.status, 0);
const check = spawnSync('/usr/bin/unzip', ['-tq', zip], { stdio: 'inherit' });
assert.equal(check.status, 0);
console.log(JSON.stringify({ package: zip, files: manifest.length, zipBytes: (await stat(zip)).size, privateConfigurationExcluded: true }));
