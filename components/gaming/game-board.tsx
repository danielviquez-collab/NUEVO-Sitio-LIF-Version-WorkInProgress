'use client';
/* eslint-disable react/react-compiler, jsx-a11y/prefer-tag-over-role */
import { useEffect, useRef, type RefObject } from 'react';
import {
  applyInput,
  createGame,
  stepGame,
  type Direction,
  type GameState,
  type Input,
} from '@/lib/gaming/engine';
import { GAME_CONFIG as C } from '@/lib/gaming/config';
import { drawGame } from '@/lib/gaming/render';
import type { Session } from '@/lib/gaming/client';
import { MemoryBoard } from './memory-board';
import {
  SNAKE_IMPACT_MS,
  SNAKE_PORTRAIT_QUERY,
  snakeInputDirection,
} from '@/lib/gaming/snake-view';
export type Snapshot = { state: GameState; inputs: Input[] };
export type BoardControl = (
  direction?: Direction,
  slot?: number,
  action?: 'peek' | 'radar',
) => void;
export type BoardProps = {
  session: Session;
  images: Map<string, HTMLImageElement>;
  paused: boolean;
  snapshot: RefObject<Snapshot | null>;
  control: RefObject<BoardControl | null>;
  onUpdate: (state: GameState) => void;
  onEnd: () => void;
  onDirectionSound?: (sound: 'turn' | 'blocked') => void;
};
export function GameBoard(props: BoardProps) {
  return props.session.game === 'memory_lif' ? (
    <MemoryBoard {...props} />
  ) : (
    <SnakeBoard {...props} />
  );
}
function SnakeBoard({
  session,
  images,
  paused,
  snapshot,
  control,
  onUpdate,
  onEnd,
  onDirectionSound,
}: BoardProps) {
  const canvas = useRef<HTMLCanvasElement>(null),
    pauseRef = useRef(paused),
    callbacks = useRef({ onUpdate, onEnd, onDirectionSound });
  useEffect(() => {
    callbacks.current = { onUpdate, onEnd, onDirectionSound };
  }, [onUpdate, onEnd, onDirectionSound]);
  useEffect(() => {
    pauseRef.current = paused;
  }, [paused]);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const state = createGame(session.game, session.seed),
      inputs: Input[] = [];
    const orientation = matchMedia(SNAKE_PORTRAIT_QUERY),
      reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let portrait = orientation.matches;
    const resize = () => {
      portrait = orientation.matches;
      canvas.current!.width = portrait ? 600 : 900;
      canvas.current!.height = portrait ? 900 : 600;
    };
    resize();
    orientation.addEventListener('change', resize);
    snapshot.current = { state, inputs };
    control.current = (direction) => {
      if (pauseRef.current || state.ended || state.freezeMs) return;
      const logical = direction
        ? snakeInputDirection(direction, portrait)
        : undefined;
      const input: Input = {
        at: state.ms,
        ...(logical ? { direction: logical } : {}),
      };
      if (applyInput(state, input)) inputs.push(input);
      else if (
        logical ===
        { up: 'down', down: 'up', left: 'right', right: 'left' }[
          state.direction
        ]
      )
        callbacks.current.onDirectionSound?.('blocked');
    };
    const keys: Record<string, Direction> = {
      ArrowUp: 'up',
      w: 'up',
      W: 'up',
      ArrowDown: 'down',
      s: 'down',
      S: 'down',
      ArrowLeft: 'left',
      a: 'left',
      A: 'left',
      ArrowRight: 'right',
      d: 'right',
      D: 'right',
    };
    const keydown = (event: KeyboardEvent) => {
      const direction = keys[event.key];
      if (!direction) return;
      event.preventDefault();
      control.current?.(direction);
    };
    document.addEventListener('keydown', keydown);
    let frame = 0,
      last = performance.now(),
      accumulator = 0,
      lastUpdate = 0,
      lastPublishedEvent = 0,
      finished = false,
      endedAt: number | undefined;
    function render(now: number) {
      const dt = Math.min(100, now - last);
      last = now;
      if (!pauseRef.current && !finished) {
        accumulator += dt;
        while (accumulator >= C.STEP_MS && !state.ended) {
          const previousDirection = state.direction;
          stepGame(state);
          if (state.direction !== previousDirection)
            callbacks.current.onDirectionSound?.('turn');
          accumulator -= C.STEP_MS;
        }
      }
      if (state.ended) endedAt ??= now;
      const impact =
        endedAt === undefined
          ? 0
          : Math.min(1, (now - endedAt) / SNAKE_IMPACT_MS);
      drawGame(ctx!, state, images, now, pauseRef.current ? 0 : accumulator, {
        portrait,
        impact: reduced ? 0 : impact,
      });
      const latestEvent = state.events.at(-1)?.id ?? 0;
      if (now - lastUpdate > 80 || latestEvent !== lastPublishedEvent) {
        callbacks.current.onUpdate({ ...state });
        lastUpdate = now;
        lastPublishedEvent = latestEvent;
      }
      if (
        state.ended &&
        !finished &&
        (state.ended === 'time' || reduced || impact >= 1)
      ) {
        finished = true;
        callbacks.current.onUpdate({ ...state });
        callbacks.current.onEnd();
      }
      frame = requestAnimationFrame(render);
    }
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', keydown);
      orientation.removeEventListener('change', resize);
      control.current = null;
    };
  }, [session.id, session.game, session.seed, images, snapshot, control]);
  const touch = useRef<{ x: number; y: number } | null>(null);
  return (
    <canvas
      ref={canvas}
      width={900}
      height={600}
      className="lif-game-canvas"
      role="img"
      aria-label="Tablero Snake LIF. Mové el Snake con flechas, WASD o los controles."
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        touch.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerMove={(event) => {
        if (!touch.current) return;
        const dx = event.clientX - touch.current.x,
          dy = event.clientY - touch.current.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) > 18) {
          control.current?.(
            Math.abs(dx) > Math.abs(dy)
              ? dx > 0
                ? 'right'
                : 'left'
              : dy > 0
                ? 'down'
                : 'up',
          );
          touch.current = { x: event.clientX, y: event.clientY };
        }
      }}
      onPointerUp={() => {
        touch.current = null;
      }}
      onPointerCancel={() => {
        touch.current = null;
      }}
    />
  );
}
