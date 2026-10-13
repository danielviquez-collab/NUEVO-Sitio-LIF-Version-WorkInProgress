import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playWithMutedFallback } from './media-playback.ts';
import { acquireMediaOverlay, isMediaOverlayActive, subscribeMediaOverlay } from './media-priority.ts';

const denied = () => new DOMException('Playback requires user activation', 'NotAllowedError');
function media(outcomes = [], muted = false) {
  const calls = [];
  return {
    muted, currentTime: 3, calls,
    play() {
      calls.push(this.muted);
      const next = outcomes.shift();
      return next instanceof Error ? Promise.reject(next) : Promise.resolve();
    },
  };
}

test('audio/video begin in the click call stack when sound is allowed', async () => {
  const video = media();
  const playback = playWithMutedFallback(video);
  assert.deepEqual(video.calls, [false]);
  assert.equal(await playback, 'playing');
  assert.equal(video.muted, false);
});

test('denied sound automatically retries muted without resetting playback', async () => {
  const video = media([denied()]);
  assert.equal(await playWithMutedFallback(video), 'playing');
  assert.deepEqual(video.calls, [false, true]);
  assert.equal(video.muted, true);
  assert.equal(video.currentTime, 3);
});

test('permission errors also work across browser error prototypes', async () => {
  const calls = [];
  const video = { muted: false, play() {
    calls.push(this.muted);
    return this.muted ? Promise.resolve() : Promise.reject({ name: 'NotAllowedError' });
  } };
  assert.equal(await playWithMutedFallback(video), 'playing');
  assert.deepEqual(calls, [false, true]);
});

test('muted user preference is preserved, including subsequent plays', async () => {
  const video = media([], true);
  await playWithMutedFallback(video);
  await playWithMutedFallback(video);
  assert.deepEqual(video.calls, [true, true]);
});

test('sound remains enabled on repeats when the browser allowed it', async () => {
  const video = media();
  await playWithMutedFallback(video);
  await playWithMutedFallback(video);
  assert.deepEqual(video.calls, [false, false]);
});

test('only blocking both sound and muted playback requires a play control', async () => {
  const video = media([denied(), denied()]);
  assert.equal(await playWithMutedFallback(video), 'blocked');
  assert.deepEqual(video.calls, [false, true]);
  const muted = media([denied()], true);
  assert.equal(await playWithMutedFallback(muted), 'blocked');
  assert.deepEqual(muted.calls, [true]);
});

test('a direct sound activation can recover after muted autoplay', async () => {
  const video = media([denied()]);
  await playWithMutedFallback(video);
  video.muted = false;
  assert.equal(await playWithMutedFallback(video), 'playing');
  assert.deepEqual(video.calls, [false, true, false]);
});

test('stale or hidden playback never starts a muted retry', async () => {
  let active = true;
  let reject;
  const video = { muted: false, calls: 0, play() { this.calls++; return new Promise((_, fail) => { reject = fail; }); } };
  const playback = playWithMutedFallback(video, () => active);
  active = false;
  reject(denied());
  assert.equal(await playback, 'cancelled');
  assert.equal(video.calls, 1);
  assert.equal(video.muted, false);
  assert.equal(await playWithMutedFallback(video, () => false), 'cancelled');
  assert.equal(video.calls, 1);
});

test('technical failures are not mistaken for audio permission failures', async () => {
  const error = new DOMException('Unsupported file', 'NotSupportedError');
  const video = media([error]);
  await assert.rejects(playWithMutedFallback(video), { name: 'NotSupportedError' });
  assert.deepEqual(video.calls, [false]);
  const aborted = media([new DOMException('Paused', 'AbortError')]);
  assert.equal(await playWithMutedFallback(aborted), 'cancelled');
  assert.deepEqual(aborted.calls, [false]);
});

test('popup protection stops background playback and survives duplicate cleanup', async () => {
  const changes = [];
  const unsubscribe = subscribeMediaOverlay((active) => changes.push(active));
  const release = acquireMediaOverlay();
  const releaseSecond = acquireMediaOverlay();
  assert.equal(isMediaOverlayActive(), true);
  const background = media();
  assert.equal(await playWithMutedFallback(background, () => !isMediaOverlayActive()), 'cancelled');
  assert.deepEqual(background.calls, []);
  release(); release();
  assert.equal(isMediaOverlayActive(), true);
  releaseSecond(); releaseSecond();
  assert.equal(isMediaOverlayActive(), false);
  assert.deepEqual(changes, [true, false]);
  unsubscribe();
});

test('opening a popup during an outstanding background play prevents its fallback', async () => {
  let reject;
  const background = { muted: false, calls: 0, play() { this.calls++; return new Promise((_, fail) => { reject = fail; }); } };
  const playback = playWithMutedFallback(background, () => !isMediaOverlayActive());
  const release = acquireMediaOverlay();
  reject(denied());
  assert.equal(await playback, 'cancelled');
  assert.equal(background.calls, 1);
  release();
});
