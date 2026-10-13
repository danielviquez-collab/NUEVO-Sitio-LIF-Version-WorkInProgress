import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { CompetitionStore } from './server.ts';
import {
  exportCompetitionState,
  importCompetitionState,
  GoogleCompetitionState,
} from './competition-state.ts';
import { createNetlifyApi, syncNetlifyRecords } from './netlify-api.ts';
import defaultHandler from '../../netlify/functions/lif-api.ts';
import { previewLeaderboard } from './leaderboard-preview.ts';

const emptyRank = {
  top: [],
  position: null,
  best: 0,
  total: 0,
  period: 'campaign',
};
function fixture() {
  let revision = 0,
    snapshot = null;
  const events = [];
  const state = {
    async load() {
      events.push('load');
      return { revision, snapshot };
    },
    async save(expected, next) {
      events.push('save');
      if (expected !== revision) return { saved: false, revision };
      snapshot = next;
      return { saved: true, revision: ++revision };
    },
  };
  return {
    state,
    events,
    sheets: () => ({
      async flush() {
        events.push('flush');
      },
      async leaderboard() {
        return emptyRank;
      },
    }),
  };
}
function req(path, body, cookie) {
  return new Request(`https://lif.example${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

test('Public ranking reads preserve the snapshot without identities, attempts, writes or Sheets flushes', async () => {
  const f = fixture();
  const response = await createNetlifyApi(f)(req('/api/games/ranking'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('set-cookie'), null);
  assert.deepEqual(await response.json(), previewLeaderboard(emptyRank));
  assert.deepEqual(f.events, ['load']);
});

test('state roundtrip preserves devices, attempts, sessions, requests, contacts and acknowledgements', () => {
  const first = new CompetitionStore(':memory:'),
    second = new CompetitionStore(':memory:');
  try {
    const device = first.device();
    const request = randomUUID();
    const session = first.start(device.id, 'snake', request);
    first.contact({
      request: randomUUID(),
      name: 'Prueba',
      email: 'qa@example.test',
      message: 'Mensaje tecnico',
      consent: true,
    });
    first.db
      .prepare('INSERT INTO sheet_sync VALUES(?,?,?)')
      .run('contacts', randomUUID(), 'hash');
    const snapshot = exportCompetitionState(first);
    importCompetitionState(second, snapshot);
    assert.equal(exportCompetitionState(second), snapshot);
    assert.equal(second.device(device.token).id, device.id);
    assert.equal(second.start(device.id, 'snake', request).id, session.id);
    assert.equal(second.attempts(device.id).snake, 2);
  } finally {
    first.db.close();
    second.db.close();
  }
});

test('corrupt snapshots fail closed and roll back partially restored tables', () => {
  const store = new CompetitionStore(':memory:');
  try {
    const clean = exportCompetitionState(store);
    const bad = JSON.parse(clean);
    bad.tables.devices = [
      { id: randomUUID(), token: 'test', created: Date.now() },
    ];
    bad.tables.sessions = [{ unexpected: 'SQL is not accepted' }];
    assert.throws(
      () => importCompetitionState(store, JSON.stringify(bad)),
      /STATE_CORRUPT/,
    );
    assert.equal(exportCompetitionState(store), clean);
    assert.throws(() => importCompetitionState(store, ''), /STATE_CORRUPT/);
    assert.throws(
      () => importCompetitionState(store, JSON.stringify({ version: 999 })),
      /STATE_CORRUPT/,
    );
  } finally {
    store.db.close();
  }
});

test('cold invocations retain ownership and retrying start consumes only one attempt', async () => {
  const deps = fixture();
  const bootstrap = await createNetlifyApi(deps)(req('/api/games/bootstrap'));
  const cookie = bootstrap.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly.*SameSite=Strict.*Secure/);
  const owner = (await bootstrap.json()).deviceId;
  const body = { game: 'snake', request: randomUUID() };
  const first = await (
    await createNetlifyApi(deps)(req('/api/games/start', body, cookie))
  ).json();
  const second = await (
    await createNetlifyApi(deps)(
      req('/.netlify/functions/lif-api/games/start', body, cookie),
    )
  ).json();
  assert.deepEqual(second, first);
  const reload = await (
    await createNetlifyApi(deps)(req('/api/games/bootstrap', undefined, cookie))
  ).json();
  assert.equal(reload.deviceId, owner);
  assert.equal(reload.attempts.snake, 2);
  assert.ok(deps.events.indexOf('save') < deps.events.indexOf('flush'));
});

test('simultaneous starts are serialized by revision and never exceed the daily limit', async () => {
  const deps = fixture();
  const bootstrap = await createNetlifyApi(deps)(req('/api/games/bootstrap'));
  const cookie = bootstrap.headers.get('set-cookie');
  const results = await Promise.all(
    Array.from({ length: 4 }, () =>
      createNetlifyApi(deps)(
        req(
          '/api/games/start',
          { game: 'memory_lif', request: randomUUID() },
          cookie,
        ),
      ),
    ),
  );
  assert.deepEqual(
    results.map((result) => result.status).sort((a, b) => a - b),
    [200, 200, 200, 422],
  );
  const saved = await deps.state.load();
  assert.equal(JSON.parse(saved.snapshot).tables.sessions.length, 3);
});

test('contact persists before sheet sync and is not duplicated after a failed acknowledgement', async () => {
  const deps = fixture();
  let offline = true;
  deps.sheets = (store) => ({
    async flush() {
      if (offline) throw new Error('unavailable');
      const row = store.db.prepare('SELECT id FROM contact_messages').get();
      store.db
        .prepare('INSERT OR IGNORE INTO sheet_sync VALUES(?,?,?)')
        .run('contacts', row.id, 'confirmed');
    },
    async leaderboard() {
      return emptyRank;
    },
  });
  const body = {
    request: randomUUID(),
    name: 'Prueba',
    email: 'qa@example.test',
    message: 'Mensaje tecnico',
    consent: true,
  };
  assert.equal(
    (await createNetlifyApi(deps)(req('/api/contact', body))).status,
    503,
  );
  offline = false;
  assert.equal(
    (await createNetlifyApi(deps)(req('/api/contact', body))).status,
    200,
  );
  const tables = JSON.parse((await deps.state.load()).snapshot).tables;
  assert.equal(tables.contact_messages.length, 1);
  assert.equal(tables.sheet_sync.length, 1);
  await syncNetlifyRecords(deps);
});

test('registered nicknames, emoji and best score survive cold invocations without exposing contact fields', async () => {
  const deps = fixture(),
    store = new CompetitionStore(':memory:');
  const device = store.device();
  const session = store.start(device.id, 'memory_lif');
  store.db
    .prepare(
      "UPDATE sessions SET status='completed',validated_score=3900,raw_score=3900,ended=?,reason='time' WHERE id=?",
    )
    .run(Date.now(), session.id);
  await deps.state.save(0, exportCompetitionState(store));
  store.db.close();
  const cookie = `lif_game_device=${device.token}`;
  const registration = {
    id: session.id,
    name: 'Persona de prueba',
    email: 'qa@example.test',
    phone: '88881111',
    nickname: 'Jess🏆',
    terms: true,
  };
  const result = await createNetlifyApi(deps)(
    req('/api/games/register', registration, cookie),
  );
  assert.equal(result.status, 200);
  assert.equal((await result.json()).score, 3900);
  const restored = await (
    await createNetlifyApi(deps)(req('/api/games/bootstrap', undefined, cookie))
  ).json();
  assert.deepEqual(restored.participant, { nickname: 'Jess🏆' });
  assert.equal(JSON.stringify(restored).includes('qa@example.test'), false);
  const tables = JSON.parse((await deps.state.load()).snapshot).tables;
  assert.equal(tables.participants.length, 0);
  assert.equal(tables.registrations.length, 1);
  assert.equal(tables.registrations[0].id, tables.sessions[0].id);
  assert.equal(tables.sessions[0].participant, null);
});

test('ranking is read from the shared sheet, never from a temporary local database', async () => {
  const deps = fixture();
  const ranking = {
    ...emptyRank,
    top: [{ nickname: 'Jess🏆', game: 'memory_lif', score: 3900, position: 1 }],
    total: 1,
  };
  deps.sheets = () => ({
    async flush() {},
    async leaderboard() {
      return ranking;
    },
  });
  const response = await createNetlifyApi(deps)(
    req('/api/games/leaderboard?game=all&limit=20'),
  );
  assert.deepEqual(await response.json(), previewLeaderboard(ranking));
});

test('origin, method, size and configuration errors do not disclose private data', async () => {
  const deps = fixture(),
    api = createNetlifyApi(deps);
  const crossOrigin = new Request('https://lif.example/api/games/bootstrap', {
    headers: { origin: 'https://evil.example' },
  });
  assert.equal((await api(crossOrigin)).status, 403);
  assert.equal(deps.events.length, 0);
  assert.equal((await api(req('/api/games/start'))).status, 405);
  assert.equal(
    (await api(req('/api/contact', { text: 'x'.repeat(1000001) }))).status,
    413,
  );
  deps.state.load = async () => {
    throw new Error('private-key-and-records');
  };
  const unavailable = await api(req('/api/games/bootstrap'));
  assert.equal(unavailable.status, 503);
  assert.equal(await unavailable.text(), '{"error":"SHEETS_UNAVAILABLE"}');
  assert.equal((await defaultHandler(req('/api/games/bootstrap'))).status, 503);
});

test('unconfirmed durable commit never returns success or an ownership cookie', async () => {
  const deps = fixture();
  deps.state.save = async () => {
    throw new Error('private transport error');
  };
  const response = await createNetlifyApi(deps)(req('/api/games/bootstrap'));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('set-cookie'), null);
});

test('state transport rejects inconsistent remote revisions and missing snapshots', async () => {
  const state = new GoogleCompetitionState({
    async call() {
      return { ok: true, revision: 1, snapshot: null };
    },
  });
  await assert.rejects(state.load(), /STATE_CORRUPT/);
  await assert.rejects(state.save(1, 'test'), /STATE_CORRUPT/);
});
