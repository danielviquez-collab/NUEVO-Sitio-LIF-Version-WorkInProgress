import test from 'node:test';
import assert from 'node:assert/strict';
import rhythm from './roulette-rhythm.json' with { type: 'json' };
import {
  roulettePointerAngleAt,
  rouletteProgressAt,
  ROULETTE_SPIN_MS,
} from './roulette-motion.ts';

test('The spin follows the measured MP3 segment without silence or changing its pitch', () => {
  assert.equal(ROULETTE_SPIN_MS, 8990);
  assert.equal(rhythm.sourceEndMs - rhythm.sourceStartMs, ROULETTE_SPIN_MS);
  assert.equal(rhythm.progress[0], 0);
  assert.equal(rhythm.progress.at(-1), 1);
  assert.ok(rhythm.ticksMs.length > 90);
  for (let i = 1; i < rhythm.ticksMs.length; i++)
    assert.ok(rhythm.ticksMs[i] > rhythm.ticksMs[i - 1]);
  rhythm.ticksMs.forEach((time, i) => {
    const expected = (i + 1) / rhythm.ticksMs.length;
    assert.ok(Math.abs(rouletteProgressAt(time) - expected) < 0.009);
  });
});

test('Rotation moves continuously forward, decelerates with the ticks and stops exactly on the selected angle', () => {
  let previous = 0;
  for (let time = 0; time <= ROULETTE_SPIN_MS; time += 10) {
    const next = rouletteProgressAt(time);
    assert.ok(next >= previous && next <= 1);
    previous = next;
  }
  assert.equal(rouletteProgressAt(-100), 0);
  assert.equal(rouletteProgressAt(ROULETTE_SPIN_MS), 1);
  assert.equal(rouletteProgressAt(ROULETTE_SPIN_MS + 1000), 1);
  const early = rouletteProgressAt(1000);
  const late = 1 - rouletteProgressAt(ROULETTE_SPIN_MS - 1000);
  assert.ok(early > late * 5);
});

test('Decoded buffer duration and delayed display frames never introduce timing drift', () => {
  for (const duration of [8950, 8990, 9040]) {
    for (const fraction of [0, 0.15, 0.5, 0.8, 1])
      assert.equal(
        rouletteProgressAt(duration * fraction, duration),
        rouletteProgressAt(ROULETTE_SPIN_MS * fraction),
      );
  }
  const currentAudioTime = 7123;
  const resumed = rouletteProgressAt(currentAudioTime);
  assert.ok(resumed > rouletteProgressAt(6000));
  assert.equal(resumed, rouletteProgressAt(currentAudioTime));
});

test('The hinged pointer follows measured clicks and settles between slower detents', () => {
  assert.equal(roulettePointerAngleAt(-100), 0);
  assert.equal(roulettePointerAngleAt(0), 0);
  assert.equal(roulettePointerAngleAt(rhythm.ticksMs[0]), 0);
  assert.ok(roulettePointerAngleAt(rhythm.ticksMs[0] + 15) < -5);
  const last = rhythm.ticksMs.at(-1);
  assert.ok(roulettePointerAngleAt(last + 15) < -5);
  assert.ok(roulettePointerAngleAt(last + 60) > 0);
  assert.equal(roulettePointerAngleAt(last + 180), 0);
  assert.equal(roulettePointerAngleAt(ROULETTE_SPIN_MS), 0);
  assert.equal(roulettePointerAngleAt(ROULETTE_SPIN_MS + 1000), 0);
});

test('Pointer deflection stays bounded and continuous at clicks, recovery and the final stop', () => {
  for (let time = 0; time <= ROULETTE_SPIN_MS; time++) {
    const angle = roulettePointerAngleAt(time);
    assert.ok(angle >= -26 && angle <= 7);
    assert.ok(Math.abs(angle - roulettePointerAngleAt(time - 1)) < 2.5);
  }
  for (const tick of rhythm.ticksMs)
    assert.ok(
      Math.abs(
        roulettePointerAngleAt(tick - 0.001) -
          roulettePointerAngleAt(tick + 0.001),
      ) < 0.01,
    );
});

test('Pointer and rotor use the same audible clock even with decoded duration or frame delays', () => {
  for (const duration of [8950, 8990, 9040])
    for (const fraction of [0, 0.15, 0.5, 0.8, 1])
      assert.ok(
        Math.abs(
          roulettePointerAngleAt(duration * fraction, duration) -
            roulettePointerAngleAt(ROULETTE_SPIN_MS * fraction),
        ) < 0.00001,
      );
  assert.ok(roulettePointerAngleAt(8660) < 0);
  assert.equal(roulettePointerAngleAt(8840), 0);
});
