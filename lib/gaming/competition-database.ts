import { createHash } from 'node:crypto';
import pg from 'pg';
import { SUPABASE_ROOT_CA } from './supabase-ca.ts';
import { CompetitionStore } from './server.ts';
import {
  exportCompetitionState,
  importCompetitionState,
} from './competition-state.ts';

type Row = Record<string, string | number | null>;
type Snapshot = { version: 1; tables: Record<string, Row[]> };
type Client = {
  query: (sql: string, values?: unknown[]) => Promise<{ rows: Row[] }>;
  release: (destroy?: boolean) => void;
};
type Pool = { connect: () => Promise<Client>; end?: () => Promise<void> };
export interface CompetitionDatabase {
  transact<T>(operation: (store: CompetitionStore) => Promise<T>): Promise<T>;
  snapshot(): Promise<string>;
  acknowledge(rows: Row[]): Promise<void>;
}
const keys: Record<string, string[]> = {
  devices: ['id'],
  participants: ['id'],
  sessions: ['id'],
  start_requests: ['device', 'request'],
  contact_messages: ['id'],
  sheet_sync: ['kind', 'id'],
  registrations: ['id'],
};
const tableNames = Object.keys(keys);
const lock = 'SELECT pg_advisory_xact_lock(1279870535, 1)';
export const databaseSchema = `
CREATE SCHEMA IF NOT EXISTS lif_game;
REVOKE ALL ON SCHEMA lif_game FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS lif_game.devices(id TEXT PRIMARY KEY,token TEXT UNIQUE NOT NULL,created BIGINT NOT NULL,_order BIGINT GENERATED ALWAYS AS IDENTITY);
CREATE TABLE IF NOT EXISTS lif_game.participants(id TEXT PRIMARY KEY,device TEXT UNIQUE NOT NULL REFERENCES lif_game.devices(id),name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,nickname TEXT NOT NULL,nickname_key TEXT UNIQUE NOT NULL,terms BIGINT NOT NULL,created BIGINT NOT NULL,updated BIGINT NOT NULL,_order BIGINT GENERATED ALWAYS AS IDENTITY);
CREATE TABLE IF NOT EXISTS lif_game.sessions(id TEXT PRIMARY KEY,device TEXT NOT NULL REFERENCES lif_game.devices(id),participant TEXT REFERENCES lif_game.participants(id),game TEXT NOT NULL,seed BIGINT NOT NULL,started BIGINT NOT NULL,ended BIGINT,status TEXT NOT NULL,attempt BIGINT NOT NULL,day TEXT NOT NULL,raw_score BIGINT NOT NULL DEFAULT 0,validated_score BIGINT NOT NULL DEFAULT 0,reason TEXT,inputs TEXT NOT NULL DEFAULT '[]',sim_ms BIGINT NOT NULL DEFAULT 0,version TEXT NOT NULL,heartbeat BIGINT NOT NULL,_order BIGINT GENERATED ALWAYS AS IDENTITY);
CREATE INDEX IF NOT EXISTS session_attempts ON lif_game.sessions(device,game,day);
CREATE INDEX IF NOT EXISTS session_ranking ON lif_game.sessions(game,status,started,participant);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_game ON lif_game.sessions(device) WHERE status='playing';
CREATE TABLE IF NOT EXISTS lif_game.start_requests(device TEXT NOT NULL REFERENCES lif_game.devices(id),request TEXT NOT NULL,session TEXT NOT NULL REFERENCES lif_game.sessions(id),PRIMARY KEY(device,request),_order BIGINT GENERATED ALWAYS AS IDENTITY);
CREATE TABLE IF NOT EXISTS lif_game.contact_messages(id TEXT PRIMARY KEY,request TEXT UNIQUE NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,message TEXT NOT NULL,consent BIGINT NOT NULL,created BIGINT NOT NULL,province TEXT NOT NULL DEFAULT '',canton TEXT NOT NULL DEFAULT '',district TEXT NOT NULL DEFAULT '',_order BIGINT GENERATED ALWAYS AS IDENTITY);
CREATE TABLE IF NOT EXISTS lif_game.sheet_sync(kind TEXT NOT NULL,id TEXT NOT NULL,hash TEXT NOT NULL,PRIMARY KEY(kind,id),_order BIGINT GENERATED ALWAYS AS IDENTITY);
CREATE TABLE IF NOT EXISTS lif_game.registrations(id TEXT PRIMARY KEY REFERENCES lif_game.sessions(id),participant TEXT NOT NULL,device TEXT NOT NULL REFERENCES lif_game.devices(id),name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,nickname TEXT NOT NULL,nickname_key TEXT NOT NULL,terms BIGINT NOT NULL,created BIGINT NOT NULL,updated BIGINT NOT NULL,_order BIGINT GENERATED ALWAYS AS IDENTITY);
CREATE INDEX IF NOT EXISTS registration_nicknames ON lif_game.registrations(nickname_key,device);
CREATE TABLE IF NOT EXISTS lif_game.migration(id BIGINT PRIMARY KEY CHECK(id=1),revision BIGINT NOT NULL,fingerprint TEXT NOT NULL,counts JSONB NOT NULL,completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
${[...tableNames, 'migration'].map((table) => `ALTER TABLE lif_game.${table} ENABLE ROW LEVEL SECURITY;`).join('\n')}
REVOKE ALL ON ALL TABLES IN SCHEMA lif_game FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA lif_game FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA lif_game REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
`;

function metadata(store: CompetitionStore, table: string) {
  return store.db.prepare(`PRAGMA table_info(${table})`).all() as {
    name: string;
    type: string;
  }[];
}
function rowKey(table: string, row: Row) {
  return JSON.stringify(keys[table].map((key) => row[key]));
}
export function snapshotProof(snapshot: string) {
  const data = JSON.parse(snapshot) as Snapshot;
  const canonical = Object.fromEntries(
    tableNames.map((table) => [
      table,
      (data.tables[table] ?? [])
        .map((row) =>
          Object.fromEntries(
            Object.keys(row)
              .sort()
              .map((key) => [key, row[key]]),
          ),
        )
        .sort((a, b) => rowKey(table, a).localeCompare(rowKey(table, b))),
    ]),
  );
  return {
    fingerprint: createHash('sha256')
      .update(JSON.stringify(canonical))
      .digest('hex'),
    counts: Object.fromEntries(
      tableNames.map((table) => [table, data.tables[table]?.length ?? 0]),
    ),
  };
}

// Replay validation stays in the existing engine. Postgres commits only changed rows,
// and its transaction lock protects attempts, nicknames and idempotent requests.
export class PostgresCompetitionDatabase implements CompetitionDatabase {
  private pool: Pool;
  constructor(pool: Pool) {
    this.pool = pool;
  }
  async close() {
    await this.pool.end?.();
  }
  private async transaction<T>(operation: (client: Client) => Promise<T>) {
    const client = await this.pool.connect();
    let broken = false;
    try {
      await client.query('BEGIN');
      await client.query(
        "SET LOCAL lock_timeout='8s'; SET LOCAL statement_timeout='15s'",
      );
      await client.query(lock);
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        broken = true;
      }
      throw error;
    } finally {
      client.release(broken);
    }
  }
  private async load(client: Client, store: CompetitionStore) {
    const tables: Record<string, Row[]> = {};
    for (const table of tableNames) {
      const columns = metadata(store, table);
      const result = await client.query(
        `SELECT ${columns.map((c) => c.name).join(',')} FROM lif_game.${table} ORDER BY _order`,
      );
      tables[table] = result.rows.map((row) =>
        Object.fromEntries(
          columns.map((column) => {
            const raw = row[column.name];
            const value =
              raw !== null && column.type === 'INTEGER' ? Number(raw) : raw;
            if (
              column.type === 'INTEGER' &&
              value !== null &&
              !Number.isSafeInteger(value)
            )
              throw new Error('DATABASE_VALUE_INVALID');
            return [column.name, value];
          }),
        ),
      );
    }
    const snapshot = JSON.stringify({ version: 1, tables });
    importCompetitionState(store, snapshot);
    return snapshot;
  }
  private async delta(
    client: Client,
    store: CompetitionStore,
    before: string,
    after: string,
  ) {
    const previous = JSON.parse(before) as Snapshot,
      next = JSON.parse(after) as Snapshot;
    for (const table of tableNames) {
      const oldRows = new Map(
        previous.tables[table].map((row) => [
          rowKey(table, row),
          JSON.stringify(row),
        ]),
      );
      const newKeys = new Set(
        next.tables[table].map((row) => rowKey(table, row)),
      );
      if ([...oldRows.keys()].some((key) => !newKeys.has(key)))
        throw new Error('DATABASE_DELETE_FORBIDDEN');
      const changed = next.tables[table].filter(
        (row) => oldRows.get(rowKey(table, row)) !== JSON.stringify(row),
      );
      if (
        table === 'registrations' &&
        changed.some((row) => oldRows.has(rowKey(table, row)))
      )
        throw new Error('DATABASE_REGISTRATION_IMMUTABLE');
      if (!changed.length) continue;
      // Update existing rows first so the partial one-active-game index is never violated.
      for (const rows of [
        changed.filter((row) => oldRows.has(rowKey(table, row))),
        changed.filter((row) => !oldRows.has(rowKey(table, row))),
      ]) {
        if (!rows.length) continue;
        const columns = metadata(store, table).map((column) => column.name);
        const update = columns
          .filter((column) => !keys[table].includes(column))
          .map((column) => `${column}=EXCLUDED.${column}`)
          .join(',');
        await client.query(
          `INSERT INTO lif_game.${table}(${columns.join(',')}) SELECT ${columns.join(',')} FROM jsonb_populate_recordset(NULL::lif_game.${table},$1::jsonb) ON CONFLICT(${keys[table].join(',')}) DO UPDATE SET ${update}`,
          [JSON.stringify(rows)],
        );
      }
    }
  }
  async transact<T>(
    operation: (store: CompetitionStore) => Promise<T>,
  ): Promise<T> {
    return this.transaction(async (client) => {
      const ready = await client.query(
        'SELECT id FROM lif_game.migration WHERE id=1',
      );
      if (!ready.rows.length) throw new Error('DATABASE_NOT_READY');
      const store = new CompetitionStore(':memory:');
      try {
        const before = await this.load(client, store);
        const result = await operation(store);
        await this.delta(client, store, before, exportCompetitionState(store));
        return result;
      } finally {
        store.db.close();
      }
    });
  }
  snapshot() {
    return this.transact(async (store) => exportCompetitionState(store));
  }
  async acknowledge(rows: Row[]) {
    if (!rows.length) return;
    await this.transact(async (store) => {
      for (const row of rows) {
        if (
          !['games', 'contacts'].includes(String(row.kind)) ||
          typeof row.id !== 'string' ||
          typeof row.hash !== 'string'
        )
          throw new Error('ACK_INVALID');
        store.db
          .prepare(
            'INSERT INTO sheet_sync VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET hash=excluded.hash',
          )
          .run(row.kind, row.id, row.hash);
      }
    });
  }
  async probe() {
    const client = await this.pool.connect();
    try {
      await client.query('SELECT 1 AS connected');
      return { connected: true };
    } finally {
      client.release();
    }
  }
  async importHistory(
    snapshot: string,
    revision: number,
    verifySource: () => Promise<void>,
  ) {
    const source = new CompetitionStore(':memory:');
    try {
      importCompetitionState(source, snapshot);
      const normalized = exportCompetitionState(source),
        proof = snapshotProof(normalized);
      return await this.transaction(async (client) => {
        await client.query(databaseSchema);
        const sealed = await client.query(
          'SELECT id FROM lif_game.migration WHERE id=1',
        );
        if (sealed.rows.length) throw new Error('MIGRATION_ALREADY_SEALED');
        const target = new CompetitionStore(':memory:');
        try {
          const before = await this.load(client, target);
          if (
            Object.values(snapshotProof(before).counts).some(
              (count) => count !== 0,
            )
          )
            throw new Error('MIGRATION_TARGET_NOT_EMPTY');
          await this.delta(client, source, before, normalized);
          const restored = new CompetitionStore(':memory:');
          try {
            const copied = snapshotProof(await this.load(client, restored));
            if (copied.fingerprint !== proof.fingerprint)
              throw new Error('MIGRATION_VERIFICATION_FAILED');
          } finally {
            restored.db.close();
          }
          await verifySource();
          await client.query(
            'INSERT INTO lif_game.migration(id,revision,fingerprint,counts) VALUES(1,$1,$2,$3::jsonb)',
            [revision, proof.fingerprint, JSON.stringify(proof.counts)],
          );
          return { migrated: true, revision, ...proof };
        } finally {
          target.db.close();
        }
      });
    } finally {
      source.db.close();
    }
  }
}

let database: PostgresCompetitionDatabase | undefined;
export function createCompetitionDatabase(
  env: Record<string, string | undefined>,
) {
  const {
    LIF_DATABASE_HOST: host,
    LIF_DATABASE_USER: user,
    LIF_DATABASE_PASSWORD: password,
  } = env;
  if (!host || !user || !password) throw new Error('DATABASE_CONFIG_INVALID');
  const pool = new pg.Pool({
    host,
    user,
    password,
    database: 'postgres',
    port: 6543,
    ssl: { rejectUnauthorized: true, ca: SUPABASE_ROOT_CA },
    max: 1,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 5000,
    allowExitOnIdle: true,
    application_name: 'lif-games',
  });
  pool.on('error', () => console.error('LIF_DATABASE_IDLE_CONNECTION_ERROR'));
  return new PostgresCompetitionDatabase(pool);
}
export function configuredDatabase() {
  database ??= createCompetitionDatabase(process.env);
  return database;
}
