import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { CompetitionStore, competitionMiddleware } from './server.ts';
import { CompetitionSheets } from './sheets.ts';
import { GAME_CONFIG, type GameId } from './config.ts';
import {
  exportCompetitionState,
  importCompetitionState,
  type CompetitionStateRepository,
} from './competition-state.ts';
import type { CompetitionDatabase } from './competition-database.ts';
import { previewLeaderboard } from './leaderboard-preview.ts';

type SheetService = Pick<CompetitionSheets, 'flush' | 'leaderboard'>;
export type Dependencies = {
  state: CompetitionStateRepository;
  sheets: (store: CompetitionStore) => SheetService;
  database?: CompetitionDatabase;
  maintenance?: boolean;
  localTesting?: boolean;
};
const routes = new Map([
  ['/api/games/bootstrap', 'GET'],
  ['/api/games/leaderboard', 'GET'],
  ['/api/games/ranking', 'GET'],
  ['/api/games/start', 'POST'],
  ['/api/games/checkpoint', 'POST'],
  ['/api/games/finish', 'POST'],
  ['/api/games/abandon', 'POST'],
  ['/api/games/register', 'POST'],
  ['/api/contact', 'POST'],
]);
const json = (status: number, data: unknown, headers?: Headers) => {
  const output = new Headers(headers);
  output.set('Content-Type', 'application/json');
  output.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(data), { status, headers: output });
};

async function dispatch(
  store: CompetitionStore,
  request: Request,
  url: URL,
  body: string,
  localTesting = false,
) {
  const headers = new Headers();
  let status = 200,
    text = '';
  const req = Readable.from(
    body ? [Buffer.from(body)] : [],
  ) as unknown as IncomingMessage;
  req.method = request.method;
  req.url = url.pathname + url.search;
  req.headers = Object.fromEntries(request.headers);
  req.headers.host = url.host;
  const res = {
    get statusCode() {
      return status;
    },
    set statusCode(code: number) {
      status = code;
    },
    setHeader(name: string, value: string) {
      headers.set(name, value);
    },
    end(value: string) {
      text = value;
    },
  } as unknown as ServerResponse;
  await competitionMiddleware(store, undefined, {
    secureCookies: url.protocol === 'https:',
    referenceRanking: true,
    localTesting,
  })(req, res, () => {
    status = 404;
    text = JSON.stringify({ error: 'NOT_FOUND' });
  });
  return { status, headers, data: JSON.parse(text) as Record<string, unknown> };
}

export function createNetlifyApi({
  state,
  sheets,
  database,
  maintenance,
  localTesting,
}: Dependencies) {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    // Netlify rewrites retain the original path in some runtimes and the function path in others.
    url.pathname = url.pathname.replace(
      /^\/\.netlify\/functions\/lif-api(?=\/)/,
      '/api',
    );
    const method = routes.get(url.pathname);
    if (!method) return json(404, { error: 'NOT_FOUND' });
    if (request.method !== method)
      return json(405, { error: 'METHOD_INVALID' });
    const origin = request.headers.get('origin');
    try {
      if (origin && new URL(origin).host !== url.host)
        return json(403, { error: 'ORIGIN_INVALID' });
    } catch {
      return json(403, { error: 'ORIGIN_INVALID' });
    }
    if (
      method === 'POST' &&
      !request.headers.get('content-type')?.startsWith('application/json')
    )
      return json(415, { error: 'CONTENT_TYPE_INVALID' });
    const body = method === 'POST' ? await request.text() : '';
    if (Buffer.byteLength(body) > 1000000)
      return json(413, { error: 'PAYLOAD_TOO_LARGE' });
    if (maintenance) return json(503, { error: 'STORAGE_MAINTENANCE' });
    if (database) {
      try {
        const result = await database.transact((store) =>
          dispatch(store, request, url, body, localTesting),
        );
        return json(result.status, result.data, result.headers);
      } catch (error) {
        // Codes only: never log SQL, contact records, tokens or credentials.
        const code =
          error && typeof error === 'object' && 'code' in error
            ? String(error.code)
            : 'STORAGE';
        console.error(
          'LIF_DATABASE_REQUEST_FAILED',
          url.pathname,
          /^[A-Z0-9_]{1,40}$/.test(code) ? code : 'STORAGE',
        );
        const notReady =
          code === '42P01' ||
          (error instanceof Error && error.message === 'DATABASE_NOT_READY');
        return json(503, {
          error:
            code === 'LOCAL_DATABASE_CONFIG_REQUIRED'
              ? code
              : notReady
                ? 'STORAGE_NOT_READY'
                : 'STORAGE_UNAVAILABLE',
        });
      }
    }
    let committedHeaders: Headers | undefined;
    let store: CompetitionStore | undefined;
    try {
      for (let retry = 0; retry < 4; retry++) {
        const saved = await state.load();
        store = new CompetitionStore(':memory:');
        importCompetitionState(store, saved.snapshot);
        const before = exportCompetitionState(store);
        const result = await dispatch(store, request, url, body, localTesting);
        const after = exportCompetitionState(store);
        let revision = saved.revision;
        if (after !== before) {
          const commit = await state.save(saved.revision, after);
          if (!commit.saved) {
            store.db.close();
            store = undefined;
            continue;
          }
          revision = commit.revision;
        }
        // No success or ownership cookie is returned until the durable commit is confirmed.
        committedHeaders = result.headers;
        if (result.status !== 200)
          return json(result.status, result.data, result.headers);
        const service = sheets(store);
        if (
          [
            '/api/contact',
            '/api/games/register',
            '/api/games/finish',
            '/api/games/bootstrap',
          ].includes(url.pathname)
        ) {
          await service.flush();
          const acknowledged = exportCompetitionState(store);
          // A conflict only leaves acknowledgements pending; sync by record ID is idempotent.
          if (acknowledged !== after) await state.save(revision, acknowledged);
        }
        const cookie =
          result.headers.get('set-cookie') ??
          request.headers.get('cookie') ??
          '';
        const token = /lif_game_device=([a-f0-9]{64})/.exec(cookie)?.[1];
        const device = store.db
          .prepare('SELECT id FROM devices WHERE token=?')
          .get(token ?? '') as { id: string } | undefined;
        if (
          ['/api/games/leaderboard', '/api/games/ranking'].includes(
            url.pathname,
          )
        ) {
          const ranking = await service.leaderboard(
            (url.searchParams.get('game') ?? 'all') as GameId | 'all',
            device?.id ?? '',
            Number(
              url.searchParams.get('limit') ?? GAME_CONFIG.LEADERBOARD_SIZE,
            ),
          );
          return json(
            200,
            previewLeaderboard(
              ranking,
              (url.searchParams.get('game') ?? 'all') as GameId | 'all',
            ),
            result.headers,
          );
        }
        if (url.pathname === '/api/games/register')
          result.data.position = previewLeaderboard(
            await service.leaderboard(
              'all',
              device?.id ?? '',
              GAME_CONFIG.LEADERBOARD_SIZE,
            ),
          ).position;
        return json(200, result.data, result.headers);
      }
      return json(503, { error: 'STATE_BUSY' });
    } catch {
      return json(503, { error: 'SHEETS_UNAVAILABLE' }, committedHeaders);
    } finally {
      store?.db.close();
    }
  };
}

export async function syncNetlifyRecords({
  state,
  sheets,
  database,
  maintenance,
}: Dependencies) {
  if (maintenance) return;
  if (database) {
    const store = new CompetitionStore(':memory:');
    try {
      importCompetitionState(store, await database.snapshot());
      const before = new Map(
        (
          store.db.prepare('SELECT * FROM sheet_sync').all() as {
            kind: string;
            id: string;
            hash: string;
          }[]
        ).map((row) => [`${row.kind}:${row.id}`, row.hash]),
      );
      try {
        await sheets(store).flush();
      } finally {
        const changed = (
          store.db.prepare('SELECT * FROM sheet_sync').all() as {
            kind: string;
            id: string;
            hash: string;
          }[]
        ).filter((row) => before.get(`${row.kind}:${row.id}`) !== row.hash);
        await database.acknowledge(changed);
      }
    } finally {
      store.db.close();
    }
    return;
  }
  const saved = await state.load();
  const store = new CompetitionStore(':memory:');
  try {
    importCompetitionState(store, saved.snapshot);
    const before = exportCompetitionState(store);
    await sheets(store).flush();
    const after = exportCompetitionState(store);
    if (after !== before) await state.save(saved.revision, after);
  } finally {
    store.db.close();
  }
}
