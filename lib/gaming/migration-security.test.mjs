import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import migrate from '../../netlify/functions/lif-migrate.ts';

test('temporary migration rejects public, expired, oversized and modified requests', async () => {
  const before = { ...process.env };
  process.env.LIF_SHEETS_SYNC_KEY = 'x'.repeat(64);
  process.env.LIF_MIGRATION_EXPIRES = String(Date.now() + 60000);
  const req = (body, issued = String(Date.now()), signature = '0'.repeat(64)) => new Request('https://lif.example/.netlify/functions/lif-migrate', {
    method: 'POST', body, headers: { 'x-lif-issued': issued, 'x-lif-signature': signature },
  });
  try {
    assert.equal((await migrate(req('{"action":"import"}'))).status, 403);
    assert.equal((await migrate(req('x'.repeat(1001)))).status, 403);
    assert.equal((await migrate(new Request('https://lif.example/.netlify/functions/lif-migrate'))).status, 404);
    const issued = String(Date.now()), body = '{"action":"import"}';
    const signature = createHmac('sha256', process.env.LIF_SHEETS_SYNC_KEY).update(`lif-migration\n${issued}\n${body}`).digest('hex');
    assert.equal((await migrate(req('{"action":"probe"}', issued, signature))).status, 403);
    process.env.LIF_MIGRATION_EXPIRES = String(Date.now() - 1);
    assert.equal((await migrate(req(body, issued, signature))).status, 404);
  } finally {
    for (const key of ['LIF_SHEETS_SYNC_KEY', 'LIF_MIGRATION_EXPIRES']) {
      if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key];
    }
  }
});
