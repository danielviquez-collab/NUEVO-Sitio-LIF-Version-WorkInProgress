import { createHash } from 'node:crypto';
import { GAME_CONFIG as C, type GameId } from './config.ts';
import {
  periodBounds,
  REGISTERED_GAMES_SQL,
  type CompetitionStore,
} from './server.ts';
import { nicknameValidationMessage } from './nickname.ts';
import { SheetsConnection } from './sheet-connection.ts';
import { contactLocationLabels } from '../contact-location.ts';

type SheetRecord = Record<string, string | number | boolean> & { id: string };
type Pending = {
  kind: 'games' | 'contacts';
  record: SheetRecord;
  hash: string;
};
type RankRow = {
  nickname: string;
  game: GameId;
  score: number;
  position: number;
};
type Ranking = {
  top: RankRow[];
  position: number | null;
  best: number;
  total: number;
  period: string;
};
type SheetResponse = {
  ok?: boolean;
  ids?: string[];
  ranking?: Ranking;
  contactLocationSaved?: boolean;
};
type StoredRecord = Record<string, string | number> & {
  id: string;
  consent: number;
};

export class CompetitionSheets {
  private inFlight: Promise<void> | null = null;
  private cache = new Map<string, { until: number; ranking: Ranking }>();
  private store: CompetitionStore;
  private connection: SheetsConnection;
  constructor(
    store: CompetitionStore,
    endpoint: string,
    secret: string,
    request: typeof fetch = fetch,
    connection?: SheetsConnection,
  ) {
    this.store = store;
    this.connection =
      connection ?? new SheetsConnection(endpoint, secret, request);
  }
  private async call(action: 'sync' | 'ranking', body: unknown) {
    return this.connection.call<SheetResponse>(action, body);
  }
  private pending(): Pending[] {
    const games = this.store.db
      .prepare(
        `SELECT id,participant,game,score,started,achieved,version,name,email,phone,nickname,consent,updated FROM (${REGISTERED_GAMES_SQL}) ORDER BY achieved,id`,
      )
      .all() as StoredRecord[];
    const contacts = this.store.db
      .prepare(
        'SELECT id,name,email,phone,message,consent,created,province,canton,district FROM contact_messages ORDER BY created,id',
      )
      .all() as StoredRecord[];
    const candidates: { kind: Pending['kind']; record: SheetRecord }[] = [
      ...games.map((row) => ({
        kind: 'games' as const,
        record: { ...row, consent: !!row.consent } as SheetRecord,
      })),
      ...contacts.map((row) => {
        const { province, canton, district, ...record } = row;
        const location = contactLocationLabels({ province, canton, district });
        return {
          kind: 'contacts' as const,
          record: {
            ...record,
            ...(province || canton || district ? location : {}),
            consent: !!row.consent,
          } as SheetRecord,
        };
      }),
    ];
    return candidates.flatMap(({ kind, record }) => {
      const hash = createHash('sha256')
        .update(JSON.stringify(record))
        .digest('hex');
      const saved = this.store.db
        .prepare('SELECT hash FROM sheet_sync WHERE kind=? AND id=?')
        .get(kind, record.id) as { hash: string } | undefined;
      return saved?.hash === hash ? [] : [{ kind, record, hash }];
    });
  }
  flush(): Promise<void> {
    if (this.inFlight) return this.inFlight.then(() => this.flush());
    this.inFlight = this.save().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }
  private async save() {
    const pending = this.pending();
    for (const kind of ['games', 'contacts'] as const) {
      const records = pending.filter((row) => row.kind === kind);
      for (let index = 0; index < records.length; index += 20) {
        const batch = records.slice(index, index + 20);
        const response = await this.call('sync', {
          kind,
          records: batch.map((row) => row.record),
        });
        const ids = response.ids;
        if (
          (kind === 'contacts' &&
            batch.some((row) => row.record.province) &&
            response.contactLocationSaved !== true) ||
          !Array.isArray(ids) ||
          ids.length !== batch.length ||
          !batch.every((row, i) => ids[i] === row.record.id)
        )
          throw new Error('SHEETS_UNAVAILABLE');
        // Persist acknowledgements only; the validated local records remain the retry source.
        this.store.db.exec('BEGIN IMMEDIATE');
        try {
          for (const row of batch)
            this.store.db
              .prepare(
                'INSERT INTO sheet_sync VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET hash=excluded.hash',
              )
              .run(row.kind, row.record.id, row.hash);
          this.store.db.exec('COMMIT');
        } catch (error) {
          this.store.db.exec('ROLLBACK');
          throw error;
        }
        this.cache.clear();
      }
    }
  }
  async leaderboard(
    game: GameId | 'all',
    device: string,
    limit: number,
  ): Promise<Ranking> {
    const [start, end] = periodBounds();
    const own = this.store.participant(device);
    const size = Math.max(
      1,
      Math.min(
        C.LEADERBOARD_MAX_SIZE,
        Number.isFinite(limit) ? Math.floor(limit) : C.LEADERBOARD_SIZE,
      ),
    );
    const key = `${game}:${own?.id ?? ''}:${size}:${start}:${end}`;
    const cached = this.cache.get(key);
    if (cached && cached.until > Date.now()) return cached.ranking;
    const response = await this.call('ranking', {
      game: game === 'all' ? 'unified' : game,
      version: C.VERSION,
      participant: own?.id ?? null,
      limit: size,
      start,
      end,
    });
    const raw = response.ranking;
    if (
      !raw ||
      !Array.isArray(raw.top) ||
      raw.top.length > size ||
      !Number.isInteger(raw.total) ||
      raw.total < raw.top.length ||
      (raw.position !== null &&
        (!Number.isInteger(raw.position) ||
          raw.position < 1 ||
          raw.position > raw.total)) ||
      !Number.isSafeInteger(raw.best) ||
      raw.best < 0
    )
      throw new Error('SHEETS_UNAVAILABLE');
    const top: RankRow[] = raw.top.map((row: RankRow, i: number) => {
      if (
        !row ||
        row.position !== i + 1 ||
        typeof row.nickname !== 'string' ||
        nicknameValidationMessage(row.nickname) ||
        !['memory_lif', 'snake'].includes(row.game) ||
        (game !== 'all' && row.game !== game) ||
        !Number.isSafeInteger(row.score) ||
        row.score < 0
      )
        throw new Error('SHEETS_UNAVAILABLE');
      return {
        nickname: row.nickname,
        game: row.game,
        score: row.score,
        position: row.position,
      };
    });
    const ranking = {
      top,
      position: raw.position as number | null,
      best: raw.best as number,
      total: raw.total as number,
      period: C.RANKING_PERIOD,
    };
    this.cache.set(key, { until: Date.now() + 30000, ranking });
    return ranking;
  }
}
