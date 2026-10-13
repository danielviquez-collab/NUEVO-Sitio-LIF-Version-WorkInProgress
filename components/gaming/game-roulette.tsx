'use client';
/* eslint-disable next/no-img-element -- Local game assets retain their exact proportions. */
import { ChevronLeft, MapPin, RotateCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GAME_FLAVORS, GAME_NAMES, type GameId } from '@/lib/gaming/config';
import { type AudioPlayback, type GameAudio } from '@/lib/gaming/audio';
import {
  roulettePointerAngleAt,
  rouletteProgressAt,
} from '@/lib/gaming/roulette-motion';
import {
  chooseRandomGame,
  rouletteRotation,
  ROULETTE_RESULT_MS,
  ROULETTE_SPIN_MS,
} from '@/lib/gaming/random-selection';

function randomSample() {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000;
}

export function GameRoulette({
  attempts,
  audio,
  disabled,
  onSelect,
  onBack,
  onSpin,
}: {
  attempts: Record<GameId, number>;
  audio: GameAudio;
  disabled: boolean;
  onSelect: (game: GameId) => void;
  onBack: () => void;
  onSpin: () => void;
}) {
  const wheel = useRef<HTMLDivElement>(null);
  const pointer = useRef<SVGSVGElement>(null);
  const frame = useRef<number | null>(null);
  const playback = useRef<AudioPlayback | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const locked = useRef(false);
  const select = useRef(onSelect);
  const disabledRef = useRef(disabled);
  const [spinning, setSpinning] = useState(false);
  const [selected, setSelected] = useState<GameId | null>(null);
  const stopSpin = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    if (pointer.current)
      pointer.current.style.transform = 'translateX(-50%) rotate(0deg)';
    playback.current?.stop();
    playback.current = undefined;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => {
    select.current = onSelect;
    disabledRef.current = disabled;
    if (disabled) stopSpin();
  }, [onSelect, disabled, stopSpin]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopSpin();
    };
  }, [stopSpin]);
  const spin = () => {
    if (locked.current || disabled || !wheel.current) return;
    const game = chooseRandomGame(attempts, randomSample());
    if (!game) return;
    locked.current = true;
    setSpinning(true);
    onSpin();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const angle = rouletteRotation(game, randomSample());
    const sound = audio.startRoulette();
    playback.current = sound;
    const duration = sound?.durationMs ?? ROULETTE_SPIN_MS;
    const started = performance.now();
    const advance = (time: number) => {
      if (!mounted.current || disabledRef.current || !wheel.current) return;
      const elapsed = sound?.elapsedMs() ?? time - started;
      const progress = rouletteProgressAt(elapsed, duration);
      wheel.current.style.transform = `rotate(${angle * (reduced ? 1 : progress)}deg)`;
      if (pointer.current)
        pointer.current.style.transform = `translateX(-50%) rotate(${reduced ? 0 : roulettePointerAngleAt(elapsed, duration)}deg)`;
      if (elapsed >= duration) {
        frame.current = null;
        playback.current = undefined;
        setSpinning(false);
        setSelected(game);
        timer.current = setTimeout(() => {
          if (mounted.current && !disabledRef.current) select.current(game);
        }, ROULETTE_RESULT_MS);
      } else frame.current = requestAnimationFrame(advance);
    };
    frame.current = requestAnimationFrame(advance);
  };
  return (
    <section className="game-roulette" data-spinning={spinning}>
      <button
        className="game-back"
        type="button"
        onClick={() => {
          disabledRef.current = true;
          stopSpin();
          onBack();
        }}
      >
        <ChevronLeft />
        Elegir un juego
      </button>
      <div className="game-roulette-layout">
        <h3 data-step-focus tabIndex={-1}>
          Que decida la suerte.
        </h3>
        <div className="game-roulette-wheel">
          <MapPin
            ref={pointer}
            className="game-roulette-pointer"
            fill="currentColor"
            aria-hidden="true"
          />
          <div className="game-roulette-rotor" ref={wheel} aria-hidden="true">
            {(['memory_lif', 'snake', 'memory_lif', 'snake'] as const).map(
              (value, index) => (
                <div
                  className={`game-roulette-sector game-roulette-sector-${index}`}
                  key={index}
                >
                  <img
                    src={GAME_FLAVORS[value === 'memory_lif' ? 0 : 2].image}
                    alt=""
                  />
                  <strong>
                    {value === 'memory_lif' ? (
                      <>
                        Memoria
                        <br />
                        LIF
                      </>
                    ) : (
                      <>
                        Snake
                        <br />
                        LIF
                      </>
                    )}
                  </strong>
                </div>
              ),
            )}
          </div>
          <button
            type="button"
            className="game-roulette-spin"
            onClick={spin}
            disabled={disabled || spinning || selected !== null}
            aria-label="Girar ruleta y seleccionar un juego al azar"
          >
            <RotateCw aria-hidden="true" />
            GIRAR
          </button>
        </div>
        <div
          className="game-roulette-result"
          aria-live="polite"
          aria-atomic="true"
        >
          {selected ? (
            <strong>{GAME_NAMES[selected]}</strong>
          ) : spinning ? (
            <span>Eligiendo tu juego…</span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
