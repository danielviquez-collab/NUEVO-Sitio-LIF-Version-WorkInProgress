import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  FORM_SEND_SOUND,
  playFormSendSound,
  stopFormSendSound,
} from './form-submission-audio.ts';

test('All submissions reuse the isolated send effect, honor mute and never block the form', async () => {
  let muted = false;
  const recordings = [];
  globalThis.sessionStorage = { getItem: () => (muted ? '1' : null) };
  globalThis.Audio = class {
    constructor(src) {
      this.src = src;
      this.currentTime = 4;
      this.plays = 0;
      this.pauses = 0;
      recordings.push(this);
    }
    play() {
      this.plays++;
      return Promise.resolve();
    }
    pause() {
      this.pauses++;
    }
  };
  try {
    muted = true;
    playFormSendSound();
    assert.equal(recordings.length, 0);
    muted = false;
    playFormSendSound();
    assert.equal(recordings[0].src, FORM_SEND_SOUND);
    assert.equal(recordings[0].volume, 0.45);
    assert.equal(recordings[0].currentTime, 0);
    stopFormSendSound();
    assert.equal(recordings[0].pauses, 1);
    playFormSendSound();
    assert.equal(recordings.length, 1);
    assert.equal(recordings[0].plays, 2);
    recordings[0].play = () => Promise.reject(new Error('Autoplay blocked'));
    assert.doesNotThrow(playFormSendSound);
    await new Promise((resolve) => setImmediate(resolve));
    delete globalThis.sessionStorage;
    assert.doesNotThrow(playFormSendSound);
  } finally {
    delete globalThis.sessionStorage;
    delete globalThis.Audio;
  }
});

test('The menu stays silent and all three forms play once after their duplicate-submit guard', () => {
  const header = readFileSync(
    new URL('../components/site-chrome.tsx', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(
    header,
    /contact-audio|form-submission-audio|playContactSound|playFormSendSound/,
  );
  for (const [path, handler, end, guard, request] of [
    [
      '../components/contact-modal.tsx',
      'async function submit',
      '  return (',
      'sending',
      "fetch('/api/contact'",
    ],
    [
      '../components/confession-form.tsx',
      'async function handleSubmit',
      '  return <dialog',
      'sending',
      'await readConfessionVideo',
    ],
    [
      '../components/gaming/game-experience.tsx',
      'const register = async',
      'const retryAssets = async',
      'registrationSending',
      'await gamesApi<Result>',
    ],
  ]) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.match(source, /from '@\/lib\/form-submission-audio'/);
    assert.equal(source.match(/stopFormSendSound\(\)/g)?.length, 1);
    const start = source.indexOf(handler);
    const submit = source.slice(start, source.indexOf(end, start));
    assert.equal(submit.match(/playFormSendSound\(\)/g)?.length, 1, path);
    assert.ok(
      submit.indexOf(`if (${guard}.current) return`) <
        submit.indexOf('playFormSendSound()'),
      path,
    );
    assert.ok(
      submit.indexOf(`${guard}.current = true`) <
        submit.indexOf('playFormSendSound()'),
      path,
    );
    assert.ok(
      submit.indexOf('playFormSendSound()') < submit.indexOf(request),
      path,
    );
    if (guard === 'registrationSending') {
      assert.ok(
        submit.indexOf('if (!nicknameInput.reportValidity()) return') <
          submit.indexOf('playFormSendSound()'),
      );
    }
  }
});

test('The public sound is a short PCM clip, not the three-second typing recording', () => {
  const wave = readFileSync(
    new URL(`../public${FORM_SEND_SOUND}`, import.meta.url),
  );
  assert.equal(wave.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wave.toString('ascii', 8, 12), 'WAVE');
  let rate = 0,
    channels = 0,
    samples;
  for (let offset = 12; offset + 8 <= wave.length;) {
    const kind = wave.toString('ascii', offset, offset + 4);
    const size = wave.readUInt32LE(offset + 4);
    if (kind === 'fmt ') {
      assert.equal(wave.readUInt16LE(offset + 8), 1);
      channels = wave.readUInt16LE(offset + 10);
      rate = wave.readUInt32LE(offset + 12);
      assert.equal(wave.readUInt16LE(offset + 22), 16);
    }
    if (kind === 'data') samples = wave.subarray(offset + 8, offset + 8 + size);
    offset += 8 + size + (size % 2);
  }
  assert.ok(samples && rate && channels);
  const duration = samples.length / (2 * channels * rate);
  assert.ok(Math.abs(duration - 0.38) < 0.001, String(duration));
  let peak = 0;
  for (let offset = 0; offset < samples.length; offset += 2) {
    peak = Math.max(peak, Math.abs(samples.readInt16LE(offset)) / 32768);
  }
  assert.ok(peak > 0.1 && peak < 0.95, String(peak));
});
