import {
  GAME_CONFIG as C,
  type GameId,
  type HistoricalGameId,
} from './config.ts';
import {
  createSessionPlan,
  type SessionPlan,
  type ScheduledEvent,
} from './session-random.ts';
import {
  createMemory,
  memoryInput,
  stepMemory,
  type MemoryState,
} from './memory-engine.ts';
import {
  createGame as createLegacy,
  applyInput as inputLegacy,
  stepGame as stepLegacy,
  replayGame as replayLegacy,
  type GameState as LegacyState,
} from '../../legacy-engine.ts';
import { replayGame as replayMemoryV1 } from '../memory-v1/engine.ts';
import { replayGame as replayUnifiedV2 } from '../unified-v2/engine.ts';
import { replayGame as replayRestoredV3 } from '../restored-v3/engine.ts';

export type Direction = 'up' | 'right' | 'down' | 'left';
export type Input = {
  at: number;
  direction?: Direction;
  lane?: number;
  slot?: number;
  action?: 'peek' | 'radar';
};
export type Cell = { x: number; y: number };
export type ItemKind =
  | 'flavor'
  | 'logo'
  | 'double'
  | 'magnet'
  | 'shield'
  | 'boost'
  | 'hazard';
export type GameItem = Cell & {
  id: number;
  kind: ItemKind;
  flavor: number;
  born: number;
  ttl: number;
  lane: number;
  speed: number;
};
export type GameEvent = {
  id: number;
  type:
    | 'normal'
    | 'new'
    | 'logo'
    | 'penalty'
    | 'powerup'
    | 'boost'
    | 'super'
    | 'death'
    | 'complete'
    | 'flip'
    | 'mismatch'
    | 'shuffle'
    | 'peek'
    | 'radar';
  value: number;
  flavor: number;
  at: number;
  x: number;
  y: number;
};
export type GameState = {
  game: GameId;
  rng: number;
  ms: number;
  activeMs: number;
  score: number;
  nextId: number;
  lane: number;
  catcherX: number;
  target: number;
  items: GameItem[];
  snake: Cell[];
  previousSnake: Cell[];
  direction: Direction;
  queued: Direction | null;
  tickMs: number;
  spawnAt: number;
  newIndex: number;
  newSeen: number[];
  bonusCount: number;
  doubleUntil: number;
  magnetUntil: number;
  shield: boolean;
  boostMs: number;
  freezeMs: number;
  spotlight: number | 'super' | null;
  ended: 'wall' | 'self' | 'time' | 'points' | 'error_streak' | null;
  events: GameEvent[];
  plan: SessionPlan;
  scheduleIndex: number;
  pendingSpawns: ScheduledEvent[];
  memory: MemoryState | null;
  normalBag: number[];
  normalPrevious: number;
  competitionProgress: number;
  recoveryMs: number;
  pendingSuper: boolean;
};

export function emit(
  s: GameState,
  type: GameEvent['type'],
  value = 0,
  flavor = -1,
  p: Cell = { x: 0, y: 0 },
) {
  s.events.push({ id: s.nextId++, type, value, flavor, at: s.activeMs, ...p });
  if (s.events.length > 128) s.events.splice(0, s.events.length - 128);
}

export function createGame(game: GameId, seed: number): GameState {
  // Original Snake behavior, including its RNG, spawns, powers and turbo clock.
  const legacy = createLegacy(game === 'snake' ? 'snake' : 'catch', seed);
  const state = {
    ...legacy,
    game,
    plan: { game, events: [], shuffles: [] },
    scheduleIndex: 0,
    pendingSpawns: [],
    memory: null,
    normalBag: [],
    normalPrevious: -1,
    competitionProgress: 0,
    recoveryMs: 0,
    pendingSuper: false,
  } as GameState;
  if (game === 'memory_lif') {
    state.plan = createSessionPlan(game, seed);
    state.memory = createMemory(state);
  }
  return state;
}

export function applyInput(s: GameState, input: Input): boolean {
  if (s.ended || s.freezeMs > 0) return false;
  if (s.game === 'memory_lif') return memoryInput(s, input);
  const queued = s.queued;
  inputLegacy(s as unknown as LegacyState, input);
  return s.queued !== queued;
}

export function stepGame(s: GameState) {
  if (s.ended) return;
  if (s.game === 'snake') {
    stepLegacy(s as unknown as LegacyState);
    return;
  }
  s.ms += C.STEP_MS;
  if (s.freezeMs > 0) {
    s.freezeMs = Math.max(0, s.freezeMs - C.STEP_MS);
    if (!s.freezeMs) s.spotlight = null;
    return;
  }
  s.activeMs = Math.min(C.GAME_DURATION_SECONDS * 1000, s.activeMs + C.STEP_MS);
  if (s.activeMs >= C.GAME_DURATION_SECONDS * 1000) {
    s.ended = 'time';
    emit(s, 'complete');
    return;
  }
  stepMemory(s);
}

export function replayGame(
  game: HistoricalGameId,
  seed: number,
  inputs: Input[],
  untilMs: number,
  version: string = C.VERSION,
): GameState {
  if (version === 'lif-games-20261007-restored-v3' && game !== 'catch')
    return replayRestoredV3(
      game,
      seed,
      inputs,
      untilMs,
    ) as unknown as GameState;
  if (version === 'lif-games-20261007-unified-v2' && game !== 'catch')
    return replayUnifiedV2(game, seed, inputs, untilMs) as unknown as GameState;
  if (version === 'lif-games-20261007-memory-v1' && game !== 'catch')
    return replayMemoryV1(game, seed, inputs, untilMs) as unknown as GameState;
  if (game === 'catch' || version === 'lif-games-20261002-v2')
    return replayLegacy(
      game === 'catch' ? 'catch' : 'snake',
      seed,
      inputs,
      untilMs,
    ) as unknown as GameState;
  const state = createGame(game, seed);
  let index = 0;
  for (let t = 0; t < untilMs && !state.ended; t += C.STEP_MS) {
    while (index < inputs.length && inputs[index].at <= state.ms)
      applyInput(state, inputs[index++]);
    stepGame(state);
  }
  return state;
}
