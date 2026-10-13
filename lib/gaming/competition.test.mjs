import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, stepGame, applyInput, replayGame } from './engine.ts';
import {
  createGame as createV1,
  stepGame as stepV1,
} from './versions/memory-v1/engine.ts';
import {
  createGame as createV2,
  stepGame as stepV2,
} from './versions/unified-v2/engine.ts';
import {
  createGame as createV3,
  stepGame as stepV3,
  applyInput as inputV3,
} from './versions/restored-v3/engine.ts';
import { CompetitionStore } from './server.ts';
import { GAME_CONFIG as C } from './config.ts';
import { simulateCompetition } from './balance-audit.ts';

test('Calibrated Memory rewards leave original Snake, thresholds, clocks and failure rules unchanged', () => {
  assert.equal(C.NORMAL_FLAVOR_POINTS, 50);
  assert.equal(C.NEW_FLAVOR_POINTS, 300);
  assert.equal(C.LIF_LOGO_POINTS, 150);
  assert.equal(C.SNAKE_SUPER_BONUS_POINTS, 1000);
  assert.equal(C.MEMORY_MATCH_NORMAL_POINTS, 10);
  assert.equal(C.MEMORY_MATCH_NEW_FLAVOR_POINTS, 60);
  assert.equal(C.MEMORY_LOGO_MATCH_POINTS, 30);
  assert.equal(C.MEMORY_SUPER_BONUS_POINTS, 250);
  assert.equal(C.MEMORY_MISMATCH_PENALTY, 20);
  assert.equal(C.SNAKE_SUPER_BONUS_LENGTH, 15);
  assert.equal(C.MEMORY_SUPER_BONUS_MATCHES, 6);
  assert.equal(C.BOOST_CLOCK_MULTIPLIER, 1.4);
  assert.equal(C.MEMORY_MAX_ERROR_STREAK, 10);
  assert.equal(C.LEADERBOARD_SIZE, 20);
  assert.equal(C.LEADERBOARD_MAX_SIZE, 20);
  assert.equal(C.DAILY_ATTEMPTS, 3);
});
test('Logo scores repeatedly without increasing length or triggering Super; no fixed point ceiling', () => {
  const s = createGame('snake', 1);
  s.score = 2000000;
  s.doubleUntil = 1000000;
  for (let action = 0; action < 180; action++) {
    s.snake = [
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 },
    ];
    s.direction = 'right';
    s.queued = null;
    s.tickMs = 190;
    s.items = [
      {
        id: 9000 + action,
        kind: 'logo',
        flavor: -1,
        x: 9,
        y: 10,
        born: s.activeMs,
        ttl: 180000,
        lane: 0,
        speed: 0,
      },
    ];
    stepGame(s);
  }
  assert.equal(s.bonusCount, 0);
  assert.equal(s.snake.length, 3);
  assert.equal(s.score, 2000000 + 180 * 300);
});
test('Memory-v1 and unified-v2 sessions retain their own replays without reinterpretation', () => {
  const old = createV1('snake', 9);
  while (!old.ended) stepV1(old);
  assert.equal(old.ended, 'wall');
  assert.deepEqual(
    replayGame('snake', 9, [], old.ms, 'lif-games-20261007-memory-v1'),
    old,
  );
  for (const game of ['snake', 'memory_lif']) {
    const frozen = createV2(game, 9);
    for (let n = 0; n < 1000; n++) stepV2(frozen);
    assert.deepEqual(
      replayGame(game, 9, [], frozen.ms, 'lif-games-20261007-unified-v2'),
      frozen,
    );
  }
  assert.equal(replayGame('snake', 9, [], old.ms).ended, 'wall');
});
test('Restored-v3 sessions keep their original Memory points and server validation without rewriting history', () => {
  const store = new CompetitionStore(':memory:');
  try {
    const d = store.device();
    const session = store.start(d.id, 'memory_lif');
    store.db
      .prepare('UPDATE sessions SET version=? WHERE id=?')
      .run('lif-games-20261007-restored-v3', session.id);
    const old = createV3('memory_lif', session.seed);
    const a = old.memory.cards.findIndex((card) => card.flavor === 0);
    const b = old.memory.cards.findIndex(
      (card, slot) => slot !== a && card.flavor === 0,
    );
    const inputs = [a, b].map((slot) => ({ at: 0, slot }));
    for (const input of inputs) assert.ok(inputV3(old, input));
    while (!old.ended) stepV3(old);
    assert.equal(old.score, 300);
    assert.deepEqual(
      replayGame(
        'memory_lif',
        session.seed,
        inputs,
        old.ms,
        'lif-games-20261007-restored-v3',
      ),
      old,
    );
    assert.equal(
      replayGame('memory_lif', session.seed, inputs, old.ms).score,
      0,
    );
    store.db
      .prepare('UPDATE sessions SET started=? WHERE id=?')
      .run(Date.now() - old.ms, session.id);
    const result = store.validate(
      d.id,
      session.id,
      inputs,
      old.ms,
      old.score,
      'finish',
    );
    assert.equal(result.score, 300);
    assert.equal(store.session(d.id, session.id).validated_score, 300);
    assert.equal(
      store.session(d.id, session.id).version,
      'lif-games-20261007-restored-v3',
    );
    assert.equal(store.leaderboard('all', d.id).total, 0);
  } finally {
    store.db.close();
  }
});
test('Calibrated-v4 games retain exact replay, daily usage and Top 20 eligibility after the panel update', async () => {
  const { createGame: oldGame, applyInput: oldInput, stepGame: oldStep } = await import('./versions/calibrated-v4/engine.ts');
  const store = new CompetitionStore(':memory:');
  try {
    const device = store.device();
    const session = store.start(device.id, 'memory_lif');
    const version = 'lif-games-20261007-calibrated-v4';
    store.db.prepare('UPDATE sessions SET version=? WHERE id=?').run(version, session.id);
    const state = oldGame('memory_lif', session.seed);
    const slots = state.memory.cards.map((c, i) => c.flavor === 0 ? i : -1).filter(i => i >= 0);
    const inputs = slots.map(slot => ({ at: 0, slot }));
    for (const input of inputs) assert.ok(oldInput(state, input));
    while (!state.ended) oldStep(state);
    assert.deepEqual(replayGame('memory_lif', session.seed, inputs, state.ms, version), state);
    store.db.prepare('UPDATE sessions SET started=? WHERE id=?').run(Date.now() - state.ms, session.id);
    assert.equal(store.validate(device.id, session.id, inputs, state.ms, state.score, 'finish').score, 60);
    store.register(device.id, session.id, { name: 'Prueba anterior', email: 'previous@example.test', phone: '88881111', nickname: 'AnteriorV4', terms: true });
    assert.equal(store.leaderboard('all').top[0].score, 60);
    assert.equal(store.session(device.id, session.id).version, version);
    assert.equal(store.result(device.id, session.id).best, 60);
    assert.equal(store.attempts(device.id).memory_lif, 2);
  } finally { store.db.close(); }
});
test('One ranking takes best score across games, excludes older rules and keeps history unchanged', () => {
  const store = new CompetitionStore(':memory:');
  try {
    const d = store.device();
    function completed(game, score, version = C.VERSION) {
      const session = store.start(d.id, game);
      store.db
        .prepare(
          "UPDATE sessions SET status='completed',ended=?,raw_score=?,validated_score=?,version=? WHERE id=?",
        )
        .run(Date.now(), score, score, version, session.id);
      return session;
    }
    const memory = completed('memory_lif', 2500);
    store.register(d.id, memory.id, {
      name: 'QA only',
      email: 'qa@example.test',
      phone: '88881111',
      nickname: 'Jugador',
      terms: true,
      website: '',
    });
    const snake = completed('snake', 3000);
    store.register(d.id, snake.id, {
      name: 'QA only',
      email: 'qa@example.test',
      phone: '88881111',
      nickname: 'Jugador',
      terms: true,
    });
    const old = completed(
      'memory_lif',
      45050,
      'lif-games-20261007-restored-v3',
    );
    const before = JSON.stringify(store.session(d.id, old.id));
    const rank = store.leaderboard('all', d.id);
    assert.equal(rank.total, 1);
    assert.equal(rank.best, 3000);
    assert.equal(rank.top[0].game, 'snake');
    assert.equal(rank.position, 1);
    assert.equal(store.result(d.id, memory.id).best, 3000);
    assert.equal(JSON.stringify(store.session(d.id, old.id)), before);
  } finally {
    store.db.close();
  }
});
test('Memory defeat and penalties are reproduced and validated by the server', () => {
  const store = new CompetitionStore(':memory:');
  try {
    const d = store.device(),
      session = store.start(d.id, 'memory_lif');
    const s = createGame('memory_lif', session.seed),
      inputs = [];
    while (!s.ended) {
      if (
        !s.freezeMs &&
        s.memory.cycle === 'idle' &&
        !s.memory.selected.length
      ) {
        const b = s.memory.cards.findIndex(
          (c) => c.flavor !== s.memory.cards[0].flavor,
        );
        for (const slot of [0, b]) {
          const input = { at: s.ms, slot };
          assert.ok(applyInput(s, input));
          inputs.push(input);
        }
      }
      stepGame(s);
    }
    assert.equal(s.ended, 'error_streak');
    assert.deepEqual(replayGame('memory_lif', session.seed, inputs, s.ms), s);
    store.db
      .prepare('UPDATE sessions SET started=? WHERE id=?')
      .run(Date.now() - s.ms, session.id);
    const result = store.validate(
      d.id,
      session.id,
      inputs,
      s.ms,
      s.score,
      'finish',
    );
    assert.equal(result.reason, 'error_streak');
    assert.equal(result.score, 0);
    assert.deepEqual(store.attempts(d.id), { memory_lif: 2, snake: 3 });
  } finally {
    store.db.close();
  }
});
test('Balance agents are reproducible and report actual termination, not presumed equivalence', () => {
  for (const game of ['memory_lif', 'snake']) {
    const row = simulateCompetition(game, 12);
    assert.deepEqual(simulateCompetition(game, 12), row);
    assert.ok(row.score >= 0);
    assert.ok(row.activeMs <= 180000);
    assert.ok(['time', 'wall', 'self', 'error_streak'].includes(row.reason));
  }
});
