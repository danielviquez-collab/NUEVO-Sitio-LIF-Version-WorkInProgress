import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advancePodiumScoreReveal,
  podiumScoreValue,
  PODIUM_SCORE_REVEAL_MS,
} from './score-reveal.ts';

test('Podium scores begin at zero and settle at the exact final score', () => {
  for (const score of [0, 2800, 3250, 3900, 99999]) {
    assert.equal(podiumScoreValue(score, 0), 0);
    assert.equal(podiumScoreValue(score, PODIUM_SCORE_REVEAL_MS), score);
    assert.equal(podiumScoreValue(score, PODIUM_SCORE_REVEAL_MS + 500), score);
  }
});

test('Podium scores grow monotonically as integers, without exceeding the target', () => {
  for (const score of [2800, 3250, 3900]) {
    let previous = 0;
    for (let elapsed = 0; elapsed <= PODIUM_SCORE_REVEAL_MS; elapsed += 10) {
      const value = podiumScoreValue(score, elapsed);
      assert.ok(Number.isInteger(value));
      assert.ok(value >= previous && value <= score);
      previous = value;
    }
    assert.ok(podiumScoreValue(score, PODIUM_SCORE_REVEAL_MS - 1) < score);
  }
});

test('Pauses retain progress, long frames cannot skip the reveal, and completed reveals stay complete', () => {
  assert.equal(advancePodiumScoreReveal(700, 0), 700);
  assert.equal(advancePodiumScoreReveal(700, 10000), 764);
  assert.equal(advancePodiumScoreReveal(700, 16), 716);
  assert.equal(
    advancePodiumScoreReveal(PODIUM_SCORE_REVEAL_MS, 16),
    PODIUM_SCORE_REVEAL_MS,
  );
});

test('Invalid or negative values cannot produce invalid scores or progress', () => {
  assert.equal(podiumScoreValue(-100, 1000), 0);
  assert.equal(podiumScoreValue(NaN, 1000), 0);
  assert.equal(podiumScoreValue(3900, NaN), 0);
  assert.equal(podiumScoreValue(3900, -100), 0);
  assert.equal(advancePodiumScoreReveal(NaN, 16), 16);
  assert.equal(advancePodiumScoreReveal(200, -100), 200);
  assert.equal(advancePodiumScoreReveal(200, NaN), 200);
});
