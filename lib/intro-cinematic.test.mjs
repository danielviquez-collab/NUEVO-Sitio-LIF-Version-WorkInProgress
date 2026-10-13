import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { INTRO_PROPOSALS } from './intro-proposals.ts';
import { INTRO_PARTS } from './intro-choreography.ts';
import {
  CINEMATIC_NAMES,
  cinematicIntroPose,
  cinematicAccentTimes,
} from './intro-cinematic.ts';

const settled = { x: 0, y: 0, rotation: 0, sx: 1, sy: 1, opacity: 1 };
test('Cinematic proposals keep five audio choices, author every measured accent and settle in the exact official artwork', () => {
  assert.equal(new Set(Object.values(CINEMATIC_NAMES)).size, 5);
  for (const proposal of INTRO_PROPOSALS) {
    assert.deepEqual(cinematicAccentTimes(proposal), proposal.cues);
    const final = cinematicIntroPose(proposal, proposal.durationMs);
    assert.deepEqual(final.ensemble, settled);
    for (const part of INTRO_PARTS)
      assert.deepEqual(final.parts[part], settled, `${proposal.id}/${part}`);
    for (const ink of Object.values(final.material)) {
      assert.equal(ink.ink, 1);
      assert.equal(ink.fill, 1);
      assert.equal(ink.outline, 0);
      assert.equal(ink.radius, 1200);
    }
    assert.equal(final.trailOpacity, 0);
    assert.deepEqual(
      cinematicIntroPose(proposal, proposal.durationMs + 5000),
      final,
    );
    assert.deepEqual(
      cinematicIntroPose(proposal, -500),
      cinematicIntroPose(proposal, 0),
    );
  }
});
test('All six elements move; silhouettes and lettering are constructed, rather than just fading in', () => {
  for (const proposal of INTRO_PROPOSALS) {
    const samples = Array.from(
      { length: Math.ceil(proposal.durationMs / 8) },
      (_, i) => cinematicIntroPose(proposal, i * 8),
    );
    for (const part of INTRO_PARTS) {
      assert.ok(
        samples.some(
          (p) =>
            Math.abs(p.parts[part].x) +
              Math.abs(p.parts[part].y) +
              Math.abs(p.parts[part].rotation) >
            10,
        ),
      );
      if (part !== 'dot') {
        assert.ok(
          samples.some(
            (p) => p.material[part].ink > 0.1 && p.material[part].ink < 0.8,
          ),
        );
        assert.ok(samples.some((p) => p.material[part].outline > 0.8));
        assert.ok(samples.every((p) => p.parts[part].opacity === 1));
      }
    }
    for (const sample of samples) {
      for (const pose of [...Object.values(sample.parts), sample.ensemble]) {
        assert.ok(Object.values(pose).every(Number.isFinite));
        assert.ok(
          pose.sx >= 0.04 - 1e-9 &&
            pose.sx <= 1.31 &&
            pose.sy >= 0.04 - 1e-9 &&
            pose.sy <= 1.21,
        );
        assert.ok(pose.opacity >= 0 && pose.opacity <= 1);
      }
      for (const ink of Object.values(sample.material)) {
        assert.ok(
          ink.ink >= 0 && ink.ink <= 1 && ink.fill >= 0 && ink.fill <= 1,
        );
      }
      assert.equal(sample.trail.length, 12);
      assert.ok(
        sample.trail.flatMap((p) => Object.values(p)).every(Number.isFinite),
      );
      assert.ok(
        Math.abs(sample.trail.at(-1).x - sample.parts.dot.x - 502.188) < 1e-8,
      );
      assert.ok(
        Math.abs(sample.trail.at(-1).y - sample.parts.dot.y - 449.632) < 1e-8,
      );
    }
  }
});
test('Each Drinking swallow compresses the point and is followed by a distinct weighted leap', () => {
  const proposal = INTRO_PROPOSALS.find((p) => p.id === 'drinking');
  for (const cue of proposal.cues) {
    const contact = cinematicIntroPose(proposal, cue).parts.dot;
    const takeoff = cinematicIntroPose(proposal, cue + 90).parts.dot;
    assert.ok(contact.sx > 1.2 && contact.sy < 0.81);
    assert.ok(takeoff.y < contact.y && takeoff.sy > contact.sy);
  }
});
test('Seed contacts meet a visible leaf at the authored sound accent, before its expansion', () => {
  for (const [id, at] of [
    ['actual', 455],
    ['drinking', 625],
    ['ice2', 85],
  ]) {
    const proposal = INTRO_PROPOSALS.find((p) => p.id === id);
    const pose = cinematicIntroPose(proposal, at);
    assert.equal(pose.material.leaf.fill, 1);
    assert.ok(pose.parts.leaf.sx < 0.2 && pose.parts.leaf.sy < 0.1);
    const leaf = {
      x: 548.795 + pose.parts.leaf.x,
      y: 545.66 + pose.parts.leaf.y,
    };
    const dot = {
      x: 502.188 + pose.parts.dot.x,
      y: 449.632 + pose.parts.dot.y,
    };
    assert.ok(Math.hypot(leaf.x - dot.x, leaf.y - dot.y) < 8);
    assert.ok(
      cinematicIntroPose(proposal, at + 160).parts.leaf.sx > pose.parts.leaf.sx,
    );
  }
});
test('New local-only route preserves both comparison routes and does not replace the approved home', () => {
  const route = readFileSync(
    new URL('../app/pruebas/entrada-cinematica/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(route, /NODE_ENV !== 'development'\) notFound\(\)/);
  assert.match(route, /initial={opcion} cinematic/);
  const player = readFileSync(
    new URL('../components/intro-proposals.tsx', import.meta.url),
    'utf8',
  );
  for (const path of [
    '/pruebas/entrada?',
    '/pruebas/entrada-completa?',
    '/pruebas/entrada-cinematica?',
  ])
    assert.ok(player.includes(path));
  const home = readFileSync(
    new URL('../components/home-entrance.tsx', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(home, /intro-cinematic|entrada-cinematica/);
});
