import { build } from 'vite';
import { mkdir, readdir, rm, readFile } from 'node:fs/promises';
import { builtinModules } from 'node:module';
import { resolve } from 'node:path';

const output = resolve('dist/netlify-functions');
await mkdir(output, { recursive: true });
for (const file of await readdir(output))
  await rm(resolve(output, file), { recursive: true });
const names = ['lif-api', 'lif-sync', 'lif-ranking-page'];
if (process.env.LIF_INCLUDE_MIGRATION === 'true') names.push('lif-migrate');
for (const name of names) {
  await build({
    configFile: false,
    publicDir: false,
    ssr: { noExternal: true },
    define:
      name === 'lif-ranking-page'
        ? {
            __LIF_GAMES_HTML__: JSON.stringify(
              await readFile('dist/client/juega.html', 'utf8'),
            ),
            __LIF_GAMES_RSC__: JSON.stringify(
              await readFile('dist/client/juega.rsc', 'utf8'),
            ),
            'process.env.NODE_ENV': JSON.stringify('production'),
          }
        : {},
    build: {
      target: 'node22',
      ssr: `netlify/functions/${name}.ts`,
      outDir: output,
      emptyOutDir: false,
      sourcemap: false,
      rolldownOptions: {
        external: [
          ...builtinModules,
          ...builtinModules.map((module) => `node:${module}`),
        ],
        output: { entryFileNames: `${name}.mjs`, codeSplitting: false },
      },
    },
  });
}
