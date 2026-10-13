import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const showcase = read('../../components/gaming/ranking-showcase.tsx');

test('Initial ranking preserves the unified table instead of replacing legacy loading cards', () => {
  assert.doesNotMatch(showcase, /LeaderboardTable|variant="tiles"/);
  assert.match(
    showcase,
    /const rows = ranking\?\.top\.slice\(0, GAME_CONFIG\.LEADERBOARD_SIZE\) \?\? \[\]/,
  );
  assert.match(showcase, /<table aria-label="Ranking unificado/);
  assert.match(showcase, /<td colSpan=\{4\} className="game-ranking-status">/);
  assert.match(showcase, /<RankingPodiumPlayers\s+ranking=\{ranking\}/);
});

test('Loading and empty rankings use one explicit status without inventing winners', () => {
  assert.match(showcase, /aria-busy=\{ranking === null\}/);
  assert.match(showcase, /role="status"/);
  assert.equal((showcase.match(/Cargando ranking/g) ?? []).length, 1);
  assert.match(showcase, /Estrená el ranking/);
  assert.match(showcase, /rows\.length > 0 && overflow/);
});

test('Obsolete split tabs and tiled loading presentation are absent from active UI and styles', () => {
  for (const path of [
    '../../components/games.tsx',
    '../../components/gaming/leaderboard.tsx',
    '../../components/gaming/ranking-showcase.tsx',
    '../../app/gaming.css',
    '../../app/memory-game.css',
  ])
    assert.doesNotMatch(
      read(path),
      /game-ranking-tabs|game-leaderboard-tiles|rankingGame/,
    );
});

test('Client presentation starts with the request snapshot, never fabricated initial rows, and keeps the podium score reveal', () => {
  const games = read('../../components/games.tsx');
  assert.match(
    games,
    /typeof initialRanking === 'object' \? initialRanking : null/,
  );
  assert.doesNotMatch(
    games,
    /previewLeaderboard|localRankingDemo|demonstration/,
  );
  assert.doesNotMatch(
    games,
    /game-ranking-demo|Demostración|puntajes ficticios/,
  );
  assert.match(games, /Top \{GAME_CONFIG\.LEADERBOARD_SIZE\} LIF/);
  assert.doesNotMatch(games, /ranking !== null && !ranking\.total/);
  assert.match(showcase, /podiumScoreValue\(score, elapsed\)/);
  assert.match(
    read('../../components/gaming/ranking-content.ts'),
    /formatScore\(row\.score\)/,
  );
});

test('The page supplies a per-request snapshot rather than build-time references', () => {
  const page = read('../../app/juega/page.tsx');
  const games = read('../../components/games.tsx');
  assert.match(
    page,
    /rankingPreview=\{process\.env\.LIF_CLIENT_PREVIEW === 'true'\}/,
  );
  assert.match(page, /initialRanking=\{initialRanking\}/);
  assert.match(page, /requestPublicRanking/);
  assert.match(games, /<RankingList ranking=\{ranking\}/);
});

test('Landing and post-game request the same unified Top 20 rather than truncating at ten', () => {
  for (const path of [
    '../../components/games.tsx',
    '../../components/gaming/game-experience.tsx',
  ]) {
    const source = read(path);
    assert.doesNotMatch(source, /limit=10|Top 10/);
    assert.match(
      source,
      /leaderboard\?game=all&limit=\$\{(?:GAME_CONFIG|C)\.LEADERBOARD_SIZE\}/,
    );
  }
  assert.match(showcase, /veinte mejores puntajes/);
});

test('The podium precedes the Top 20 only in the stacked mobile layout', () => {
  const styles = postcss.parse(read('../../app/gaming.css'));
  const placement = [];
  styles.walkRules('.game-hub-ranking > .game-ranking-content', (rule) => {
    rule.walkDecls('order', (declaration) => {
      placement.push({
        order: declaration.value,
        media: rule.parent.type === 'atrule' && rule.parent.name === 'media'
          ? rule.parent.params
          : null,
      });
    });
  });
  assert.deepEqual(placement, [{ order: '-1', media: '(max-width: 700px)' }]);
});
