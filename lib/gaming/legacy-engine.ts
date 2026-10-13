// Historical replay only. Never used by the public game selector.
import { LEGACY_CONFIG as C, type GameId } from './legacy-config.ts';
export type Direction = 'up' | 'right' | 'down' | 'left';
export type Input = { at: number; direction?: Direction; lane?: number };
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
    | 'complete';
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
function random(s: GameState) {
  s.rng = (s.rng + 0x6d2b79f5) | 0;
  let t = Math.imul(s.rng ^ (s.rng >>> 15), 1 | s.rng);
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
export function createGame(game: GameId, seed: number): GameState {
  const snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ];
  const state: GameState = {
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
  };
  if (game === 'snake') {
    spawn(state, 'flavor', 0);
    state.newIndex = 1;
    spawn(state, 'hazard', 0);
  }
  return state;
}
function emit(
  s: GameState,
  type: GameEvent['type'],
  value = 0,
  flavor = -1,
  p: Cell = { x: 0, y: 0 },
) {
  s.events.push({ id: s.nextId++, type, value, flavor, at: s.activeMs, ...p });
}
function freeCell(s: GameState): Cell | null {
  const free: Cell[] = [];
  for (let y = 2; y < C.BOARD_ROWS - 2; y++)
    for (let x = 2; x < C.BOARD_COLS - 2; x++) {
      const p = { x, y };
      if (
        !s.snake.some((c) => same(c, p)) &&
        !s.items.some(
          (i) => Math.abs(i.x - x) <= 1 && Math.abs(i.y - y) <= 1,
        ) &&
        Math.abs(s.snake[0].x - x) + Math.abs(s.snake[0].y - y) > 3
      )
        free.push(p);
    }
  return free.length ? free[Math.floor(random(s) * free.length)] : null;
}
function spawn(s: GameState, kind: ItemKind, flavor = -1, lane?: number) {
  const nextLane = lane ?? Math.floor(random(s) * 5);
  const cell = s.game === 'snake' ? freeCell(s) : { x: nextLane, y: -0.1 };
  if (!cell) return;
  const fleeting = kind !== 'flavor' && kind !== 'hazard';
  s.items.push({
    ...cell,
    id: s.nextId++,
    kind,
    flavor,
    born: s.activeMs,
    ttl: fleeting
      ? C.FLEETING_ITEM_DURATION_SECONDS * 1000
      : s.game === 'snake' && kind === 'hazard'
        ? 12000
        : 30000,
    lane: nextLane,
    speed:
      (0.21 + Math.floor(s.activeMs / 60000) * 0.05) * (0.9 + random(s) * 0.2),
  });
}
export function applyInput(s: GameState, input: Input) {
  if (s.ended || s.freezeMs) return;
  if (s.game === 'catch') {
    if (input.lane !== undefined)
      s.lane = Math.max(0, Math.min(4, Math.round(input.lane)));
    else if (input.direction === 'left') s.lane = Math.max(0, s.lane - 1);
    else if (input.direction === 'right') s.lane = Math.min(4, s.lane + 1);
  } else if (
    input.direction &&
    input.direction !== opposites[s.direction] &&
    !s.queued
  )
    s.queued = input.direction;
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
    s.score = Math.max(0, s.score - C.COMPETITOR_PENALTY_POINTS);
    s.snake = s.snake.slice(
      0,
      Math.max(
        C.SNAKE_STARTING_LENGTH,
        s.snake.length - C.COMPETITOR_SEGMENT_DAMAGE,
      ),
    );
    emit(s, 'penalty', -C.COMPETITOR_PENALTY_POINTS, -1, item);
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
    return;
  }
  if (s.game === 'catch' && item.flavor !== s.target) {
    s.score = Math.max(0, s.score - C.WRONG_FLAVOR_PENALTY_POINTS);
    emit(s, 'penalty', -C.WRONG_FLAVOR_PENALTY_POINTS, item.flavor, item);
    if (!s.score) {
      s.ended = 'points';
      emit(s, 'death');
    }
    return;
  }
  const isNew = item.flavor < 3;
  const value =
    (isNew ? C.NEW_FLAVOR_POINTS : C.NORMAL_FLAVOR_POINTS) * multiplier;
  s.score += value;
  emit(s, isNew ? 'new' : 'normal', value, item.flavor, item);
  if (isNew && !s.newSeen.includes(item.flavor)) {
    s.newSeen.push(item.flavor);
    s.spotlight = item.flavor;
    s.freezeMs = C.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1000;
  }
  if (s.game === 'snake') s.snake.push({ ...s.snake[s.snake.length - 1] });
  if (s.game === 'snake' && s.snake.length >= C.SNAKE_SUPER_BONUS_LENGTH) {
    s.score += C.SNAKE_SUPER_BONUS_POINTS;
    s.bonusCount++;
    s.snake = s.snake.slice(0, C.SNAKE_STARTING_LENGTH);
    s.freezeMs = C.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1000;
    s.spotlight = 'super';
    emit(s, 'super', C.SNAKE_SUPER_BONUS_POINTS, -1, item);
  }
}
export function stepGame(s: GameState) {
  if (s.ended) return;
  s.ms += C.STEP_MS;
  if (s.freezeMs > 0) {
    s.freezeMs = Math.max(0, s.freezeMs - C.STEP_MS);
    if (!s.freezeMs) s.spotlight = null;
    return;
  }
  const speed = s.boostMs > 0 ? C.BOOST_SPEED_MULTIPLIER : 1;
  const previousActiveMs = s.activeMs;
  s.activeMs += C.STEP_MS * (s.boostMs > 0 ? C.BOOST_CLOCK_MULTIPLIER : 1);
  s.boostMs = Math.max(0, s.boostMs - C.STEP_MS);
  if (s.activeMs >= C.GAME_DURATION_SECONDS * 1000) {
    s.activeMs = C.GAME_DURATION_SECONDS * 1000;
    s.ended = 'time';
    emit(s, 'complete');
    return;
  }
  s.items = s.items.filter((i) => s.activeMs - i.born < i.ttl);
  if (s.game === 'catch') {
    s.target = Math.floor(s.activeMs / (C.TARGET_FLAVOR_DURATION * 1000)) % 13;
    s.catcherX += Math.max(-0.14, Math.min(0.14, s.lane - s.catcherX));
    if (s.activeMs >= s.spawnAt) {
      const difficulty = Math.floor(s.activeMs / 60000);
      const roll = random(s);
      if (roll < 0.1) spawn(s, 'logo');
      else if (roll < 0.16) spawn(s, 'double');
      else if (roll < 0.21) spawn(s, 'magnet');
      else if (roll < 0.27) spawn(s, 'boost');
      else
        spawn(
          s,
          'flavor',
          random(s) < 0.6 ? s.target : Math.floor(random(s) * 13),
        );
      s.spawnAt = s.activeMs + [800, 660, 520][difficulty] / speed;
    }
    // Every target window starts with an attainable target, including all three campaign flavors.
    if (
      previousActiveMs === 0 ||
      Math.floor(previousActiveMs / (C.TARGET_FLAVOR_DURATION * 1000)) !==
        Math.floor(s.activeMs / (C.TARGET_FLAVOR_DURATION * 1000))
    )
      spawn(s, 'flavor', s.target, s.lane);
    for (const i of s.items) {
      i.y += (i.speed * C.STEP_MS * speed) / 1000;
      if (i.y >= 0.87) {
        const radius = s.activeMs < s.magnetUntil ? 0.85 : 0.48;
        if (Math.abs(i.lane - s.catcherX) <= radius) collect(s, i);
        s.items = s.items.filter((c) => c.id !== i.id);
        if (s.freezeMs || s.ended) break;
      }
    }
  } else {
    const interval =
      C.SNAKE_TICK_MS /
      Math.pow(1 + C.SNAKE_SPEED_INCREASE_PER_SUPER_BONUS, s.bonusCount) /
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
      if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= C.BOARD_COLS ||
        head.y >= C.BOARD_ROWS
      )
        s.ended = 'wall';
      else if (s.snake.slice(0, -1).some((c) => same(c, head)))
        s.ended = 'self';
      if (s.ended) {
        emit(s, 'death');
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
    if (!s.items.some((i) => i.kind === 'flavor')) {
      const flavor =
        s.newIndex < 3 ? s.newIndex++ : 3 + Math.floor(random(s) * 10);
      spawn(s, 'flavor', flavor);
    }
    // Scheduled campaign products stay available even if a previous item was not collected.
    if (s.activeMs >= 20000 && s.newIndex < 2) {
      spawn(s, 'flavor', 1);
      s.newIndex = 2;
    }
    if (s.activeMs >= 40000 && s.newIndex < 3) {
      spawn(s, 'flavor', 2);
      s.newIndex = 3;
    }
    if (s.activeMs >= s.spawnAt) {
      const kind: ItemKind = (
        ['logo', 'double', 'shield', 'hazard', 'boost'] as const
      )[Math.floor(random(s) * 5)];
      if (s.items.filter((i) => i.kind === kind).length < 2)
        spawn(s, kind, Math.floor(random(s) * 2));
      s.spawnAt = s.activeMs + 5500;
    }
  }
}
export function replayGame(
  game: GameId,
  seed: number,
  inputs: Input[],
  untilMs: number,
) {
  const state = createGame(game, seed);
  let index = 0;
  for (let t = 0; t < untilMs && !state.ended; t += C.STEP_MS) {
    while (index < inputs.length && inputs[index].at <= state.ms)
      applyInput(state, inputs[index++]);
    stepGame(state);
  }
  return state;
}
