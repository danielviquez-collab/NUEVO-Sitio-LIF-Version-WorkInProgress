import test from 'node:test';
import assert from 'node:assert/strict';
import {
  availableRandomGames,
  chooseRandomGame,
  rouletteRotation,
} from './random-selection.ts';

test('Random selection gives the two available games equal-sized intervals', () => {
  const attempts = { memory_lif: 3, snake: 3 };
  assert.equal(chooseRandomGame(attempts, 0), 'memory_lif');
  assert.equal(chooseRandomGame(attempts, 0.499999), 'memory_lif');
  assert.equal(chooseRandomGame(attempts, 0.5), 'snake');
  assert.equal(chooseRandomGame(attempts, 0.999999), 'snake');
  assert.deepEqual(attempts, { memory_lif: 3, snake: 3 });
});

test('An exhausted game cannot be selected and spinning does not consume attempts', () => {
  const attempts = { memory_lif: 0, snake: 1 };
  assert.deepEqual(availableRandomGames(attempts), ['snake']);
  assert.equal(chooseRandomGame(attempts, 0), 'snake');
  assert.equal(chooseRandomGame(attempts, 0.999999), 'snake');
  assert.equal(chooseRandomGame({ memory_lif: 0, snake: 0 }, 0.5), null);
  assert.deepEqual(attempts, { memory_lif: 0, snake: 1 });
});

test('The final wheel sector agrees with the selected game and avoids boundaries', () => {
  for (const game of ['memory_lif', 'snake'])
    for (const sample of [0, 0.25, 0.5, 0.75, 0.999999]) {
      const rotation = rouletteRotation(game, sample);
      const pointerAngle = (360 - (rotation % 360) + 360) % 360;
      assert.ok(rotation > 360 * 5);
      assert.equal(
        Math.floor(pointerAngle / 90) % 2 === 0 ? 'memory_lif' : 'snake',
        game,
      );
      assert.ok(pointerAngle % 90 >= 20 && pointerAngle % 90 <= 70);
    }
});

test('Invalid random samples cannot produce an undefined selection or rotation', () => {
  for (const sample of [-1, 1, NaN, Infinity]) {
    assert.throws(() => chooseRandomGame({ memory_lif: 3, snake: 3 }, sample));
    assert.throws(() => rouletteRotation('memory_lif', sample));
  }
});
