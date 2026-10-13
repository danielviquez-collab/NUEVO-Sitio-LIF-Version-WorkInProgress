export type ProtectedGamePhase = 'countdown' | 'playing' | 'paused' | 'game-over-transition' | 'restarting';
const sessions = new Map<string, ProtectedGamePhase>();
const listeners = new Set<(active: boolean) => void>();

export function isGameSessionActive() { return sessions.size > 0; }

export function setGameSessionPhase(id: string, phase: ProtectedGamePhase | null) {
  const before = isGameSessionActive();
  if (phase) sessions.set(id, phase);
  else sessions.delete(id);
  if (before !== isGameSessionActive()) listeners.forEach((listener) => listener(isGameSessionActive()));
}

export function subscribeGameSession(listener: (active: boolean) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
