import rhythm from './curtain-rhythm.json' with { type: 'json' };

export const CURTAIN_TEXTURE_ASSET = '/games/cortina-verde-comic.webp';
export const CURTAIN_HOLD_MS = 1500;
export const CURTAIN_FABRIC_OPEN_END_MS = CURTAIN_HOLD_MS + rhythm.durationMs;
export const CURTAIN_LOGO_START_MS = CURTAIN_HOLD_MS + 20;
export const CURTAIN_LOGO_REVEAL_MS = CURTAIN_LOGO_START_MS + 1350;
export const CURTAIN_LOGO_SHINE_START_MS = CURTAIN_LOGO_REVEAL_MS + 20;
export const CURTAIN_LOGO_SHINE_DURATION_MS = 1200;
export const CURTAIN_LOGO_FADE_START_MS =
  CURTAIN_LOGO_SHINE_START_MS + CURTAIN_LOGO_SHINE_DURATION_MS + 80;
export const CURTAIN_LOGO_FADE_END_MS = CURTAIN_LOGO_FADE_START_MS + 500;
export const CURTAIN_CONTENT_REVEAL_MS = CURTAIN_LOGO_FADE_END_MS - 100;
export const CURTAIN_CONTENT_READY_MS = CURTAIN_CONTENT_REVEAL_MS + 780;

function dissolve(progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return p * p * p * (p * (6 * p - 15) + 10);
}

export function curtainLogoShine(elapsedMs: number, durationMs: number) {
  const progress = Math.max(0, Math.min(1, elapsedMs / durationMs));
  return {
    offset: -75 + 150 * dissolve(progress),
    opacity:
      dissolve(progress / 0.12) * (1 - dissolve((progress - 0.88) / 0.12)),
  };
}

export function curtainOpenProgress(elapsed: number) {
  const openingElapsed = elapsed - CURTAIN_HOLD_MS;
  if (openingElapsed <= rhythm.holdMs) return 0;
  const position =
    Math.max(0, Math.min(1, openingElapsed / rhythm.durationMs)) *
    (rhythm.progress.length - 1);
  const index = Math.floor(position);
  const from = rhythm.progress[index];
  const to = rhythm.progress[Math.min(index + 1, rhythm.progress.length - 1)];
  return from + (to - from) * (position - index);
}

export function curtainLogoOpacity(elapsed: number) {
  const appearance = dissolve(
    (elapsed - CURTAIN_LOGO_START_MS) /
      (CURTAIN_LOGO_REVEAL_MS - CURTAIN_LOGO_START_MS),
  );
  return (
    appearance *
    (1 -
      dissolve(
        (elapsed - CURTAIN_LOGO_FADE_START_MS) /
          (CURTAIN_LOGO_FADE_END_MS - CURTAIN_LOGO_FADE_START_MS),
      ))
  );
}

export function curtainLogoOffset(elapsed: number, height: number) {
  const arrival = dissolve(
    (elapsed - CURTAIN_LOGO_START_MS) /
      (CURTAIN_LOGO_REVEAL_MS - CURTAIN_LOGO_START_MS),
  );
  const retirement = dissolve(
    (elapsed - CURTAIN_LOGO_FADE_START_MS) /
      (CURTAIN_LOGO_FADE_END_MS - CURTAIN_LOGO_FADE_START_MS),
  );
  const hovering = Math.max(0, Math.min(80, elapsed - CURTAIN_LOGO_REVEAL_MS));
  const float =
    -Math.min(4, height * 0.006) *
    Math.sin((hovering / 1800) * Math.PI * 2) *
    dissolve(hovering / 300);
  return (
    height * 0.42 * (1 - arrival) +
    float * (1 - retirement) -
    Math.min(22, height * 0.025) * retirement
  );
}

export function curtainDropProgress(elapsed: number) {
  const progress = Math.max(
    0,
    Math.min(
      1,
      (elapsed - CURTAIN_CONTENT_REVEAL_MS) /
        (CURTAIN_CONTENT_READY_MS - CURTAIN_CONTENT_REVEAL_MS),
    ),
  );
  return dissolve(progress);
}

export function curtainContentOffset(elapsed: number, height: number) {
  const progress = curtainDropProgress(elapsed);
  return progress === 1 ? 0 : -height * 1.04 * (1 - progress);
}

// The upper center separates first, while the lower cloth follows the drape.
export function curtainPanelWidth(y: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const drape = 0.65 * y ** 1.7 - 0.6 * (1 - y) ** 1.6;
  return (1 - p) * (1 + p * drape);
}

export function curtainSpotlightsAt(
  elapsed: number,
  width: number,
  height: number,
) {
  const t = elapsed / 1000;
  return [
    {
      x: width * (0.22 + 0.12 * Math.sin(t * 1.8)),
      y: height * (0.52 + 0.16 * Math.cos(t * 1.1)),
    },
    {
      x: width * (0.5 + 0.16 * Math.sin(t * 1.5 + 2)),
      y: height * (0.28 + 0.12 * Math.sin(t * 1.2)),
    },
    {
      x: width * (0.78 + 0.1 * Math.sin(t * 1.7 + 4)),
      y: height * (0.46 + 0.18 * Math.cos(t * 1.3 + 1)),
    },
  ];
}

export function curtainLogoWidth(width: number, height: number) {
  const widthShare = width <= 700 ? 0.48 : 0.2;
  return Math.min(width * widthShare, height * 0.35) * 1.2;
}
