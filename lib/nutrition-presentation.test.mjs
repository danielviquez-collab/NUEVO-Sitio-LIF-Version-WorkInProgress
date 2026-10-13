import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('nutrition uses black label bars, not the former green table band', () => {
  const css = readFileSync(new URL('../app/flavors.css', import.meta.url), 'utf8');
  assert.match(css, /\.nutrition-table thead \{ background: #000; color: #fff/);
  assert.match(css, /\.nutrition-serving \{[^}]*border-top: 10px solid #000/);
  assert.doesNotMatch(css, /\.nutrition-table[^}]*var\(--green\)/);
});

test('all original animation phase names and durations stay unchanged', () => {
  const motion = readFileSync(new URL('./sachet-motion.ts', import.meta.url), 'utf8');
  assert.match(motion, /\['focusing', 360\], \['settling', 320\], \['turning', 580\], \['backVisible', 240\], \['nutritionExpanding', 620\]/);
});
