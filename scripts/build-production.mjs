import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { parseEnv } from 'node:util';

const configuration = parseEnv(await readFile('.env.example', 'utf8'));
const env = { ...process.env, NODE_ENV: 'production',
  LIF_BLOCK_CONFESSIONS_CONTENT: configuration.LIF_BLOCK_CONFESSIONS_CONTENT,
  LIF_CLIENT_PREVIEW: 'true', LIF_LOCAL_GAME_TESTING: '0', LIF_INCLUDE_MIGRATION: 'false',
  NEXT_PUBLIC_CONFESSIONS_ENDPOINT: process.env.NEXT_PUBLIC_CONFESSIONS_ENDPOINT || configuration.NEXT_PUBLIC_CONFESSIONS_ENDPOINT };
for (const key of Object.keys(env)) if (/PASSWORD|SYNC_KEY|TOKEN|KEYCHAIN/.test(key)) delete env[key];
for (const args of [['node_modules/vinext/dist/cli.js', 'build'],
  ['--experimental-strip-types', 'scripts/finalize-static.mjs'], ['scripts/build-netlify-functions.mjs']]) {
  const result = spawnSync(process.execPath, args, { env, stdio: 'inherit' });
  assert.equal(result.status, 0, 'Production build failed');
}
