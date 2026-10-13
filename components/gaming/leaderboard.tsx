import { Trophy } from 'lucide-react';
import type { Leaderboard } from '@/lib/gaming/client';
import { GAME_NAMES } from '@/lib/gaming/config';
import { formatScore } from '@/lib/gaming/format-score';
export function LeaderboardTable({ ranking }: { ranking: Leaderboard | null }) {
  return (
    <div className="game-leaderboard">
      <div className="game-leaderboard-head">
        <span>POSICIÓN</span>
        <span>NICKNAME</span>
        <span>JUEGO</span>
        <span>MEJOR PUNTAJE</span>
      </div>
      {!ranking ? (
        <p className="game-ranking-empty">Cargando ranking…</p>
      ) : !ranking.top.length ? (
        <div className="game-ranking-empty">
          <Trophy />
          <strong>Estrená el ranking.</strong>
          <span>Tu próximo récord puede abrir la lista.</span>
        </div>
      ) : (
        <ol>
          {ranking.top.map((row) => (
            <li
              key={row.position}
              className={row.position <= 3 ? `game-top-${row.position}` : ''}
            >
              <span>
                {row.position <= 3 ? <Trophy /> : null}#{row.position}
              </span>
              <strong>{row.nickname}</strong>
              <span className="ranking-game-name">{GAME_NAMES[row.game]}</span>
              <b>{formatScore(row.score)}</b>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
