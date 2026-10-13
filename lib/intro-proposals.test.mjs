import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import {
  INTRO_PROPOSALS,
  introPose,
  audibleIntroTime,
} from './intro-proposals.ts';
import { IntroProposalAudio } from './intro-proposal-audio.ts';
import {
  completeIntroPose,
  INTRO_PARTS,
  sampleIntroTrack,
} from './intro-choreography.ts';

test('Exactly five distinct proposals preserve all supplied audio and final LIF artwork geometry', () => {
  assert.equal(INTRO_PROPOSALS.length, 5);
  assert.equal(new Set(INTRO_PROPOSALS.map((p) => p.id)).size, 5);
  for (const proposal of INTRO_PROPOSALS) {
    assert.ok(existsSync(new URL('../public' + proposal.raw, import.meta.url)));
    assert.ok(
      existsSync(new URL('../public' + proposal.refined, import.meta.url)),
    );
    assert.ok(proposal.durationMs > 1000 && proposal.durationMs < 3000);
    assert.ok(
      proposal.frames.every(
        (f, i) => i === 0 || f.at > proposal.frames[i - 1].at,
      ),
    );
    const final = introPose(proposal, proposal.durationMs);
    assert.deepEqual(
      [
        final.x,
        final.y,
        final.rotation,
        final.sx,
        final.sy,
        final.opacity,
        final.cameraScale,
      ],
      [0, 0, 0, 1, 1, 1, 1],
    );
    assert.deepEqual(final.letterOpacity, [1, 1, 1]);
    assert.equal(final.signatureOpacity, 1);
    for (const cue of proposal.cues)
      assert.ok(proposal.frames.some((f) => f.at === cue));
    for (let t = 0; t <= proposal.durationMs; t += 5) {
      const pose = introPose(proposal, t);
      assert.ok(Object.values(pose).flat().every(Number.isFinite));
      assert.ok(pose.sx > 0.8 && pose.sy > 0.8);
      assert.ok(Math.abs(pose.x) <= 435 && Math.abs(pose.y) <= 180);
    }
  }
});
test('Drinking uses all four measured swallows for compression, takeoff and a damped final landing', () => {
  const drinking = INTRO_PROPOSALS.find((p) => p.id === 'drinking');
  assert.deepEqual(drinking.cues, [625, 1145, 1725, 2355]);
  for (const cue of drinking.cues) {
    const contact = introPose(drinking, cue),
      airborne = introPose(drinking, cue + 90);
    assert.ok(contact.sx > 1 && contact.sy < 1);
    assert.ok(airborne.y < contact.y);
  }
  assert.equal(introPose(drinking, 2600).y, 0);
});
test('Animation follows audible output, not page timers, and compensates scheduled start and device latency', () => {
  const context = { currentTime: 5, baseLatency: 0.04 };
  assert.equal(audibleIntroTime(context, 4.6, 2000), 360.00000000000034);
  context.getOutputTimestamp = () => ({
    contextTime: 4.8,
    performanceTime: 200,
  });
  assert.ok(Math.abs(audibleIntroTime(context, 4.6, 2000) - 200) < 0.001);
  assert.equal(audibleIntroTime(context, 6, 2000, 900), 900);
  assert.equal(audibleIntroTime(context, 1, 2000), 2000);
});
test('Proposal route is development-only and does not replace the approved home entry', () => {
  const route = readFileSync(
    new URL('../app/pruebas/entrada/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(route, /NODE_ENV !== 'development'\) notFound\(\)/);
  const home = readFileSync(
    new URL('../components/home-entrance.tsx', import.meta.url),
    'utf8',
  );
  assert.match(home, /src="\/audio\/lif-pour\.mp3"/);
  assert.doesNotMatch(home, /intro-proposals/);
  const completeRoute = readFileSync(
    new URL('../app/pruebas/entrada-completa/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(completeRoute, /NODE_ENV !== 'development'\) notFound\(\)/);
  assert.match(completeRoute, /wholeLogo/);
  assert.doesNotMatch(route, /wholeLogo/);
});
test('All five complete versions animate every official logo element, preserve the dot accents and settle without distorting the final artwork', () => {
  for (const proposal of INTRO_PROPOSALS) {
    const samples = [];
    for (let t = 0; t <= proposal.durationMs; t += 10) {
      const pose = completeIntroPose(proposal, t);
      for (const part of [...Object.values(pose.parts), pose.ensemble]) {
        assert.ok(Object.values(part).every(Number.isFinite));
        assert.ok(part.opacity >= 0 && part.opacity <= 1);
        assert.ok(
          part.sx >= 0.65 &&
            part.sy >= 0.65 &&
            part.sx <= 1.16 &&
            part.sy <= 1.16,
        );
      }
      samples.push(pose);
    }
    for (const part of INTRO_PARTS) {
      const visible = samples
        .map((pose) => pose.parts[part])
        .filter((p) => p.opacity > 0.85);
      assert.ok(
        visible.some(
          (p) => Math.abs(p.x) + Math.abs(p.y) + Math.abs(p.rotation) > 10,
        ),
        `${proposal.id}: ${part} must visibly move`,
      );
      assert.deepEqual(
        completeIntroPose(proposal, proposal.durationMs).parts[part],
        { x: 0, y: 0, rotation: 0, sx: 1, sy: 1, opacity: 1 },
      );
    }
    assert.deepEqual(
      completeIntroPose(proposal, proposal.durationMs).ensemble,
      { x: 0, y: 0, rotation: 0, sx: 1, sy: 1, opacity: 1 },
    );
    for (const cue of proposal.cues) {
      const reference = introPose(proposal, cue),
        full = completeIntroPose(proposal, cue).parts.dot;
      for (const key of ['x', 'y', 'rotation', 'sx', 'sy'])
        assert.ok(Math.abs(full[key] - reference[key]) < 0.00001);
    }
  }
});
test('Complete motion keeps continuous velocity at authored accents and never overshoots between them', () => {
  const track = [
    { at: 0, x: -100, y: 50 },
    { at: 100, x: -70, y: 10 },
    { at: 300, x: 0, y: 0 },
    { at: 500, x: 0, y: 0 },
  ];
  for (const at of [100, 300]) {
    const left = sampleIntroTrack(track, at - 0.01),
      center = sampleIntroTrack(track, at),
      right = sampleIntroTrack(track, at + 0.01);
    for (const key of ['x', 'y'])
      assert.ok(
        Math.abs(
          (center[key] - left[key]) / 0.01 - (right[key] - center[key]) / 0.01,
        ) < 0.001,
      );
  }
  for (let t = 0; t <= 500; t++) {
    const pose = sampleIntroTrack(track, t);
    assert.ok(pose.x >= -100 && pose.x <= 0 && pose.y >= 0 && pose.y <= 50);
  }
});
test('Stopping during audio preparation cancels stale playback; pause/resume preserve the audible position and avoid overlapping sources', async () => {
  const calls = [],
    pending = [];
  globalThis.AudioContext = class {
    currentTime = 2;
    baseLatency = 0;
    destination = {};
    resume() {
      return Promise.resolve();
    }
    decodeAudioData() {
      return new Promise((resolve) => pending.push(resolve));
    }
    createGain() {
      return {
        connect() {
          calls.push('connect');
        },
        gain: { value: 1, setTargetAtTime() {} },
      };
    }
    createBufferSource() {
      return {
        connect() {},
        disconnect() {},
        start(time, offset) {
          calls.push(['start', time, offset]);
        },
        stop() {
          calls.push('stop');
        },
      };
    }
    close() {
      return Promise.resolve();
    }
  };
  const fetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(2),
  });
  const player = new IntroProposalAudio();
  try {
    const old = player.play('/old.wav');
    await new Promise((resolve) => setImmediate(resolve));
    player.stop();
    pending.shift()({ duration: 2 });
    assert.equal(await old, false);
    assert.equal(calls.filter((c) => Array.isArray(c)).length, 0);
    const current = player.play('/new.wav', 500);
    await new Promise((resolve) => setImmediate(resolve));
    pending.shift()({ duration: 2 });
    assert.equal(await current, true);
    assert.deepEqual(calls.at(-1), ['start', 2.06, 0.5]);
    assert.equal(player.pause(), 500);
    assert.equal(player.timeMs(), 500);
    await player.play('/new.wav', 500);
    assert.equal(calls.filter((c) => c === 'connect').length, 1);
    assert.equal(calls.filter((c) => c === 'stop').length, 1);
    player.stop();
    assert.equal(calls.filter((c) => c === 'stop').length, 2);
    player.dispose();
    const reopened = player.play('/new.wav');
    await new Promise((resolve) => setImmediate(resolve));
    pending.shift()({ duration: 2 });
    assert.equal(await reopened, true);
    assert.equal(calls.filter((c) => c === 'connect').length, 2);
    assert.deepEqual(calls.at(-1), ['start', 2.06, 0]);
  } finally {
    player.dispose();
    globalThis.fetch = fetch;
    delete globalThis.AudioContext;
  }
});
