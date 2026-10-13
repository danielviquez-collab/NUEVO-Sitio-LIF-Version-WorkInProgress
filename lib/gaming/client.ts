import type { GameId } from './config';
export type Bootstrap = {
  deviceId: string;
  attempts: Record<GameId, number>;
  participant: { nickname: string } | null;
  day: string;
  localTesting?: boolean;
};
export type Leaderboard = {
  top: { position: number; nickname: string; score: number; game: GameId }[];
  position: number | null;
  best: number;
  total: number;
  period: string;
};
export type Session = {
  id: string;
  game: GameId;
  seed: number;
  attempt: number;
  configVersion: string;
};
export type Result = {
  id: string;
  score: number;
  reason: string;
  best: number;
  newBest: boolean;
  position: number | null;
  attempts: Record<GameId, number>;
};
const messages: Record<string, string> = {
  NO_ATTEMPTS: 'Ya usaste tus tres intentos de hoy. Volvé mañana.',
  NICKNAME_TAKEN: 'Ese nickname ya está en uso. Probá con otro.',
  REGISTRATION_INVALID:
    'Revisá los campos y aceptá los términos para continuar.',
  REGISTRATION_LOCKED:
    'Esta partida ya está registrada. Sus datos no se pueden cambiar.',
  SCORE_INVALID: 'No pudimos validar esta partida.',
  TIME_INVALID: 'No pudimos validar el tiempo de la partida.',
  SESSION_INVALID: 'La sesión ya no está disponible.',
  SHEETS_UNAVAILABLE:
    'Estamos intentando reconectar para guardar la partida. No cerrés esta página.',
  STORAGE_UNAVAILABLE:
    'Estamos intentando reconectar para guardar la partida. No cerrés esta página.',
  STORAGE_MAINTENANCE:
    'Estamos actualizando el registro de partidas. Intentá de nuevo en unos minutos.',
  STORAGE_NOT_READY: 'La base de datos de juegos todavía no está lista.',
  LOCAL_DATABASE_CONFIG_REQUIRED:
    'Falta configurar la conexión local con Supabase.',
};
export class GameApiError extends Error {
  code: string;
  retryable: boolean;
  constructor(code: string, retryable: boolean, path = '') {
    const action = path.split('?')[0];
    const unavailable = [
      'SHEETS_UNAVAILABLE',
      'STORAGE_UNAVAILABLE',
      'SERVER_ERROR',
      'STATE_BUSY',
    ].includes(code);
    const contextual =
      unavailable && action === 'leaderboard'
        ? 'No pudimos actualizar el ranking. Intentá de nuevo.'
        : unavailable && action === 'bootstrap'
          ? 'No pudimos conectar el servicio de juegos. Intentá de nuevo.'
          : undefined;
    super(
      contextual ||
        messages[code] ||
        'No se pudo guardar la partida. Intentá de nuevo.',
    );
    this.code = code;
    this.retryable = retryable;
  }
}
export async function gamesApi<T>(
  path: string,
  body?: unknown,
  request: typeof fetch = fetch,
  wait: (ms: number) => Promise<void> = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<T> {
  // Retrying uses the same session/request IDs. Validation errors are never retried.
  const serialized = body === undefined ? undefined : JSON.stringify(body);
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await request(`/api/games/${path}`, {
        credentials: 'same-origin',
        signal: AbortSignal.timeout(10000),
        ...(body !== undefined
          ? {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: serialized,
            }
          : {}),
      });
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        throw new GameApiError('STORAGE_UNAVAILABLE', true, path);
      }
      if (!response.ok) {
        const error = (data as { error?: string }).error ?? '';
        throw new GameApiError(
          error,
          response.status >= 500 || response.status === 429,
          path,
        );
      }
      return data as T;
    } catch (error) {
      const failure =
        error instanceof GameApiError
          ? error
          : new GameApiError('STORAGE_UNAVAILABLE', true, path);
      if (
        !failure.retryable ||
        [
          'STORAGE_MAINTENANCE',
          'STORAGE_NOT_READY',
          'LOCAL_DATABASE_CONFIG_REQUIRED',
        ].includes(failure.code) ||
        attempt >= 2
      )
        throw failure;
      await wait(attempt === 0 ? 400 : 1200);
    }
  }
}
export async function bootstrapGames() {
  const data = await gamesApi<Bootstrap>('bootstrap');
  try {
    localStorage.setItem('lif.anonymousDeviceId', data.deviceId);
  } catch {
    /* Cookie remains authoritative. */
  }
  return data;
}
