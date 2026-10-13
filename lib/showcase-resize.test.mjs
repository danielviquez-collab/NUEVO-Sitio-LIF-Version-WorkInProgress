import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { changedOrientation, needsCarouselRebuild, sameShowcaseSize } from './showcase-resize.ts';

const portrait = { width: 390, height: 400, slideWidth: 273, viewportWidth: 390, viewportHeight: 844 };
const landscape = { width: 666, height: 440, slideWidth: 222, viewportWidth: 844, viewportHeight: 390 };
test('rotation rebuilds the measured track in both directions', () => {
  assert.equal(needsCarouselRebuild(portrait, landscape), true);
  assert.equal(needsCarouselRebuild(landscape, portrait), true);
  assert.equal(changedOrientation(portrait, landscape), true);
  assert.equal(changedOrientation(landscape, portrait), true);
});
test('unchanged layout and browser chrome height changes do not rebuild the track', () => {
  assert.equal(needsCarouselRebuild(portrait, { ...portrait }), false);
  assert.equal(needsCarouselRebuild(portrait, { ...portrait, viewportHeight: 760 }), false);
  assert.equal(changedOrientation(portrait, { ...portrait, viewportHeight: 760 }), false);
  assert.equal(sameShowcaseSize(portrait, { ...portrait, viewportHeight: 760 }), false);
});
test('a breakpoint changing only slide width still recalculates, while rounding does not', () => {
  assert.equal(needsCarouselRebuild(portrait, { ...portrait, slideWidth: 130 }), true);
  assert.equal(sameShowcaseSize(portrait, { ...portrait, width: 390.2 }), true);
  assert.equal(needsCarouselRebuild(portrait, { ...portrait, width: 390.2 }), false);
});
test('Home eagerly loads all loop images, preserves the selected snap and cleans up observers', () => {
  const source = readFileSync(new URL('../components/flavor-showcase.tsx', import.meta.url), 'utf8');
  assert.match(source, /className="showcase-pack" eager/);
  assert.match(source, /reInit\(\{ startIndex: carousel.selectedScrollSnap\(\)/);
  assert.match(source, /watchResize: false/);
  assert.match(source, /observer.disconnect\(\)/);
  assert.match(source, /cancelAnimationFrame\(resizeFrameRef.current\)/);
  assert.match(source, /visualViewport\?\.removeEventListener\('resize', schedule\)/);
  assert.match(source, /const AUTOPLAY_INTERVAL = 4000/);
});
