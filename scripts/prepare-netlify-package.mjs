import assert from 'node:assert/strict';
import { cp, mkdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parseEnv } from 'node:util';
import { productionAllowed } from './release-policy.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
const name = process.argv[2] ?? 'LIF-LAICA-NUEVOSITIOWEB-V2';
assert.match(name, /^LIF-LAICA-[A-Za-z0-9-]+$/);
const stage = join(project, 'work', `${name}-build`);
const packageRoot = join(stage, 'outputs', name);
const delivered = join(project, 'outputs', name);
const archive = `${delivered}.zip`;
const resume = process.argv.includes('--resume');
const blockedConfessions = process.argv.includes('--blocked-confessions');
for (const path of [stage, delivered, archive]) {
  const exists = await stat(path).then(() => true).catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return false;
  });
  assert.ok(!exists || path === stage && resume, `No se reemplaza un paquete existente: ${path}`);
}
assert.equal(await stat(join(packageRoot, 'manifest.json')).then(() => true).catch(() => false), false, 'Paquete finalizado; no reemplazar');
await mkdir(stage, { recursive: true });
const directories = ['app', 'components', 'hooks', 'lib', 'public', 'netlify', 'integrations', 'scripts'];
const rootFiles = ['README.md', 'AGENTS.md', 'package.json', 'package-lock.json', 'vite.config.ts',
  'next.config.ts', 'tsconfig.json', 'components.json', '.gitignore', '.oxfmtrc.json', '.oxlintrc.json', 'netlify.toml'];
for (const file of [...directories, ...rootFiles]) {
  const source = join(project, file);
  if (!(await stat(source).catch(() => null))) continue;
  await cp(source, join(stage, file), { recursive: true, filter: path => productionAllowed(relative(project, path)) });
}
if (!(await stat(join(stage, 'node_modules')).catch(() => null)))
  await symlink(join(project, 'node_modules'), join(stage, 'node_modules'), 'dir');
await mkdir(join(stage, '.openai'), { recursive: true });
await writeFile(join(stage, '.openai/hosting.json'), JSON.stringify({
  project_id: 'appgprj_6a99761be3608191b3fbfdef4a5777dd', static: { directory: 'dist/client' },
  d1: null, r2: null,
}) + '\n');

const privateEnv = await readFile(join(project, '.env.local'), 'utf8').then(parseEnv).catch(error => {
  if (error.code !== 'ENOENT') throw error;
  return {};
});
const endpoint = privateEnv.NEXT_PUBLIC_CONFESSIONS_ENDPOINT || process.env.NEXT_PUBLIC_CONFESSIONS_ENDPOINT;
assert.ok(endpoint?.startsWith('https://script.google.com/macros/s/'), 'Falta endpoint publico de Confesiones');
const env = { ...process.env, NODE_ENV: 'production', LIF_CLIENT_PREVIEW: 'true',
  LIF_BLOCK_CONFESSIONS_CONTENT: String(blockedConfessions), LIF_LOCAL_GAME_TESTING: '0',
  LIF_INCLUDE_MIGRATION: 'false', NEXT_PUBLIC_CONFESSIONS_ENDPOINT: endpoint };
for (const key of Object.keys(env)) if (/PASSWORD|SYNC_KEY|TOKEN|KEYCHAIN/.test(key)) delete env[key];
function run(command, args) {
  const result = spawnSync(command, args, { cwd: stage, env, stdio: 'inherit' });
  assert.equal(result.status, 0, `Fallo preparando paquete: ${args.join(' ')}`);
}
run(process.execPath, ['node_modules/vinext/dist/cli.js', 'build']);
run(process.execPath, ['--experimental-strip-types', 'scripts/finalize-static.mjs']);
run(process.execPath, ['scripts/build-netlify-functions.mjs']);
if (blockedConfessions) {
  await rm(join(stage, 'dist/client/campaign/comunidad'), { recursive: true, force: true });
  for (const media of ['renzo-lif.mp4', 'renzo-lif-poster.webp'])
    await rm(join(stage, 'dist/client/campaign', media), { force: true });
}
run(process.env.LIF_PYTHON_BIN || 'python3', ['scripts/verify-export.py']);

const publicRoot = join(stage, 'dist/client');
const html = await readFile(join(publicRoot, 'confesiones.html'), 'utf8');
assert.equal(html.includes('class="section-in-progress"'), blockedConfessions);
assert.equal(html.includes('confession-editorial') && html.includes('confession-community'), !blockedConfessions);
assert.equal(html.includes('src="/campaign/renzo-lif.mp4"'), !blockedConfessions);
const stories = await import('../lib/confession-stories.ts');
for (const story of stories.confessionStories) {
  const page = await readFile(join(publicRoot, `confesiones/${story.slug}.html`), 'utf8');
  assert.equal(page.includes('class="section-in-progress"'), blockedConfessions);
  if (!blockedConfessions) assert.ok(page.includes(story.alias));
}
for (const path of ['pruebas', 'prueba-logo.html', 'audio/intro-proposals'])
  assert.equal(await stat(join(publicRoot, path)).then(() => true).catch(() => false), false);

const { flavors } = await import('../lib/lif-content.ts');
const temporaryPhotos = flavors.some(flavor => flavor.back?.medium === 'photo');
await writeFile(join(stage, 'ESTADO-PAQUETE.md'), [
  `# ${name}`, '', 'Desarrollo: Daniel V\u00edquez Azofeifa para LAICA 2026.', '',
  'Preparado el 13 de octubre de 2026, Costa Rica. No publicado.', '',
  blockedConfessions ? '- Confesiones mantiene Renzo, comunidad e historias en construccion; hero y formulario activos. Videos bloqueados excluidos.' : '- Todas las secciones publicas completas, incluido Renzo e historias de Confesiones.',
  '- Franja negra y presentacion de etiqueta en informacion nutricional; transiciones intactas.',
  '- Trece reversos de sobres, frentes/PDF y datos nutricionales conservados.',
  temporaryPhotos ? '- Estado de imagenes: diez renders y tres fotos provisionales. Los nuevos renders adjuntos no estaban disponibles en disco al preparar este paquete; no se afirma su reemplazo.' : '- Los trece reversos utilizan renders suministrados.',
  '- Juegos, podio, ranking inicial, formularios, audios y menu actualizados como en la fuente local.',
  '- Solo se excluyen ayudas locales /pruebas, medios experimentales e intentos ilimitados, como se acordo.',
  '- Tres funciones Netlify completas, sin migraciones ni reinicio del historial.',
  '- Sin contrasenas, claves, .env, bases locales, caches ni dependencias instaladas.', '',
  'No instalar arrastrando solamente public/: eso no instala las funciones.',
  'Usar Actualizar Netlify.command o el comando indicado en LEEME.md, con sus variables existentes.', '',
].join('\n'));
run(process.execPath, ['scripts/package-netlify.mjs', name]);
await mkdir(join(project, 'outputs'), { recursive: true });
await cp(packageRoot, delivered, { recursive: true });
await cp(join(stage, 'outputs', `${name}.zip`), archive);
console.log(JSON.stringify({ archive, directory: delivered, completeConfessions: !blockedConfessions,
  temporaryPhotos, deployed: false, zipBytes: (await stat(archive)).size }));
