import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_CONFIG as C } from './config.ts';
import { snakeViewCell, snakeViewDirection, snakeInputDirection, snakeImpactOffset, SNAKE_IMPACT_MS } from './snake-view.ts';

test('Portrait maps every original cell to one unique vertical cell without changing the simulation', () => {
  const seen = new Set();
  for (let y = 0; y < C.BOARD_ROWS; y++)
    for (let x = 0; x < C.BOARD_COLS; x++) {
      const point = { x, y };
      const rotated = snakeViewCell(point, true);
      assert.ok(rotated.x >= 0 && rotated.x < C.BOARD_ROWS);
      assert.ok(rotated.y >= 0 && rotated.y < C.BOARD_COLS);
      seen.add(`${rotated.x},${rotated.y}`);
      assert.equal(snakeViewCell(point, false), point);
    }
  assert.equal(seen.size, C.BOARD_COLS * C.BOARD_ROWS);
});
test('Swipes, keyboard and pad remain screen-relative in portrait and unchanged in landscape', () => {
  const vectors = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const before = { x: 9, y: 8 };
  for (const direction of Object.keys(vectors)) {
    const logical = snakeInputDirection(direction, true);
    assert.equal(snakeViewDirection(logical, true), direction);
    const [dx, dy] = vectors[logical];
    const from = snakeViewCell(before, true);
    const to = snakeViewCell({ x: before.x + dx, y: before.y + dy }, true);
    assert.deepEqual([to.x - from.x, to.y - from.y], vectors[direction]);
    assert.equal(snakeInputDirection(direction, false), direction);
    assert.equal(snakeViewDirection(direction, false), direction);
  }
});
test('Collision feedback has one outward impact, one rebound and settles without resuming the game', () => {
  assert.equal(SNAKE_IMPACT_MS, 560);
  assert.equal(snakeImpactOffset(0), 0);
  assert.ok(snakeImpactOffset(0.25) > 0);
  assert.ok(snakeImpactOffset(0.75) < 0);
  assert.equal(snakeImpactOffset(1), 0);
  for (let i = 0; i <= 100; i++) assert.ok(Math.abs(snakeImpactOffset(i / 100)) < 0.65);
});
