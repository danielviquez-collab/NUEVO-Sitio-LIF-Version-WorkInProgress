import {
  applyInput,
  createGame,
  stepGame,
  type Direction,
  type GameState,
} from './engine.ts';
import { GAME_CONFIG as C } from './config.ts';
import { memoryPairValue } from './memory-engine.ts';

const vectors: [Direction, number, number][] = [
  ['up', 0, -1],
  ['right', 1, 0],
  ['down', 0, 1],
  ['left', -1, 0],
];
const reverse: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};
function route(s: GameState): Direction | null {
  const targets = s.items.filter(
    (item) => item.kind === 'flavor' || item.kind === 'logo',
  );
  const blocked = new Set([
    ...s.snake.slice(0, -1).map((c) => `${c.x},${c.y}`),
    ...s.items.filter((i) => i.kind === 'hazard').map((i) => `${i.x},${i.y}`),
  ]);
  const queue = [{ ...s.snake[0], first: null as Direction | null }],
    seen = new Set<string>();
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const cell = queue[cursor];
    if (targets.some((target) => cell.x === target.x && cell.y === target.y))
      return cell.first;
    for (const [direction, dx, dy] of vectors) {
      if (!cell.first && direction === reverse[s.direction]) continue;
      const x = cell.x + dx,
        y = cell.y + dy,
        key = `${x},${y}`;
      if (
        x < 0 ||
        y < 0 ||
        x >= C.BOARD_COLS ||
        y >= C.BOARD_ROWS ||
        seen.has(key) ||
        blocked.has(key)
      )
        continue;
      seen.add(key);
      queue.push({ x, y, first: cell.first ?? direction });
    }
  }
  // With no reachable reward, prefer the legal step with the most open space.
  let best: Direction | null = null,
    largest = -1;
  for (const [direction, dx, dy] of vectors) {
    if (direction === reverse[s.direction]) continue;
    const start = { x: s.snake[0].x + dx, y: s.snake[0].y + dy };
    const area = [start],
      visited = new Set<string>();
    for (let n = 0; n < area.length; n++) {
      const cell = area[n],
        key = `${cell.x},${cell.y}`;
      if (
        cell.x < 0 ||
        cell.y < 0 ||
        cell.x >= C.BOARD_COLS ||
        cell.y >= C.BOARD_ROWS ||
        blocked.has(key) ||
        visited.has(key)
      )
        continue;
      visited.add(key);
      for (const [, vx, vy] of vectors)
        area.push({ x: cell.x + vx, y: cell.y + vy });
    }
    if (visited.size > largest && visited.size > 0) {
      best = direction;
      largest = visited.size;
    }
  }
  return best;
}

// Informed agents see every card/item and react immediately. Snake seeks the
// nearest reward, collecting powers only on its path. These are not score caps
// or evidence of equivalent human memory, dexterity, or difficulty.
export function simulateCompetition(
  game: 'memory_lif' | 'snake',
  seed: number,
) {
  const s = createGame(game, seed);
  let objectives = 0,
    previousCell = '';
  while (!s.ended) {
    if (game === 'memory_lif') {
      const m = s.memory!;
      objectives = m.matches;
      if (!s.freezeMs && m.cycle === 'idle' && !m.selected.length) {
        let best: number[] = [];
        let value = -1;
        for (let a = 0; a < 16; a++)
          for (let b = a + 1; b < 16; b++)
            if (
              m.cards[a].phase === 'idle' &&
              m.cards[b].phase === 'idle' &&
              m.cards[a].flavor === m.cards[b].flavor
            ) {
              const f = m.cards[a].flavor,
                v = memoryPairValue([f]);
              if (v > value) {
                value = v;
                best = [a, b];
              }
            }
        for (const slot of best) applyInput(s, { at: s.ms, slot });
      }
    } else {
      const cell = `${s.snake[0].x},${s.snake[0].y}`;
      if (!s.freezeMs && !s.recoveryMs && !s.queued && cell !== previousCell) {
        previousCell = cell;
        const direction = route(s);
        if (direction) applyInput(s, { at: s.ms, direction });
      }
    }
    stepGame(s);
  }
  if (game === 'snake')
    objectives = s.events.filter((event) =>
      ['normal', 'new', 'logo'].includes(event.type),
    ).length;
  return {
    score: s.score,
    objectives,
    activeMs: s.activeMs,
    elapsedMs: s.ms,
    seed,
    newSeen: s.newSeen,
    reason: s.ended,
  };
}
