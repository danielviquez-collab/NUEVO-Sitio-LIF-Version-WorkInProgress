import type { SQLInputValue } from 'node:sqlite';
import type { CompetitionStore } from './server.ts';
import { SheetsConnection } from './sheet-connection.ts';

const tables = [
  'devices',
  'participants',
  'sessions',
  'start_requests',
  'contact_messages',
  'sheet_sync',
  'registrations',
] as const;
export const MAX_STATE_CHARS = 6000000;
export type StoredState = { revision: number; snapshot: string | null };
export interface CompetitionStateRepository {
  load(): Promise<StoredState>;
  save(
    revision: number,
    snapshot: string,
  ): Promise<{ saved: boolean; revision: number }>;
}

export function exportCompetitionState(store: CompetitionStore): string {
  const snapshot = JSON.stringify({
    version: 1,
    tables: Object.fromEntries(
      tables.map((table) => [
        table,
        store.db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all(),
      ]),
    ),
  });
  if (snapshot.length > MAX_STATE_CHARS) throw new Error('STATE_CAPACITY');
  return snapshot;
}

export function importCompetitionState(
  store: CompetitionStore,
  snapshot: string | null,
) {
  if (snapshot === null) return;
  try {
    if (!snapshot || snapshot.length > MAX_STATE_CHARS) throw new Error('size');
    const data = JSON.parse(snapshot);
    if (data?.version === 1 && data.tables && !('registrations' in data.tables))
      data.tables.registrations = [];
    if (
      data?.version !== 1 ||
      !data.tables ||
      Object.keys(data.tables).sort().join('|') !== [...tables].sort().join('|')
    )
      throw new Error('schema');
    store.db.exec('BEGIN IMMEDIATE');
    for (const table of tables) {
      const columns = (
        store.db.prepare(`PRAGMA table_info(${table})`).all() as {
          name: string;
        }[]
      ).map((column) => column.name);
      const rows = data.tables[table];
      if (!Array.isArray(rows)) throw new Error('rows');
      const insert = store.db.prepare(
        `INSERT INTO ${table}(${columns.join(',')}) VALUES(${columns.map(() => '?').join(',')})`,
      );
      for (const row of rows) {
        // Snapshots saved before optional residence fields retain their exact contact history.
        const restored =
          table === 'contact_messages' && row
            ? { province: '', canton: '', district: '', ...row }
            : row;
        if (
          !restored ||
          Object.keys(restored).sort().join('|') !==
            [...columns].sort().join('|')
        )
          throw new Error('columns');
        const values = columns.map((column) => restored[column]);
        if (
          values.some(
            (value) =>
              value !== null &&
              typeof value !== 'string' &&
              !(typeof value === 'number' && Number.isSafeInteger(value)),
          )
        )
          throw new Error('value');
        insert.run(...(values as SQLInputValue[]));
      }
    }
    store.db.exec('COMMIT');
  } catch {
    if (store.db.isTransaction) store.db.exec('ROLLBACK');
    throw new Error('STATE_CORRUPT');
  }
}

export class GoogleCompetitionState implements CompetitionStateRepository {
  private connection: SheetsConnection;
  constructor(connection: SheetsConnection) {
    this.connection = connection;
  }
  async load(): Promise<StoredState> {
    const data = await this.connection.call<{
      ok: boolean;
      revision: number;
      snapshot: string | null;
    }>('state-load', {});
    if (
      !Number.isSafeInteger(data.revision) ||
      data.revision < 0 ||
      !(
        data.snapshot === null ||
        (typeof data.snapshot === 'string' &&
          data.snapshot.length <= MAX_STATE_CHARS)
      ) ||
      (data.revision === 0) !== (data.snapshot === null)
    )
      throw new Error('STATE_CORRUPT');
    return { revision: data.revision, snapshot: data.snapshot };
  }
  async save(revision: number, snapshot: string) {
    const data = await this.connection.call<{
      ok: boolean;
      saved: boolean;
      revision: number;
    }>('state-save', { revision, snapshot });
    if (
      typeof data.saved !== 'boolean' ||
      !Number.isSafeInteger(data.revision) ||
      (data.saved ? data.revision !== revision + 1 : data.revision <= revision)
    )
      throw new Error('STATE_CORRUPT');
    return { saved: data.saved, revision: data.revision };
  }
}
