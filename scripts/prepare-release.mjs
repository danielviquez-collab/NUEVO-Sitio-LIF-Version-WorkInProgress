import assert from 'node:assert/strict';
import { cp, mkdir, readFile, rm, stat, symlink, writeFile, chmod } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parseEnv } from 'node:util';
import { productionAllowed, sourceAllowed } from './release-policy.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
const name = process.argv[2];
assert.match(name ?? '', /^LIF-LAICA-[A-Za-z0-9-]+$/);
const release = join(project, 'outputs', name);
const buildRoot = join(project, 'work', name);
const resume = process.argv.includes('--resume');
for (const path of [release, buildRoot]) {
  const exists = await stat(path).then(() => true).catch(error => {
    if (error.code !== 'ENOENT') throw error; return false;
  });
  assert.ok(!exists || resume, `No sobrescribir una entrega existente: ${path}`);
}
assert.equal(await stat(join(release, 'manifest.json')).then(() => true).catch(() => false), false, 'Entrega finalizada; no modificar');
await mkdir(release, { recursive: true });
await mkdir(buildRoot, { recursive: true });
const directories = ['app', 'components', 'hooks', 'lib', 'public', 'netlify', 'integrations', 'scripts', 'worker'];
const rootFiles = ['README.md', 'AGENTS.md', 'ENTREGA.md', 'PUBLICACION.md', 'package.json', 'package-lock.json',
  'vite.config.ts', 'next.config.ts', 'tsconfig.json', 'components.json', '.gitignore', '.oxfmtrc.json', '.oxlintrc.json', 'netlify.toml'];
async function copySource(destination, allowed) {
  await mkdir(destination, { recursive: true });
  for (const name of [...directories, ...rootFiles]) {
    const source = join(project, name);
    if (!(await stat(source).catch(() => null))) continue;
    await cp(source, join(destination, name), { recursive: true,
      filter: path => allowed(relative(project, path)) });
  }
}
const source = join(release, 'fuente');
await copySource(source, sourceAllowed);
const privateEnv = await readFile(join(project, '.env.local'), 'utf8').then(parseEnv).catch(error => {
  if (error.code !== 'ENOENT') throw error; return {};
});
const endpoint = privateEnv.NEXT_PUBLIC_CONFESSIONS_ENDPOINT || process.env.NEXT_PUBLIC_CONFESSIONS_ENDPOINT;
assert.ok(endpoint?.startsWith('https://script.google.com/macros/s/'), 'Falta endpoint publico de Confesiones');
const env = { ...process.env, NODE_ENV: 'production', LIF_CLIENT_PREVIEW: 'true', NEXT_PUBLIC_CONFESSIONS_ENDPOINT: endpoint };
delete env.LIF_INCLUDE_MIGRATION;
for (const key of Object.keys(env)) if (/PASSWORD|SYNC_KEY|TOKEN|KEYCHAIN/.test(key)) delete env[key];
function run(cwd, args, extra = {}) {
  const result = spawnSync(process.execPath, args, { cwd, env: { ...env, ...extra }, stdio: 'inherit' });
  assert.equal(result.status, 0, `Fallo: ${args.join(' ')}`);
}
for (const variant of ['netlify', 'sites']) {
  const stage = join(buildRoot, variant);
  await copySource(stage, productionAllowed);
  if (!(await stat(join(stage, 'node_modules')).catch(() => null)))
    await symlink(join(project, 'node_modules'), join(stage, 'node_modules'), 'dir');
  await mkdir(join(stage, '.openai'), { recursive: true });
  await writeFile(join(stage, '.openai/hosting.json'), JSON.stringify({
    project_id: 'appgprj_6a99761be3608191b3fbfdef4a5777dd', d1: null, r2: null,
    ...(variant === 'netlify' ? { static: { directory: 'dist/client' } } : {}),
  }, null, 2) + '\n');
  const blocked = variant === 'netlify';
  if (blocked) {
    run(stage, ['node_modules/vinext/dist/cli.js', 'build'], { LIF_BLOCK_CONFESSIONS_CONTENT: 'true' });
    run(stage, ['--experimental-strip-types', 'scripts/finalize-static.mjs'], { LIF_BLOCK_CONFESSIONS_CONTENT: 'true' });
    run(stage, ['scripts/build-netlify-functions.mjs']);
    await rm(join(stage, 'dist/client/campaign/comunidad'), { recursive: true, force: true });
    for (const media of ['renzo-lif.mp4', 'renzo-lif-poster.webp'])
      await rm(join(stage, 'dist/client/campaign', media), { force: true });
  } else run(stage, ['scripts/build-sites.mjs'], { LIF_BLOCK_CONFESSIONS_CONTENT: 'false' });
  const check = spawnSync('python3', ['scripts/verify-export.py'], { cwd: stage, stdio: 'inherit' });
  assert.equal(check.status, 0, `Recursos incompletos: ${variant}`);
  const output = join(release, variant);
  await mkdir(output, { recursive: true });
  await cp(join(stage, 'dist/client'), join(output, blocked ? 'public' : 'client'), { recursive: true });
  if (blocked) {
    await cp(join(stage, 'dist/netlify-functions'), join(output, 'functions'), { recursive: true });
    for (const [from, to] of [['package.toml', 'netlify.toml'], ['LEEME.md', 'LEEME.md'],
      ['verificar-paquete.mjs', 'verificar-paquete.mjs'], ['Actualizar Netlify.command', 'Actualizar Netlify.command']])
      await cp(join(project, 'integrations/netlify', from), join(output, to));
    await chmod(join(output, 'Actualizar Netlify.command'), 0o755);
  } else {
    await cp(join(stage, 'dist/server'), join(output, 'server'), { recursive: true });
    await writeFile(join(output, 'LEEME.md'), '# LIF - Sites preparado\n\nDesarrollo: Daniel Víquez Azofeifa para LAICA 2026.\n\nContenido completo. Publicacion pendiente por indicacion de Daniel.\nEl worker sirve ranking inicial actualizado y API mediante Netlify/Supabase.\nNo publicar solo client/: se perderia el servicio y la carga inicial.\nEl manifiesto de plataforma se restaura con la cuenta propietaria al publicar.\nNo incluye credenciales ni paginas experimentales. Consultar ../README.md.\n');
  }
  const html = await readFile(join(output, blocked ? 'public/confesiones.html' : 'client/confesiones.html'), 'utf8');
  assert.equal(html.includes('class="section-in-progress"'), blocked, 'Politica Confesiones incorrecta');
  assert.equal(html.includes('src="/campaign/renzo-lif.mp4"'), !blocked, 'Contenido Renzo incorrecto');
  for (const path of ['pruebas', 'prueba-logo.html', 'audio/intro-proposals'])
    assert.equal(await stat(join(output, blocked ? 'public' : 'client', path)).then(() => true).catch(() => false), false);
}
await cp(join(project, 'README.md'), join(release, 'README.md'));
console.log(JSON.stringify({ release, prepared: ['netlify', 'sites'], sitesPublished: false }));
