import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { CompetitionStore } from './server.ts';
import { GAME_CONFIG } from './config.ts';
import { exportCompetitionState } from './competition-state.ts';
import { createCompetitionDatabase } from './competition-database.ts';
import {
  createLocalDatabaseApi,
  localDatabasePassword,
} from './local-database.ts';
import { localApiBridge } from './local-api-bridge.ts';

const env = {
  LIF_DATABASE_HOST: 'database.example.test',
  LIF_DATABASE_USER: 'local-test',
};
const request = (path, body, cookie) =>
  new Request(`http://localhost:3000${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(cookie ? { cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
function fixture(configuration = env) {
  const store = new CompetitionStore(':memory:');
  const calls = { password: 0, factory: 0, closed: 0 };
  const service = createLocalDatabaseApi(configuration, {
    async readPassword() {
      calls.password++;
      return 'test-password-not-a-real-secret';
    },
    createDatabase(config) {
      calls.factory++;
      assert.equal(
        config.LIF_DATABASE_PASSWORD,
        'test-password-not-a-real-secret',
      );
      return {
        async transact(operation) {
          return operation(store);
        },
        async snapshot() {
          return exportCompetitionState(store);
        },
        async acknowledge() {},
        async close() {
          calls.closed++;
          store.db.close();
        },
      };
    },
  });
  return { store, service, calls };
}

async function inMode(mode, operation) {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = mode;
  try {
    return await operation();
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
}

void test('local testing unlocks both exhausted games, keeps ownership/history and validates each new session', async () => {
  const f = fixture();
  try {
    const device = f.store.device();
    const cookie = `lif_game_device=${device.token}`;
    for (const game of ['memory_lif', 'snake']) {
      for (let index = 0; index < 3; index++) {
        const session = f.store.start(device.id, game);
        f.store.validate(device.id, session.id, [], 0, 0, 'abandon');
      }
    }
    const history = f.store.db.prepare('SELECT * FROM sessions').all();
    assert.deepEqual(f.store.attempts(device.id), { memory_lif: 0, snake: 0 });
    await inMode('development', async () => {
      const bootstrap = await f.service.request(
        request('/api/games/bootstrap', undefined, cookie),
      );
      const data = await bootstrap.json();
      assert.equal(data.deviceId, device.id);
      assert.equal(bootstrap.headers.get('set-cookie'), null);
      assert.equal(data.localTesting, true);
      assert.deepEqual(data.attempts, { memory_lif: 3, snake: 3 });
      for (const game of ['memory_lif', 'snake']) {
        for (let index = 0; index < 5; index++) {
          const body = { game, request: randomUUID() };
          const start = await f.service.request(
            request('/api/games/start', body, cookie),
          );
          assert.equal(start.status, 200);
          const session = await start.json();
          assert.equal(session.attempt, 4 + index);
          const retry = await f.service.request(
            request('/api/games/start', body, cookie),
          );
          assert.deepEqual(await retry.json(), session);
          const invalid = await f.service.request(
            request(
              '/api/games/checkpoint',
              {
                id: session.id,
                inputs: [],
                simMs: 0,
                score: 999,
              },
              cookie,
            ),
          );
          assert.equal(invalid.status, 422);
          const result = await f.service.request(
            request(
              '/api/games/abandon',
              {
                id: session.id,
                inputs: [],
                simMs: 0,
                score: 0,
              },
              cookie,
            ),
          );
          assert.equal(result.status, 200);
          assert.deepEqual((await result.json()).attempts, {
            memory_lif: 3,
            snake: 3,
          });
        }
      }
    });
    assert.deepEqual(
      f.store.db.prepare('SELECT * FROM sessions LIMIT 6').all(),
      history,
    );
    assert.equal(
      f.store.db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n,
      16,
    );
    assert.equal(
      f.store.db.prepare('SELECT COUNT(*) AS n FROM devices').get().n,
      1,
    );
    assert.deepEqual(f.store.attempts(device.id), { memory_lif: 0, snake: 0 });
  } finally {
    await f.service.close();
  }
});

void test('testing cannot be enabled in production, on published/lookalike hosts or HTTPS, or by request data', async () => {
  for (const [mode, base] of [
    ['production', 'http://localhost:3000'],
    ['development', 'https://localhost:3000'],
    ['development', 'https://lifnewsitev1.netlify.app'],
    ['development', 'http://localhost.evil.test:3000'],
    ['development', 'http://192.168.1.10:3000'],
  ]) {
    const f = fixture();
    try {
      const device = f.store.device();
      const cookie = `lif_game_device=${device.token}`;
      for (let index = 0; index < 3; index++) {
        const session = f.store.start(device.id, 'snake');
        f.store.validate(device.id, session.id, [], 0, 0, 'abandon');
      }
      await inMode(mode, async () => {
        const bootstrap = await f.service.request(
          new Request(`${base}/api/games/bootstrap`, {
            headers: { cookie },
          }),
        );
        const data = await bootstrap.json();
        assert.equal(data.localTesting, undefined);
        assert.equal(data.attempts.snake, 0);
        const result = await f.service.request(
          new Request(`${base}/api/games/start`, {
            method: 'POST',
            headers: { cookie, 'content-type': 'application/json' },
            body: JSON.stringify({
              game: 'snake',
              request: randomUUID(),
              localTesting: true,
            }),
          }),
        );
        assert.equal(result.status, 422);
        assert.deepEqual(await result.json(), { error: 'NO_ATTEMPTS' });
      });
      assert.equal(
        f.store.db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n,
        3,
      );
    } finally {
      await f.service.close();
    }
  }
});

void test('local daily-limit testing can be restored explicitly without altering records', async () => {
  const f = fixture({ ...env, LIF_LOCAL_GAME_TESTING: '0' });
  try {
    await inMode('development', async () => {
      const bootstrap = await f.service.request(
        request('/api/games/bootstrap'),
      );
      const cookie = bootstrap.headers.get('set-cookie');
      assert.equal((await bootstrap.json()).localTesting, undefined);
      for (let index = 0; index < 3; index++) {
        const result = await f.service.request(
          request(
            '/api/games/start',
            {
              game: 'memory_lif',
              request: randomUUID(),
            },
            cookie,
          ),
        );
        assert.equal(result.status, 200);
      }
      const result = await f.service.request(
        request(
          '/api/games/start',
          {
            game: 'memory_lif',
            request: randomUUID(),
          },
          cookie,
        ),
      );
      assert.equal(result.status, 422);
      assert.deepEqual(await result.json(), { error: 'NO_ATTEMPTS' });
    });
  } finally {
    await f.service.close();
  }
});

void test('local Supabase keeps current rules, ownership and idempotent daily attempts without Sheets', async () => {
  const f = fixture();
  try {
    const bootstrap = await f.service.request(request('/api/games/bootstrap'));
    assert.equal(bootstrap.status, 200);
    const owner = await bootstrap.json(),
      cookie = bootstrap.headers.get('set-cookie');
    assert.match(cookie, /HttpOnly.*SameSite=Strict/);
    assert.equal(cookie.includes('Secure'), false);
    const body = { game: 'memory_lif', request: randomUUID() };
    const first = await (
      await f.service.request(request('/api/games/start', body, cookie))
    ).json();
    const second = await (
      await f.service.request(request('/api/games/start', body, cookie))
    ).json();
    assert.deepEqual(second, first);
    assert.equal(first.configVersion, GAME_CONFIG.VERSION);
    const reloaded = await (
      await f.service.request(
        request('/api/games/bootstrap', undefined, cookie),
      )
    ).json();
    assert.equal(reloaded.deviceId, owner.deviceId);
    assert.equal(reloaded.attempts.memory_lif, 2);
    assert.equal(reloaded.attempts.snake, 3);
    const finished = await f.service.request(
      request(
        '/api/games/abandon',
        { id: first.id, inputs: [], score: 0, simMs: 0 },
        cookie,
      ),
    );
    assert.equal(finished.status, 200);
    assert.deepEqual(f.calls, { password: 1, factory: 1, closed: 0 });
  } finally {
    await f.service.close();
  }
  assert.equal(f.calls.closed, 1);
});

void test('local Supabase ranking is one Top 20, preserves history and does not expose contacts', async () => {
  const f = fixture();
  try {
    for (let index = 0; index < 22; index++) {
      const device = f.store.device();
      const session = f.store.start(
        device.id,
        index % 2 ? 'snake' : 'memory_lif',
      );
      f.store.db
        .prepare(
          "UPDATE sessions SET status='completed',validated_score=?,raw_score=?,ended=?,reason='time' WHERE id=?",
        )
        .run(50000 + index, 50000 + index, Date.now(), session.id);
      f.store.register(device.id, session.id, {
        name: 'Prueba',
        email: 'qa@example.test',
        phone: '88881111',
        nickname: `Prueba${index}`,
        terms: true,
      });
    }
    const before = f.store.db
      .prepare('SELECT COUNT(*) AS n FROM sessions')
      .get().n;
    const result = await f.service.request(
      request('/api/games/leaderboard?game=all&limit=20'),
    );
    assert.equal(result.status, 200);
    const text = await result.text(),
      ranking = JSON.parse(text);
    assert.equal(ranking.top.length, 20);
    assert.equal(ranking.top[0].score, 50021);
    assert.deepEqual(
      new Set(ranking.top.map((row) => row.game)),
      new Set(['snake', 'memory_lif']),
    );
    assert.equal(text.includes('qa@example.test'), false);
    assert.equal(text.includes('88881111'), false);
    assert.equal(
      f.store.db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n,
      before,
    );
  } finally {
    await f.service.close();
  }
});

void test('missing private configuration fails closed without reading credentials or creating a database', async () => {
  let reads = 0,
    created = 0;
  const service = createLocalDatabaseApi(
    {},
    {
      async readPassword() {
        reads++;
        return 'not-to-be-read';
      },
      createDatabase() {
        created++;
        throw new Error('not-to-be-created');
      },
    },
  );
  try {
    const response = await service.request(request('/api/games/bootstrap'));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: 'LOCAL_DATABASE_CONFIG_REQUIRED',
    });
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal(reads, 0);
    assert.equal(created, 0);
  } finally {
    await service.close();
  }
});

void test('unavailable Keychain can be corrected and retried without restart or disclosing its error', async () => {
  let available = false;
  const f = fixture();
  const service = createLocalDatabaseApi(env, {
    async readPassword() {
      if (!available) throw new Error('private-keychain-details');
      return 'test-password-not-a-real-secret';
    },
    createDatabase() {
      return {
        async transact(fn) {
          return fn(f.store);
        },
        async close() {},
        async snapshot() {
          return '';
        },
        async acknowledge() {},
      };
    },
  });
  try {
    const failed = await service.request(request('/api/games/bootstrap'));
    assert.equal(
      await failed.text(),
      '{"error":"LOCAL_DATABASE_CONFIG_REQUIRED"}',
    );
    available = true;
    assert.equal(
      (await service.request(request('/api/games/bootstrap'))).status,
      200,
    );
  } finally {
    await service.close();
    f.store.db.close();
  }
});

void test('unknown routes, wrong methods and origins are rejected before any secret is read', async () => {
  const f = fixture();
  try {
    assert.equal(
      (await f.service.request(request('/api/games/unknown'))).status,
      404,
    );
    assert.equal(
      (await f.service.request(request('/api/games/start'))).status,
      405,
    );
    assert.equal(
      (
        await f.service.request(
          new Request('http://localhost:3000/api/games/bootstrap', {
            headers: { origin: 'https://evil.example' },
          }),
        )
      ).status,
      403,
    );
    assert.equal(f.calls.password, 0);
    assert.equal(f.calls.factory, 0);
  } finally {
    f.store.db.close();
    await f.service.close();
  }
});

void test('a missing schema or unprepared history is reported explicitly and never migrated automatically', async () => {
  for (const failure of [
    Object.assign(new Error('private-SQL'), { code: '42P01' }),
    new Error('DATABASE_NOT_READY'),
  ]) {
    const service = createLocalDatabaseApi(env, {
      async readPassword() {
        return 'test-password';
      },
      createDatabase() {
        return {
          async transact() {
            throw failure;
          },
          async close() {},
          async snapshot() {
            throw new Error('no migration');
          },
          async acknowledge() {},
        };
      },
    });
    try {
      const response = await service.request(request('/api/games/bootstrap'));
      assert.equal(response.status, 503);
      assert.equal(await response.text(), '{"error":"STORAGE_NOT_READY"}');
      assert.equal(response.headers.get('set-cookie'), null);
    } finally {
      await service.close();
    }
  }
});

void test('database credentials are server-only and each local pool can be closed independently', async () => {
  await assert.rejects(
    localDatabasePassword({}),
    /LOCAL_DATABASE_CONFIG_REQUIRED/,
  );
  assert.equal(
    await localDatabasePassword({ LIF_DATABASE_PASSWORD: ' test-password ' }),
    ' test-password ',
  );
  assert.throws(() => createCompetitionDatabase({}), /DATABASE_CONFIG_INVALID/);
  const database = createCompetitionDatabase({
    ...env,
    LIF_DATABASE_PASSWORD: 'test-password',
  });
  await database.close();
});

async function invokeBridge(
  handler,
  {
    path = '/api/games/bootstrap',
    method = 'GET',
    host = 'localhost:3000',
    body = '',
    headers = {},
  } = {},
) {
  const req = Readable.from(body ? [Buffer.from(body)] : []);
  req.url = path;
  req.method = method;
  req.headers = { host, ...headers };
  let status = 200,
    text = '',
    next = false;
  const responseHeaders = {};
  const res = {
    get statusCode() {
      return status;
    },
    set statusCode(value) {
      status = value;
    },
    setHeader(key, value) {
      responseHeaders[key.toLowerCase()] = value;
    },
    end(value) {
      text = value;
    },
  };
  await localApiBridge(handler)(req, res, () => {
    next = true;
  });
  return { status, text, headers: responseHeaders, next };
}

void test('Vite bridge forwards JSON and HttpOnly cookies without adding database details to browser responses', async () => {
  const result = await invokeBridge(
    async (req) => {
      assert.equal(req.url, 'http://localhost:3000/api/games/start');
      assert.equal(req.headers.get('cookie'), 'lif_game_device=test-cookie');
      assert.deepEqual(await req.json(), { game: 'snake' });
      return new Response('{"id":"local-session"}', {
        headers: {
          'set-cookie': 'lif_game_device=test; HttpOnly; SameSite=Strict',
          'cache-control': 'no-store',
        },
      });
    },
    {
      path: '/api/games/start',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'lif_game_device=test-cookie',
      },
      body: '{"game":"snake"}',
    },
  );
  assert.equal(result.status, 200);
  assert.equal(result.text, '{"id":"local-session"}');
  assert.match(result.headers['set-cookie'], /HttpOnly/);
  assert.equal(result.headers['cache-control'], 'no-store');
});

void test('Vite bridge ignores site routes and rejects oversized bodies and external hosts', async () => {
  let called = 0;
  const handler = async () => {
    called++;
    return new Response('{}');
  };
  assert.equal((await invokeBridge(handler, { path: '/juega' })).next, true);
  assert.equal(
    (await invokeBridge(handler, { host: 'evil.example' })).status,
    403,
  );
  assert.equal(
    (await invokeBridge(handler, { method: 'POST', body: 'a'.repeat(1000001) }))
      .status,
    413,
  );
  assert.equal(called, 0);
});
