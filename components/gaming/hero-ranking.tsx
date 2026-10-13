'use client';

import { useEffect, useState } from 'react';
import { ArrowDownRight, Trophy } from 'lucide-react';
import type { Leaderboard } from '@/lib/gaming/client';
import { GAME_NAMES } from '@/lib/gaming/config';
import { formatScore } from '@/lib/gaming/format-score';
import { useHeroMotion } from './hero-motion';

export function GameHeroRanking({
  ranking,
  error,
}: {
  ranking: Leaderboard | null;
  error: boolean;
}) {
  const { element, playing } = useHeroMotion();
  const [active, setActive] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const rows = ranking?.top.slice(0, 5) ?? [];
  useEffect(() => {
    if (!playing || engaged || rows.length < 2) return;
    const timer = window.setInterval(
      () => setActive((value) => (value + 1) % rows.length),
      3200,
    );
    return () => clearInterval(timer);
  }, [playing, engaged, rows.length]);
  return (
    <div
      ref={element}
      className="game-hero-ranking"
      data-playing={playing && !engaged}
      aria-labelledby="game-hero-ranking-title"
      aria-busy={!ranking && !error}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setEngaged(true);
      }}
      onPointerLeave={() => setEngaged(false)}
      onFocus={() => setEngaged(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setEngaged(false);
      }}
    >
      <div className="game-top-five-heading">
        <Trophy aria-hidden="true" />
        <h2 id="game-hero-ranking-title">
          TOP <span>5</span>
        </h2>
        <span className="game-top-five-label">
          RANKING
          <br />
          LIF
        </span>
      </div>
      {!ranking ? (
        <output className="game-top-five-status">
          <Trophy aria-hidden="true" />
          <p>
            {error
              ? 'Ranking no disponible por el momento.'
              : 'Cargando ranking…'}
          </p>
        </output>
      ) : (
        <ol className="game-top-five-list">
          {Array.from({ length: 5 }, (_, index) => {
            const row = rows[index];
            return (
              <li
                key={index}
                data-active={!!row && active % rows.length === index}
              >
                {row ? (
                  <a
                    href="#ranking"
                    onFocus={() => setActive(index)}
                    onPointerEnter={() => setActive(index)}
                  >
                    <span className="game-top-five-position">
                      {row.position}
                    </span>
                    <span className="game-top-five-player">
                      <strong>{row.nickname}</strong>
                      <small>{GAME_NAMES[row.game]}</small>
                    </span>
                    <span className="game-top-five-score">
                      <b>{formatScore(row.score)}</b>
                      <small>PTS</small>
                    </span>
                    <ArrowDownRight
                      className="game-top-five-row-arrow"
                      aria-hidden="true"
                    />
                  </a>
                ) : (
                  <div className="game-top-five-vacant">
                    <span className="game-top-five-position">{index + 1}</span>
                    <span>Puesto libre</span>
                    <span aria-hidden="true">-</span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <a className="game-top-five-link" href="#ranking">
        Ver ranking completo <ArrowDownRight aria-hidden="true" />
      </a>
    </div>
  );
}
