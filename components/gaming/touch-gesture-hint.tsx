'use client';
/* eslint-disable jsx-a11y/prefer-tag-over-role */

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Hand } from 'lucide-react';
import type { GameId } from '@/lib/gaming/config';

export function TouchGestureHint({ game }: { game: GameId }) {
  return (
    <div className={`game-touch-hint game-touch-hint-${game}`} role="img"
      aria-label="Deslizá el dedo hacia arriba, abajo, izquierda o derecha">
      <div className="game-touch-gesture" aria-hidden="true">
        <ArrowLeft className="gesture-left" />
        <ArrowRight className="gesture-right" />
        {game === 'snake' && <><ArrowUp className="gesture-up" /><ArrowDown className="gesture-down" /></>}
        <Hand className="gesture-hand" fill="currentColor" />
      </div>
    </div>
  );
}
