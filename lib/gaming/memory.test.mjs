import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame as createEngineGame, stepGame, applyInput, replayGame } from './engine.ts';
import { GAME_CONFIG as C } from './config.ts';
import {
  createSessionPlan,
  inspectPlan,
  validPlan,
  memoryPairBag,
  stream,
} from './session-random.ts';
import { memoryPairValue } from './memory-engine.ts';
import { CompetitionStore } from './server.ts';
import {
  exportCompetitionState,
  importCompetitionState,
} from './competition-state.ts';

function run(s, ms) {
  for (let i = 0; i < ms && !s.ended; i += C.STEP_MS) stepGame(s);
  return s;
}
function createGame(game, seed) {
  const state = createEngineGame(game, seed);
  if (game === 'memory_lif') settle(state);
  return state;
}
function solvable(s) {
  const counts = new Map();
  for (const c of s.memory.cards)
    counts.set(c.flavor, (counts.get(c.flavor) ?? 0) + 1);
  assert.equal(s.memory.cards.length, 16);
  for (const n of counts.values()) assert.equal(n % 2, 0);
}
function pair(s, predicate = () => true) {
  const cards = s.memory.cards;
  for (let a = 0; a < cards.length; a++)
    for (let b = a + 1; b < cards.length; b++)
      if (cards[a].phase === 'idle' && cards[b].phase === 'idle' && cards[a].flavor === cards[b].flavor && predicate(cards[a].flavor))
        return [a, b];
  throw Error('pair missing');
}
function match(s, predicate) {
  const slots = pair(s, predicate);
  slots.forEach((slot) =>
    assert.equal(applyInput(s, { at: s.ms, slot }), true),
  );
  run(s, 460);
  return slots;
}
function settle(s) {
  for (
    let i = 0;
    i < 10000 && (s.freezeMs || s.memory.cycle !== 'idle');
    i += 20
  )
    stepGame(s);
  assert.equal(s.memory.cycle, 'idle');
}

test('16 cards, eight identical pairs, all new flavors guaranteed from the start', () => {
  for (let seed = 0; seed < 100; seed++) {
    const s = createGame('memory_lif', seed);
    solvable(s);
    assert.ok(
      [0, 1, 2].every(
        (f) => s.memory.cards.filter((c) => c.flavor === f).length === 2,
      ),
    );
  }
});
test('rapid inputs cannot reveal a third card or reselect the same card', () => {
  const s = createGame('memory_lif', 8);
  assert.ok(applyInput(s, { at: 0, slot: 0 }));
  assert.equal(applyInput(s, { at: 0, slot: 0 }), false);
  assert.ok(applyInput(s, { at: 0, slot: 1 }));
  assert.equal(applyInput(s, { at: 0, slot: 2 }), false);
  assert.equal(s.memory.selected.length, 2);
});
test('First mismatch in a streak is free and recloses both cards before accepting input', () => {
  const s = createGame('memory_lif', 1);
  const b = s.memory.cards.findIndex(
    (c) => c.flavor !== s.memory.cards[0].flavor,
  );
  s.score = 250;
  applyInput(s, { at: 0, slot: 0 });
  applyInput(s, { at: 0, slot: b });
  run(s, 460);
  assert.equal(s.memory.cycle, 'mismatch');
  assert.equal(s.score, 250);
  assert.equal(s.memory.errorStreak, 1);
  settle(s);
  assert.equal(s.memory.cards[0].phase, 'idle');
});
function mismatch(s) {
  const a = s.memory.cards.findIndex(c => c.phase === 'idle');
  const b = s.memory.cards.findIndex(
    (c) => c.phase === 'idle' && c.flavor !== s.memory.cards[a].flavor,
  );
  for (const slot of [a, b]) assert.ok(applyInput(s, { at: s.ms, slot }));
  run(s, 460);
}
test('Racha de errores counts pairs only; second and subsequent failures cost 20, never below zero', () => {
  const s = createGame('memory_lif', 1);
  s.score = 25;
  assert.ok(applyInput(s, { at: 0, slot: 0 }));
  run(s, 1000);
  assert.equal(s.memory.errorStreak, 0);
  assert.equal(applyInput(s, { at: s.ms, slot: 0 }), false);
  const b = s.memory.cards.findIndex(
    (c) => c.flavor !== s.memory.cards[0].flavor,
  );
  applyInput(s, { at: s.ms, slot: b });
  run(s, 460);
  assert.equal(s.score, 25);
  settle(s);
  s.doubleUntil = 100000;
  mismatch(s);
  assert.equal(s.score, 5);
  assert.equal(s.memory.errorStreak, 2);
  assert.equal(s.events.at(-1).value, -20);
  settle(s);
  mismatch(s);
  assert.equal(s.score, 0);
  assert.equal(s.ended, null);
});
test('Matching resets Racha de errores and grants the next streak its free first failure', () => {
  const s = createGame('memory_lif', 1);
  mismatch(s);
  settle(s);
  mismatch(s);
  settle(s);
  assert.equal(s.memory.errorStreak, 2);
  match(s, (f) => f >= 3);
  assert.equal(s.memory.errorStreak, 0);
  settle(s);
  const before = s.score;
  mismatch(s);
  assert.equal(s.memory.errorStreak, 1);
  assert.equal(s.score, before);
});
test('Ten consecutive mismatches terminate immediately at any score and ignore further input', () => {
  for (const points of [0, 5000]) {
    const s = createGame('memory_lif', 1);
    s.score = points;
    for (let n = 1; n <= 10; n++) {
      mismatch(s);
      assert.equal(s.memory.errorStreak, n);
      assert.equal(s.score, Math.max(0, points - Math.max(0, n - 1) * 20));
      assert.equal(s.ended, n === 10 ? 'error_streak' : null);
      if (n < 10) settle(s);
    }
    assert.equal(s.events.at(-1).type, 'death');
    assert.ok(s.activeMs < 180000);
    assert.equal(applyInput(s, { at: s.ms, slot: 2 }), false);
    const snapshot = structuredClone(s);
    stepGame(s);
    assert.deepEqual(s, snapshot);
  }
});
test('normal +10, logo +30 and each new +60; x2 does not double Super', () => {
  for (const [predicate, expected] of [
    [(f) => f >= 3, 10],
    [(f) => f === -1, 30],
    [(f) => f === 0, 60],
    [(f) => f === 1, 60],
    [(f) => f === 2, 60],
  ]) {
    const s = createGame('memory_lif', 8);
    match(s, predicate);
    assert.equal(s.score, expected);
    const doubled = createGame('memory_lif', 8);
    doubled.doubleUntil = 10000;
    match(doubled, predicate);
    assert.equal(doubled.score, expected * 2);
  }
  const s = createGame('memory_lif', 8);
  s.doubleUntil = 10000;
  match(s, (f) => f >= 3);
  assert.equal(s.score, 20);
  settle(s);
  s.memory.superProgress = 5;
  const before = s.score;
  const f = s.memory.cards[pair(s)[0]].flavor;
  match(s);
  run(s, 2000);
  assert.equal(s.bonusCount, 1);
  assert.equal(s.score - before, 250 + (f < 0 ? 30 : f < 3 ? 60 : 10) * 2);
});
test('hero moment pauses active timer and inputs for the configured duration', () => {
  const s = createGame('memory_lif', 19);
  match(s, (f) => f === 1);
  assert.equal(s.spotlight, 1);
  const before = s.activeMs;
  assert.equal(applyInput(s, { at: s.ms, slot: 0 }), false);
  run(s, s.freezeMs);
  assert.equal(s.activeMs, before);
  assert.equal(s.spotlight, null);
  stepGame(s);
  assert.ok(s.activeMs > before);
});
test('Matched pairs stay visible and fixed until all eight pairs renew the complete board', () => {
  const s = createGame('memory_lif', 77);
  const original = s.memory.cards.map(c => ({ id: c.id, flavor: c.flavor }));
  const slots = match(s, (f) => f >= 3);
  settle(s);
  assert.deepEqual(s.memory.cards.map(c => ({ id: c.id, flavor: c.flavor })), original);
  assert.ok(slots.every(i => s.memory.cards[i].phase === 'matched'));
  const score = s.score;
  for (const slot of slots) assert.equal(applyInput(s, { at: s.ms, slot }), false);
  assert.equal(s.score, score);
  solvable(s);
  assert.equal(s.memory.notice, '¡Pareja encontrada!');
  for (let i = 0; i < 7; i++) {
    match(s);
    settle(s);
    solvable(s);
  }
  assert.equal(s.memory.boardIndex, 1);
  assert.ok(original.every(({ id }) => !s.memory.cards.some(c => c.id === id)));
  assert.notDeepEqual(s.memory.cards.map(c => c.flavor), original.map(c => c.flavor));
  assert.ok(s.memory.cards.every(c => c.phase === 'idle'));
});
test('Super resets after six pairs and repeats without score cap', () => {
  const s = createGame('memory_lif', 55);
  s.score = 2000000;
  for (let i = 0; i < 18; i++) {
    match(s);
    settle(s);
  }
  assert.equal(s.bonusCount, 3);
  assert.equal(s.memory.superProgress, 0);
  assert.ok(s.score > 2000750);
});
test('Peek consumes a charge, blocks selection briefly, never grants score and cleans up', () => {
  const s = createGame('memory_lif', 2);
  assert.ok(applyInput(s, { at: 0, action: 'peek' }));
  assert.equal(s.memory.peekCharges, 0);
  assert.equal(applyInput(s, { at: 0, slot: 0 }), false);
  run(s, 1000);
  assert.equal(s.score, 0);
  assert.ok(applyInput(s, { at: s.ms, slot: 0 }));
  assert.equal(applyInput(s, { at: s.ms, action: 'radar' }), false);
});
test('x2 is scheduled for ten active seconds and powers have comparable quotas', () => {
  const s = createGame('memory_lif', 42),
    event = s.plan.events.find((e) => e.kind === 'double');
  run(s, Math.ceil(event.at / 20) * 20 - s.activeMs);
  assert.equal(s.doubleUntil - s.activeMs, 10000);
  run(s, 10000);
  assert.ok(s.doubleUntil <= s.activeMs);
});
test('Partially solved panels never shuffle on timers or powers', () => {
  const s = createGame('memory_lif', 31);
  match(s, f => f >= 3);
  settle(s);
  const cards = structuredClone(s.memory.cards);
  assert.deepEqual(s.plan.shuffles, []);
  run(s, 120000);
  assert.deepEqual(s.memory.cards, cards);
  assert.equal(s.memory.boardIndex, 0);
  assert.ok(s.events.every(e => e.type !== 'shuffle'));
});

test('Every board previews all sixteen cards, blocks scoring and then flips them closed', () => {
  const s = createEngineGame('memory_lif', 5);
  assert.equal(s.memory.cycle, 'preview');
  assert.ok(s.memory.cards.every(c => c.phase === 'preview'));
  assert.equal(applyInput(s, { at: 0, slot: 0 }), false);
  assert.equal(applyInput(s, { at: 0, action: 'peek' }), false);
  run(s, C.MEMORY_BOARD_PREVIEW_MS);
  assert.equal(s.memory.cycle, 'board-closing');
  assert.ok(s.memory.cards.every(c => c.phase === 'closing'));
  run(s, C.MEMORY_FLIP_MS);
  assert.equal(s.memory.cycle, 'idle');
  assert.equal(s.score, 0);
  assert.equal(s.memory.peekCharges, 1);
});
test('ends exactly at 180 active seconds, positive time reason, no further inputs', () => {
  const s = createGame('memory_lif', 42);
  run(s, 180000);
  assert.equal(s.activeMs, 180000);
  assert.equal(s.ended, 'time');
  assert.equal(s.events.at(-1).type, 'complete');
  assert.equal(applyInput(s, { at: s.ms, slot: 0 }), false);
});
test('Client actions replay exactly through matched pairs, full panel changes and powers', () => {
  const s = createGame('memory_lif', 991),
    inputs = [];
  while (s.activeMs < 90000 && !s.ended) {
    if (s.memory.cycle === 'idle' && !s.freezeMs && !s.memory.selected.length) {
      for (const slot of pair(s)) {
        const input = { at: s.ms, slot };
        if (applyInput(s, input)) inputs.push(input);
      }
    }
    stepGame(s);
  }
  assert.deepEqual(replayGame('memory_lif', 991, inputs, s.ms), s);
});
test('500 Memory seeds: layouts, schedules and paired-value quotas remain varied and bounded', () => {
  const layouts = new Set(),
    schedules = new Set(),
    orders = new Set();
  for (let seed = 0; seed < 500; seed++) {
    const m = createGame('memory_lif', seed);
    layouts.add(m.memory.cards.map((c) => c.flavor).join(','));
    solvable(m);
    {
      const p = createSessionPlan('memory_lif', seed);
      assert.ok(validPlan(p));
      schedules.add(JSON.stringify(p.events));
      const stats = inspectPlan(p);
      assert.equal(stats.counts.double, 3);
      orders.add(
        memoryPairBag(stream(seed, 'initial'), 0, true)
          .filter((f) => f >= 0 && f < 3)
          .join(','),
      );
    }
    const rng = stream(seed, 'pairs');
    let last = -2;
    for (let n = 0; n < 30; n++) {
      const bag = memoryPairBag(rng, n % 3, false, last);
      assert.equal(memoryPairValue(bag), 250);
      assert.notEqual(bag[0], last);
      last = bag.at(-1);
    }
  }
  assert.ok(layouts.size > 495);
  assert.ok(schedules.size > 495);
  assert.equal(orders.size, 6);
});
test('Restored Snake uses original campaign flavor availability and safe non-overlapping spawns', () => {
  const positions = new Set();
  for (let seed = 0; seed < 20; seed++) {
    const s = createGame('snake', seed),
      seen = new Set();
    while (s.activeMs < 60000 && !s.ended) {
      const h = s.snake[0];
      if (s.direction === 'right' && h.x >= 27)
        applyInput(s, { at: s.ms, direction: 'down' });
      if (s.direction === 'down' && h.y >= 17)
        applyInput(s, { at: s.ms, direction: 'left' });
      if (s.direction === 'left' && h.x <= 2)
        applyInput(s, { at: s.ms, direction: 'up' });
      if (s.direction === 'up' && h.y <= 2)
        applyInput(s, { at: s.ms, direction: 'right' });
      const previous = new Set(s.items.map((i) => i.id));
      stepGame(s);
      for (const item of s.items) {
        if (item.kind === 'flavor' && item.flavor < 3) seen.add(item.flavor);
        if (!previous.has(item.id)) {
          assert.ok(item.x >= 2 && item.x < 28 && item.y >= 2 && item.y < 18);
          assert.ok(!s.snake.some((c) => c.x === item.x && c.y === item.y));
          positions.add(`${item.x},${item.y}`);
        }
      }
    }
    assert.equal(s.ended, null);
    assert.ok(
      [0, 1, 2].every(
        (flavor) => seen.has(flavor) || s.newSeen.includes(flavor),
      ),
    );
  }
  assert.ok(positions.size > 10);
});
test('historical catch snapshot remains byte-identical, excluded from new ranking and attempts', () => {
  const store = new CompetitionStore(':memory:'),
    restored = new CompetitionStore(':memory:');
  try {
    const d = store.device(),
      old = store.start(d.id, 'snake');
    store.db
      .prepare(
        "UPDATE sessions SET game='catch',status='completed',version='lif-games-20261002-v2',validated_score=9000,ended=? WHERE id=?",
      )
      .run(Date.now(), old.id);
    const before = JSON.stringify(store.session(d.id, old.id));
    const snapshot = exportCompetitionState(store);
    importCompetitionState(restored, snapshot);
    assert.equal(exportCompetitionState(restored), snapshot);
    assert.deepEqual(store.attempts(d.id), { memory_lif: 3, snake: 3 });
    assert.equal(store.leaderboard('memory_lif').total, 0);
    assert.throws(() => store.start(d.id, 'catch'), /GAME_INVALID/);
    store.start(d.id, 'memory_lif');
    assert.equal(JSON.stringify(store.session(d.id, old.id)), before);
  } finally {
    store.db.close();
    restored.db.close();
  }
});
test('debug seed override is permitted only with explicit development environment', () => {
  const env = process.env.NODE_ENV,
    seed = process.env.REPLAY_SESSION_SEED;
  const store = new CompetitionStore(':memory:');
  try {
    process.env.NODE_ENV = 'development';
    process.env.REPLAY_SESSION_SEED = '88';
    assert.equal(store.start(store.device().id, 'memory_lif').seed, 88);
    process.env.NODE_ENV = 'production';
    assert.notEqual(store.start(store.device().id, 'memory_lif').seed, 88);
  } finally {
    if (env === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = env;
    if (seed === undefined) delete process.env.REPLAY_SESSION_SEED;
    else process.env.REPLAY_SESSION_SEED = seed;
    store.db.close();
  }
});
test('A completed Memory round is replay-validated, registered and included in the unified ranking', () => {
  const store = new CompetitionStore(':memory:');
  try {
    const device = store.device(),
      session = store.start(device.id, 'memory_lif'),
      state = createGame('memory_lif', session.seed);
    const inputs = pair(state, (f) => f === 0).map((slot) => ({ at: state.ms, slot }));
    for (const input of inputs) assert.ok(applyInput(state, input));
    while (!state.ended) stepGame(state);
    assert.equal(state.score, 60);
    store.db
      .prepare('UPDATE sessions SET started=? WHERE id=?')
      .run(Date.now() - state.ms, session.id);
    assert.throws(
      () =>
        store.validate(
          device.id,
          session.id,
          inputs,
          state.ms,
          999999,
          'finish',
        ),
      /SCORE_INVALID/,
    );
    const result = store.validate(
      device.id,
      session.id,
      inputs,
      state.ms,
      state.score,
      'finish',
    );
    assert.equal(result.reason, 'time');
    store.register(device.id, session.id, {
      name: 'Prueba aislada',
      email: 'memory@example.test',
      phone: '88881111',
      nickname: 'MemoriaQA',
      terms: true,
    });
    assert.equal(store.leaderboard('memory_lif', device.id).best, 60);
    assert.equal(store.leaderboard('all', device.id).best, 60);
    assert.equal(store.leaderboard('snake', device.id).total, 0);
    assert.deepEqual(store.attempts(device.id), { memory_lif: 2, snake: 3 });
    const record = store.session(device.id, session.id);
    assert.equal(record.raw_score, 60);
    assert.equal(record.validated_score, 60);
    assert.equal(record.version, C.VERSION);
  } finally {
    store.db.close();
  }
});
