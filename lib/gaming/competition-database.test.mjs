import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, X509Certificate } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { SUPABASE_ROOT_CA } from './supabase-ca.ts';
import { CompetitionStore } from './server.ts';
import {
  exportCompetitionState,
  importCompetitionState,
} from './competition-state.ts';
import {
  PostgresCompetitionDatabase,
  databaseSchema,
  snapshotProof,
} from './competition-database.ts';
import { createNetlifyApi, syncNetlifyRecords } from './netlify-api.ts';

test('Supabase uses its official root certificate without disabling TLS verification', () => {
  const certificate = new X509Certificate(SUPABASE_ROOT_CA);
  assert.equal(certificate.ca, true);
  assert.match(certificate.subject, /Supabase Root 2021 CA/);
  assert.equal(certificate.subject, certificate.issuer);
  assert.ok(certificate.verify(certificate.publicKey));
  const source = readFileSync(
    new URL('./competition-database.ts', import.meta.url),
    'utf8',
  );
  assert.match(
    source,
    /ssl: \{ rejectUnauthorized: true, ca: SUPABASE_ROOT_CA \}/,
  );
  assert.doesNotMatch(
    source,
    /rejectUnauthorized: false|NODE_TLS_REJECT_UNAUTHORIZED/,
  );
});

function fixture() {
  const empty = new CompetitionStore(':memory:');
  let saved = exportCompetitionState(empty);
  empty.db.close();
  let sealed = false,
    working;
  const queries = [];
  const client = {
    async query(sql, values = []) {
      queries.push(sql);
      if (sql === 'BEGIN') working = JSON.parse(saved);
      if (sql === 'COMMIT') saved = JSON.stringify(working);
      if (sql === 'ROLLBACK') working = undefined;
      if (sql.startsWith('SELECT id FROM lif_game.migration'))
        return { rows: sealed ? [{ id: 1 }] : [] };
      if (sql.startsWith('INSERT INTO lif_game.migration')) {
        sealed = true;
        return { rows: [] };
      }
      if (/^SELECT .* FROM lif_game\./.test(sql)) {
        const table = /FROM lif_game\.(\w+)/.exec(sql)[1];
        return { rows: working.tables[table].map((row) => ({ ...row })) };
      }
      if (/^INSERT INTO lif_game\./.test(sql)) {
        const table = /INSERT INTO lif_game\.(\w+)/.exec(sql)[1];
        const keys = /ON CONFLICT\(([^)]+)\)/.exec(sql)[1].split(',');
        for (const row of JSON.parse(values[0])) {
          const index = working.tables[table].findIndex((old) =>
            keys.every((key) => old[key] === row[key]),
          );
          if (index < 0) working.tables[table].push(row);
          else working.tables[table][index] = row;
        }
      }
      return { rows: [] };
    },
    release() {
      queries.push('RELEASE');
    },
  };
  const database = new PostgresCompetitionDatabase({
    async connect() {
      return client;
    },
  });
  return { database, queries, snapshot: () => saved };
}
function source() {
  const store = new CompetitionStore(':memory:');
  const device = store.device();
  const session = store.start(device.id, 'memory_lif');
  store.db
    .prepare(
      "UPDATE sessions SET status='completed',ended=?,validated_score=3900,raw_score=3900,reason='time' WHERE id=?",
    )
    .run(Date.now(), session.id);
  store.register(device.id, session.id, {
    name: 'Prueba',
    email: 'qa@example.test',
    phone: '88881111',
    nickname: 'Prueba',
    terms: true,
  });
  return { store, device, session, snapshot: exportCompetitionState(store) };
}
const request = (path, body, cookie) =>
  new Request(`https://lif.example${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

test('migration preserves every field including historical consent timestamps and seals a second import', async () => {
  const f = fixture(),
    s = source();
  try {
    const result = await f.database.importHistory(
      s.snapshot,
      275,
      async () => {},
    );
    assert.equal(result.fingerprint, snapshotProof(s.snapshot).fingerprint);
    assert.deepEqual(
      snapshotProof(await f.database.snapshot()),
      snapshotProof(s.snapshot),
    );
    await assert.rejects(
      f.database.importHistory(s.snapshot, 276, async () => {}),
      /SEALED/,
    );
  } finally {
    s.store.db.close();
  }
});

test('delta writes only changed tables and rolls back on validation failure', async () => {
  const f = fixture(),
    s = source();
  try {
    await f.database.importHistory(s.snapshot, 1, async () => {});
    f.queries.length = 0;
    await f.database.transact(async (store) =>
      store.start(s.device.id, 'snake', randomUUID()),
    );
    const writes = f.queries.filter((q) => q.startsWith('INSERT'));
    assert.ok(writes.some((q) => q.includes('sessions')));
    assert.ok(writes.some((q) => q.includes('start_requests')));
    assert.equal(
      writes.some((q) => q.includes('participants')),
      false,
    );
    const before = f.snapshot();
    await assert.rejects(
      f.database.transact(async (store) => {
        store.device();
        throw new Error('validation');
      }),
      /validation/,
    );
    assert.equal(f.snapshot(), before);
    assert.equal(f.queries.at(-2), 'ROLLBACK');
    assert.equal(f.queries.at(-1), 'RELEASE');
  } finally {
    s.store.db.close();
  }
});

test('Sheets can be completely offline without delaying or failing registration and ranking', async () => {
  const f = fixture(),
    s = source();
  try {
    await f.database.importHistory(s.snapshot, 1, async () => {});
    const deps = {
      database: f.database,
      state: {
        load() {
          throw Error('legacy state must not be used');
        },
      },
      sheets() {
        throw Error('Sheets must not be used');
      },
    };
    const api = createNetlifyApi(deps),
      cookie = `lif_game_device=${s.device.token}`;
    const rank = await api(
      request('/api/games/leaderboard?game=all&limit=20', undefined, cookie),
    );
    assert.equal(rank.status, 200);
    const text = await rank.text();
    assert.equal(JSON.parse(text).top[0].score, 3900);
    assert.equal(text.includes('qa@example.test'), false);
    const form = await api(
      request('/api/contact', {
        request: randomUUID(),
        name: 'Prueba',
        email: 'qa@example.test',
        message: 'Mensaje tecnico',
        consent: true,
      }),
    );
    assert.equal(form.status, 200);
    assert.equal(JSON.parse(f.snapshot()).tables.contact_messages.length, 1);
  } finally {
    s.store.db.close();
  }
});

test('Trial registrations progressively replace references and result positions match the public Top 20', async () => {
  const f = fixture(),
    s = source();
  try {
    await f.database.importHistory(s.snapshot, 1, async () => {});
    const deps = {
      database: f.database,
      state: {
        load() {
          throw Error('legacy disabled');
        },
        save() {
          throw Error('legacy disabled');
        },
      },
      sheets() {
        throw Error('Sheets cannot be on the gameplay path');
      },
    };
    const api = createNetlifyApi(deps);
    const cookie = `lif_game_device=${s.device.token}`;
    const savedHistory = JSON.parse(await f.database.snapshot());
    for (const [nickname, score] of [
      ['ClienteUno', 100],
      ['ClienteDos', 4500],
    ]) {
      const game = await f.database.transact(async (store) => {
        const session = store.start(s.device.id, 'snake', randomUUID());
        store.db
          .prepare(
            "UPDATE sessions SET status='completed',ended=?,validated_score=?,raw_score=?,reason='time' WHERE id=?",
          )
          .run(Date.now(), score, score, session.id);
        return session;
      });
      const registration = await api(
        new Request('https://lif.example/api/games/register', {
          method: 'POST',
          headers: { cookie, 'content-type': 'application/json' },
          body: JSON.stringify({
            id: game.id,
            name: 'Cliente',
            email: 'client@example.test',
            phone: '88888888',
            nickname,
            terms: true,
          }),
        }),
      );
      assert.equal(registration.status, 200);
      const result = await registration.json();
      const response = await api(
        new Request(
          'https://lif.example/api/games/leaderboard?game=all&limit=20',
          { headers: { cookie } },
        ),
      );
      const ranking = await response.json();
      assert.equal(ranking.top.length, 20);
      assert.equal(
        ranking.top.find((row) => row.nickname === nickname).position,
        result.position,
      );
      assert.equal(
        ranking.top.find((row) => row.nickname === nickname).score,
        score,
      );
      assert.ok(result.position === (score === 100 ? 20 : 1));
    }
    const after = JSON.parse(await f.database.snapshot());
    for (const row of savedHistory.tables.registrations)
      assert.deepEqual(
        after.tables.registrations.find((next) => next.id === row.id),
        row,
      );
    assert.ok(
      after.tables.sessions.length > savedHistory.tables.sessions.length,
    );
  } finally {
    s.store.db.close();
  }
});

test('failed database commit does not return an ownership cookie or fall back to Sheets', async () => {
  const api = createNetlifyApi({
    database: {
      async transact(operation) {
        const store = new CompetitionStore(':memory:');
        try {
          await operation(store);
          throw new Error('private-password');
        } finally {
          store.db.close();
        }
      },
    },
    sheets() {
      throw Error('no fallback');
    },
    state: {},
  });
  const response = await api(request('/api/games/bootstrap'));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('set-cookie'), null);
  assert.deepEqual(await response.json(), { error: 'STORAGE_UNAVAILABLE' });
});

test('report sync persists successful acknowledgements even if a later batch fails, without overwriting newer records', async () => {
  const f = fixture(),
    s = source();
  try {
    await f.database.importHistory(s.snapshot, 1, async () => {});
    await assert.rejects(
      syncNetlifyRecords({
        database: f.database,
        state: {},
        sheets: (store) => ({
          async flush() {
            await f.database.transact(async (live) => live.device());
            store.db
              .prepare('INSERT INTO sheet_sync VALUES(?,?,?)')
              .run('games', s.session.id, 'confirmed');
            throw Error('Sheets offline');
          },
        }),
      }),
      /offline/,
    );
    const data = JSON.parse(f.snapshot()).tables;
    assert.equal(data.devices.length, 2);
    assert.equal(data.sheet_sync.length, 1);
  } finally {
    s.store.db.close();
  }
});

test('private database tables have RLS enabled and no public-role grants', () => {
  for (const table of [
    'devices',
    'participants',
    'sessions',
    'start_requests',
    'contact_messages',
    'sheet_sync',
    'registrations',
    'migration',
  ])
    assert.ok(
      databaseSchema.includes(
        `ALTER TABLE lif_game.${table} ENABLE ROW LEVEL SECURITY`,
      ),
    );
  assert.match(
    databaseSchema,
    /REVOKE ALL ON ALL TABLES IN SCHEMA lif_game FROM PUBLIC, anon, authenticated/,
  );
  assert.equal(databaseSchema.includes('CREATE POLICY'), false);
});
test('Postgres rejects any attempt to rewrite a previously confirmed registration', async () => {
  const f = fixture(),
    s = source();
  try {
    await f.database.importHistory(s.snapshot, 1, async () => {});
    const before = f.snapshot();
    await assert.rejects(
      f.database.transact(async (store) => {
        store.db
          .prepare('UPDATE registrations SET name=? WHERE id=?')
          .run('Rewritten name', s.session.id);
      }),
      /DATABASE_REGISTRATION_IMMUTABLE/,
    );
    assert.equal(f.snapshot(), before);
  } finally {
    s.store.db.close();
  }
});
