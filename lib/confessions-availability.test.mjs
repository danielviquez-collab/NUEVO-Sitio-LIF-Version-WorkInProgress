import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Confessions restrictions require an explicit publication flag on all entry points', () => {
  for (const path of ['app/confesiones/page.tsx', 'app/confesiones/todas/page.tsx', 'app/confesiones/[slug]/page.tsx']) {
    assert.match(read(path), /process\.env\.LIF_BLOCK_CONFESSIONS_CONTENT === 'true'/);
  }
  assert.match(read('components/confessions-content.tsx'), /storiesUnavailable = false/);
});

test('Only the editorial and community are replaced; the hero and form remain available', () => {
  const source = read('components/confessions-content.tsx');
  assert.ok(source.indexOf('className="confession-hero"') < source.indexOf('{storiesUnavailable ?'));
  assert.match(source, /storiesUnavailable \? <SectionInProgress \/> : <>[\s\S]*confession-editorial[\s\S]*<ConfessionCommunity \/>[\s\S]*<\/>\}/);
  assert.match(source, /\{formOpen && <ConfessionForm/);
});

test('The placeholder uses the existing approved artwork and exact approved message', () => {
  const source = read('components/section-in-progress.tsx');
  assert.match(source, /\/brand\/work-in-progress\.png/);
  assert.ok(source.includes('Por el momento esta sección se encuentra bajo diseño y construcción. Pura Vida 👍🏻!'));
});
