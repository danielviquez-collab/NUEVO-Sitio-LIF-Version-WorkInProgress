import rhythm from './roulette-rhythm.json' with { type: 'json' };

export const ROULETTE_SPIN_MS = rhythm.durationMs;

export function rouletteProgressAt(
  elapsedMs: number,
  durationMs = ROULETTE_SPIN_MS,
) {
  const position =
    Math.max(0, Math.min(1, elapsedMs / durationMs)) *
    (rhythm.progress.length - 1);
  const index = Math.floor(position);
  const from = rhythm.progress[index];
  const to = rhythm.progress[Math.min(index + 1, rhythm.progress.length - 1)];
  return from + (to - from) * (position - index);
}

export function roulettePointerAngleAt(
  elapsedMs: number,
  durationMs = ROULETTE_SPIN_MS,
) {
  if (elapsedMs <= 0 || elapsedMs >= durationMs) return 0;
  const time = (elapsedMs / durationMs) * rhythm.durationMs;
  let angle = 0;
  // Each audible detent gives the hinged pointer a short damped impulse.
  for (const tick of rhythm.ticksMs) {
    const age = time - tick;
    if (age < 0) break;
    if (age < 180)
      angle -=
        32 *
        Math.sin((age * Math.PI) / 45) *
        Math.exp(-age / 42) *
        (1 - age / 180) ** 2;
  }
  return Math.max(-26, Math.min(7, angle));
}
