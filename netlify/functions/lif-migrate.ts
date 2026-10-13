import { createHmac, timingSafeEqual } from 'node:crypto';
import { configuredDatabase } from '../../lib/gaming/competition-database.ts';
import { dependencies } from './connection.ts';

// Temporary, signed, fixed-action migration. It cannot accept SQL or record data,
// and the database seals further imports after the first verified commit.
export default async function migrate(request: Request) {
  const reply = (status: number, data: unknown) => new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
  if (request.method !== 'POST') return reply(404, { error: 'NOT_FOUND' });
  const expires = Number(process.env.LIF_MIGRATION_EXPIRES);
  if (!Number.isSafeInteger(expires) || Date.now() > expires) return reply(404, { error: 'NOT_FOUND' });
  const body = await request.text();
  if (body.length > 1000) return reply(403, { error: 'FORBIDDEN' });
  const issued = request.headers.get('x-lif-issued') ?? '';
  const signature = request.headers.get('x-lif-signature') ?? '';
  const secret = process.env.LIF_SHEETS_SYNC_KEY ?? '';
  if (secret.length < 32 || !/^\d{13}$/.test(issued) || Math.abs(Date.now() - Number(issued)) > 120000 || !/^[a-f0-9]{64}$/.test(signature)) return reply(403, { error: 'FORBIDDEN' });
  const expected = createHmac('sha256', secret).update(`lif-migration\n${issued}\n${body}`).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return reply(403, { error: 'FORBIDDEN' });
  try {
    const data = JSON.parse(body);
    if (Object.keys(data).join(',') !== 'action') return reply(400, { error: 'ACTION_INVALID' });
    const database = configuredDatabase();
    if (data.action === 'probe') return reply(200, await database.probe());
    if (data.action !== 'import' || process.env.LIF_GAME_STORAGE !== 'migrating') return reply(403, { error: 'FORBIDDEN' });
    const { state } = dependencies(50000);
    const source = await state.load();
    if (!source.snapshot) throw new Error('MIGRATION_SOURCE_EMPTY');
    const proof = await database.importHistory(source.snapshot, source.revision, async () => {
      const current = await state.load();
      if (current.revision !== source.revision || current.snapshot !== source.snapshot) throw new Error('MIGRATION_SOURCE_CHANGED');
    });
    return reply(200, proof);
  } catch (error) {
    const raw = error instanceof Error ? error.message : '';
    const code = /^(MIGRATION_[A-Z_]+|STATE_CORRUPT)$/.test(raw) ? raw
      : error && typeof error === 'object' && 'code' in error && /^[A-Z0-9_]{1,40}$/.test(String(error.code)) ? String(error.code) : 'CONNECTION_FAILED';
    return reply(503, { error: code });
  }
}
