import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { centeredPackBounds, printedPanelBounds, paintedPackBounds, frameAdvance, sachetPhases } from './sachet-motion.ts';
import { flavors } from './lif-content.ts';

const viewports = [
  { left: 0, top: 0, width: 1440, height: 900 },
  { left: 0, top: 0, width: 820, height: 1180 },
  { left: 0, top: 48, width: 390, height: 700 },
  { left: 0, top: 0, width: 844, height: 390 },
  { left: 12, top: 18, width: 320, height: 480 },
];
test('object-fit bounds preserve original image ratio and centering', () => {
  assert.deepEqual(paintedPackBounds({ left: 10, top: 20, width: 200, height: 200 }, 100, 200),
    { left: 60, top: 20, width: 100, height: 200 });
});
test('every catalog position centers in the current visual viewport without distortion', () => {
  for (const viewport of viewports) for (const left of [0, 150, 650, 1000]) for (const top of [-200, 80, 400, 1000]) {
    const source = { left, top, width: 170, height: 190 };
    const target = centeredPackBounds(source, viewport);
    assert.ok(Math.abs(target.left + target.width / 2 - viewport.left - viewport.width / 2) < .001);
    assert.ok(Math.abs(target.top + target.height / 2 - viewport.top - viewport.height / 2) < .001);
    assert.ok(Math.abs(target.width / target.height - source.width / source.height) < .001);
    assert.ok(target.left >= viewport.left + 32 - .001);
    assert.ok(target.top >= viewport.top + 72 - .001);
  }
});
test('tall and wide packs fit narrow/short screens with uniform scale', () => {
  for (const [width, height] of [[400, 500], [600, 400], [992, 1113]]) {
    const target = centeredPackBounds({ left: 100, top: 500, width, height }, { left: 0, top: 0, width: 320, height: 320 });
    assert.ok(target.width <= 256 && target.height <= 176);
    assert.ok(Math.abs(target.width / target.height - width / height) < .001);
  }
});
test('all 13 printed surfaces start within their own reverse and scale uniformly', () => {
  assert.equal(flavors.length, 13);
  for (const flavor of flavors) for (const viewport of viewports) for (const height of [180, 700]) {
    const pack = centeredPackBounds({ left: 30, top: 600, width: 170, height: 190 }, viewport);
    const panel = { left: 24, top: 24, width: Math.min(720, viewport.width - 48), height };
    assert.equal(flavor.back.kind, 'official');
    const printed = printedPanelBounds(pack, panel, flavor.back.nutritionArea);
    assert.ok(printed.left >= pack.left && printed.top >= pack.top);
    assert.ok(printed.left + printed.width <= pack.left + pack.width + .001);
    assert.ok(printed.top + printed.height <= pack.top + pack.height + .001);
    assert.ok(Math.abs(printed.width / printed.height - panel.width / panel.height) < .001);
  }
});
test('one short shared sequence includes every phase, regardless of flavor or viewport', () => {
  assert.deepEqual(sachetPhases.map(([name]) => name), ['focusing', 'settling', 'turning', 'backVisible', 'nutritionExpanding']);
  assert.ok(sachetPhases.reduce((sum, [,duration]) => sum + duration, 0) < 2300);
  assert.ok(sachetPhases.every(([,duration]) => duration >= 200));
});
test('suspension and long frames cannot fast-forward past an animation phase', () => {
  assert.equal(frameAdvance(null, 5000, false), 0);
  assert.equal(frameAdvance(0, 5000, true), 0);
  assert.equal(frameAdvance(0, 5000, false), 48);
  assert.equal(frameAdvance(100, 116, false), 16);
});
test('new flavors use the same comma-separated naming as the existing catalog', () => {
  assert.deepEqual(flavors.filter(f => f.isNew).map(f => f.name), ['Té verde, maracuyá', 'Té blanco, fresa', 'Té frío, manzana']);
});
test('resize only updates geometry; loading does not bypass the sequence; touch has one entry point', () => {
  const selection = readFileSync(new URL('../components/sachet-selection.tsx', import.meta.url), 'utf8');
  const catalog = readFileSync(new URL('../components/flavor-catalog.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(selection, /finishImmediately|nutritionEmergence|releaseDust|sealRelease/);
  assert.match(selection, /addEventListener\('resize', resize\)/);
  assert.match(selection, /readyImage\(originalImage, signal\)/);
  assert.match(selection, /readyImage\(backImage, signal\)/);
  assert.doesNotMatch(catalog, /onTouchStart|onTouchEnd|onPointerUp/);
  assert.match(catalog, /if \(busy.current\) return/);
});
