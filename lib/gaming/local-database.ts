import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createCompetitionDatabase } from './competition-database.ts';
import { createNetlifyApi, type Dependencies } from './netlify-api.ts';
import type { CompetitionDatabase } from './competition-database.ts';

type Environment = Record<string, string | undefined>;
type LocalDatabase = CompetitionDatabase & { close(): Promise<void> };
type Options = {
  readPassword?: (env: Environment) => Promise<string>;
  createDatabase?: (env: Environment) => LocalDatabase;
};
const execute = promisify(execFile);

export async function localDatabasePassword(env: Environment): Promise<string> {
  if (env.LIF_DATABASE_PASSWORD) return env.LIF_DATABASE_PASSWORD;
  if (
    process.platform !== 'darwin' ||
    !env.LIF_DATABASE_KEYCHAIN_SERVICE ||
    !env.LIF_DATABASE_KEYCHAIN_ACCOUNT
  )
    throw new Error('LOCAL_DATABASE_CONFIG_REQUIRED');
  try {
    // The password stays in server memory; it is never an argument, file or log.
    const { stdout } = await execute(
      '/usr/bin/security',
      [
        'find-generic-password',
        '-s',
        env.LIF_DATABASE_KEYCHAIN_SERVICE,
        '-a',
        env.LIF_DATABASE_KEYCHAIN_ACCOUNT,
        '-w',
      ],
      { timeout: 15000, maxBuffer: 8192 },
    );
    const password = stdout.replace(/\r?\n$/, '');
    if (!password) throw new Error('empty');
    return password;
  } catch {
    throw new Error('LOCAL_DATABASE_CONFIG_REQUIRED');
  }
}

function unavailable(code: string) {
  return new Response(JSON.stringify({ error: code }), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export function createLocalDatabaseApi(
  env: Environment,
  options: Options = {},
) {
  let database: LocalDatabase | undefined;
  let connecting: Promise<LocalDatabase> | undefined;
  let closing: Promise<void> | undefined;
  let closed = false;
  const legacyDisabled: Dependencies['state'] = {
    async load(): Promise<never> {
      throw new Error('LEGACY_STATE_DISABLED');
    },
    async save(): Promise<never> {
      throw new Error('LEGACY_STATE_DISABLED');
    },
  };
  async function connect() {
    if (closed) throw new Error('LOCAL_DATABASE_CONFIG_REQUIRED');
    if (database) return database;
    connecting ??= (async () => {
      if (!env.LIF_DATABASE_HOST || !env.LIF_DATABASE_USER)
        throw new Error('LOCAL_DATABASE_CONFIG_REQUIRED');
      const password = await (options.readPassword ?? localDatabasePassword)(
        env,
      );
      const connected = (options.createDatabase ?? createCompetitionDatabase)({
        ...env,
        LIF_DATABASE_PASSWORD: password,
      });
      if (closed) {
        await connected.close();
        throw new Error('LOCAL_DATABASE_CONFIG_REQUIRED');
      }
      return (database = connected);
    })().finally(() => {
      connecting = undefined;
    });
    return connecting;
  }
  const handler = createNetlifyApi({
    localTesting: env.LIF_LOCAL_GAME_TESTING !== '0',
    state: legacyDisabled,
    sheets() {
      throw new Error('LEGACY_SHEETS_DISABLED');
    },
    database: {
      async transact(operation) {
        let active: LocalDatabase;
        try {
          active = await connect();
        } catch {
          throw Object.assign(new Error('LOCAL_DATABASE_CONFIG_REQUIRED'), {
            code: 'LOCAL_DATABASE_CONFIG_REQUIRED',
          });
        }
        return active.transact(operation);
      },
      async snapshot() {
        return (await connect()).snapshot();
      },
      async acknowledge(rows) {
        return (await connect()).acknowledge(rows);
      },
    },
  });
  return {
    async request(request: Request): Promise<Response> {
      if (closed) return unavailable('LOCAL_DATABASE_CONFIG_REQUIRED');
      // Supabase is authoritative. No Sheets calls, SQLite fallback or automatic migration.
      return handler(request);
    },
    close() {
      closing ??= (async () => {
        closed = true;
        try {
          await connecting;
        } catch {
          /* No connection to close. */
        }
        await database?.close();
      })();
      return closing;
    },
  };
}
