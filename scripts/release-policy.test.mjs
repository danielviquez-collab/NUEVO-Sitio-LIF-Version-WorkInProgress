import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceAllowed, productionAllowed } from './release-policy.mjs';

void test('handoff excludes private state, secrets and installed dependencies', () => {
  for (const path of ['.env.local', '.env.development.local', '.git/config', '.netlify/state.json',
    'node_modules/pg/index.js', 'work/test.json', 'foo.sqlite', 'scripts/macos/start-local.zsh'])
    assert.equal(sourceAllowed(path), false, path);
  for (const path of ['README.md', 'lib/gaming/server.ts', 'lib/gaming/versions/restored-v3/config.ts',
    'integrations/google-apps-script/Records.gs']) assert.equal(sourceAllowed(path), true, path);
});
void test('experiments remain in source but cannot become published pages or media', () => {
  for (const path of ['app/pruebas/menu/page.tsx', 'app/prueba-logo/page.tsx', 'public/audio/intro-proposals/actual-refined.wav']) {
    assert.equal(sourceAllowed(path), true); assert.equal(productionAllowed(path), false);
  }
  for (const path of ['app/juega/page.tsx', 'app/confesiones/page.tsx', 'public/audio/contact-send.wav'])
    assert.equal(productionAllowed(path), true);
});
