'use client';

import { TrendingUp, Zap } from 'lucide-react';
import { useHeroMotion } from './hero-motion';

export function GameHeroChallenge() {
  const { element, playing } = useHeroMotion();
  return (
    <div ref={element} className="game-hero-challenge" data-playing={playing}>
      <p className="game-challenge-line">
        <span
          className="game-challenge-icon challenge-reflex"
          aria-hidden="true"
        >
          <Zap />
        </span>
        <span>
          Poné tus <strong className="game-challenge-reflex">reflejos</strong> a
          prueba.
        </span>
      </p>
      <p className="game-challenge-line">
        <span
          className="game-challenge-icon challenge-record"
          aria-hidden="true"
        >
          <TrendingUp />
        </span>
        <span>
          Superá tu <strong className="game-challenge-record">récord</strong> y
          subí al <strong className="game-challenge-ranking">ranking</strong>.
        </span>
      </p>
    </div>
  );
}
