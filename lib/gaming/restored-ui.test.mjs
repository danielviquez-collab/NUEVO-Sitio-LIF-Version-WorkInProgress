import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Memory UI uses the exact Racha de errores label with a bounded visible count and penalty feedback', () => {
  const board = read('../../components/gaming/memory-board.tsx');
  assert.match(board, /<span>Racha de errores<\/span>/);
  assert.match(board, /m\.errorStreak\}\s*\/\s*\{C\.MEMORY_MAX_ERROR_STREAK/);
  assert.match(board, /e\.type === 'mismatch' && e\.value < 0/);
  assert.match(board, /aria-live="polite"/);
});
test('Active instructions and defeat reasons no longer advertise recovery or zero mismatch penalties', () => {
  const experience = read('../../components/gaming/game-experience.tsx');
  assert.match(experience, /10 errores seguidos terminan la partida/);
  assert.match(experience, /Super Bonus · 15 segmentos/);
  assert.match(experience, /C\.SNAKE_SUPER_BONUS_LENGTH/);
  assert.match(experience, /hud\?\.snake\.length/);
  assert.match(experience, /reason === 'error_streak'/);
  assert.doesNotMatch(
    experience,
    /no perdés puntos|0 de penalización|Perdés tiempo, no puntos|6 sobres o logos|competitionProgress/,
  );
  assert.doesNotMatch(read('./render.ts'), /Seguís jugando|recoveryMs/);
});
test('Memory instructions, flavor spotlight and Super display use its own calibrated rewards', () => {
  const experience = read('../../components/gaming/game-experience.tsx');
  for (const key of [
    'MEMORY_MATCH_NORMAL_POINTS',
    'MEMORY_MATCH_NEW_FLAVOR_POINTS',
    'MEMORY_LOGO_MATCH_POINTS',
    'MEMORY_SUPER_BONUS_POINTS',
  ]) {
    assert.ok(experience.includes(`C.${key}`));
    assert.ok(
      read('../../components/games.tsx').includes(`GAME_CONFIG.${key}`),
    );
  }
  assert.match(
    experience,
    /\? C\.MEMORY_MATCH_NEW_FLAVOR_POINTS\s*: C\.NEW_FLAVOR_POINTS\) \*/,
  );
  assert.doesNotMatch(experience, /Super Bonus · 6 parejas <b>\+1\.000/);
});
test('Selector titles and descriptions are centered; error count has stable responsive dimensions', () => {
  const css = read('../../app/gaming.css');
  const title = css.match(/\.game-choice h3\s*\{([^}]+)\}/)?.[1];
  assert.match(title, /place-items:\s*center/);
  assert.match(title, /text-align:\s*center/);
  assert.match(title, /min-height:\s*48px/);
  const description = css.match(/\.game-choice p\s*\{([^}]+)\}/)?.[1];
  assert.match(description, /text-align:\s*center/);
  assert.match(
    read('../../app/memory-game.css'),
    /\.memory-error-streak\s*\{[\s\S]*?flex:\s*0 0 28px/,
  );
});
test('Snake retains its original green palette and a visible, responsive LIF watermark', () => {
  const render = read('./render.ts');
  const snake = render.slice(
    render.indexOf('export function drawSnake'),
    render.indexOf('function drawItem'),
  );
  for (const color of [
    '#004d2b',
    '#00ad49',
    '#b4ef6e',
    '#70cc48',
    '#a1db02',
    '#00943b',
  ])
    assert.ok(snake.includes(color));
  assert.doesNotMatch(snake, /#30208f|#6548ed|#a897ff|#9b84ff|#3a20cf/);
  assert.match(render, /globalAlpha = 0\.16/);
  assert.match(render, /width \* 0\.5,\s*height \* 0\.5/);
  assert.match(render, /#cfe8a2ad.*#dcf2b6ad/);
});
