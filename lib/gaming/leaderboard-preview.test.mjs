import test from 'node:test';
import assert from 'node:assert/strict';
import { previewLeaderboard } from './leaderboard-preview.ts';
import { nicknameValidationMessage } from './nickname.ts';

test('Per-game historical design previews keep ten valid players', () => {
  for (const game of ['memory_lif', 'snake']) {
    const preview = previewLeaderboard(null, game);
    assert.equal(preview.top.length, 10);
    assert.ok(
      preview.top.every(
        (row) => row.game === game && !nicknameValidationMessage(row.nickname),
      ),
    );
    assert.equal(new Set(preview.top.map((row) => row.nickname)).size, 10);
    assert.equal(preview.position, null);
  }
});
test('Ten qualifying real players displace all examples in their game', () => {
  const ranking = {
    top: Array.from({ length: 10 }, (_, i) => ({
      position: i + 1,
      nickname: `Real${i}`,
      score: 10000 - i * 100,
      game: 'snake',
    })),
    position: null,
    best: 0,
    total: 10,
    period: 'campaign',
  };
  assert.deepEqual(previewLeaderboard(ranking, 'snake').top, ranking.top);
  assert.equal(previewLeaderboard(null).top.length, 20);
});
test('One actual participant replaces one reference even with a lower score and duplicate name', () => {
  const ranking = {
    top: [{ position: 1, nickname: 'jess 🏆', score: 100, game: 'memory_lif' }],
    position: 1,
    best: 100,
    total: 1,
    period: 'campaign',
  };
  const displayed = previewLeaderboard(ranking);
  assert.equal(displayed.top.length, 20);
  assert.equal(
    displayed.top.filter((row) => row.nickname.toLowerCase() === 'jess 🏆')
      .length,
    1,
  );
  assert.equal(displayed.top.at(-1).nickname, 'jess 🏆');
  assert.equal(displayed.position, 20);
  assert.equal(displayed.best, 100);
  assert.equal(ranking.top.length, 1);
});

test('References are displaced one by one; actual rankings take over at twenty participants', () => {
  const references = new Set(
    previewLeaderboard(null).top.map((row) => row.nickname),
  );
  for (const n of [0, 1, 2, 3, 10, 19, 20, 25]) {
    const ranking = {
      top: Array.from({ length: Math.min(20, n) }, (_, i) => ({
        nickname: `Actual${i}`,
        game: i % 2 ? 'snake' : 'memory_lif',
        score: 100 - i,
        position: i + 1,
      })),
      position: n ? 1 : null,
      best: n ? 100 : 0,
      total: n,
      period: 'campaign',
    };
    const original = structuredClone(ranking);
    const displayed = previewLeaderboard(ranking);
    assert.equal(displayed.top.length, 20);
    assert.equal(
      displayed.top.filter((row) => references.has(row.nickname)).length,
      Math.max(0, 20 - n),
    );
    assert.equal(
      displayed.top.filter((row) => row.nickname.startsWith('Actual')).length,
      Math.min(20, n),
    );
    assert.equal(displayed.position, n ? (n >= 20 ? 1 : 21 - n) : null);
    assert.ok(
      displayed.top.every(
        (row, i) =>
          row.position === i + 1 &&
          (!i || displayed.top[i - 1].score >= row.score),
      ),
    );
    assert.deepEqual(ranking, original);
  }
});

test('Equal scores favor actual participants and the display is idempotent', () => {
  const ranking = {
    top: [{ nickname: 'Cliente', game: 'snake', score: 3900, position: 1 }],
    position: 1,
    best: 3900,
    total: 1,
    period: 'campaign',
  };
  const displayed = previewLeaderboard(ranking);
  assert.equal(displayed.top[0].nickname, 'Cliente');
  assert.equal(displayed.position, 1);
  assert.deepEqual(previewLeaderboard(displayed), displayed);
});
test('Historical records are not rewritten or relabeled by preview helpers', () => {
  const ranking = {
    top: [{ position: 1, nickname: 'Historical', score: 9000, game: 'catch' }],
    position: null,
    best: 0,
    total: 1,
    period: 'campaign',
  };
  const before = structuredClone(ranking);
  assert.deepEqual(previewLeaderboard(ranking), before);
  assert.deepEqual(ranking, before);
});
test('Unified client presentation has both games, twenty rows and no current user', () => {
  const ranking = previewLeaderboard(null, 'all');
  assert.deepEqual(
    new Set(ranking.top.map((row) => row.game)),
    new Set(['memory_lif', 'snake']),
  );
  assert.equal(ranking.top.length, 20);
  assert.equal(ranking.position, null);
  assert.equal(new Set(ranking.top.map((row) => row.nickname)).size, 20);
  assert.deepEqual(
    ranking.top.map((row) => row.position),
    Array.from({ length: 20 }, (_, i) => i + 1),
  );
});
