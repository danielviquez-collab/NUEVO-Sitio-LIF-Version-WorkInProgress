import { GAME_CONFIG as C } from './config.ts';
import type { Cell, Direction } from './engine.ts';

export const SNAKE_PORTRAIT_QUERY =
  '(max-width: 700px) and (orientation: portrait)';
export const SNAKE_IMPACT_MS = 560;
const portraitDirections: Record<Direction, Direction> = {
  up: 'left',
  right: 'up',
  down: 'right',
  left: 'down',
};
const logicalDirections: Record<Direction, Direction> = {
  up: 'right',
  right: 'down',
  down: 'left',
  left: 'up',
};
export function snakeViewCell(cell: Cell, portrait: boolean): Cell {
  return portrait ? { x: cell.y, y: C.BOARD_COLS - 1 - cell.x } : cell;
}
export function snakeViewDirection(
  direction: Direction,
  portrait: boolean,
): Direction {
  return portrait ? portraitDirections[direction] : direction;
}
export function snakeInputDirection(
  direction: Direction,
  portrait: boolean,
): Direction {
  return portrait ? logicalDirections[direction] : direction;
}
export function snakeImpactOffset(progress: number) {
  if (progress <= 0 || progress >= 1) return 0;
  return Math.sin(progress * Math.PI * 2) * (1 - progress) * 0.65;
}
