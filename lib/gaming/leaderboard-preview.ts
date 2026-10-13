import type { Leaderboard } from './client';
import { GAME_CONFIG, type GameId } from './config.ts';

const PREVIEW_PLAYERS: Leaderboard['top'] = [
  { position: 0, nickname: 'Jess 🏆', game: 'memory_lif', score: 3900 },
  { position: 0, nickname: 'Josh 😊', game: 'snake', score: 3250 },
  { position: 0, nickname: 'Pris ✨', game: 'memory_lif', score: 2800 },
  { position: 0, nickname: 'TicoPlay', game: 'snake', score: 2350 },
  { position: 0, nickname: 'MangoPower🥭', game: 'memory_lif', score: 1850 },
  { position: 0, nickname: 'LimonExpr🍋', game: 'snake', score: 1200 },
  { position: 0, nickname: 'LaTica', game: 'memory_lif', score: 1150 },
  { position: 0, nickname: 'RetroLIF', game: 'snake', score: 1100 },
  { position: 0, nickname: 'SaborNinja', game: 'memory_lif', score: 1050 },
  { position: 0, nickname: 'FresaFresh🍓', game: 'snake', score: 1000 },
  { position: 0, nickname: 'Juanca', game: 'memory_lif', score: 1000 },
  { position: 0, nickname: 'MaracuyaMix', game: 'snake', score: 950 },
  { position: 0, nickname: 'ValePlay', game: 'memory_lif', score: 900 },
  { position: 0, nickname: 'PintoPower', game: 'snake', score: 850 },
  { position: 0, nickname: 'CaroCR', game: 'memory_lif', score: 850 },
  { position: 0, nickname: 'GaboPixel', game: 'snake', score: 800 },
  { position: 0, nickname: 'TropicalPro', game: 'memory_lif', score: 750 },
  { position: 0, nickname: 'SofiSnake', game: 'snake', score: 700 },
  { position: 0, nickname: 'LIFRunner', game: 'memory_lif', score: 650 },
  { position: 0, nickname: 'NicoBonus', game: 'snake', score: 600 },
];

export function previewLeaderboard(
  ranking: Leaderboard | null,
  game: GameId | 'all' = 'all',
): Leaderboard {
  const players = PREVIEW_PLAYERS.filter(
    (row) => game === 'all' || row.game === game,
  );
  const capacity = Math.min(players.length, GAME_CONFIG.LEADERBOARD_MAX_SIZE);
  if (
    ranking &&
    (ranking.total >= capacity ||
      ranking.top.some((row) => !['memory_lif', 'snake'].includes(row.game)))
  )
    return ranking;
  const actual = ranking?.top ?? [];
  const nicknameKey = (name: string) =>
    name.trim().normalize('NFC').toLocaleLowerCase('es-CR');
  const occupied = new Set(actual.map((row) => nicknameKey(row.nickname)));
  const own = actual.find((row) => row.position === ranking?.position);
  // Every actual participant replaces one reference; references never block entry.
  const remaining = players
    .filter((row) => !occupied.has(nicknameKey(row.nickname)))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, capacity - actual.length));
  const rows = [...actual, ...remaining]
    .sort((a, b) => b.score - a.score)
    .slice(0, capacity)
    .map((row, index) => ({ ...row, position: index + 1 }));
  return {
    top: rows,
    position: own
      ? rows.find(
          (row) => nicknameKey(row.nickname) === nicknameKey(own.nickname),
        )!.position
      : (ranking?.position ?? null),
    best: ranking?.best ?? 0,
    total: Math.max(ranking?.total ?? 0, rows.length),
    period: ranking?.period ?? 'campaign',
  };
}
