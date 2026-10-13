import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { flavors } from './lif-content.ts';

test('all 13 flavors use supplied renders, with no temporary photos remaining', () => {
  const files = readdirSync(new URL('../public/products/backs/', import.meta.url));
  assert.equal(files.length, 13);
  assert.equal(flavors.filter(flavor => flavor.back.medium === 'render').length, 13);
  assert.equal(flavors.filter(flavor => flavor.back.medium === 'photo').length, 0);
  for (const flavor of flavors) {
    assert.equal(flavor.back.kind, 'official');
    assert.equal(flavor.back.medium, 'render');
    assert.equal(flavor.back.image, `/products/backs/${flavor.slug}.webp`);
    const bytes = readFileSync(new URL(`../public${flavor.back.image}`, import.meta.url));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  }
});

test('the existing panel stays hidden over the original reverse until expansion', () => {
  const scene = readFileSync(new URL('./sachet-scene.ts', import.meta.url), 'utf8');
  assert.match(scene, /print\.style\.visibility = backImage && phase !== 'nutritionExpanding' \? 'hidden' : 'visible'/);
  assert.match(scene, /if \(!backImage\) Object\.assign\(reverse\.element\.style/);
  const css = readFileSync(new URL('../app/flavors.css', import.meta.url), 'utf8');
  assert.match(css, /\.sachet-back\[data-artwork='official'\][^{]*\{[^}]*background: transparent/);
});
