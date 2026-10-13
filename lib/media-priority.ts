const overlays = new Set<symbol>();
const listeners = new Set<(active: boolean) => void>();

export function isMediaOverlayActive() { return overlays.size > 0; }

export function acquireMediaOverlay() {
  const key = Symbol('video-overlay');
  const wasActive = isMediaOverlayActive();
  overlays.add(key);
  if (!wasActive) listeners.forEach((listener) => listener(true));
  return () => {
    if (!overlays.delete(key) || isMediaOverlayActive()) return;
    listeners.forEach((listener) => listener(false));
  };
}

export function subscribeMediaOverlay(listener: (active: boolean) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
