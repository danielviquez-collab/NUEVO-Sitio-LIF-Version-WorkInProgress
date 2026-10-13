import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { CompetitionStore, costaRicaDay, periodBounds } from './server.ts';
import { replayGame } from './engine.ts';

function completed(
  store,
  device,
  score = 0,
  game = 'memory_lif',
  when = Date.now(),
) {
  const s = store.start(device, game);
  store.db
    .prepare(
      "UPDATE sessions SET status='completed',validated_score=?,raw_score=?,ended=?,reason='time' WHERE id=?",
    )
    .run(score, score, when, s.id);
  return s;
}
const data = (nickname) => ({
  name: 'Persona de prueba',
  email: `${nickname}@example.test`,
  phone: '88881111',
  nickname,
  terms: true,
});
test('Costa Rica resets at midnight, not UTC; ranking has configured bounds', () => {
  assert.equal(costaRicaDay(Date.parse('2026-10-03T05:59:59Z')), '2026-10-02');
  assert.equal(costaRicaDay(Date.parse('2026-10-03T06:00:00Z')), '2026-10-03');
  const bounds = periodBounds();
  assert.ok(bounds[0] < bounds[1]);
});
test('Three separate daily attempts per game; reloads never refund; start is idempotent', () => {
  const store = new CompetitionStore(':memory:');
  try {
    const d = store.device(),
      key = randomUUID(),
      s = store.start(d.id, 'memory_lif', key);
    assert.equal(store.device(d.token).id, d.id);
    assert.equal(store.start(d.id, 'memory_lif', key).id, s.id);
    assert.deepEqual(store.attempts(d.id), { memory_lif: 2, snake: 3 });
    store.start(d.id, 'memory_lif');
    store.start(d.id, 'memory_lif');
    assert.throws(() => store.start(d.id, 'memory_lif'), /NO_ATTEMPTS/);
    assert.equal(store.attempts(d.id).snake, 3);
    assert.equal(
      store.db
        .prepare('SELECT COUNT(*) n FROM sessions WHERE device=?')
        .get(d.id).n,
      3,
    );
    store.db
      .prepare("UPDATE sessions SET day='2026-09-01' WHERE device=?")
      .run(d.id);
    assert.equal(store.attempts(d.id).memory_lif, 3);
  } finally {
    store.db.close();
  }
});
test('Server recomputes scores, rejects impossible times and session ownership', () => {
  const store = new CompetitionStore(':memory:'),
    d = store.device(),
    other = store.device();
  try {
    const s = store.start(d.id, 'snake');
    assert.throws(
      () => store.validate(other.id, s.id, [], 20, 0, 'checkpoint'),
      /SESSION_INVALID/,
    );
    assert.throws(
      () => store.validate(d.id, s.id, [], 20, 999, 'checkpoint'),
      /SCORE_INVALID/,
    );
    assert.throws(
      () => store.validate(d.id, s.id, [], 180000, 0, 'checkpoint'),
      /TIME_INVALID/,
    );
    assert.throws(
      () =>
        store.validate(
          d.id,
          s.id,
          [{ at: 19, direction: 'up' }],
          20,
          0,
          'checkpoint',
        ),
      /INPUT_INVALID/,
    );
    assert.throws(
      () => store.validate(d.id, s.id, [], 20, 0, 'finish'),
      /GAME_NOT_FINISHED/,
    );
    const state = replayGame('snake', s.seed, [], 3600000);
    store.db
      .prepare('UPDATE sessions SET started=? WHERE id=?')
      .run(Date.now() - state.ms, s.id);
    const result = store.validate(
      d.id,
      s.id,
      [],
      state.ms,
      state.score,
      'finish',
    );
    assert.equal(result.reason, 'wall');
    assert.equal(
      store.validate(d.id, s.id, [], state.ms, state.score, 'finish').id,
      s.id,
    );
    assert.deepEqual(store.validate(d.id, s.id, [], 20, 0, 'checkpoint'), {
      saved: true,
    });
  } finally {
    store.db.close();
  }
});
test('Checkpoint prefix cannot be rewritten; abandon is stored and consumes an attempt', () => {
  const store = new CompetitionStore(':memory:'),
    d = store.device();
  try {
    const s = store.start(d.id, 'memory_lif'),
      inputs = [{ at: 0, slot: 1 }];
    const state = replayGame('memory_lif', s.seed, inputs, 1000);
    store.validate(d.id, s.id, inputs, 1000, state.score, 'checkpoint');
    assert.throws(
      () =>
        store.validate(
          d.id,
          s.id,
          [{ at: 0, slot: 4 }],
          1000,
          state.score,
          'checkpoint',
        ),
      /INPUT_REWRITTEN/,
    );
    store.validate(d.id, s.id, inputs, 1000, state.score, 'abandon');
    assert.equal(store.session(d.id, s.id).status, 'abandoned');
    assert.equal(store.attempts(d.id).memory_lif, 2);
  } finally {
    store.db.close();
  }
});
test('Historical lower scores remain; best is MAX, not cumulative; tied scores are not new records', () => {
  const store = new CompetitionStore(':memory:'),
    d = store.device();
  try {
    const first = completed(store, d.id, 500);
    store.register(d.id, first.id, data('Marca'));
    const second = completed(store, d.id, 100);
    const third = completed(store, d.id, 500);
    store.register(d.id, second.id, data('Marca'));
    store.register(d.id, third.id, data('Marca'));
    assert.equal(store.result(d.id, second.id).best, 500);
    assert.equal(store.result(d.id, second.id).newBest, false);
    assert.equal(store.result(d.id, third.id).newBest, false);
    assert.equal(store.leaderboard('memory_lif', d.id).top.length, 1);
    assert.equal(store.leaderboard('memory_lif', d.id).best, 500);
    assert.equal(
      store.db.prepare('SELECT COUNT(*) n FROM sessions').get().n,
      3,
    );
  } finally {
    store.db.close();
  }
});
test('Top twenty deduplicates participants, respects first achievement and returns private position outside twenty', () => {
  const store = new CompetitionStore(':memory:');
  try {
    const people = [];
    for (let i = 0; i < 22; i++) {
      const d = store.device(),
        s = completed(store, d.id, 2000 - i * 50, 'memory_lif', Date.now() + i);
      store.register(d.id, s.id, data(`Player${i}`));
      people.push(d);
    }
    const rank = store.leaderboard('memory_lif', people[21].id);
    assert.equal(rank.top.length, 20);
    assert.equal(rank.position, 22);
    assert.equal(rank.total, 22);
    assert.equal(rank.top[0].nickname, 'Player0');
    assert.equal(new Set(rank.top.map((r) => r.nickname)).size, 20);
    assert.deepEqual(Object.keys(rank.top[0]).sort(), [
      'game',
      'nickname',
      'position',
      'score',
    ]);
    assert.equal(store.leaderboard('snake').total, 0);
    completed(store, people[1].id, 2000, 'memory_lif', Date.now() + 100);
    assert.equal(store.leaderboard('memory_lif').top[0].nickname, 'Player0');
  } finally {
    store.db.close();
  }
});
test("Unified ranking uses each participant's single best score across both games", () => {
  const store = new CompetitionStore(':memory:'),
    d = store.device();
  try {
    const catchGame = completed(store, d.id, 500);
    store.register(d.id, catchGame.id, data('Unified'));
    const snake = completed(store, d.id, 900, 'snake');
    store.register(d.id, snake.id, data('Unified'));
    const rank = store.leaderboard('all', d.id);
    assert.equal(rank.top.length, 1);
    assert.equal(rank.best, 900);
    assert.equal(store.leaderboard('snake', d.id).best, 900);
    assert.equal(rank.top[0].game, 'snake');
    assert.equal(rank.position, 1);
  } finally {
    store.db.close();
  }
});
test('Returning browser identity recognizes past scores without a new game; another device stays anonymous', () => {
  const store = new CompetitionStore(':memory:');
  try {
    const original = store.device();
    const session = completed(store, original.id, 900);
    store.register(original.id, session.id, data('Returning'));
    const returning = store.device(original.token);
    const ranking = store.leaderboard('all', returning.id, 20);
    assert.equal(returning.id, original.id);
    assert.equal(ranking.position, 1);
    assert.equal(ranking.best, 900);
    assert.equal(ranking.top[0].nickname, 'Returning');
    const otherDevice = store.leaderboard('all', store.device().id, 20);
    assert.deepEqual(otherDevice.top, ranking.top);
    assert.equal(otherDevice.position, null);
    assert.equal(otherDevice.best, 0);
    assert.equal(
      store.db.prepare('SELECT COUNT(*) n FROM sessions').get().n,
      1,
    );
  } finally {
    store.db.close();
  }
});
test('Public rankings always cap at twenty without exposing private data', () => {
  const store = new CompetitionStore(':memory:');
  try {
    let last;
    for (let i = 0; i < 22; i++) {
      const device = store.device();
      const session = completed(store, device.id, 2000 - i * 20);
      store.register(device.id, session.id, data(`Twenty${i}`));
      last = device;
    }
    assert.equal(store.leaderboard().top.length, 20);
    const ranking = store.leaderboard('all', last.id, 20);
    assert.equal(ranking.top.length, 20);
    assert.equal(ranking.position, 22);
    assert.equal(ranking.total, 22);
    assert.equal(ranking.top[19].position, 20);
    assert.equal(store.leaderboard('all', undefined, 1000).top.length, 20);
    assert.equal(store.leaderboard('all', undefined, NaN).top.length, 20);
    assert.deepEqual(Object.keys(ranking.top[0]).sort(), [
      'game',
      'nickname',
      'position',
      'score',
    ]);
  } finally {
    store.db.close();
  }
});
test('Contact saves privately, retries idempotently and requires consent and valid fields', () => {
  const store = new CompetitionStore(':memory:');
  try {
    const message = {
      request: randomUUID(),
      name: 'Prueba',
      email: 'qa@example.test',
      phone: '',
      message: 'Mensaje de prueba local.',
      consent: true,
      website: '',
    };
    assert.throws(
      () => store.contact({ ...message, consent: false }),
      /INPUT_INVALID/,
    );
    assert.throws(
      () => store.contact({ ...message, website: 'bot' }),
      /INPUT_INVALID/,
    );
    const a = store.contact(message),
      b = store.contact(message);
    assert.deepEqual(a, b);
    assert.equal(
      store.db.prepare('SELECT COUNT(*) n FROM contact_messages').get().n,
      1,
    );
    assert.deepEqual(Object.keys(a).sort(), ['id', 'saved']);
  } finally {
    store.db.close();
  }
});
test('Registration requires consent, rejects duplicate nickname and links only the submitted game', () => {
  const store = new CompetitionStore(':memory:'),
    d = store.device(),
    other = store.device();
  try {
    const first = completed(store, d.id, 150),
      second = completed(store, d.id, 50);
    assert.throws(
      () => store.register(d.id, first.id, { ...data('Alias'), terms: false }),
      /REGISTRATION_INVALID/,
    );
    store.register(d.id, second.id, data('Alias'));
    assert.equal(store.session(d.id, first.id).participant, null);
    assert.equal(
      store.db.prepare('SELECT id FROM registrations WHERE id=?').get(first.id),
      undefined,
    );
    assert.equal(
      store.db.prepare('SELECT id FROM registrations WHERE id=?').get(second.id)
        .id,
      second.id,
    );
    const duplicate = completed(store, other.id, 200);
    assert.throws(
      () => store.register(other.id, duplicate.id, data('Alias')),
      /NICKNAME_TAKEN/,
    );
    assert.equal(store.leaderboard('memory_lif', d.id).best, 50);
  } finally {
    store.db.close();
  }
});

test('Registration accepts emoji nicknames with 2-12 graphemes and never truncates overlong submissions', () => {
  const store = new CompetitionStore(':memory:');
  try {
    const device = store.device();
    const session = completed(store, device.id, 150);
    for (const nickname of ['🏆', 'A'.repeat(13), '👩🏽‍🚀'.repeat(13), 'A\u202eB'])
      assert.throws(
        () =>
          store.register(device.id, session.id, { ...data('Alias'), nickname }),
        /REGISTRATION_INVALID/,
      );
    const nickname = '👩🏽‍🚀'.repeat(12);
    store.register(device.id, session.id, { ...data('Alias'), nickname });
    assert.equal(store.leaderboard('memory_lif').top[0].nickname, nickname);
    assert.equal(
      store.db.prepare('SELECT COUNT(*) n FROM registrations').get().n,
      1,
    );
  } finally {
    store.db.close();
  }
});

test('Emoji nickname uniqueness ignores casing and canonically equivalent accents', () => {
  const store = new CompetitionStore(':memory:');
  try {
    const first = store.device();
    const other = store.device();
    const session = completed(store, first.id, 150);
    const duplicate = completed(store, other.id, 200);
    store.register(first.id, session.id, {
      ...data('Alias'),
      nickname: '  José 🏆  ',
    });
    assert.equal(store.leaderboard('memory_lif').top[0].nickname, 'José 🏆');
    assert.throws(
      () =>
        store.register(other.id, duplicate.id, {
          ...data('Other'),
          nickname: 'JOSE\u0301 🏆',
        }),
      /NICKNAME_TAKEN/,
    );
  } finally {
    store.db.close();
  }
});
