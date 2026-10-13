import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, applyInput, stepGame, replayGame } from './legacy-engine.ts';
import { LEGACY_CONFIG as C } from './legacy-config.ts';

function item(kind = 'flavor', flavor = 3, position = { x: 2, y: 0.88 }) {
  return {
    ...position,
    id: 9000,
    kind,
    flavor,
    born: 0,
    ttl: 300000,
    lane: 2,
    speed: 0,
  };
}
function catchItem(kind, flavor = 3, score = 0) {
  const s = createGame('catch', 42);
  s.activeMs = 36000;
  s.spawnAt = Infinity;
  s.score = score;
  s.items = [item(kind, flavor)];
  return s;
}
function snakeItem(kind, flavor = 3) {
  const s = createGame('snake', 42);
  s.items = [item(kind, flavor, { x: 9, y: 10 })];
  s.spawnAt = Infinity;
  s.tickMs = 170;
  return s;
}
function run(s, ms) {
  const end = s.ms + ms;
  while (s.ms < end && !s.ended) stepGame(s);
  return s;
}
function survive(s, ms) {
  const seen = new Set();
  while (s.activeMs < ms && !s.ended) {
    for (const i of s.items) if (i.kind === 'flavor') seen.add(i.flavor);
    const p = s.snake[0];
    if (s.direction === 'right' && p.x >= 27)
      applyInput(s, { at: s.ms, direction: 'down' });
    if (s.direction === 'down' && p.y >= 17)
      applyInput(s, { at: s.ms, direction: 'left' });
    if (s.direction === 'left' && p.x <= 2)
      applyInput(s, { at: s.ms, direction: 'up' });
    if (s.direction === 'up' && p.y <= 2)
      applyInput(s, { at: s.ms, direction: 'right' });
    stepGame(s);
  }
  return seen;
}
test('Catch: normal +50, logo +150, wrong -100 and score never negative', () => {
  for (const [kind, flavor, start, expected] of [
    ['flavor', 3, 0, 50],
    ['logo', -1, 0, 150],
    ['flavor', 4, 150, 50],
    ['flavor', 4, 20, 0],
  ]) {
    const s = catchItem(kind, flavor, start);
    stepGame(s);
    assert.equal(s.score, expected);
  }
});
test('Catch: each new is +300; freeze pauses active timer and controls', () => {
  for (let flavor = 0; flavor < 3; flavor++) {
    const s = createGame('catch', 20);
    s.activeMs = flavor * 12000;
    s.spawnAt = Infinity;
    s.items = [item('flavor', flavor)];
    stepGame(s);
    assert.equal(s.score, 300);
    assert.equal(s.spotlight, flavor);
    const time = s.activeMs,
      lane = s.lane;
    applyInput(s, { at: s.ms, direction: 'left' });
    assert.equal(s.lane, lane);
    run(s, 1760);
    assert.equal(s.activeMs, time);
    assert.equal(s.spotlight, null);
    stepGame(s);
    assert.equal(s.activeMs, time + 20);
  }
});
test('Catch: x2 lasts ten seconds and magnet widens reachable area', () => {
  const s = catchItem('double');
  stepGame(s);
  assert.equal(s.doubleUntil, s.activeMs + 10000);
  s.items = [item('flavor', 3)];
  stepGame(s);
  assert.equal(s.score, 100);
  const m = catchItem('magnet');
  stepGame(m);
  assert.equal(m.magnetUntil, m.activeMs + 7000);
  m.catcherX = 1.3;
  m.lane = 1;
  m.items = [item('logo', -1)];
  stepGame(m);
  assert.equal(m.score, 150);
});
test('Catch: all three campaign products appear and difficulty increases', () => {
  const s = createGame('catch', 28),
    seen = new Set();
  s.score=100000;
  while (s.activeMs < 42000) {
    stepGame(s);
    for (const i of s.items) if (i.kind === 'flavor') seen.add(i.flavor);
  }
  assert.ok([0, 1, 2].every((i) => seen.has(i)));
  const speeds = [];
  for (const time of [1000, 61000, 121000]) {
    const stage = createGame('catch', 11);
    stage.activeMs = time;
    stepGame(stage);
    speeds.push(stage.items[0].speed);
  }
  assert.ok(speeds[0] < speeds[1] && speeds[1] < speeds[2]);
});
test('Snake: impossible reversal ignored, first queued turn wins', () => {
  const s = createGame('snake', 5);
  applyInput(s, { at: 0, direction: 'left' });
  assert.equal(s.queued, null);
  applyInput(s, { at: 0, direction: 'up' });
  applyInput(s, { at: 0, direction: 'down' });
  run(s, 200);
  assert.equal(s.direction, 'up');
  assert.deepEqual(s.snake[0], { x: 8, y: 9 });
});
test('Snake: flavor grows one segment; logo does not grow; x2 doubles score', () => {
  const normal = snakeItem('flavor');
  stepGame(normal);
  assert.equal(normal.score, 50);
  assert.equal(normal.snake.length, 4);
  const logo = snakeItem('logo', -1);
  stepGame(logo);
  assert.equal(logo.score, 150);
  assert.equal(logo.snake.length, 3);
  const doubled = snakeItem('flavor', 1);
  doubled.doubleUntil = 10000;
  stepGame(doubled);
  assert.equal(doubled.score, 600);
});
test('Snake: hazard subtracts 100 and two segments, without death or dropping below three', () => {
  const s = snakeItem('hazard');
  s.score = 200;
  s.snake.push({ x: 5, y: 10 }, { x: 4, y: 10 });
  stepGame(s);
  assert.equal(s.score, 100);
  assert.equal(s.snake.length, 3);
  assert.equal(s.ended, null);
  const zero = snakeItem('hazard');
  stepGame(zero);
  assert.equal(zero.score, 0);
  assert.equal(zero.snake.length, 3);
});
test('Snake: shield absorbs one hazard only; wall and self are instant defeat', () => {
  const shield = snakeItem('hazard');
  shield.shield = true;
  shield.score = 200;
  stepGame(shield);
  assert.equal(shield.score, 200);
  assert.equal(shield.shield, false);
  const wall = createGame('snake', 2);
  wall.shield = true;
  wall.snake = [
    { x: 29, y: 10 },
    { x: 28, y: 10 },
    { x: 27, y: 10 },
  ];
  wall.tickMs = 170;
  stepGame(wall);
  assert.equal(wall.ended, 'wall');
  const self = createGame('snake', 2);
  self.snake = [
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 11, y: 11 },
    { x: 11, y: 10 },
    { x: 12, y: 10 },
    { x: 12, y: 11 },
  ];
  self.tickMs = 170;
  stepGame(self);
  assert.equal(self.ended, 'self');
});
test('Snake: Super Bonus gives 1000, resets to three and increases speed', () => {
  const s = snakeItem('flavor');
  s.snake = Array.from({ length: 14 }, (_, i) => ({ x: 20 - i, y: 10 }));
  s.items = [item('flavor', 3, { x: 21, y: 10 })];
  stepGame(s);
  assert.equal(s.score, 1050);
  assert.equal(s.bonusCount, 1);
  assert.equal(s.snake.length, 3);
  assert.equal(s.spotlight, 'super');
  run(s, 1760);
  const head = s.snake[0].x;
  run(s, 180);
  assert.equal(s.snake[0].x, head + 1);
});
test('Snake: fair seeded spawn and all new flavors available in a surviving game', () => {
  for (let seed = 0; seed < 50; seed++) {
    const s = createGame('snake', seed);
    for (const i of s.items) {
      assert.ok(i.x >= 2 && i.x < 28 && i.y >= 2 && i.y < 18);
      assert.ok(!s.snake.some((c) => c.x === i.x && c.y === i.y));
      assert.ok(
        Math.abs(i.x - s.snake[0].x) + Math.abs(i.y - s.snake[0].y) > 3,
      );
    }
  }
  const s = createGame('snake', 73),
    seen = survive(s, 60000);
  assert.equal(s.ended, null);
  assert.ok([0, 1, 2].every((i) => seen.has(i)));
});
test('Three active minutes finish positively, independent of spotlight time', () => {
  const catchState = createGame('catch', 73);
  catchState.score=100000;
  run(catchState, 240000);
  assert.equal(catchState.ended, 'time');
  assert.equal(catchState.activeMs, 180000);
  const snake = createGame('snake', 73);
  survive(snake, 180000);
  assert.equal(snake.ended, 'time');
  assert.equal(snake.activeMs, 180000);
});
test('Client simulation and server replay reproduce identical state', () => {
  const inputs = [
    { at: 1000, direction: 'left' },
    { at: 1800, lane: 4 },
    { at: 12400, lane: 2 },
  ];
  const state = createGame('catch', 822);
  let index = 0;
  while (state.ms < 45000 && !state.ended) {
    while (index < inputs.length && inputs[index].at <= state.ms)
      applyInput(state, inputs[index++]);
    stepGame(state);
  }
  assert.deepEqual(replayGame('catch', 822, inputs, 45000), state);
  assert.equal(C.STEP_MS, 20);
});
test('Catch loses only when a penalty reaches zero, not at the initial zero score',()=>{
  const initial=createGame('catch',7);stepGame(initial);assert.equal(initial.ended,null);
  const loss=catchItem('flavor',4,50);stepGame(loss);assert.equal(loss.ended,'points');assert.equal(loss.score,0);
});
test('Turbo in both games gives seven active seconds, double points and faster clock; spotlight pauses it',()=>{
  for(const game of ['catch','snake']) {
    const s=game==='catch'?catchItem('boost'):snakeItem('boost');stepGame(s);assert.equal(s.boostMs,7000);
    const before=s.activeMs;s.freezeMs=100;run(s,100);assert.equal(s.activeMs,before);assert.equal(s.boostMs,7000);
    const prior=s.activeMs;stepGame(s);assert.equal(s.activeMs-prior,28);assert.equal(s.boostMs,6980);
  }
  const doubled=catchItem('boost');stepGame(doubled);doubled.items=[item('flavor',3)];stepGame(doubled);assert.equal(doubled.score,100);
});
