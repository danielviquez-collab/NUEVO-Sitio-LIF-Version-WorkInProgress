import { SheetsConnection } from '../../lib/gaming/sheet-connection.ts';
import { GoogleCompetitionState } from '../../lib/gaming/competition-state.ts';
import { CompetitionSheets } from '../../lib/gaming/sheets.ts';
import type { CompetitionStore } from '../../lib/gaming/server.ts';
import { configuredDatabase } from '../../lib/gaming/competition-database.ts';

export function dependencies(duration = 52000) {
  const endpoint = process.env.LIF_SHEETS_ENDPOINT ?? '';
  const secret = process.env.LIF_SHEETS_SYNC_KEY ?? '';
  const mode = process.env.LIF_GAME_STORAGE ?? 'sheets';
  if (!['sheets', 'migrating', 'postgres'].includes(mode)) throw new Error('STORAGE_CONFIG_INVALID');
  const deadline = Date.now() + duration;
  const connection = () => new SheetsConnection(endpoint, secret, fetch, deadline);
  return {
    database: mode === 'postgres' ? configuredDatabase() : undefined,
    maintenance: mode === 'migrating',
    state: mode === 'postgres' ? {
      async load(): Promise<never> { throw new Error('LEGACY_STATE_DISABLED'); },
      async save(): Promise<never> { throw new Error('LEGACY_STATE_DISABLED'); },
    } : new GoogleCompetitionState(connection()),
    sheets: (store: CompetitionStore) => new CompetitionSheets(store, endpoint, secret, fetch, connection()),
  };
}
