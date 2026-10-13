import type { GameId } from './config.ts';

export { ROULETTE_SPIN_MS } from './roulette-motion.ts';
export const ROULETTE_RESULT_MS = 900;

export function availableRandomGames(
  attempts: Record<GameId, number>,
): GameId[] {
  return (['memory_lif', 'snake'] as const).filter((game) => attempts[game] > 0);
}

export function chooseRandomGame(
  attempts: Record<GameId, number>,
  sample: number,
) {
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1)
    throw new Error('RANDOM_SAMPLE_INVALID');
  const games = availableRandomGames(attempts);
  return games[Math.floor(sample * games.length)] ?? null;
}

export function rouletteRotation(game: GameId, sample: number) {
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1)
    throw new Error('RANDOM_SAMPLE_INVALID');
  // Alternating quarter sections; each repeated sector gets half its game's stops.
  const center = (game === 'memory_lif' ? 45 : 135) + (sample < 0.5 ? 0 : 180);
  const jitter = ((sample % 0.5) * 2 - 0.5) * 50;
  return 360 * 5 + (360 - center) + jitter;
}
