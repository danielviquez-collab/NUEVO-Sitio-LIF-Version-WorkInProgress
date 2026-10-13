import type { Leaderboard } from './client';

// Exported pages replace this data slot per request, before HTML reaches the browser.
export const INITIAL_RANKING_SLOT = '__LIF_REQUEST_RANKING__';
export type InitialRanking = Leaderboard | typeof INITIAL_RANKING_SLOT | null;

export function publicRanking(value: unknown): Leaderboard | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Leaderboard;
  if (
    !Array.isArray(data.top) ||
    data.top.length > 20 ||
    !Number.isSafeInteger(data.total) ||
    data.total < data.top.length ||
    typeof data.period !== 'string' ||
    data.top.some(
      (row, index) =>
        !row ||
        row.position !== index + 1 ||
        typeof row.nickname !== 'string' ||
        !['snake', 'memory_lif'].includes(row.game) ||
        !Number.isSafeInteger(row.score) ||
        row.score < 0,
    )
  )
    return null;
  return {
    top: data.top.map(({ position, nickname, game, score }) => ({
      position,
      nickname,
      game,
      score,
    })),
    total: data.total,
    period: data.period,
    position: null,
    best: 0,
  };
}

export async function requestPublicRanking(
  origin: string,
  request: typeof fetch = fetch,
): Promise<Leaderboard | null> {
  try {
    const response = await request(new URL('/api/games/ranking', origin), {
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });
    return response.ok &&
      response.headers.get('content-type')?.includes('application/json')
      ? publicRanking(await response.json())
      : null;
  } catch {
    return null;
  }
}
