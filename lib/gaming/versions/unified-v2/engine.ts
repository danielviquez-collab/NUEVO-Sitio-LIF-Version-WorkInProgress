import {
  GAME_CONFIG as C,
  type GameId,
  type HistoricalGameId,
} from './config.ts';
import {
  createSessionPlan,
  random,
  memoryPairBag,
  type SessionPlan,
  type ScheduledEvent,
} from './session-random.ts';
import {
  createMemory,
  memoryInput,
  stepMemory,
  type MemoryState,
} from './memory-engine.ts';
import { replayGame as replayLegacy } from '../../legacy-engine.ts';
import { replayGame as replayMemoryV1 } from '../memory-v1/engine.ts';
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
  ended: 'wall' | 'self' | 'time' | 'points' | null;
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
const vectors: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const opposites: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};
const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
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
  const snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ];
  const s: GameState = {
    game,
    rng: seed,
    ms: 0,
    activeMs: 0,
    score: 0,
    nextId: 1,
    lane: 2,
    catcherX: 2,
    target: 0,
    items: [],
    snake,
    previousSnake: snake.map((c) => ({ ...c })),
    direction: 'right',
    queued: null,
    tickMs: 0,
    spawnAt: 0,
    newIndex: 0,
    newSeen: [],
    bonusCount: 0,
    doubleUntil: 0,
    magnetUntil: 0,
    shield: false,
    boostMs: 0,
    freezeMs: 0,
    spotlight: null,
    ended: null,
    events: [],
    plan: createSessionPlan(game, seed),
    scheduleIndex: 0,
    pendingSpawns: [],
    memory: null,
    normalBag: [],
    normalPrevious: -1,
    competitionProgress: 0,
    recoveryMs: 0,
    pendingSuper: false,
  };
  if (game === 'memory_lif') s.memory = createMemory(s);
  else {
    s.shield = true;
    replenishSnake(s, true);
    runSchedule(s);
  }
  return s;
}
function freeCell(s: GameState, kind: ItemKind): Cell | null {
  const free: Cell[] = [];
  const reachable = new Set<string>();
  const enqueued = new Set<string>();
  const queue: Cell[] = [s.snake[0]];
  // Reject enclosed cells, occupied cells and immediate collisions before spawning.
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const p = queue[cursor],
      key = `${p.x},${p.y}`;
    reachable.add(key);
    for (const vector of Object.values(vectors)) {
      const next = { x: p.x + vector.x, y: p.y + vector.y },
        nextKey = `${next.x},${next.y}`;
      if (
        next.x < 0 ||
        next.y < 0 ||
        next.x >= C.BOARD_COLS ||
        next.y >= C.BOARD_ROWS ||
        enqueued.has(nextKey) ||
        s.snake.slice(1).some((c) => same(c, next)) ||
        s.items.some((i) => i.kind === 'hazard' && same(i, next))
      )
        continue;
      enqueued.add(nextKey);
      queue.push(next);
    }
  }
  for (let y = 2; y < C.BOARD_ROWS - 2; y++)
    for (let x = 2; x < C.BOARD_COLS - 2; x++) {
      const p = { x, y },
        distance = Math.abs(s.snake[0].x - x) + Math.abs(s.snake[0].y - y);
      if (
        !reachable.has(`${x},${y}`) ||
        s.snake.some((c) => same(c, p)) ||
        s.items.some((i) => Math.abs(i.x - x) <= 1 && Math.abs(i.y - y) <= 1) ||
        distance < C.SNAKE_ITEM_MIN_DISTANCE ||
        (kind !== 'hazard' && distance > C.SNAKE_ITEM_MAX_DISTANCE)
      )
        continue;
      free.push(p);
    }
  return free.length ? free[Math.floor(random(s) * free.length)] : null;
}
function spawn(s: GameState, kind: ItemKind, flavor: number) {
  const cell = freeCell(s, kind);
  if (!cell) return false;
  s.items.push({
    ...cell,
    id: s.nextId++,
    kind,
    flavor,
    born: s.activeMs,
    ttl:
      kind === 'flavor' || kind === 'logo'
        ? C.GAME_DURATION_SECONDS * 1000
        : kind === 'hazard'
          ? 12000
          : C.FLEETING_ITEM_DURATION_SECONDS * 1000,
    lane: 0,
    speed: 0,
  });
  return true;
}
function runSchedule(s: GameState) {
  while (
    s.scheduleIndex < s.plan.events.length &&
    s.plan.events[s.scheduleIndex].at <= s.activeMs
  )
    s.pendingSpawns.push(s.plan.events[s.scheduleIndex++]);
  s.pendingSpawns = s.pendingSpawns.filter((event) => {
    if (event.kind === 'double') {
      s.doubleUntil = s.activeMs + C.MEMORY_X2_DURATION_SECONDS * 1000;
      emit(s, 'powerup');
      return false;
    }
    if (event.kind === 'shield') {
      s.shield = true;
      emit(s, 'powerup');
      return false;
    }
    return !spawn(s, event.kind as ItemKind, event.flavor);
  });
}
export function applyInput(s: GameState, input: Input): boolean {
  if (s.ended || s.freezeMs > 0 || s.recoveryMs > 0) return false;
  if (s.game === 'memory_lif') return memoryInput(s, input);
  if (
    input.direction &&
    input.direction !== opposites[s.direction] &&
    !s.queued
  ) {
    s.queued = input.direction;
    return true;
  }
  return false;
}
function collect(s: GameState, item: GameItem) {
  const multiplier = s.activeMs < s.doubleUntil || s.boostMs > 0 ? 2 : 1;
  if (item.kind === 'boost') {
    s.boostMs = C.BOOST_DURATION_SECONDS * 1000;
    emit(s, 'boost', 0, -1, item);
    return;
  }
  if (item.kind === 'hazard') {
    if (s.shield) {
      s.shield = false;
      emit(s, 'powerup', 0, -1, item);
      return;
    }
    s.snake = s.snake.slice(
      0,
      Math.max(
        C.SNAKE_STARTING_LENGTH,
        s.snake.length - C.COMPETITOR_SEGMENT_DAMAGE,
      ),
    );
    s.recoveryMs = C.COMPETITION_ERROR_RECOVERY_MS;
    emit(s, 'penalty', 0, -1, item);
    return;
  }
  if (
    item.kind === 'double' ||
    item.kind === 'magnet' ||
    item.kind === 'shield'
  ) {
    if (item.kind === 'double')
      s.doubleUntil = s.activeMs + C.POWERUP_DURATION_SECONDS * 1000;
    if (item.kind === 'magnet')
      s.magnetUntil = s.activeMs + C.MAGNET_DURATION_SECONDS * 1000;
    if (item.kind === 'shield') s.shield = true;
    emit(s, 'powerup', 0, -1, item);
    return;
  }
  if (item.kind === 'logo') {
    const value = C.LIF_LOGO_POINTS * multiplier;
    s.score += value;
    emit(s, 'logo', value, -1, item);
    advanceSnakeBonus(s, item);
    return;
  }
  const isNew = item.flavor < 3,
    value = (isNew ? C.NEW_FLAVOR_POINTS : C.NORMAL_FLAVOR_POINTS) * multiplier;
  s.score += value;
  emit(s, isNew ? 'new' : 'normal', value, item.flavor, item);
  if (isNew) {
    if (!s.newSeen.includes(item.flavor)) s.newSeen.push(item.flavor);
    s.spotlight = item.flavor;
    s.freezeMs = C.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1000;
  }
  s.snake.push({ ...s.snake[s.snake.length - 1] });
  advanceSnakeBonus(s, item);
}
function advanceSnakeBonus(s: GameState, item: Cell) {
  s.competitionProgress++;
  if (s.competitionProgress >= C.COMPETITION_SUPER_BONUS_ACTIONS) {
    s.pendingSuper = true;
    if (!s.freezeMs) startSnakeSuper(s, item);
  }
}
function startSnakeSuper(s: GameState, item: Cell = s.snake[0]) {
    s.pendingSuper = false;
    s.competitionProgress = 0;
    s.score += C.COMPETITION_SUPER_BONUS_POINTS;
    s.bonusCount++;
    s.snake = s.snake.slice(0, C.SNAKE_STARTING_LENGTH);
    s.freezeMs = C.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1000;
    s.spotlight = 'super';
    emit(s, 'super', C.COMPETITION_SUPER_BONUS_POINTS, -1, item);
}
function replenishSnake(s: GameState, initial = false) {
  if (s.items.some((item) => item.kind === 'flavor' || item.kind === 'logo')) return;
  if (!s.normalBag.length)
    s.normalBag = memoryPairBag(s, Math.min(2, Math.floor(s.activeMs / 60000)), initial, s.normalPrevious);
  const flavor = s.normalBag[0];
  if (spawn(s, flavor < 0 ? 'logo' : 'flavor', flavor))
    s.normalPrevious = s.normalBag.shift()!;
}
function recoverSnake(s: GameState) {
  if (s.shield) { s.shield = false; emit(s, 'powerup'); }
  else { s.recoveryMs = C.COMPETITION_ERROR_RECOVERY_MS; emit(s, 'penalty'); }
  s.snake = [{x:8,y:10},{x:7,y:10},{x:6,y:10}];
  s.previousSnake = s.snake.map(cell => ({...cell}));
  s.direction = 'right';
  s.queued = null;
  s.tickMs = 0;
  s.items = s.items.filter(item => {
    const nearby = s.snake.some(cell => Math.abs(cell.x-item.x) + Math.abs(cell.y-item.y) < 3);
    if (nearby && (item.kind === 'flavor' || item.kind === 'logo')) s.normalBag.unshift(item.flavor);
    return !nearby;
  });
}
export function stepGame(s: GameState) {
  if (s.ended) return;
  s.ms += C.STEP_MS;
  if (s.freezeMs > 0) {
    s.freezeMs = Math.max(0, s.freezeMs - C.STEP_MS);
    if (!s.freezeMs) s.spotlight = null;
    return;
  }
  if (s.game === 'snake' && s.pendingSuper) { startSnakeSuper(s); return; }
  const speed = s.boostMs > 0 ? C.BOOST_SPEED_MULTIPLIER : 1;
  s.activeMs = Math.min(
    C.GAME_DURATION_SECONDS * 1000,
    s.activeMs + C.STEP_MS * (s.boostMs > 0 ? C.BOOST_CLOCK_MULTIPLIER : 1),
  );
  s.boostMs = Math.max(0, s.boostMs - C.STEP_MS);
  if (s.activeMs >= C.GAME_DURATION_SECONDS * 1000) {
    s.ended = 'time';
    emit(s, 'complete');
    return;
  }
  if (s.game === 'memory_lif') {
    stepMemory(s);
    return;
  }
  if (s.recoveryMs > 0) {
    s.recoveryMs = Math.max(0, s.recoveryMs - C.STEP_MS);
    return;
  }
  s.items = s.items.filter((i) => s.activeMs - i.born < i.ttl);
  const interval =
    C.SNAKE_TICK_MS /
    (1 + Math.min(2, Math.floor(s.activeMs / 60000)) * 0.06) /
    speed;
  s.tickMs += C.STEP_MS;
  if (s.tickMs >= interval) {
    s.tickMs -= interval;
    if (s.queued) {
      s.direction = s.queued;
      s.queued = null;
    }
    const vector = vectors[s.direction],
      head = { x: s.snake[0].x + vector.x, y: s.snake[0].y + vector.y };
    const collision =
      head.x < 0 ||
      head.y < 0 ||
      head.x >= C.BOARD_COLS ||
      head.y >= C.BOARD_ROWS || s.snake.slice(0, -1).some((c) => same(c, head));
    if (collision) {
      recoverSnake(s);
      return;
    }
    s.previousSnake = s.snake.map((c) => ({ ...c }));
    s.snake = [head, ...s.snake.slice(0, -1)];
    const item = s.items.find((i) => same(i, head));
    if (item) {
      s.items = s.items.filter((i) => i.id !== item.id);
      collect(s, item);
    }
  }
  runSchedule(s);
  replenishSnake(s);
}
export function replayGame(
  game: HistoricalGameId,
  seed: number,
  inputs: Input[],
  untilMs: number,
  version: string = C.VERSION,
): GameState {
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
