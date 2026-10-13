import { spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { build } from 'vite';

const result = spawnSync(process.execPath, ['node_modules/vinext/dist/cli.js', 'build'], {
  stdio: 'inherit', env: { ...process.env, LIF_BLOCK_CONFESSIONS_CONTENT: 'false' },
});
if (result.status !== 0) process.exit(result.status || 1);
const verify = spawnSync(process.execPath, ['--experimental-strip-types', 'scripts/finalize-static.mjs'], { stdio: 'inherit' });
if (verify.status !== 0) process.exit(verify.status || 1);
const html = await readFile('dist/client/juega.html', 'utf8');
const rsc = await readFile('dist/client/juega.rsc', 'utf8');
await build({
  configFile: false, publicDir: false, ssr: { noExternal: true },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    __LIF_GAMES_HTML__: JSON.stringify(html), __LIF_GAMES_RSC__: JSON.stringify(rsc),
  },
  build: {
    target: 'es2022', ssr: 'worker/index.mjs', outDir: 'dist/server', emptyOutDir: true,
    rolldownOptions: { output: { entryFileNames: 'index.js', codeSplitting: false } },
  },
});
// Keep game templates private so asset-first hosting cannot bypass the fresh ranking.
await mkdir('dist/.templates', { recursive: true });
await writeFile('dist/.templates/juega.html', html);
await writeFile('dist/.templates/juega.rsc', rsc);
await rm('dist/client/juega.html');
await rm('dist/client/juega.rsc');
