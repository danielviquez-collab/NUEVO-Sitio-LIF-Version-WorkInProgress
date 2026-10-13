export const PODIUM_SCORE_REVEAL_MS = 2200;

export function advancePodiumScoreReveal(elapsed: number, frameMs: number) {
  const previous = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  const delta = Number.isFinite(frameMs)
    ? Math.min(64, Math.max(0, frameMs))
    : 0;
  return Math.min(PODIUM_SCORE_REVEAL_MS, previous + delta);
}

export function podiumScoreValue(score: number, elapsed: number) {
  const target = Number.isFinite(score) ? Math.max(0, Math.trunc(score)) : 0;
  const progress = Number.isFinite(elapsed)
    ? Math.min(1, Math.max(0, elapsed / PODIUM_SCORE_REVEAL_MS))
    : 0;
  if (progress === 1) return target;
  return Math.floor(target * (1 - (1 - progress) ** 3));
}
