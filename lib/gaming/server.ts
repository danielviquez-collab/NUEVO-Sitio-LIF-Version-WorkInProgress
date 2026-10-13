import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  GAME_CONFIG as C,
  type GameId,
  type HistoricalGameId,
  ACTIVE_GAMES,
  RANKING_VERSIONS,
  isActiveGame,
} from './config.ts';
import { replayGame, type Input } from './engine.ts';
import { nicknameValidationMessage, normalizeNickname } from './nickname.ts';
import type { CompetitionSheets } from './sheets.ts';
import { validateContactLocation } from '../contact-location.ts';
import { previewLeaderboard } from './leaderboard-preview.ts';
import type { Leaderboard } from './client.ts';

type Session = {
  id: string;
  device: string;
  participant: string | null;
  game: HistoricalGameId;
  seed: number;
  started: number;
  ended: number | null;
  status: string;
  attempt: number;
  day: string;
  raw_score: number;
  validated_score: number;
  reason: string | null;
  inputs: string;
  sim_ms: number;
  version: string;
  heartbeat: number;
};
export const REGISTERED_GAMES_SQL = `SELECT s.id,s.device,s.game,s.validated_score score,s.started,s.ended achieved,s.version,
  COALESCE(r.participant,p.id) participant,COALESCE(r.name,p.name) name,COALESCE(r.email,p.email) email,
  COALESCE(r.phone,p.phone) phone,COALESCE(r.nickname,p.nickname) nickname,
  COALESCE(r.terms,p.terms) consent,COALESCE(r.updated,p.updated) updated
  FROM sessions s LEFT JOIN registrations r ON r.id=s.id LEFT JOIN participants p ON p.id=s.participant
  WHERE s.status='completed' AND (r.id IS NOT NULL OR p.id IS NOT NULL)`;
export function costaRicaDay(now = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: C.TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
export function periodBounds(now = Date.now()): [number, number] {
  const day = costaRicaDay(now),
    date = new Date(`${day}T00:00:00-06:00`);
  if (C.RANKING_PERIOD === 'weekly') {
    const weekday = date.getUTCDay();
    const start = date.getTime() - ((weekday + 6) % 7) * 86400000;
    return [start, start + 7 * 86400000];
  }
  if (C.RANKING_PERIOD === 'monthly') {
    const [year, month] = day.split('-').map(Number);
    return [Date.UTC(year, month - 1, 1, 6), Date.UTC(year, month, 1, 6)];
  }
  return [
    new Date(`${C.RANKING_START}T00:00:00-06:00`).getTime(),
    new Date(`${C.RANKING_END}T23:59:59-06:00`).getTime(),
  ];
}
export class CompetitionStore {
  db: DatabaseSync;
  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS devices(id TEXT PRIMARY KEY, token TEXT UNIQUE NOT NULL, created INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS participants(id TEXT PRIMARY KEY, device TEXT UNIQUE NOT NULL REFERENCES devices(id), name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, nickname TEXT NOT NULL, nickname_key TEXT UNIQUE NOT NULL, terms INTEGER NOT NULL, created INTEGER NOT NULL, updated INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY, device TEXT NOT NULL REFERENCES devices(id), participant TEXT REFERENCES participants(id), game TEXT NOT NULL, seed INTEGER NOT NULL, started INTEGER NOT NULL, ended INTEGER, status TEXT NOT NULL, attempt INTEGER NOT NULL, day TEXT NOT NULL, raw_score INTEGER NOT NULL DEFAULT 0, validated_score INTEGER NOT NULL DEFAULT 0, reason TEXT, inputs TEXT NOT NULL DEFAULT '[]', sim_ms INTEGER NOT NULL DEFAULT 0, version TEXT NOT NULL, heartbeat INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS session_attempts ON sessions(device, game, day);
      CREATE INDEX IF NOT EXISTS session_ranking ON sessions(game, status, started, participant);
      CREATE UNIQUE INDEX IF NOT EXISTS one_active_game ON sessions(device) WHERE status='playing';
      CREATE TABLE IF NOT EXISTS start_requests(device TEXT NOT NULL REFERENCES devices(id), request TEXT NOT NULL, session TEXT NOT NULL REFERENCES sessions(id), PRIMARY KEY(device,request));`);
    this.db
      .exec(`CREATE TABLE IF NOT EXISTS registrations(id TEXT PRIMARY KEY REFERENCES sessions(id),participant TEXT NOT NULL,device TEXT NOT NULL REFERENCES devices(id),name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,nickname TEXT NOT NULL,nickname_key TEXT NOT NULL,terms INTEGER NOT NULL,created INTEGER NOT NULL,updated INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS registration_nicknames ON registrations(nickname_key,device);`);
    this.db.exec(
      `CREATE TABLE IF NOT EXISTS contact_messages(id TEXT PRIMARY KEY,request TEXT UNIQUE NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,message TEXT NOT NULL,consent INTEGER NOT NULL,created INTEGER NOT NULL);`,
    );
    this.db.exec(
      'CREATE TABLE IF NOT EXISTS sheet_sync(kind TEXT NOT NULL,id TEXT NOT NULL,hash TEXT NOT NULL,PRIMARY KEY(kind,id));',
    );
    const contactColumns = this.db
      .prepare('PRAGMA table_info(contact_messages)')
      .all() as { name: string }[];
    for (const column of ['province', 'canton', 'district'])
      if (!contactColumns.some((item) => item.name === column))
        this.db.exec(
          `ALTER TABLE contact_messages ADD COLUMN ${column} TEXT NOT NULL DEFAULT '';`,
        );
  }
  device(token?: string) {
    if (token) {
      const row = this.db
        .prepare('SELECT id, token FROM devices WHERE token=?')
        .get(token) as { id: string; token: string } | undefined;
      if (row) return row;
    }
    const row = { id: randomUUID(), token: randomBytes(32).toString('hex') };
    this.db
      .prepare('INSERT INTO devices VALUES(?,?,?)')
      .run(row.id, row.token, Date.now());
    return row;
  }
  contact(data: Record<string, unknown>) {
    const value = (key: string, max: number) =>
      typeof data[key] === 'string'
        ? (data[key] as string).trim().slice(0, max)
        : '';
    const request = value('request', 36),
      name = value('name', 100),
      email = value('email', 150),
      phone = value('phone', 25),
      message = value('message', 3000);
    if (
      !/^[a-f0-9-]{36}$/.test(request) ||
      name.length < 2 ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      message.length < 10 ||
      data.consent !== true ||
      data.website
    )
      throw new Error('INPUT_INVALID');
    const location = validateContactLocation(data);
    const previous = this.db
      .prepare('SELECT id FROM contact_messages WHERE request=?')
      .get(request) as { id: string } | undefined;
    if (previous) return { saved: true, id: previous.id };
    const id = randomUUID();
    this.db
      .prepare(
        'INSERT INTO contact_messages(id,request,name,email,phone,message,consent,created,province,canton,district) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
      )
      .run(
        id,
        request,
        name,
        email,
        phone,
        message,
        1,
        Date.now(),
        location.province,
        location.canton,
        location.district,
      );
    return { saved: true, id };
  }
  private usedAttempts(device: string, game: GameId) {
    return (
      this.db
        .prepare(
          'SELECT COUNT(*) AS n FROM sessions WHERE device=? AND game=? AND day=?',
        )
        .get(device, game, costaRicaDay()) as { n: number }
    ).n;
  }
  attempts(device: string, localTesting = false) {
    return Object.fromEntries(
      ACTIVE_GAMES.map((game) => {
        const used = localTesting ? 0 : this.usedAttempts(device, game);
        return [game, Math.max(0, C.DAILY_ATTEMPTS - used)];
      }),
    ) as Record<GameId, number>;
  }
  participant(device: string) {
    return (this.db
      .prepare(
        'SELECT participant id,nickname FROM registrations WHERE device=? ORDER BY created DESC,rowid DESC LIMIT 1',
      )
      .get(device) ??
      this.db
        .prepare('SELECT id,nickname FROM participants WHERE device=?')
        .get(device)) as { id: string; nickname: string } | undefined;
  }
  start(
    device: string,
    game: GameId,
    request = randomUUID(),
    localTesting = false,
  ) {
    if (!isActiveGame(game)) throw new Error('GAME_INVALID');
    if (!/^[a-f0-9-]{36}$/.test(request)) throw new Error('INPUT_INVALID');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const existing = this.db
        .prepare(
          'SELECT session FROM start_requests WHERE device=? AND request=?',
        )
        .get(device, request) as { session: string } | undefined;
      if (existing) {
        const row = this.session(device, existing.session);
        if (row.game !== game) throw new Error('GAME_INVALID');
        this.db.exec('COMMIT');
        return {
          id: row.id,
          seed: row.seed,
          game,
          attempt: row.attempt,
          configVersion: row.version,
        };
      }
      // Starting after a reload finalizes the interrupted session, never refunds its attempt.
      this.db
        .prepare(
          "UPDATE sessions SET status='abandoned', reason='reload', ended=? WHERE device=? AND status='playing'",
        )
        .run(Date.now(), device);
      const available = this.attempts(device, localTesting)[game];
      if (!available) throw new Error('NO_ATTEMPTS');
      const id = randomUUID(),
        seed = this.sessionSeed(game),
        now = Date.now(),
        attempt = this.usedAttempts(device, game) + 1;
      this.db
        .prepare(
          'INSERT INTO sessions(id,device,participant,game,seed,started,status,attempt,day,version,heartbeat) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
        )
        .run(
          id,
          device,
          null,
          game,
          seed,
          now,
          'playing',
          attempt,
          costaRicaDay(),
          C.VERSION,
          now,
        );
      this.db
        .prepare('INSERT INTO start_requests VALUES(?,?,?)')
        .run(device, request, id);
      this.db.exec('COMMIT');
      return {
        id,
        seed,
        game,
        attempt,
        configVersion: C.VERSION,
      };
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  private sessionSeed(game: GameId) {
    const debug = process.env.REPLAY_SESSION_SEED;
    if (
      process.env.NODE_ENV === 'development' &&
      C.ENABLE_DEBUG_SEED_REPLAY &&
      debug !== undefined
    ) {
      if (!/^[0-9]+$/.test(debug) || Number(debug) > 0xffffffff)
        throw new Error('INPUT_INVALID');
      return Number(debug);
    }
    let seed = randomBytes(4).readUInt32LE();
    while (
      this.db
        .prepare(
          'SELECT id FROM sessions WHERE game=? AND seed=? AND version=?',
        )
        .get(game, seed, C.VERSION)
    )
      seed = randomBytes(4).readUInt32LE();
    return seed;
  }
  session(device: string, id: string) {
    const row = this.db
      .prepare('SELECT * FROM sessions WHERE id=? AND device=?')
      .get(id, device) as Session | undefined;
    if (!row) throw new Error('SESSION_INVALID');
    return row;
  }
  validate(
    device: string,
    id: string,
    inputs: Input[],
    simMs: number,
    rawScore: number,
    mode: 'checkpoint' | 'finish' | 'abandon',
  ) {
    const row = this.session(device, id);
    if (row.status !== 'playing') {
      if (mode === 'checkpoint' && row.ended) return { saved: true };
      if (mode !== 'checkpoint' && row.ended) return this.result(device, id);
      throw new Error('SESSION_INVALID');
    }
    if (mode === 'checkpoint' && simMs < row.sim_ms) return { saved: true };
    if (
      ![
        C.VERSION,
        'lif-games-20261007-calibrated-v4',
        'lif-games-20261007-restored-v3',
        'lif-games-20261007-unified-v2',
        'lif-games-20261007-memory-v1',
        'lif-games-20261002-v2',
      ].includes(row.version)
    )
      throw new Error('SESSION_VERSION');
    if (
      !Number.isInteger(simMs) ||
      simMs < row.sim_ms ||
      simMs > 3600000 ||
      simMs % C.STEP_MS !== 0 ||
      !Number.isSafeInteger(rawScore) ||
      rawScore < 0 ||
      !Array.isArray(inputs) ||
      inputs.length > 12000
    )
      throw new Error('SCORE_INVALID');
    const elapsed = Date.now() - row.started;
    if (simMs > elapsed + 2000) throw new Error('TIME_INVALID');
    let previous = -1;
    for (const input of inputs) {
      if (
        !Number.isInteger(input.at) ||
        input.at < previous ||
        input.at > simMs ||
        input.at % C.STEP_MS !== 0 ||
        (row.game === 'memory_lif'
          ? input.direction !== undefined ||
            input.lane !== undefined ||
            !(
              (Number.isInteger(input.slot) &&
                input.slot! >= 0 &&
                input.slot! < 16 &&
                input.action === undefined) ||
              (input.slot === undefined &&
                ['peek', 'radar'].includes(input.action ?? ''))
            )
          : input.slot !== undefined ||
            input.action !== undefined ||
            (row.game === 'catch'
              ? !(
                  (input.lane !== undefined &&
                    Number.isInteger(input.lane) &&
                    input.lane >= 0 &&
                    input.lane <= 4) ||
                  ['left', 'right'].includes(input.direction ?? '')
                )
              : !['up', 'down', 'left', 'right'].includes(
                  input.direction ?? '',
                ) || input.lane !== undefined))
      )
        throw new Error('INPUT_INVALID');
      previous = input.at;
    }
    const saved = JSON.parse(row.inputs) as Input[];
    if (JSON.stringify(inputs.slice(0, saved.length)) !== JSON.stringify(saved))
      throw new Error('INPUT_REWRITTEN');
    const state = replayGame(row.game, row.seed, inputs, simMs, row.version);
    if (state.ms !== simMs) throw new Error('TIME_INVALID');
    if (rawScore !== state.score) throw new Error('SCORE_INVALID');
    if (mode === 'finish' && !state.ended) throw new Error('GAME_NOT_FINISHED');
    const status =
      mode === 'abandon'
        ? 'abandoned'
        : mode === 'finish'
          ? 'completed'
          : 'playing';
    this.db
      .prepare(
        'UPDATE sessions SET inputs=?,sim_ms=?,raw_score=?,validated_score=?,heartbeat=?,status=?,ended=?,reason=? WHERE id=?',
      )
      .run(
        JSON.stringify(inputs),
        simMs,
        rawScore,
        state.score,
        Date.now(),
        status,
        status === 'playing' ? null : Date.now(),
        status === 'abandoned' ? 'exit' : state.ended,
        id,
      );
    return mode === 'checkpoint' ? { saved: true } : this.result(device, id);
  }
  leaderboard(
    game: GameId | 'all' = 'all',
    device?: string,
    limit: number = C.LEADERBOARD_SIZE,
    participant?: string,
  ) {
    const [start, end] = periodBounds();
    if (game !== 'all' && !isActiveGame(game)) throw new Error('GAME_INVALID');
    const rows = this.db
      .prepare(`WITH registered AS (${REGISTERED_GAMES_SQL}), personal AS (
        SELECT participant,nickname,game,score,achieved,
          ROW_NUMBER() OVER (PARTITION BY participant ORDER BY score DESC,achieved ASC,id ASC) choice
        FROM registered WHERE (?='all' OR game=?) AND game IN ('memory_lif','snake') AND version IN (${RANKING_VERSIONS.map(() => '?').join(',')}) AND started BETWEEN ? AND ?
      ) SELECT nickname,game,score,participant,ROW_NUMBER() OVER (ORDER BY score DESC,achieved ASC,participant ASC) position FROM personal WHERE choice=1 ORDER BY position`)
      .all(game, game, ...RANKING_VERSIONS, start, end) as {
      nickname: string;
      score: number;
      participant: string;
      position: number;
      game: GameId;
    }[];
    const own =
      participant ?? (device ? this.participant(device)?.id : undefined);
    const publicRow = ({
      nickname,
      score,
      position,
      game,
    }: (typeof rows)[number]) => ({ nickname, score, position, game });
    return {
      top: rows
        .slice(
          0,
          Math.max(
            1,
            Math.min(
              C.LEADERBOARD_MAX_SIZE,
              Number.isFinite(limit) ? Math.floor(limit) : C.LEADERBOARD_SIZE,
            ),
          ),
        )
        .map(publicRow),
      position: rows.find((r) => r.participant === own)?.position ?? null,
      best: rows.find((r) => r.participant === own)?.score ?? 0,
      total: rows.length,
      period: C.RANKING_PERIOD,
    };
  }
  result(device: string, id: string) {
    const session = this.session(device, id);
    const registration = this.db
      .prepare('SELECT participant FROM registrations WHERE id=?')
      .get(id) as { participant: string } | undefined;
    const participant = registration?.participant ?? session.participant;
    const ranking = participant
      ? this.leaderboard('all', undefined, C.LEADERBOARD_SIZE, participant)
      : null;
    const best = this.db
      .prepare(
        `WITH registered AS (${REGISTERED_GAMES_SQL}) SELECT MAX(score) n FROM registered WHERE participant=? AND game IN ('memory_lif','snake') AND version IN (${RANKING_VERSIONS.map(() => '?').join(',')})`,
      )
      .get(participant, ...RANKING_VERSIONS) as { n: number | null };
    const previous = this.db
      .prepare(
        `WITH registered AS (${REGISTERED_GAMES_SQL}) SELECT MAX(score) n FROM registered WHERE participant=? AND game IN ('memory_lif','snake') AND version IN (${RANKING_VERSIONS.map(() => '?').join(',')}) AND id<>? AND achieved<=?`,
      )
      .get(
        participant,
        ...RANKING_VERSIONS,
        id,
        session.ended ?? Date.now(),
      ) as {
      n: number | null;
    };
    return {
      id,
      score: session.validated_score,
      reason: session.reason,
      best: best.n ?? session.validated_score,
      newBest: !!participant && session.validated_score > (previous.n ?? 0),
      position: ranking?.position ?? null,
      attempts: this.attempts(device),
    };
  }
  register(device: string, id: string, data: Record<string, unknown>) {
    const session = this.session(device, id);
    if (session.status !== 'completed') throw new Error('SESSION_INVALID');
    const field = (name: string, max: number) =>
      typeof data[name] === 'string'
        ? (data[name] as string).trim().slice(0, max)
        : '';
    const name = field('name', 100),
      email = field('email', 150).toLowerCase(),
      phone = field('phone', 25),
      nickname = normalizeNickname(
        typeof data.nickname === 'string' ? data.nickname : '',
      );
    if (
      name.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^[+\d ()-]{8,25}$/.test(phone) ||
      nicknameValidationMessage(nickname) ||
      data.terms !== true
    )
      throw new Error('REGISTRATION_INVALID');
    const nicknameKey = nickname.toLocaleLowerCase('es-CR'),
      now = Date.now();
    try {
      this.db.exec('BEGIN IMMEDIATE');
      const saved = (this.db
        .prepare(
          'SELECT name,email,phone,nickname FROM registrations WHERE id=?',
        )
        .get(id) ??
        (session.participant
          ? this.db
              .prepare(
                'SELECT name,email,phone,nickname FROM participants WHERE id=?',
              )
              .get(session.participant)
          : undefined)) as
        | { name: string; email: string; phone: string; nickname: string }
        | undefined;
      if (saved) {
        if (
          saved.name !== name ||
          saved.email !== email ||
          saved.phone !== phone ||
          saved.nickname !== nickname
        )
          throw new Error('REGISTRATION_LOCKED');
        this.db.exec('COMMIT');
        return this.result(device, id);
      }
      const owners = this.db
        .prepare(`SELECT id participant,device FROM participants WHERE nickname_key=?
        UNION ALL SELECT participant,device FROM registrations WHERE nickname_key=?`)
        .all(nicknameKey, nicknameKey) as {
        participant: string;
        device: string;
      }[];
      if (owners.some((owner) => owner.device !== device))
        throw new Error('NICKNAME_TAKEN');
      const participant = owners[0]?.participant ?? randomUUID();
      // One immutable snapshot per finished game; legacy profiles and anonymous games stay untouched.
      this.db
        .prepare('INSERT INTO registrations VALUES(?,?,?,?,?,?,?,?,?,?,?)')
        .run(
          id,
          participant,
          device,
          name,
          email,
          phone,
          nickname,
          nicknameKey,
          now,
          now,
          now,
        );
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
    return this.result(device, id);
  }
}

export function competitionMiddleware(
  store: CompetitionStore,
  sheets?: CompetitionSheets,
  options: {
    secureCookies?: boolean;
    referenceRanking?: boolean;
    localTesting?: boolean;
  } = {},
) {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    if (!req.url?.startsWith('/api/games/') && req.url !== '/api/contact')
      return next();
    const send = (code: number, data: unknown) => {
      res.statusCode = code;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(data));
    };
    try {
      // Testing access is server-controlled and never available on a published host.
      const localTesting =
        options.localTesting === true &&
        process.env.NODE_ENV === 'development' &&
        !options.secureCookies &&
        /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(
          req.headers.host ?? '',
        );
      const presentRanking = (
        ranking: Leaderboard,
        game: GameId | 'all' = 'all',
      ) =>
        options.referenceRanking ? previewLeaderboard(ranking, game) : ranking;
      const presentResult = (
        device: string,
        id: string,
        result: ReturnType<CompetitionStore['result']>,
      ) => {
        if (localTesting) result.attempts = store.attempts(device, true);
        if (!options.referenceRanking) return result;
        const registration = store.db
          .prepare('SELECT participant FROM registrations WHERE id=?')
          .get(id) as { participant: string } | undefined;
        const participant =
          registration?.participant ?? store.session(device, id).participant;
        if (participant)
          result.position = presentRanking(
            store.leaderboard(
              'all',
              undefined,
              C.LEADERBOARD_SIZE,
              participant,
            ),
          ).position;
        return result;
      };
      const url = new URL(req.url, 'http://localhost');
      if (req.method !== 'GET' && req.method !== 'POST')
        return send(405, { error: 'METHOD_INVALID' });
      if (
        req.headers.origin &&
        new URL(req.headers.origin).host !== req.headers.host
      )
        return send(403, { error: 'ORIGIN_INVALID' });
      if (url.pathname === '/api/games/ranking') {
        if (req.method !== 'GET') return send(405, { error: 'METHOD_INVALID' });
        // Public page reads do not create identities, spend attempts or alter sessions.
        return send(
          200,
          presentRanking(
            sheets
              ? await sheets.leaderboard('all', '', C.LEADERBOARD_SIZE)
              : store.leaderboard('all', undefined, C.LEADERBOARD_SIZE),
          ),
        );
      }
      const token = /(?:^|;\s*)lif_game_device=([a-f0-9]{64})/.exec(
        req.headers.cookie ?? '',
      )?.[1];
      const device = store.device(token);
      if (device.token !== token)
        res.setHeader(
          'Set-Cookie',
          `lif_game_device=${device.token}; Path=/api/games; HttpOnly; SameSite=Strict; Max-Age=31536000${options.secureCookies ? '; Secure' : ''}`,
        );
      if (req.method === 'GET' && url.pathname === '/api/games/bootstrap') {
        store.db
          .prepare(
            "UPDATE sessions SET status='abandoned',reason='connection_lost',ended=? WHERE device=? AND status='playing' AND heartbeat < ?",
          )
          .run(Date.now(), device.id, Date.now() - 90000);
        const participant = store.participant(device.id);
        return send(200, {
          deviceId: device.id,
          attempts: store.attempts(device.id, localTesting),
          ...(localTesting ? { localTesting: true } : {}),
          participant: participant ? { nickname: participant.nickname } : null,
          day: costaRicaDay(),
        });
      }
      if (req.method === 'GET' && url.pathname === '/api/games/leaderboard') {
        const game = url.searchParams.get('game') ?? 'all';
        if (!isActiveGame(game) && game !== 'all')
          throw new Error('GAME_INVALID');
        const limit = Number(
          url.searchParams.get('limit') ?? C.LEADERBOARD_SIZE,
        );
        return send(
          200,
          presentRanking(
            sheets
              ? await sheets.leaderboard(game, device.id, limit)
              : store.leaderboard(game, device.id, limit),
            game,
          ),
        );
      }
      if (req.method !== 'POST') return send(405, { error: 'METHOD_INVALID' });
      if (!(req.headers['content-type'] ?? '').startsWith('application/json'))
        return send(415, { error: 'CONTENT_TYPE_INVALID' });
      let body = '';
      for await (const chunk of req) {
        body += chunk.toString();
        if (body.length > 1000000) throw new Error('PAYLOAD_TOO_LARGE');
      }
      let data;
      try {
        data = JSON.parse(body || '{}');
      } catch {
        throw new Error('INPUT_INVALID');
      }
      if (!data || typeof data !== 'object' || Array.isArray(data))
        throw new Error('INPUT_INVALID');
      if (url.pathname === '/api/contact') {
        const saved = store.contact(data);
        if (sheets) await sheets.flush();
        return send(200, saved);
      }
      if (url.pathname === '/api/games/start') {
        if (!isActiveGame(data.game)) throw new Error('GAME_INVALID');
        if (typeof data.request !== 'string') throw new Error('INPUT_INVALID');
        return send(
          200,
          store.start(device.id, data.game, data.request, localTesting),
        );
      }
      if (url.pathname === '/api/games/register') {
        const result = store.register(device.id, data.id, data);
        if (sheets) {
          await sheets.flush();
          result.position = presentRanking(
            await sheets.leaderboard('all', device.id, C.LEADERBOARD_SIZE),
          ).position;
        }
        return send(200, presentResult(device.id, data.id, result));
      }
      const mode = url.pathname.split('/').pop();
      if (mode === 'checkpoint' || mode === 'finish' || mode === 'abandon') {
        const result = store.validate(
          device.id,
          data.id,
          data.inputs,
          data.simMs,
          data.score,
          mode,
        );
        if (sheets && mode === 'finish') await sheets.flush();
        return send(
          200,
          mode === 'checkpoint'
            ? result
            : presentResult(
                device.id,
                data.id,
                result as ReturnType<CompetitionStore['result']>,
              ),
        );
      }
      return send(404, { error: 'NOT_FOUND' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SERVER_ERROR';
      if (message === 'SHEETS_UNAVAILABLE')
        return send(503, { error: message });
      const known =
        /^(NO_ATTEMPTS|SESSION_|SCORE_|TIME_|INPUT_|GAME_|REGISTRATION_|NICKNAME_|PAYLOAD_)/.test(
          message,
        );
      if (!known) console.error('[LIF games] Request failed:', message);
      send(known ? 422 : 500, { error: known ? message : 'SERVER_ERROR' });
    }
  };
}
