import {
  createElement as h,
  Fragment,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react';
import { Trophy } from 'lucide-react';
import type { Leaderboard } from '../../lib/gaming/client';
import { GAME_CONFIG, GAME_NAMES } from '../../lib/gaming/config.ts';
import { formatScore } from '../../lib/gaming/format-score.ts';

const ROW_LIME = [
  100, 78, 58, 54, 50, 46, 42, 38, 34, 30, 27, 24, 21, 18, 15, 12, 9, 6, 3, 0,
];
type Row = Leaderboard['top'][number];

export function RankingTableRows({ ranking }: { ranking: Leaderboard }) {
  const rows = ranking.top.slice(0, GAME_CONFIG.LEADERBOARD_SIZE);
  return h(
    Fragment,
    null,
    ...rows.map((row, index) =>
      h(
        'tr',
        {
          key: row.position,
          'data-position': row.position,
          'data-current': row.position === ranking.position,
          style: {
            '--ranking-row-lime': `${ROW_LIME[Math.round((index / Math.max(1, rows.length - 1)) * (ROW_LIME.length - 1))]}%`,
            '--ranking-row-font-size': `${index < 3 ? 18 - index * 2 : 12}px`,
          } as CSSProperties,
        },
        h('th', { scope: 'row' }, `#${row.position}`),
        h(
          'td',
          null,
          h('strong', null, row.nickname),
          row.position === ranking.position
            ? h('span', { className: 'game-ranking-you' }, '(tú)')
            : null,
        ),
        h('td', null, GAME_NAMES[row.game]),
        h('td', null, h('b', null, formatScore(row.score))),
      ),
    ),
  );
}

export function PodiumScoreFigure({
  score,
  value = 0,
  element,
}: {
  score: number;
  value?: number;
  element?: Ref<HTMLDivElement>;
}) {
  return h(
    'div',
    { ref: element, className: 'game-podium-score', 'data-score': score },
    h('small', null, 'SCORE'),
    h(
      'b',
      null,
      h(
        'span',
        { className: 'game-podium-score-figure', 'aria-hidden': true },
        formatScore(value),
      ),
      h('span', { className: 'sr-only' }, formatScore(score)),
    ),
  );
}

export function RankingPodiumPlayers({
  ranking,
  renderScore,
}: {
  ranking: Leaderboard;
  renderScore?: (row: Row) => ReactNode;
}) {
  return h(
    Fragment,
    null,
    ...ranking.top
      .slice(0, 3)
      .map((row) =>
        h(
          'li',
          { key: row.position, className: `game-podium-${row.position}` },
          h(
            'div',
            { className: 'game-podium-player' },
            h(
              'strong',
              { 'data-nickname': row.nickname },
              h('span', null, row.nickname),
            ),
            renderScore
              ? renderScore(row)
              : h(PodiumScoreFigure, { score: row.score }),
          ),
          h(
            'span',
            { className: 'game-podium-place' },
            h(Trophy, { 'aria-hidden': true }),
            h('b', null, `#${row.position}`),
          ),
        ),
      ),
  );
}
