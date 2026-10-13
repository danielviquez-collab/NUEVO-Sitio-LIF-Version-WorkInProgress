import test from 'node:test';
import assert from 'node:assert/strict';
import { gamesApi, GameApiError } from './client.ts';

void test('transient failures retry with the exact original body and bounded backoff', async () => {
  const bodies = [],
    delays = [];
  const result = await gamesApi(
    'start',
    { request: 'same-id', game: 'snake' },
    async (_url, options) => {
      bodies.push(options.body);
      return new Response(
        JSON.stringify(
          bodies.length < 3
            ? { error: 'STORAGE_UNAVAILABLE' }
            : { id: 'saved' },
        ),
        { status: bodies.length < 3 ? 503 : 200 },
      );
    },
    async (ms) => delays.push(ms),
  );
  assert.deepEqual(result, { id: 'saved' });
  assert.equal(new Set(bodies).size, 1);
  assert.deepEqual(delays, [400, 1200]);
});
void test('validation errors and maintenance are not retried', async () => {
  for (const [status, code] of [
    [422, 'SCORE_INVALID'],
    [503, 'STORAGE_MAINTENANCE'],
  ]) {
    let calls = 0;
    await assert.rejects(
      gamesApi(
        'checkpoint',
        {},
        async () => {
          calls++;
          return new Response(JSON.stringify({ error: code }), { status });
        },
        async () => {},
      ),
      (error) => error instanceof GameApiError && error.code === code,
    );
    assert.equal(calls, 1);
  }
});
void test('lost responses are bounded to three attempts without claiming durable success', async () => {
  let calls = 0;
  await assert.rejects(
    gamesApi(
      'finish',
      {},
      async () => {
        calls++;
        throw new TypeError('Failed to fetch');
      },
      async () => {},
    ),
    /reconectar/,
  );
  assert.equal(calls, 3);
});
void test('ranking and bootstrap errors never claim an in-progress game could not be saved', async () => {
  for (const [path, expected] of [
    ['leaderboard?game=all&limit=20', /actualizar el ranking/],
    ['bootstrap', /servicio de juegos/],
  ]) {
    await assert.rejects(
      gamesApi(
        path,
        undefined,
        async () =>
          new Response('{"error":"SHEETS_UNAVAILABLE"}', { status: 503 }),
        async () => {},
      ),
      (error) => {
        assert.match(error.message, expected);
        assert.equal(error.message.includes('guardar la partida'), false);
        return true;
      },
    );
  }
});
void test('local configuration and an unprepared Supabase database do not trigger misleading reconnection loops', async () => {
  for (const code of ['LOCAL_DATABASE_CONFIG_REQUIRED', 'STORAGE_NOT_READY']) {
    let calls = 0;
    await assert.rejects(
      gamesApi(
        'bootstrap',
        undefined,
        async () => {
          calls++;
          return new Response(JSON.stringify({ error: code }), { status: 503 });
        },
        async () => {
          throw Error('must not retry');
        },
      ),
      (error) =>
        error.code === code && !error.message.includes('guardar la partida'),
    );
    assert.equal(calls, 1);
  }
});
