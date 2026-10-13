import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { CompetitionStore } from './server.ts';
import {
  exportCompetitionState,
  importCompetitionState,
} from './competition-state.ts';

const data = (nickname) => ({
  name: 'Daniel Prueba',
  email: 'daniel@example.test',
  phone: '88881111',
  nickname,
  terms: true,
});
function completed(store, device, score, game = 'memory_lif') {
  const session = store.start(device, game);
  store.db
    .prepare(
      "UPDATE sessions SET status='completed',validated_score=?,raw_score=?,ended=?,reason='time' WHERE id=?",
    )
    .run(score, score, Date.now(), session.id);
  return session;
}
const registration = (store, id) =>
  store.db.prepare('SELECT * FROM registrations WHERE id=?').get(id);

test('different people on one browser retain independent registrations, scores and Top 20 eligibility', () => {
  const store = new CompetitionStore(':memory:');
  try {
    const device = store.device();
    const first = completed(store, device.id, 50000);
    store.register(device.id, first.id, data('DanielQA'));
    const original = registration(store, first.id);
    const second = completed(store, device.id, 150, 'snake');
    assert.equal(store.session(device.id, second.id).participant, null);
    const result = store.register(device.id, second.id, {
      ...data('JessQA'),
      name: 'Jessica Prueba',
      email: 'jess@example.test',
      phone: '88882222',
    });
    assert.deepEqual(registration(store, first.id), original);
    assert.notEqual(
      registration(store, second.id).participant,
      original.participant,
    );
    assert.equal(result.best, 150);
    assert.equal(result.position, 2);
    assert.equal(store.result(device.id, first.id).best, 50000);
    assert.equal(store.result(device.id, first.id).position, 1);
    assert.deepEqual(
      store.leaderboard().top.map((row) => row.nickname),
      ['DanielQA', 'JessQA'],
    );
    assert.deepEqual(store.attempts(device.id), { memory_lif: 2, snake: 2 });
  } finally {
    store.db.close();
  }
});

test('same nickname keeps each submitted record intact while one best score competes across both games', () => {
  const store = new CompetitionStore(':memory:');
  try {
    const device = store.device();
    const first = completed(store, device.id, 150);
    store.register(device.id, first.id, data('AliasQA'));
    const original = registration(store, first.id);
    const second = completed(store, device.id, 600, 'snake');
    const result = store.register(device.id, second.id, {
      ...data('AliasQA'),
      name: 'Otro nombre',
      email: 'otro@example.test',
      phone: '88883333',
    });
    assert.deepEqual(registration(store, first.id), original);
    assert.equal(
      registration(store, second.id).participant,
      original.participant,
    );
    assert.equal(registration(store, second.id).name, 'Otro nombre');
    assert.equal(
      store.db.prepare('SELECT COUNT(*) n FROM registrations').get().n,
      2,
    );
    assert.equal(store.leaderboard().total, 1);
    assert.equal(store.leaderboard().top[0].score, 600);
    assert.equal(store.leaderboard().top[0].game, 'snake');
    assert.equal(result.newBest, true);
  } finally {
    store.db.close();
  }
});

test('one submitted game is idempotent and cannot be renamed or reassigned on retry', () => {
  const store = new CompetitionStore(':memory:');
  try {
    const device = store.device(),
      session = completed(store, device.id, 150);
    const first = store.register(device.id, session.id, data('OriginalQA'));
    const before = exportCompetitionState(store);
    assert.deepEqual(
      store.register(device.id, session.id, data('OriginalQA')),
      first,
    );
    assert.equal(exportCompetitionState(store), before);
    for (const changed of [
      { nickname: 'DifferentQA' },
      { name: 'Otro nombre' },
      { email: 'other@example.test' },
      { phone: '88884444' },
    ])
      assert.throws(
        () =>
          store.register(device.id, session.id, {
            ...data('OriginalQA'),
            ...changed,
          }),
        /REGISTRATION_LOCKED/,
      );
    assert.equal(exportCompetitionState(store), before);
    assert.equal(
      store.db.prepare('SELECT COUNT(*) n FROM registrations').get().n,
      1,
    );
  } finally {
    store.db.close();
  }
});

test('anonymous and abandoned games are never retroactively assigned by another registration', () => {
  const store = new CompetitionStore(':memory:');
  try {
    const device = store.device();
    const anonymous = completed(store, device.id, 8000);
    const abandoned = store.start(device.id, 'snake');
    store.validate(device.id, abandoned.id, [], 0, 0, 'abandon');
    const current = completed(store, device.id, 300);
    const before = JSON.stringify([
      store.session(device.id, anonymous.id),
      store.session(device.id, abandoned.id),
    ]);
    store.register(device.id, current.id, data('CurrentQA'));
    assert.equal(
      JSON.stringify([
        store.session(device.id, anonymous.id),
        store.session(device.id, abandoned.id),
      ]),
      before,
    );
    assert.equal(registration(store, anonymous.id), undefined);
    assert.equal(registration(store, abandoned.id), undefined);
    assert.equal(store.leaderboard().best, 0);
    assert.equal(store.leaderboard('all', device.id).best, 300);
    assert.equal(store.leaderboard().top[0].score, 300);
  } finally {
    store.db.close();
  }
});

test('changing aliases cannot reset daily attempts or claim another browser game', () => {
  const store = new CompetitionStore(':memory:');
  try {
    const device = store.device(),
      other = store.device();
    for (let index = 0; index < 3; index++) {
      const session = completed(store, device.id, 100 + index);
      store.register(device.id, session.id, data(`Alias${index}`));
      assert.throws(
        () => store.register(other.id, session.id, data('AttackerQA')),
        /SESSION_INVALID/,
      );
    }
    assert.throws(() => store.start(device.id, 'memory_lif'), /NO_ATTEMPTS/);
    assert.equal(store.leaderboard().total, 3);
    assert.deepEqual(store.attempts(device.id), { memory_lif: 0, snake: 3 });
  } finally {
    store.db.close();
  }
});

test('legacy shared profiles and all of their game fields remain unchanged after a new registration', () => {
  const store = new CompetitionStore(':memory:');
  try {
    const device = store.device(),
      old = completed(store, device.id, 700);
    const participant = randomUUID(),
      now = Date.now();
    store.db
      .prepare('INSERT INTO participants VALUES(?,?,?,?,?,?,?,?,?,?)')
      .run(
        participant,
        device.id,
        'Perfil anterior',
        'legacy@example.test',
        '88881111',
        'LegacyQA',
        'legacyqa',
        now,
        now,
        now,
      );
    store.db
      .prepare('UPDATE sessions SET participant=? WHERE id=?')
      .run(participant, old.id);
    const oldProfile = store.db
      .prepare('SELECT * FROM participants WHERE id=?')
      .get(participant);
    const oldGame = JSON.stringify(store.session(device.id, old.id));
    const current = completed(store, device.id, 800);
    store.register(device.id, current.id, data('NewAliasQA'));
    assert.deepEqual(
      store.db
        .prepare('SELECT * FROM participants WHERE id=?')
        .get(participant),
      oldProfile,
    );
    assert.equal(JSON.stringify(store.session(device.id, old.id)), oldGame);
    assert.equal(store.leaderboard().total, 2);
    assert.throws(
      () => store.register(device.id, old.id, data('NewAliasQA')),
      /REGISTRATION_LOCKED/,
    );
  } finally {
    store.db.close();
  }
});

test('legacy snapshots load without new registration fields and new snapshots preserve every registration exactly', () => {
  const first = new CompetitionStore(':memory:'),
    second = new CompetitionStore(':memory:'),
    third = new CompetitionStore(':memory:');
  try {
    const device = first.device(),
      session = completed(first, device.id, 150);
    const legacy = JSON.parse(exportCompetitionState(first));
    delete legacy.tables.registrations;
    importCompetitionState(second, JSON.stringify(legacy));
    assert.deepEqual(
      second.session(device.id, session.id),
      first.session(device.id, session.id),
    );
    assert.equal(
      second.db.prepare('SELECT COUNT(*) n FROM registrations').get().n,
      0,
    );
    first.register(device.id, session.id, data('RoundtripQA'));
    const current = exportCompetitionState(first);
    importCompetitionState(third, current);
    assert.equal(exportCompetitionState(third), current);
    assert.equal(third.leaderboard().top[0].nickname, 'RoundtripQA');
  } finally {
    first.db.close();
    second.db.close();
    third.db.close();
  }
});
