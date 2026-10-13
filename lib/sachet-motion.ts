export type PackBounds = { left: number; top: number; width: number; height: number };
export const sachetPhases = [
  ['focusing', 360], ['settling', 320], ['turning', 580], ['backVisible', 240], ['nutritionExpanding', 620],
] as const;
export type SachetPhase = typeof sachetPhases[number][0];
export const easeInOut = (t: number) => t * t * (3 - 2 * t);
export const easeOut = (t: number) => 1 - (1 - t) ** 3;
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function paintedPackBounds(box: PackBounds, naturalWidth: number, naturalHeight: number): PackBounds {
  if (!naturalWidth || !naturalHeight) return box;
  const ratio = Math.min(box.width / naturalWidth, box.height / naturalHeight);
  const width = naturalWidth * ratio;
  const height = naturalHeight * ratio;
  return { left: box.left + (box.width - width) / 2, top: box.top + (box.height - height) / 2, width, height };
}

export function centeredPackBounds(bounds: PackBounds, viewport: PackBounds): PackBounds {
  const scale = Math.min(1.65, Math.max(1, viewport.width - 64) / bounds.width, Math.max(1, viewport.height - 144) / bounds.height);
  const width = bounds.width * scale;
  const height = bounds.height * scale;
  return { left: viewport.left + (viewport.width - width) / 2, top: viewport.top + (viewport.height - height) / 2, width, height };
}

export function printedPanelBounds(pack: PackBounds, panel: PackBounds, area: PackBounds) {
  const scale = Math.min(pack.width * area.width / panel.width, pack.height * area.height / panel.height);
  const width = panel.width * scale;
  const height = panel.height * scale;
  return { left: pack.left + pack.width * area.left, top: pack.top + pack.height * area.top, width, height, scale };
}

// Count rendered time, not elapsed wall time: backgrounding and slow frames cannot skip stages.
export function frameAdvance(previous: number | null, now: number, hidden: boolean) {
  return previous === null || hidden ? 0 : Math.max(0, Math.min(48, now - previous));
}
