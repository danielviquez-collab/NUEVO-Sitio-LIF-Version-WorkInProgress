import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, applyInput, stepGame, replayGame } from './engine.ts';
import { GAME_CONFIG as C } from './config.ts';
import {
  createGame as originalGame,
  applyInput as originalInput,
  stepGame as originalStep,
} from './legacy-engine.ts';

function nextItem(kind, flavor = 3) {
  const s = createGame('snake', 42);
  s.plan.events = [];
  s.scheduleIndex = 0;
  s.items = [
    {
      id: 9000,
      kind,
      flavor,
      x: 9,
      y: 10,
      born: 0,
      ttl: 300000,
      lane: 0,
      speed: 0,
    },
  ];
  s.tickMs = C.SNAKE_TICK_MS - C.STEP_MS;
  return s;
}
test('Active Snake preserves scoring, growth, x2 and continuous food supply', () => {
  for (const [kind, flavor, score, length] of [
    ['flavor', 3, 50, 4],
    ['flavor', 0, 300, 4],
    ['logo', -1, 150, 3],
  ]) {
    const s = nextItem(kind, flavor);
    stepGame(s);
    assert.equal(s.score, score);
    assert.equal(s.snake.length, length);
    assert.ok(s.items.some((i) => i.kind === 'flavor'));
  }
  const s = nextItem('flavor', 1);
  s.doubleUntil = 10000;
  stepGame(s);
  assert.equal(s.score, 600);
});
test('Restored competitor subtracts 100 and two segments; shield absorbs one rival only', () => {
  const s = nextItem('hazard');
  s.score = 200;
  s.shield = false;
  s.snake.push({ x: 5, y: 10 }, { x: 4, y: 10 });
  stepGame(s);
  assert.equal(s.score, 100);
  assert.equal(s.recoveryMs, 0);
  assert.equal(s.snake.length, 3);
  const shield = nextItem('hazard');
  shield.score = 200;
  shield.shield = true;
  stepGame(shield);
  assert.equal(shield.score, 200);
  assert.equal(shield.shield, false);
  const floor = nextItem('hazard');
  stepGame(floor);
  assert.equal(floor.score, 0);
  const boost = nextItem('boost');
  stepGame(boost);
  assert.equal(boost.boostMs, 7000);
  const before = boost.activeMs;
  stepGame(boost);
  assert.equal(boost.activeMs - before, 28);
});
test('Active Snake preserves Super, controls and deterministic replay', () => {
  const s = nextItem('flavor');
  s.snake = Array.from({ length: 14 }, (_, i) => ({ x: 20 - i, y: 10 }));
  s.items[0].x = 21;
  stepGame(s);
  assert.equal(s.score, 1050);
  assert.equal(s.snake.length, 3);
  assert.equal(s.bonusCount, 1);
  assert.equal(s.spotlight, 'super');
  const state = createGame('snake', 321),
    inputs = [];
  assert.equal(applyInput(state, { at: 0, direction: 'left' }), false);
  while (state.activeMs < 60000 && !state.ended) {
    const head = state.snake[0];
    const direction =
      state.direction === 'right' && head.x >= 27
        ? 'down'
        : state.direction === 'down' && head.y >= 17
          ? 'left'
          : state.direction === 'left' && head.x <= 2
            ? 'up'
            : state.direction === 'up' && head.y <= 2
              ? 'right'
              : null;
    if (direction) {
      const input = { at: state.ms, direction };
      if (applyInput(state, input)) inputs.push(input);
    }
    stepGame(state);
  }
  assert.equal(state.ended, null);
  assert.deepEqual(replayGame('snake', 321, inputs, state.ms), state);
});
test('Restored Snake exactly matches the original engine across spawns, powers, timing and inputs', () => {
  for (let seed = 0; seed < 100; seed++) {
    const active = createGame('snake', seed),
      original = originalGame('snake', seed);
    while (!active.ended) {
      const h = active.snake[0];
      const direction =
        active.direction === 'right' && h.x >= 27
          ? 'down'
          : active.direction === 'down' && h.y >= 17
            ? 'left'
            : active.direction === 'left' && h.x <= 2
              ? 'up'
              : active.direction === 'up' && h.y <= 2
                ? 'right'
                : null;
      if (direction) {
        applyInput(active, { at: active.ms, direction });
        originalInput(original, { at: original.ms, direction });
      }
      stepGame(active);
      originalStep(original);
      if (active.ms % 1000 === 0 || active.ended) {
        const projection = Object.fromEntries(
          Object.keys(original).map((key) => [key, active[key]]),
        );
        assert.deepEqual(projection, original);
      }
    }
  }
});
test('Shield never protects a wall or self collision; zero score alone is not defeat', () => {
  const wall = createGame('snake', 4);
  wall.shield = true;
  wall.snake = [
    { x: 29, y: 10 },
    { x: 28, y: 10 },
    { x: 27, y: 10 },
  ];
  wall.tickMs = 190;
  stepGame(wall);
  assert.equal(wall.ended, 'wall');
  const self = createGame('snake', 4);
  self.shield = true;
  self.snake = [
    { x: 8, y: 10 },
    { x: 8, y: 9 },
    { x: 9, y: 9 },
    { x: 9, y: 10 },
    { x: 10, y: 10 },
  ];
  self.tickMs = 190;
  stepGame(self);
  assert.equal(self.ended, 'self');
  const zero = nextItem('hazard');
  zero.score = 50;
  stepGame(zero);
  assert.equal(zero.score, 0);
  assert.equal(zero.ended, null);
});
test('Power pickups and turbo retain their original duration and non-stacking multiplier', () => {
  const double = nextItem('double');
  stepGame(double);
  assert.equal(double.doubleUntil - double.activeMs, 10000);
  const shield = nextItem('shield');
  assert.equal(shield.shield, false);
  stepGame(shield);
  assert.equal(shield.shield, true);
  const boost = nextItem('flavor', 3);
  boost.boostMs = 7000;
  boost.doubleUntil = 10000;
  stepGame(boost);
  assert.equal(boost.score, 100);
  assert.equal(boost.boostMs, 6980);
  assert.equal(boost.activeMs, 28);
});
test('Super is triggered by 15 segments and speed compounds by six percent', () => {
  const s = nextItem('flavor', 3);
  s.snake = Array.from({ length: 14 }, (_, i) => ({ x: 20 - i, y: 10 }));
  s.items[0].x = 21;
  s.bonusCount = 2;
  s.score = 2000000;
  stepGame(s);
  assert.equal(s.bonusCount, 3);
  assert.equal(s.score, 2001050);
  assert.equal(s.snake.length, 3);
  while (s.freezeMs) stepGame(s);
  s.items = [];
  s.spawnAt = 1000000;
  const interval = C.SNAKE_TICK_MS / 1.06 ** 3;
  s.tickMs = interval - C.STEP_MS - 1;
  const x = s.snake[0].x;
  stepGame(s);
  assert.equal(s.snake[0].x, x);
  stepGame(s);
  assert.equal(s.snake[0].x, x + 1);
});
