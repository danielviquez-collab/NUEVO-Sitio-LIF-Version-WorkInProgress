import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameAudio } from './audio.ts';
import {
  GAME_CONFIG as C,
  GAME_SOUND_ASSETS,
  JINGLE_ASSETS,
} from './config.ts';

function audioFixture(
  buttonSound = GAME_SOUND_ASSETS.button,
  duration = 14011 / 44100,
) {
  const audio = new GameAudio(buttonSound),
    calls = [];
  audio.context = {
    destination: {},
    currentTime: 0,
    resume: () => Promise.resolve(),
    createBufferSource() {
      return {
        connect() {},
        disconnect() {},
        start(...args) {
          calls.push(['start', ...args]);
        },
        stop() {
          calls.push(['stop']);
        },
      };
    },
  };
  audio.buffers.set(GAME_SOUND_ASSETS.start, { duration: 4.23 });
  audio.buffers.set(GAME_SOUND_ASSETS.boost, { duration: 7 });
  audio.buffers.set(GAME_SOUND_ASSETS.roulette, { duration: 8.99 });
  audio.buffers.set(GAME_SOUND_ASSETS.curtain, { duration: 66496 / 48000 });
  audio.buffers.set(GAME_SOUND_ASSETS.logoShine, { duration: 52157 / 44100 });
  audio.buffers.set(buttonSound, { duration });
  for (const sound of ['mismatch', 'match', 'food', 'turn', 'blocked'])
    audio.buffers.set(GAME_SOUND_ASSETS[sound], { duration: 0.3, label: sound });
  audio.buffers.set(JINGLE_ASSETS[0], { duration: 5.5 });
  return { audio, calls };
}
test('Memory uses the supplied wrong and Apple Pay clips while keeping other cues and official jingles', () => {
  const { audio, calls } = audioFixture(),
    tones = [];
  audio.tone = (...args) => tones.push(args);
  for (const sound of [
    'flip',
    'mismatch',
    'match',
    'shuffle',
    'peek',
    'radar',
    'complete',
  ])
    audio.play(sound);
  assert.equal(tones.length, 12);
  assert.ok(tones.every((args) => args[0] > 0 && args[2] === 0.14));
  assert.deepEqual(calls, [['start', 0, 0], ['stop'], ['start', 0, 0]]);
  assert.equal(audio.media.get('effect').buffer, audio.buffers.get(GAME_SOUND_ASSETS.match));
});

test('Snake food, errors, turns and blocked reversals use the assigned clips without layered tones', () => {
  const { audio } = audioFixture();
  audio.tone = () => assert.fail('These events must use the supplied recordings');
  for (const [event, asset] of [['normal', 'food'], ['new', 'food'], ['logo', 'food'], ['penalty', 'mismatch'], ['turn', 'turn'], ['blocked', 'blocked']]) {
    audio.play(event);
    assert.equal(audio.media.get('effect').buffer, audio.buffers.get(GAME_SOUND_ASSETS[asset]));
  }
  assert.equal(audio.media.size, 1);
  audio.stop();
  assert.equal(audio.media.size, 0);
});
test('Start audio begins once with the countdown', () => {
  const { audio, calls } = audioFixture();
  audio.start();
  assert.deepEqual(calls, [['start', 0, 0]]);
  assert.ok(audio.media.has('start'));
});
test('Turbo plays for seven seconds, does not restart on HUD updates and resumes from its paused position', () => {
  const { audio, calls } = audioFixture();
  audio.syncBoost(C.BOOST_DURATION_SECONDS * 1000, false);
  audio.syncBoost(6920, false);
  assert.equal(calls.length, 1);
  audio.syncBoost(5000, true);
  assert.equal(audio.media.has('boost'), false);
  audio.syncBoost(5000, false);
  assert.deepEqual(calls.at(-1), ['start', 0, 2]);
  audio.syncBoost(0, false);
  assert.equal(audio.media.has('boost'), false);
});
test('Defeat cuts start and turbo before the same official LIF jingle; closing cuts all media', () => {
  const { audio, calls } = audioFixture();
  audio.start();
  audio.syncBoost(7000, false);
  audio.defeat();
  assert.deepEqual([...audio.media.keys()], ['defeat']);
  assert.equal(calls.filter((c) => c[0] === 'stop').length, 2);
  assert.equal(audio.lastJingle, 0);
  audio.stop();
  assert.equal(audio.media.size, 0);
});

test('Roulette uses the audio output clock, including its scheduled start and output latency', () => {
  const { audio, calls } = audioFixture();
  audio.context.currentTime = 10;
  const playback = audio.startRoulette();
  assert.deepEqual(calls, [['start', 10.04, 0]]);
  assert.equal(playback.durationMs, 8990);
  assert.equal(playback.elapsedMs(), 0);
  audio.context.currentTime = 10.54;
  assert.ok(Math.abs(playback.elapsedMs() - 500) < 0.001);
  audio.context.getOutputTimestamp = () => ({
    contextTime: 10.44,
    performanceTime: 1000,
  });
  assert.ok(Math.abs(playback.elapsedMs() - 400) < 0.001);
  audio.context.getOutputTimestamp = () => ({
    contextTime: 20,
    performanceTime: 1000,
  });
  assert.equal(playback.elapsedMs(), 8990);
});

test('Muting a spin does not desynchronize its clock; leaving stops its source', () => {
  const { audio, calls } = audioFixture();
  audio.master = { gain: { setTargetAtTime() {} } };
  const playback = audio.startRoulette();
  audio.setMuted(true);
  audio.context.currentTime = 2.04;
  assert.equal(playback.elapsedMs(), 2000);
  assert.ok(audio.media.has('roulette'));
  audio.setMuted(false);
  playback.stop();
  assert.equal(audio.media.has('roulette'), false);
  assert.equal(calls.filter(([event]) => event === 'stop').length, 1);
  playback.stop();
  assert.equal(calls.filter(([event]) => event === 'stop').length, 1);
});

test('An old spin handle cannot cut a later spin; global cleanup cuts all audio', () => {
  const { audio, calls } = audioFixture();
  const old = audio.startRoulette();
  const latest = audio.startRoulette();
  const source = audio.media.get('roulette');
  old.stop();
  assert.equal(audio.media.get('roulette'), source);
  assert.equal(calls.filter(([event]) => event === 'stop').length, 1);
  audio.start();
  audio.stop();
  assert.equal(audio.media.size, 0);
  latest.stop();
  assert.equal(calls.filter(([event]) => event === 'stop').length, 3);
});

test('Curtain entry plays the supplied theater file once, without Mario pipe or synthetic tones', () => {
  const { audio, calls } = audioFixture();
  audio.tone = () => assert.fail('Entry must not layer synthetic tones');
  audio.play('curtain');
  assert.deepEqual(calls, [['start', 0, 0]]);
  assert.equal(
    audio.media.get('curtain').buffer,
    audio.buffers.get(GAME_SOUND_ASSETS.curtain),
  );
  assert.equal(audio.media.has('button'), false);
  audio.stop();
  assert.equal(audio.media.size, 0);
  assert.deepEqual(calls.at(-1), ['stop']);
});
test('Curtain waits for Mouse click, then uses the audible output clock', () => {
  const { audio, calls } = audioFixture();
  audio.play('button');
  const playback = audio.startCurtain();
  assert.equal(calls.at(-1)[0], 'start');
  const startsAt = 14011 / 44100 + 0.04;
  assert.ok(Math.abs(calls.at(-1)[1] - startsAt) < 0.001);
  assert.equal(calls.at(-1)[2], 0);
  assert.equal(playback.durationMs, (66496 / 48000) * 1000);
  audio.context.currentTime = startsAt + 0.5;
  assert.ok(Math.abs(playback.elapsedMs() - 500) < 0.001);
  audio.context.getOutputTimestamp = () => ({
    contextTime: startsAt + 0.4,
    performanceTime: 1000,
  });
  assert.ok(Math.abs(playback.elapsedMs() - 400) < 0.001);
  audio.setMuted(true);
  audio.context.currentTime = 2.2;
  assert.ok(audio.media.has('curtain'));
  playback.stop();
  assert.equal(audio.media.has('curtain'), false);
});

test('Selection buttons use Mouse click, replace previous button sounds and respect mute', () => {
  const { audio, calls } = audioFixture();
  audio.master = { gain: { setTargetAtTime() {} } };
  audio.tone = () =>
    assert.fail('Buttons must use the supplied Mouse click file');
  assert.equal(GAME_SOUND_ASSETS.button, '/games/audio/mouse-click.mp3');
  audio.play('button');
  assert.equal(
    audio.media.get('button').buffer,
    audio.buffers.get(GAME_SOUND_ASSETS.button),
  );
  audio.setMuted(true);
  audio.play('button');
  assert.equal(audio.muted, true);
  assert.deepEqual(calls, [['start', 0, 0], ['stop'], ['start', 0, 0]]);
  assert.equal(audio.media.size, 1);
  audio.stop();
  assert.equal(audio.media.size, 0);
});

test('Starting a wheel spin cuts Mouse click and retains the synchronized roulette audio', () => {
  const { audio, calls } = audioFixture();
  audio.play('button');
  const playback = audio.startRoulette();
  assert.deepEqual(calls, [['start', 0, 0], ['stop'], ['start', 0.04, 0]]);
  assert.equal(audio.media.has('button'), false);
  assert.equal(
    audio.media.get('roulette').buffer,
    audio.buffers.get(GAME_SOUND_ASSETS.roulette),
  );
  assert.equal(playback.durationMs, 8990);
});

test('Opening sound waits for the closed-curtain hold while preserving its original duration', () => {
  const { audio, calls } = audioFixture();
  audio.play('button');
  const playback = audio.startCurtain(1500);
  assert.deepEqual(calls.at(-1), ['start', 1.5, 0]);
  audio.context.currentTime = 1.2;
  assert.equal(playback.elapsedMs(), 0);
  audio.context.currentTime = 1.7;
  assert.ok(Math.abs(playback.elapsedMs() - 200) < 0.001);
  assert.equal(playback.durationMs, (66496 / 48000) * 1000);
});
test('Closing during the spotlight hold cancels the scheduled opening sound', () => {
  const { audio, calls } = audioFixture();
  const playback = audio.startCurtain(1500);
  audio.stop();
  assert.equal(audio.media.has('curtain'), false);
  assert.equal(calls.filter(([action]) => action === 'stop').length, 1);
  playback.stop();
  assert.equal(calls.filter(([action]) => action === 'stop').length, 1);
});

test('New gameplay effects preserve Mouse click and the approved entrance timing', () => {
  const { audio } = audioFixture();
  assert.deepEqual(GAME_SOUND_ASSETS, {
    start: '/games/audio/arranque.mp3',
    boost: '/games/audio/turbo.mp3',
    roulette: '/games/audio/ruleta.mp3',
    curtain: '/games/audio/apertura-telon-original.wav',
    logoShine: '/games/audio/fl-studio-startup-sound.mp3',
    button: '/games/audio/mouse-click.mp3',
    mismatch: '/games/audio/wrong_SriFgVc.mp3',
    match: '/games/audio/applepay.mp3',
    food: '/games/audio/food_G1U6tlb.mp3',
    turn: '/games/audio/minecraft-click-menu.mp3',
    blocked: '/games/audio/minecraft_hit_soundmp3converter.mp3',
  });
  audio.play('button');
  assert.equal(audio.buttonEndsAt, 14011 / 44100);
  assert.equal(audio.startCurtain(1500).durationMs, 66496 / 48);
  audio.play('button');
  assert.equal(
    audio.media.get('button').buffer,
    audio.buffers.get(GAME_SOUND_ASSETS.button),
  );
});

test('Logo shine is scheduled once on the curtain clock and follows audible output, including when muted', () => {
  const { audio, calls } = audioFixture();
  const curtain = audio.startCurtain(1500);
  audio.context.currentTime = 0.1;
  const shine = audio.startLogoShine(curtain, 1390);
  assert.equal(calls.at(-1)[0], 'start');
  assert.ok(Math.abs(calls.at(-1)[1] - 2.89) < 0.001);
  assert.equal(calls.at(-1)[2], 0);
  assert.ok(Math.abs(shine.startsAt - 2.89) < 0.001);
  assert.equal(shine.durationMs, (52157 / 44100) * 1000);
  assert.equal(
    audio.media.get('logo-shine').buffer,
    audio.buffers.get(GAME_SOUND_ASSETS.logoShine),
  );
  audio.context.currentTime = 3.59;
  audio.context.getOutputTimestamp = () => ({
    contextTime: 3.49,
    performanceTime: 1000,
  });
  assert.ok(Math.abs(shine.elapsedMs() - 600) < 0.001);
  audio.setMuted(true);
  assert.ok(Math.abs(shine.elapsedMs() - 600) < 0.001);
  assert.equal(calls.filter(([kind]) => kind === 'start').length, 2);
  shine.stop();
  assert.equal(audio.media.has('logo-shine'), false);
  curtain.stop();
  assert.equal(audio.media.size, 0);
});

test('Closing the curtain cancels its pending logo sound and stale cleanup cannot cut a later opening', () => {
  const { audio, calls } = audioFixture();
  const curtain = audio.startCurtain(1500);
  const old = audio.startLogoShine(curtain, 1390);
  audio.stop();
  assert.equal(audio.media.size, 0);
  assert.equal(calls.filter(([kind]) => kind === 'stop').length, 2);
  const nextCurtain = audio.startCurtain(1500);
  const next = audio.startLogoShine(nextCurtain, 1390);
  old.stop();
  assert.equal(audio.media.has('logo-shine'), true);
  next.stop();
  nextCurtain.stop();
  assert.equal(audio.media.size, 0);
});

test('The official site loads Mouse click once and never fetches Mario coin or the old click', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  const requested = [];
  globalThis.fetch = async (src) => {
    requested.push(src);
    return { ok: true, arrayBuffer: async () => new ArrayBuffer(1) };
  };
  const { audio } = audioFixture();
  audio.master = { gain: {}, connect() {} };
  audio.context.decodeAudioData = async () => ({ duration: 1 });
  audio.unlock();
  audio.unlock();
  await audio.ready;
  assert.equal(
    requested.filter((src) => src === GAME_SOUND_ASSETS.button).length,
    1,
  );
  assert.equal(requested.includes('/games/audio/boton-moneda.mp3'), false);
  assert.equal(requested.includes('/games/audio/boton-click.wav'), false);
  assert.equal(requested.includes('/games/audio/switch-sound.mp3'), false);
  assert.ok(audio.buffers.has(GAME_SOUND_ASSETS.button));
});

const buttonAlternatives = [
  { path: '/games/audio/mouse-click.mp3', duration: 14011 / 44100 },
];
for (const { path, duration } of buttonAlternatives) {
  test(`${path} replaces every button sound while preserving curtain and roulette timing`, () => {
    const { audio, calls } = audioFixture(path, duration);
    audio.tone = () =>
      assert.fail('Buttons must use the selected attached file');
    audio.play('button');
    assert.equal(audio.media.get('button').buffer, audio.buffers.get(path));
    assert.equal(audio.buttonEndsAt, duration);
    const opening = audio.startCurtain(1500);
    assert.deepEqual(calls.at(-1), ['start', 1.5, 0]);
    assert.equal(opening.durationMs, 66496 / 48);
    audio.play('button');
    assert.equal(audio.media.get('button').buffer, audio.buffers.get(path));
    assert.equal(audio.media.size, 2);
    audio.master = { gain: { setTargetAtTime() {} } };
    audio.setMuted(true);
    assert.equal(audio.muted, true);
    audio.setMuted(false);
    const roulette = audio.startRoulette();
    assert.equal(audio.media.has('button'), false);
    assert.equal(roulette.durationMs, 8990);
    audio.stop();
    assert.equal(audio.media.size, 0);
    assert.equal(GAME_SOUND_ASSETS.button, '/games/audio/mouse-click.mp3');
  });

  test(`${path} loads once without Mario coin or the other alternative`, async (t) => {
    const originalFetch = globalThis.fetch;
    t.after(() => {
      globalThis.fetch = originalFetch;
    });
    const requested = [];
    globalThis.fetch = async (src) => {
      requested.push(src);
      return { ok: true, arrayBuffer: async () => new ArrayBuffer(1) };
    };
    const { audio } = audioFixture(path, duration);
    audio.master = { gain: {}, connect() {} };
    audio.context.decodeAudioData = async () => ({ duration });
    audio.unlock();
    audio.unlock();
    await audio.ready;
    assert.deepEqual(requested, [
      ...JINGLE_ASSETS,
      ...Object.values({ ...GAME_SOUND_ASSETS, button: path }),
    ]);
    assert.equal(requested.filter((src) => src === path).length, 1);
    assert.equal(requested.includes('/games/audio/boton-moneda.mp3'), false);
    for (const other of buttonAlternatives) {
      if (other.path !== path)
        assert.equal(requested.includes(other.path), false);
    }
    assert.ok(audio.buffers.has(path));
    assert.ok(
      readFileSync(new URL(`../../public${path}`, import.meta.url)).length >
        1000,
    );
  });
}
