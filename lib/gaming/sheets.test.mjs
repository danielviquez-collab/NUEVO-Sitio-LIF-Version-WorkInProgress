import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { CompetitionStore } from './server.ts';
import { CompetitionSheets } from './sheets.ts';

const endpoint = 'https://script.google.com/macros/s/test-only/exec';
const secret = 'test-only-private-secret-not-for-deployment';
function setup() {
  const store = new CompetitionStore(':memory:'),
    calls = [];
  const state = { fail: false, badAck: false, legacyReceiver: false };
  const sheets = new CompetitionSheets(
    store,
    endpoint,
    secret,
    async (url, options) => {
      const envelope = JSON.parse(options.body),
        body = JSON.parse(envelope.body);
      assert.equal(url, endpoint);
      assert.equal(
        envelope.signature,
        createHmac('sha256', secret)
          .update(`${envelope.action}\n${envelope.issuedAt}\n${envelope.body}`)
          .digest('hex'),
      );
      assert.ok(!options.body.includes(secret));
      calls.push({ action: envelope.action, body });
      if (state.fail) throw new Error('offline');
      return new Response(
        JSON.stringify(
          envelope.action === 'sync'
            ? {
                ok: true,
                contactLocationSaved: !state.legacyReceiver,
                ids: body.records.map((row) =>
                  state.badAck ? 'wrong' : row.id,
                ),
              }
            : {
                ok: true,
                ranking: {
                  top: [
                    {
                      position: 1,
                      nickname: 'Jess🏆',
                      game: 'memory_lif',
                      score: 300,
                      email: 'must-not-leak@example.test',
                    },
                  ],
                  position: null,
                  best: 0,
                  total: 1,
                },
              },
        ),
        { status: 200 },
      );
    },
  );
  return { store, calls, state, sheets };
}
function register(
  store,
  score = 100,
  nickname = 'Jess🏆',
  device = store.device().id,
) {
  const session = store.start(device, 'memory_lif');
  store.db
    .prepare(
      "UPDATE sessions SET status='completed',validated_score=?,ended=? WHERE id=?",
    )
    .run(score, Date.now(), session.id);
  store.register(device, session.id, {
    name: 'Prueba tecnica',
    email: 'test@example.test',
    phone: '88881111',
    nickname,
    terms: true,
  });
  return { session, device };
}
test('Sheet bridge sends only registered completed games and retains all separate attempts', async () => {
  const value = setup();
  try {
    const { device } = register(value.store, 100);
    register(value.store, 200, 'Jess🏆', device);
    register(value.store, 300, 'Jess✨', device);
    value.store.start(value.store.device().id, 'snake');
    await value.sheets.flush();
    const records = value.calls[0].body.records;
    assert.equal(records.length, 3);
    assert.equal(new Set(records.map((row) => row.id)).size, 3);
    assert.deepEqual(
      records.map((row) => row.score),
      [100, 200, 300],
    );
    assert.deepEqual(
      records.map((row) => row.nickname),
      ['Jess🏆', 'Jess🏆', 'Jess✨'],
    );
    assert.equal(records[0].participant, records[1].participant);
    assert.notEqual(records[0].participant, records[2].participant);
    await value.sheets.flush();
    assert.equal(value.calls.length, 1);
  } finally {
    value.store.db.close();
  }
});
test('Contact residence sends official names and requires explicit location acknowledgement', async () => {
  const value = setup();
  try {
    const saved = value.store.contact({
      request: randomUUID(),
      name: 'Prueba',
      email: 'qa@example.test',
      message: 'Mensaje tecnico.',
      consent: true,
      province: '1',
      canton: '115',
      district: '11501',
    });
    value.state.legacyReceiver = true;
    await assert.rejects(value.sheets.flush(), /SHEETS_UNAVAILABLE/);
    assert.equal(
      value.store.db.prepare('SELECT COUNT(*) n FROM sheet_sync').get().n,
      0,
    );
    const record = value.calls[0].body.records[0];
    assert.equal(record.id, saved.id);
    assert.equal(record.province, 'San José');
    assert.equal(record.canton, 'Montes de Oca');
    assert.equal(record.district, 'San Pedro');
    value.state.legacyReceiver = false;
    await value.sheets.flush();
    await value.sheets.flush();
    assert.equal(value.calls.length, 2);
  } finally {
    value.store.db.close();
  }
});
test('registering another nickname sends only its new row and never overwrites a previously synced game', async () => {
  const value = setup();
  try {
    const first = register(value.store, 100, 'DanielQA');
    await value.sheets.flush();
    const original = JSON.stringify(value.calls[0].body.records[0]);
    register(value.store, 300, 'JessicaQA', first.device);
    await value.sheets.flush();
    assert.equal(value.calls.length, 2);
    assert.equal(value.calls[1].body.records.length, 1);
    assert.equal(value.calls[1].body.records[0].nickname, 'JessicaQA');
    assert.notEqual(value.calls[1].body.records[0].id, first.session.id);
    assert.equal(JSON.stringify(value.calls[0].body.records[0]), original);
    await value.sheets.flush();
    assert.equal(value.calls.length, 2);
  } finally {
    value.store.db.close();
  }
});
test('Offline and mismatched acknowledgements preserve records for retry', async () => {
  const value = setup();
  try {
    register(value.store);
    value.state.fail = true;
    await assert.rejects(value.sheets.flush(), /SHEETS_UNAVAILABLE/);
    value.state.fail = false;
    value.state.badAck = true;
    await assert.rejects(value.sheets.flush(), /SHEETS_UNAVAILABLE/);
    assert.equal(
      value.store.db.prepare('SELECT COUNT(*) n FROM sheet_sync').get().n,
      0,
    );
    value.state.badAck = false;
    await value.sheets.flush();
    assert.equal(
      value.store.db.prepare('SELECT COUNT(*) n FROM sheet_sync').get().n,
      1,
    );
  } finally {
    value.store.db.close();
  }
});
test('Contact retries are one row and public ranking is cached and whitelisted', async () => {
  const value = setup();
  try {
    const contact = {
      request: randomUUID(),
      name: 'Prueba tecnica',
      email: 'test@example.test',
      phone: '',
      message: 'Prueba de contacto.',
      consent: true,
    };
    const first = value.store.contact(contact);
    assert.deepEqual(value.store.contact(contact), first);
    await value.sheets.flush();
    assert.equal(value.calls[0].body.kind, 'contacts');
    assert.equal(value.calls[0].body.records.length, 1);
    const device = value.store.device().id;
    const rank = await value.sheets.leaderboard('all', device, 20);
    assert.equal(value.calls.at(-1).body.game, 'unified');
    assert.equal(value.calls.at(-1).body.limit, 20);
    assert.ok(!JSON.stringify(rank).includes('must-not-leak'));
    await value.sheets.leaderboard('all', device, 20);
    assert.equal(
      value.calls.filter((row) => row.action === 'ranking').length,
      1,
    );
    register(value.store, 300, 'Jess🏆', device);
    await value.sheets.flush();
    await value.sheets.leaderboard('all', device, 20);
    assert.equal(
      value.calls.filter((row) => row.action === 'ranking').length,
      2,
    );
  } finally {
    value.store.db.close();
  }
});
