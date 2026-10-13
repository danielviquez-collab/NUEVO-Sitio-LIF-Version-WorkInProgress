import {
  COMPETITOR_HAZARD_ASSETS,
  GAME_CONFIG as C,
  GAME_FLAVORS,
} from './config';
import type { Cell, GameItem, GameState } from './engine';
import { CURTAIN_TEXTURE_ASSET } from './curtain-motion';
import {
  snakeImpactOffset,
  snakeViewCell,
  snakeViewDirection,
} from './snake-view';
export const IMAGE_ASSETS = [
  ...GAME_FLAVORS.map((f) => f.image),
  '/brand/lif-official.svg',
  CURTAIN_TEXTURE_ASSET,
  ...COMPETITOR_HAZARD_ASSETS,
];
let imagePromise: Promise<Map<string, HTMLImageElement>> | null = null;
export function loadGameImages() {
  imagePromise ??= prepareImages().catch((error) => {
    imagePromise = null;
    throw error;
  });
  return imagePromise;
}
async function prepareImages() {
  const images = new Map<string, HTMLImageElement>();
  await Promise.all(
    IMAGE_ASSETS.map(
      (src) =>
        new Promise<void>((resolve, reject) => {
          const image = new Image();
          image.onload = () => {
            images.set(src, image);
            resolve();
          };
          image.onerror = () =>
            reject(
              new Error(
                'No se pudo cargar un empaque. Intentá preparar la partida de nuevo.',
              ),
            );
          image.src = src;
        }),
    ),
  );
  return images;
}
function image(
  ctx: CanvasRenderingContext2D,
  images: Map<string, HTMLImageElement>,
  src: string,
  x: number,
  y: number,
  w: number,
  h: number,
  rotation = 0,
) {
  const img = images.get(src);
  if (!img) return;
  const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.shadowColor = '#10381f44';
  ctx.shadowBlur = 7;
  ctx.shadowOffsetY = 5;
  ctx.drawImage(
    img,
    (-img.naturalWidth * scale) / 2,
    (-img.naturalHeight * scale) / 2,
    img.naturalWidth * scale,
    img.naturalHeight * scale,
  );
  ctx.restore();
}
export function drawSnake(
  ctx: CanvasRenderingContext2D,
  cells: Cell[],
  direction: string,
  cell: number,
  now: number,
  impact = 0,
) {
  if (!cells.length) return;
  const points = cells.map((c) => ({
    x: (c.x + 0.5) * cell,
    y: (c.y + 0.5) * cell,
  }));
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const p = points[i],
        next = points[i + 1];
      if (next)
        ctx.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2);
      else ctx.lineTo(p.x, p.y);
    }
  };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = '#10381f55';
  ctx.shadowBlur = cell * 0.23;
  ctx.shadowOffsetY = cell * 0.18;
  path();
  ctx.strokeStyle = '#004d2b';
  ctx.lineWidth = cell * 0.94;
  ctx.stroke();
  ctx.shadowColor = 'transparent';
  path();
  ctx.strokeStyle = '#00ad49';
  ctx.lineWidth = cell * 0.8;
  ctx.stroke();
  ctx.translate(0, -cell * 0.13);
  path();
  ctx.strokeStyle = '#b4ef6e';
  ctx.lineWidth = cell * 0.15;
  ctx.stroke();
  ctx.translate(0, cell * 0.13);
  const tail = points[points.length - 1];
  ctx.fillStyle = '#70cc48';
  ctx.beginPath();
  ctx.arc(tail.x, tail.y, cell * 0.34, 0, Math.PI * 2);
  ctx.fill();
  const head = points[0],
    angle =
      { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[
        direction
      ] ?? 0;
  ctx.translate(head.x, head.y);
  ctx.rotate(angle);
  const headFill = ctx.createRadialGradient(-3, -6, 1, 0, 0, cell * 0.6);
  headFill.addColorStop(0, '#a1db02');
  headFill.addColorStop(1, '#00943b');
  ctx.fillStyle = headFill;
  ctx.beginPath();
  ctx.ellipse(2, 0, cell * 0.55, cell * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();
  const eyeBounce = Math.sin(impact * Math.PI) * cell * 0.12;
  for (const y of [-0.28, 0.28]) {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(
      cell * 0.23 + eyeBounce,
      cell * y,
      cell * 0.23,
      cell * (Math.sin(now / 900) > 0.994 && !impact ? 0.06 : 0.23),
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = '#10381f';
    ctx.beginPath();
    ctx.arc(cell * 0.31 + eyeBounce, cell * y, cell * 0.095, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#10381f';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cell * 0.3, 0, cell * 0.16, -0.6, 0.6);
  ctx.stroke();
  ctx.restore();
}
function drawItem(
  ctx: CanvasRenderingContext2D,
  item: GameItem,
  images: Map<string, HTMLImageElement>,
  x: number,
  y: number,
  size: number,
  now: number,
) {
  if (item.kind === 'flavor') {
    if (item.flavor < 3) {
      ctx.fillStyle = '#fdd825';
      ctx.beginPath();
      ctx.ellipse(
        x,
        y + size * 0.49,
        size * 0.4,
        size * 0.07,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    image(
      ctx,
      images,
      GAME_FLAVORS[item.flavor].image,
      x,
      y,
      size * 0.8,
      size,
      Math.sin(now / 600 + item.id) * 0.09,
    );
  } else if (item.kind === 'hazard')
    image(
      ctx,
      images,
      COMPETITOR_HAZARD_ASSETS[item.flavor % 2],
      x,
      y,
      size * 0.7,
      size,
      0.05,
    );
  else if (item.kind === 'logo')
    image(
      ctx,
      images,
      '/brand/lif-official.svg',
      x,
      y,
      size,
      size * 0.6,
      Math.sin(now / 300) * 0.08,
    );
  else {
    ctx.save();
    ctx.fillStyle =
      item.kind === 'boost'
        ? '#ff4200'
        : item.kind === 'double'
          ? '#3304f7'
          : item.kind === 'magnet'
            ? '#fd6c02'
            : '#00943b';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.font = `700 ${size * 0.28}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      item.kind === 'boost'
        ? '»'
        : item.kind === 'double'
          ? '×2'
          : item.kind === 'magnet'
            ? 'M'
            : 'S',
      x,
      y,
    );
    ctx.restore();
  }
  if (C.SHOW_COLLISION_BOXES) {
    ctx.strokeStyle = 'red';
    ctx.strokeRect(x - size * 0.2, y - size * 0.2, size * 0.4, size * 0.4);
  }
}
export function drawGame(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  images: Map<string, HTMLImageElement>,
  now: number,
  fraction = 0,
  visual: { portrait?: boolean; impact?: number } = {},
) {
  const portrait = visual.portrait ?? false,
    impact = visual.impact ?? 0,
    cols = portrait ? C.BOARD_ROWS : C.BOARD_COLS,
    rows = portrait ? C.BOARD_COLS : C.BOARD_ROWS,
    width = ctx.canvas.width,
    height = ctx.canvas.height,
    cell = width / cols;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#cfe8a2ad' : '#dcf2b6ad';
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  ctx.save();
  ctx.globalAlpha = 0.16;
  image(
    ctx,
    images,
    '/brand/lif-official.svg',
    width / 2,
    height / 2,
    width * 0.5,
    height * 0.5,
  );
  ctx.restore();
  for (const i of s.items) {
    const position = snakeViewCell(i, portrait);
    drawItem(
      ctx,
      i,
      images,
      (position.x + 0.5) * cell,
      (position.y + 0.5) * cell,
      cell * 1.7,
      now,
    );
  }
  {
    const interval =
      C.SNAKE_TICK_MS /
      Math.pow(1 + C.SNAKE_SPEED_INCREASE_PER_SUPER_BONUS, s.bonusCount) /
      (s.boostMs > 0 ? C.BOOST_SPEED_MULTIPLIER : 1);
    const t =
      s.ended || s.freezeMs ? 1 : Math.min(1, (s.tickMs + fraction) / interval);
    const direction = snakeViewDirection(s.direction, portrait);
    const vectors = { right: [1, 0], down: [0, 1], left: [-1, 0], up: [0, -1] };
    const [dx, dy] = vectors[direction];
    const recoil = snakeImpactOffset(impact);
    const body = s.snake.map((p, i) => {
      const old =
        s.previousSnake[i] ?? s.previousSnake[s.previousSnake.length - 1] ?? p;
      const position = snakeViewCell(
        { x: old.x + (p.x - old.x) * t, y: old.y + (p.y - old.y) * t },
        portrait,
      );
      return { x: position.x + dx * recoil, y: position.y + dy * recoil };
    });
    drawSnake(ctx, body, direction, cell, now, impact);
  }
  for (const event of s.events.slice(-9)) {
    const age = s.activeMs - event.at;
    if (age < 0 || age > 1000 || !event.value) continue;
    const position = snakeViewCell(event, portrait);
    const x = (position.x + 0.5) * cell,
      y = (position.y + 0.5) * cell;
    ctx.save();
    ctx.globalAlpha = 1 - age / 1000;
    ctx.font = '900 25px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = event.value > 0 ? '#00943b' : '#d62e43';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    const text = `${event.value > 0 ? '+' : ''}${event.value}`;
    ctx.strokeText(text, x, y - 20 - age * 0.055);
    ctx.fillText(text, x, y - 20 - age * 0.055);
    ctx.restore();
  }
}
