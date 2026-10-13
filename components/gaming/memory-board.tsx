'use client';
// Official packs are preloaded at their shared URLs; the canvas and DOM use the same assets.
/* eslint-disable react/react-compiler, next/no-img-element, jsx-a11y/prefer-tag-over-role */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { GAME_CONFIG as C, GAME_FLAVORS } from '@/lib/gaming/config';
import {
  applyInput,
  createGame,
  stepGame,
  type GameState,
  type Input,
} from '@/lib/gaming/engine';
import type { BoardProps } from './game-board';

export function MemoryBoard({
  session,
  paused,
  snapshot,
  control,
  onUpdate,
  onEnd,
}: BoardProps) {
  const [view, setView] = useState<GameState>(() =>
    createGame('memory_lif', session.seed),
  );
  const pausedRef = useRef(paused),
    callbacks = useRef({ onUpdate, onEnd });
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    callbacks.current = { onUpdate, onEnd };
  }, [onUpdate, onEnd]);
  useEffect(() => {
    const state = createGame('memory_lif', session.seed),
      inputs: Input[] = [];
    snapshot.current = { state, inputs };
    let signature = '',
      frame = 0,
      last = performance.now(),
      accumulator = 0,
      lastUpdate = 0,
      finished = false;
    const publish = () => {
      const m = state.memory!;
      setView({
        ...state,
        memory: {
          ...m,
          selected: [...m.selected],
          cards: m.cards.map((c) => ({ ...c })),
        },
      });
      callbacks.current.onUpdate({ ...state, memory: { ...m } });
    };
    control.current = (_direction, slot, action) => {
      if (pausedRef.current) return;
      const input: Input = {
        at: state.ms,
        ...(slot !== undefined ? { slot } : {}),
        ...(action ? { action } : {}),
      };
      if (applyInput(state, input)) {
        inputs.push(input);
        publish();
      }
    };
    function render(now: number) {
      const delta = Math.min(100, now - last);
      last = now;
      if (!pausedRef.current && !finished) {
        accumulator += delta;
        while (accumulator >= C.STEP_MS && !state.ended) {
          stepGame(state);
          accumulator -= C.STEP_MS;
        }
      }
      const m = state.memory!;
      const next =
        m.cards.map((c) => `${c.id}:${c.phase}`).join('|') +
        `:${m.cycle}:${m.peekUntil > state.activeMs}:${m.radarUntil > state.activeMs}:${state.spotlight}:${state.ended}:${m.noticeUntil > state.activeMs}`;
      if (signature !== next) {
        signature = next;
        publish();
        lastUpdate = now;
      } else if (now - lastUpdate > 80) {
        callbacks.current.onUpdate({ ...state, memory: { ...m } });
        lastUpdate = now;
      }
      if (state.ended && !finished) {
        finished = true;
        publish();
        callbacks.current.onEnd();
      }
      if (!finished) frame = requestAnimationFrame(render);
    }
    publish();
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      control.current = null;
    };
  }, [session.id, session.seed, snapshot, control]);
  const m = view.memory!,
    peek = m.peekUntil > view.activeMs;
  return (
    <div
      className="memory-surface"
      data-cycle={m.cycle}
      data-spotlight={view.spotlight !== null ? 'true' : undefined}
    >
      <output
        className="memory-error-streak"
        data-warning={m.errorStreak >= 7 ? 'true' : undefined}
        aria-live="polite"
      >
        <span>Racha de errores</span>
        <strong>
          {m.errorStreak}/{C.MEMORY_MAX_ERROR_STREAK}
        </strong>
      </output>
      <div className="memory-notice" aria-live="polite">
        {m.noticeUntil > view.activeMs
          ? m.notice
          : peek
            ? 'VISTA LIF'
            : '\u00a0'}
      </div>
      <div
        className="memory-grid"
        role="group"
        aria-label="Memoria LIF: dieciséis cartas"
      >
        {m.cards.map((card, slot) => {
          const front =
            peek ||
            [
              'flipping',
              'revealed',
              'matched',
              'mismatch',
              'exiting',
              'preview',
            ].includes(card.phase);
          const disabled =
            paused ||
            !!view.ended ||
            view.freezeMs > 0 ||
            m.cycle !== 'idle' ||
            peek ||
            card.phase !== 'idle';
          const label = front
            ? card.flavor === -1
              ? 'Logo LIF'
              : GAME_FLAVORS[card.flavor].name
            : `Carta ${slot + 1}, boca abajo`;
          return (
            <button
              key={slot}
              type="button"
              className="memory-card"
              style={{ '--card-index': slot } as CSSProperties}
              data-phase={card.phase}
              data-front={front ? 'true' : undefined}
              data-radar={
                m.radarUntil > view.activeMs && m.radarSlots.includes(slot)
                  ? 'true'
                  : undefined
              }
              aria-label={label}
              aria-pressed={front}
              disabled={disabled}
              onClick={() => control.current?.(undefined, slot)}
            >
              <span className="memory-card-body" key={card.id}>
                <span className="memory-face memory-back">
                  <span className="memory-back-frame" />
                  <img src="/brand/lif-official.svg" alt="" draggable={false} />
                </span>
                <span className="memory-face memory-front">
                  <img
                    src={
                      card.flavor < 0
                        ? '/brand/lif-official.svg'
                        : GAME_FLAVORS[card.flavor].image
                    }
                    alt=""
                    draggable={false}
                  />
                </span>
              </span>
              {card.phase === 'matched' && (
                <span className="memory-sparkles" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="memory-float-layer" aria-hidden="true">
        {view.events
          .filter(
            (e) =>
              (['normal', 'new', 'logo', 'super'].includes(e.type) ||
                (e.type === 'mismatch' && e.value < 0)) &&
              view.activeMs - e.at < 850,
          )
          .slice(-2)
          .map((e) => (
            <span key={e.id} data-penalty={e.value < 0 ? 'true' : undefined}>
              {e.value > 0 ? '+' : ''}
              {e.value.toLocaleString('es-CR')}
            </span>
          ))}
      </div>
    </div>
  );
}
