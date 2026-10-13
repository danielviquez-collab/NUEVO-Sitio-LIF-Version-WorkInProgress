'use client';
/* eslint-disable next/no-img-element */
import { Fragment, type RefObject } from 'react';
import { Clock3, Gamepad2, Play } from 'lucide-react';
import { GAME_CONFIG, GAME_FLAVORS } from '@/lib/gaming/config';
import { HeroSnake } from './hero-snake';
import { useHeroMotion } from './hero-motion';
import { GameHeroChallenge } from './hero-challenge';

export type LegacyHero = 'rectangle' | 'round';
export type HeroActionProps = {
  ready: boolean;
  onPlay: () => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
};

export function GameHeroMeta() {
  return (
    <div className="game-legacy-meta">
      <span>
        <Clock3 aria-hidden="true" />3 MINUTOS
      </span>
      <span>
        <Gamepad2 aria-hidden="true" />2 JUEGOS
      </span>
    </div>
  );
}

export function LegacyGameHero({
  variant = 'rectangle',
  ready,
  onPlay,
  buttonRef,
}: HeroActionProps & {
  variant?: LegacyHero;
}) {
  const { element, playing } = useHeroMotion();
  return (
    <section
      className={`lif-games-hero game-legacy-hero legacy-${variant}`}
      aria-labelledby="lif-games-title"
    >
      <HeroSnake />
      <div className="game-legacy-heading">
        <h1 id="lif-games-title">
          <span className="game-title-line">Jugá</span>
          <span className="game-title-line">
            con <span className="game-title-brand">LIF.</span>
          </span>
        </h1>
        {variant === 'rectangle' ? (
          <p className="game-legacy-intro" data-snake-copy="true">
            {['Dos retos. Tres minutos.', 'Un puesto esperando tu nombre.'].map(
              (line) => (
                <span className="game-snake-text-line" key={line}>
                  {line.split(' ').map((word, index) => (
                    <Fragment key={`${word}-${index}`}>
                      {index > 0 && ' '}
                      <span className="game-snake-word" data-snake-word="true">
                        {word}
                      </span>
                    </Fragment>
                  ))}
                </span>
              ),
            )}
          </p>
        ) : (
          <GameHeroChallenge />
        )}
      </div>
      <div ref={element} className="game-legacy-action" data-playing={playing}>
        {variant === 'round' && (
          <div
            className="game-legacy-packs"
            aria-label="Los tres nuevos sabores de LIF"
          >
            {GAME_FLAVORS.filter((flavor) => flavor.isNew).map((flavor) => (
              <div className="game-legacy-pack" key={flavor.name}>
                <img
                  src={flavor.image}
                  alt={flavor.name}
                  width={992}
                  height={1113}
                  loading="eager"
                />
                <span className="game-legacy-sticker" aria-hidden="true">
                  NUEVO
                  <br />
                  SABOR
                </span>
              </div>
            ))}
          </div>
        )}
        <button
          ref={buttonRef}
          type="button"
          className="game-legacy-play"
          aria-label={GAME_CONFIG.PLAY_CTA}
          disabled={!ready}
          aria-busy={!ready}
          onClick={onPlay}
        >
          <Play aria-hidden="true" fill="currentColor" />
          <span>
            {variant === 'rectangle'
              ? Array.from(GAME_CONFIG.PLAY_CTA).map((letter, index) => (
                  <span
                    className="game-neon-letter"
                    key={index}
                    style={{ animationName: `game-neon-letter-${index}` }}
                  >
                    {letter}
                  </span>
                ))
              : GAME_CONFIG.PLAY_CTA}
          </span>
        </button>
        <GameHeroMeta />
      </div>
    </section>
  );
}
