import assert from 'node:assert/strict';
import { cp, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { productionAllowed } from './release-policy.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
const output = join(project, '..', 'repositorios-github-2026-10-13');
const variants = [
  { name: 'NUEVO-Sitio-LIF-Version-Netlify', title: 'NUEVO Sitio LIF - Version Netlify', blocked: true,
    package: 'LIF-LAICA-NETLIFY-V2-20261013', origin: 'https://lifnewsitev1.netlify.app' },
  { name: 'NUEVO-Sitio-LIF-Version-Completa', title: 'NUEVO Sitio LIF Versi\u00f3n Completa', blocked: false,
    package: 'LIF-LAICA-NUEVOSITIOWEB-V2', origin: 'https://lifnewsitev1.danielviquez19.chatgpt.site' },
];
const directories = ['app', 'components', 'hooks', 'lib', 'public', 'netlify', 'integrations', 'scripts', 'worker'];
const rootFiles = ['AGENTS.md', 'package.json', 'package-lock.json', 'vite.config.ts', 'next.config.ts',
  'tsconfig.json', 'components.json', '.gitignore', '.oxfmtrc.json', '.oxlintrc.json'];
const hash = data => createHash('sha256').update(data).digest('hex');
async function files(root) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else { assert.ok(entry.isFile(), 'No incluir symlinks'); result.push(path); }
  }
  return result;
}
const report = [];
for (const variant of variants) {
  const root = join(output, variant.name);
  assert.equal(await stat(root).then(() => true).catch(() => false), false, `No sobrescribir: ${root}`);
  await mkdir(root, { recursive: true });
  for (const entry of [...directories, ...rootFiles]) {
    const source = join(project, entry);
    if (!(await stat(source).catch(() => null))) continue;
    await cp(source, join(root, entry), { recursive: true, filter: path => {
      const name = relative(project, path);
      return productionAllowed(name) && !(variant.blocked && /^(?:public\/campaign\/comunidad(?:\/|$)|public\/campaign\/renzo-lif(?:-poster\.webp|\.mp4)$)/.test(name));
    } });
  }
  const packaged = join(project, 'outputs', variant.package);
  for (const dir of ['public', 'functions'])
    await cp(join(packaged, dir), join(root, 'deploy', dir), { recursive: true });
  await cp(join(packaged, 'netlify.toml'), join(root, 'deploy/netlify.toml'));
  await cp(join(packaged, 'manifest.json'), join(root, 'deploy/manifest-original.json'));
  await cp(join(packaged, 'ESTADO-PAQUETE.md'), join(root, 'deploy/ESTADO-ORIGINAL.md'));
  const configuration = await readFile(join(packaged, 'netlify.toml'), 'utf8');
  await writeFile(join(root, 'netlify.toml'), configuration
    .replace('publish = "public"', 'command = ""\n  publish = "deploy/public"')
    .replace('directory = "functions"', 'directory = "deploy/functions"'));
  await mkdir(join(root, 'docs'), { recursive: true });
  for (const [from, to] of [['README.md', 'ARQUITECTURA.md'], ['PUBLICACION.md', 'PUBLICACION.md']])
    await cp(join(project, from), join(root, 'docs', to));
  await writeFile(join(root, '.gitignore'), (await readFile(join(root, '.gitignore'), 'utf8')) +
    '\n# Private hosting state\n/.openai/\n/.npm-cache/\n!.env.example\n');

  const endpointValues = new Set();
  for (const file of await files(join(root, 'deploy/public'))) {
    if (!/\.(?:js|html|rsc)$/.test(file)) continue;
    for (const value of (await readFile(file, 'utf8')).matchAll(/https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/g))
      endpointValues.add(value[0]);
  }
  assert.equal(endpointValues.size, 1, 'El formulario requiere el endpoint publico publicado');
  await writeFile(join(root, '.env.example'), [
    '# Public build configuration; never commit .env.local.',
    `LIF_BLOCK_CONFESSIONS_CONTENT=${variant.blocked}`, 'LIF_CLIENT_PREVIEW=true', 'LIF_LOCAL_GAME_TESTING=0',
    `NEXT_PUBLIC_CONFESSIONS_ENDPOINT=${[...endpointValues][0]}`, '',
    '# Set private server values in the destination environment, not Git.',
    'LIF_GAME_STORAGE=postgres', 'LIF_DATABASE_HOST=', 'LIF_DATABASE_USER=', 'LIF_DATABASE_PASSWORD=',
    'LIF_SHEETS_ENDPOINT=', 'LIF_SHEETS_SYNC_KEY=', '',
  ].join('\n'));
  await writeFile(join(root, 'README.md'), [
    `# ${variant.title}`, '', '**Desarrollo: Daniel V\u00edquez Azofeifa para LAICA 2026.**', '',
    '## Esta version', '', `Fuente y distribucion del 13 de octubre de 2026. Referencia publicada: ${variant.origin}`, '',
    variant.blocked ? '- Renzo, comunidad, ver todas e historias mantienen el aviso de construccion. Hero y formulario siguen activos. Los videos ocultos no se distribuyen.' : '- Todas las secciones publicas completas, incluido Renzo, comunidad e historias de Confesiones.',
    '- Trece reversos render, ficha nutricional negra, frentes/PDF/valores y tiempos aprobados conservados.',
    '- Memoria, Snake, ranking comun Top 20, tres intentos diarios y registros independientes.',
    '- Sin paginas experimentales, intentos ilimitados ni datos personales de participantes.',
    '- No incluye contrasenas, llaveros, cookies, base de datos, tokens ni dependencias instaladas.', '',
    '## Estructura y documentacion', '',
    '- `app/`, `components/`, `hooks/`, `lib/`: codigo fuente de la experiencia.',
    '- `public/`: productos, audio, video, fuentes y PDF.',
    '- `netlify/functions/`, `integrations/`: backend y reportes; secretos configurados por entorno.',
    '- `deploy/public/` y `deploy/functions/`: distribucion compilada conservada de la entrega aprobada.',
    '- `docs/ARQUITECTURA.md`: guia detallada de paginas, componentes, datos, reglas, animacion y mantenimiento.',
    '- `docs/PUBLICACION.md`: despliegues y verificaciones confirmados.', '',
    '## Desarrollo', '',
    'Node.js >=22.13. Instalar dependencias con `npm ci`; iniciar con `npm run dev`.',
    'La configuracion publica de compilacion esta en `.env.example`. Los valores privados se definen en el entorno local o de alojamiento; nunca se suben al repositorio.',
    'Sin credenciales propias del servidor, los juegos/contacto no pueden guardar datos.',
    'El formulario de Confesiones conserva su endpoint publico de Apps Script; no realizar envios de QA a ese servicio.', '',
    '## Instalacion en Netlify', '',
    '`netlify.toml` en la raiz instala la distribucion compilada de `deploy/`, sin recompilar.',
    'Configurar los valores privados existentes en Production/Functions. Git no contiene una copia de Supabase ni sustituye sus backups.',
    'Para una instalacion manual, usar Netlify CLI desde `deploy/`: `netlify deploy --dir=public --functions=functions --no-build`. Solo agregar `--prod` con autorizacion para publicar.',
    'No arrastrar solamente public/: eso omite las funciones de API, ranking inicial y sincronizacion de Sheets.', '',
    '## Actualizaciones', '',
    'Cada cambio debe actualizar este README y `docs/ARQUITECTURA.md`, pasar las verificaciones y regenerar la distribucion antes de publicarse.',
    'El codigo no modifica los registros existentes ni ejecuta migraciones por compilar.',
    'La guia tecnica identifica diferencias entre local, Netlify y Sites. Esta copia reproduce solo la variante indicada arriba.',
    'La distribucion `deploy/` es una captura aprobada, no se actualiza por editar archivos fuente.',
    'No publicar pruebas ni modificar fuentes, colores, recursos o tiempos sin aprobacion.', '',
    '## Limites verificados', '',
    'Los enlaces publicados pasaron paginas, ranking inicial, recursos, cinco pantallas y 35 escenarios de sobres por plataforma sin envios reales.',
    'Safari/iPhone fisico y pruebas de carga permanecen pendientes. Sheets es un reporte asincrono, no un backup completo.',
    'Acceso a GitHub pendiente de confirmar con la cuenta propietaria `danielviquez-collab`; preparar esta copia no renombra ni publica un repositorio.', '',
  ].join('\n'));
  const inventory = [];
  for (const path of await files(root)) {
    const name = relative(root, path), content = await readFile(path);
    assert.ok(!/(?:^|\/)\.env(?:\.|$)/.test(name) || name === '.env.example', `Archivo privado: ${name}`);
    assert.ok(!/\.(?:sqlite|pem|log)$/.test(name));
    assert.ok(content.length < 100 * 1024 * 1024, `Archivo demasiado grande para Git: ${name}`);
    assert.ok(!/(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(content.toString('utf8')), `Credencial detectada: ${name}`);
    if (name.startsWith('deploy/public/') || name.startsWith('deploy/functions/')) {
      const original = name.replace(/^deploy\//, '');
      assert.equal(hash(content), hash(await readFile(join(packaged, original))), original);
    }
    inventory.push({ path: name, bytes: content.length, sha256: hash(content) });
  }
  await writeFile(join(root, 'PUBLICATION-SNAPSHOT.json'), JSON.stringify({
    date: '2026-10-13', owner: 'danielviquez-collab', variant: variant.name, blockedConfessions: variant.blocked,
    sourcePackage: variant.package, referenceUrl: variant.origin, uploaded: false, files: inventory,
  }, null, 2) + '\n');
  report.push({ directory: root, variant: variant.name, blockedConfessions: variant.blocked, files: inventory.length, uploaded: false });
}
console.log(JSON.stringify(report));
