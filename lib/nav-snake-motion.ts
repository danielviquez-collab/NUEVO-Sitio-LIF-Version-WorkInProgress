export const NAV_SNAKE = {
  initialSegments: 4,
  segmentsPerFood: 4,
  lapDuration: 9000,
  biteDuration: 400,
  consumeAt: 180,
  foodDisappearsAt: 260,
  rewardDuration: 750,
  holdDuration: 450,
  resetDuration: 650,
  segmentSpacing: 6.5,
  foodWidth: 26,
  bannerInset: 14,
  bonusSpeed: 1.5,
} as const;

export type SnakeMeal = {
  distance: number;
  startsAt: number;
  kind?: 'logo' | 'bonus';
};
export const clampSnake = (value: number) => Math.max(0, Math.min(1, value));

export function snakeTickDuration(delta: number, bonusActive: boolean) {
  return (
    Math.min(80, Math.max(0, delta)) * (bonusActive ? NAV_SNAKE.bonusSpeed : 1)
  );
}

export type SnakeTextLine = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type SnakeBonusSweep = {
  start: number;
  end: number;
  left: number;
  right: number;
  y: number;
  direction: 'right' | 'left';
  bonusDistance: number;
};

type SnakePoint = { x: number; y: number };

function snakeTitleRails(
  lines: SnakeTextLine[],
  viewportWidth: number,
  minimumTop = -Infinity,
  minimumEntryX?: number,
) {
  const padding = 32;
  const left = Math.max(
    10,
    Math.min(...lines.map((line) => line.left)) - padding,
  );
  const top = Math.max(lines[0].top - padding, minimumTop);
  const bottom = lines[lines.length - 1].bottom + 24;
  const rights = lines.map((line) =>
    Math.min(viewportWidth - 10, line.right + padding),
  );
  let width = Math.max(...rights) - left;
  const entryX =
    minimumEntryX === undefined
      ? left + 12
      : Math.max(left + 12, minimumEntryX, left + width * 0.5 - 26);
  // A compact headline still needs room to turn and bite the first logo.
  rights[0] = Math.max(
    rights[0],
    Math.min(viewportWidth - 10, entryX + NAV_SNAKE.foodWidth * 2 + 4),
  );
  width = Math.max(...rights) - left;
  const firstFoodDistance =
    minimumEntryX === undefined
      ? width * 0.5 - 12
      : Math.min(26, (rights[0] - 4 - entryX) / 2);
  const points = [
    { x: entryX, y: top + 4 },
    { x: rights[0] - 4, y: top + 4 },
  ];
  for (let index = 1; index < lines.length; index++) {
    const stepY =
      rights[index] >= rights[index - 1]
        ? lines[index].top - 20
        : lines[index - 1].bottom + 20;
    points.push(
      { x: rights[index - 1] - 4, y: stepY },
      { x: rights[index] - 4, y: stepY },
    );
  }
  points.push(
    { x: rights[rights.length - 1] - 4, y: bottom - 4 },
    { x: left + 4, y: bottom - 4 },
  );
  return { points, left, top, bottom, width, entryX, firstFoodDistance };
}

function snakePointPath(points: SnakePoint[]) {
  return (
    `M ${points[0].x} ${points[0].y}` +
    points
      .slice(1)
      .map((point, index) =>
        point.y === points[index].y ? ` H ${point.x}` : ` V ${point.y}`,
      )
      .join('')
  );
}

export function snakeDescentPaths(
  menu: { x: number; y: number; width: number; height: number },
  banner: { left: number; top: number; entryX?: number; surfaceTop?: number },
  rail: number,
  logo?: SnakeTextLine,
) {
  const { x, y, width, height } = menu;
  const { left, top } = banner;
  const menuExit = `M ${x + 12} ${y + 4} H ${x + width - 12} Q ${x + width - 4} ${y + 4} ${x + width - 4} ${y + 12} V ${y + height - 12} Q ${x + width - 4} ${y + height - 4} ${x + width - 12} ${y + height - 4} H ${x + 12}`;
  const menuBottom = y + height - 4;
  const entryY = top + 4;
  const clearance = Math.min(12, (entryY - menuBottom) / 3);
  // Keep vertical travel between horizontal turns, even in a short mobile corridor.
  const travelY = Math.max(
    menuBottom + clearance,
    (banner.surfaceTop ?? -Infinity) + NAV_SNAKE.bannerInset,
    Math.min(entryY - clearance, rail),
  );
  const points = [
    { x: x + 12, y: menuBottom },
    { x: x + 12, y: travelY },
  ];
  if (
    banner.entryX !== undefined &&
    (!logo || banner.entryX >= logo.right + 12)
  ) {
    points.push(
      { x: banner.entryX, y: travelY },
      { x: banner.entryX, y: entryY },
    );
    return {
      menuExit,
      bridge: snakePointPath(points).replace(/^M [^ ]+ [^ ]+/, ''),
      points,
    };
  }
  if (
    logo &&
    x + 12 > logo.right + 12 &&
    left + 4 < logo.right + 12 &&
    travelY < logo.bottom + 12
  ) {
    // Turn before the brand, cross below it, then enter the title facing right.
    points.push(
      { x: logo.right + 12, y: travelY },
      { x: logo.right + 12, y: logo.bottom + 12 },
      { x: left + 4, y: logo.bottom + 12 },
    );
  } else points.push({ x: left + 4, y: travelY });
  points.push({ x: left + 4, y: entryY }, { x: left + 12, y: entryY });
  const bridge = snakePointPath(points).replace(/^M [^ ]+ [^ ]+/, '');
  return { menuExit, bridge, points };
}

export function snakeBannerContour(
  lines: SnakeTextLine[],
  viewportWidth: number,
  minimumTop?: number,
  minimumEntryX?: number,
) {
  const { points, left, top, bottom, width, entryX, firstFoodDistance } =
    snakeTitleRails(lines, viewportWidth, minimumTop, minimumEntryX);
  points.push({ x: left + 4, y: top + 4 }, { x: entryX, y: top + 4 });
  return {
    path: snakePointPath(points),
    left,
    top,
    bottom,
    width,
    entryX,
    firstFoodDistance,
  };
}

// On compact screens, reserve the entire copy block instead of crossing its words.
export function snakeSafeBannerContour(
  blocks: SnakeTextLine[],
  viewportWidth: number,
  minimumTop: number,
  minimumEntryX?: number,
) {
  const bounds = {
    left: Math.min(...blocks.map((block) => block.left)),
    right: Math.max(...blocks.map((block) => block.right)),
    top: Math.min(...blocks.map((block) => block.top)),
    bottom: Math.max(...blocks.map((block) => block.bottom)),
  };
  return snakeBannerContour([bounds], viewportWidth, minimumTop, minimumEntryX);
}

export function snakeBannerBonusRoute(
  title: SnakeTextLine[],
  copy: SnakeTextLine[],
  viewportWidth: number,
  minimumTop?: number,
  minimumEntryX?: number,
) {
  const { points, left, top, bottom, width, entryX, firstFoodDistance } =
    snakeTitleRails(title, viewportWidth, minimumTop, minimumEntryX);
  let distance = points
    .slice(1)
    .reduce(
      (total, point, index) =>
        total +
        Math.abs(point.x - points[index].x) +
        Math.abs(point.y - points[index].y),
      0,
    );
  const titleEnd = distance;
  const add = (point: SnakePoint) => {
    const previous = points[points.length - 1];
    distance += Math.abs(point.x - previous.x) + Math.abs(point.y - previous.y);
    points.push(point);
  };
  const leftRail = left + 4;
  const rightRail = Math.min(
    viewportWidth - 10,
    Math.max(...copy.map((line) => line.right)) + 18,
  );
  const sweeps = copy.map((line, index): SnakeBonusSweep => {
    const direction = index % 2 ? 'left' : 'right';
    const y = (line.top + line.bottom) / 2;
    add({ x: direction === 'right' ? leftRail : rightRail, y });
    const start = distance;
    const bonusDistance =
      start +
      (direction === 'right'
        ? line.left - leftRail + 8
        : rightRail - line.right + 8);
    add({ x: direction === 'right' ? rightRail : leftRail, y });
    return {
      start,
      end: distance,
      left: leftRail,
      right: rightRail,
      y,
      direction,
      bonusDistance,
    };
  });
  const returnRail = Math.max(4, leftRail - 8);
  if (copy.length % 2)
    add({ x: rightRail, y: copy[copy.length - 1].bottom + 14 });
  add({ x: returnRail, y: points[points.length - 1].y });
  add({ x: returnRail, y: top + 4 });
  const restoreAt = distance;
  add({ x: entryX, y: top + 4 });
  return {
    path: snakePointPath(points),
    points,
    left,
    top,
    bottom,
    width,
    entryX,
    firstFoodDistance,
    titleEnd,
    sweeps,
    restoreAt,
  };
}

export function snakeTextProgress(
  distance: number,
  sweep: SnakeBonusSweep,
  word: { left: number; right: number },
) {
  if (distance < sweep.start) return 0;
  const traveled = Math.min(distance, sweep.end) - sweep.start;
  const consumed =
    sweep.direction === 'right'
      ? sweep.left + traveled + 9 - word.left
      : word.right - (sweep.right - traveled - 9);
  return clampSnake(consumed / Math.max(1, word.right - word.left));
}

export function snakeCopyFrame(
  distance: number,
  lap: number,
  loopLength: number,
  sweeps: SnakeBonusSweep[],
  restoreAt: number,
  segmentCount: number,
) {
  const traveled = lap * loopLength + distance;
  const copyLap = Math.floor((traveled - sweeps[0].start) / loopLength);
  const copyDistance = copyLap < 0 ? distance : traveled - copyLap * loopLength;
  const tailLength =
    11 + Math.max(0, segmentCount - 1) * NAV_SNAKE.segmentSpacing;
  const restoreDistance = Math.max(
    restoreAt,
    sweeps[sweeps.length - 1].end + tailLength + 16,
  );
  // The tail can still be eating the previous lap when the head reaches the title.
  return {
    lap: copyLap,
    distance: copyDistance,
    restoring: copyLap >= 0 && copyDistance >= restoreDistance,
  };
}

export function snakeMeals(distances: number[], speed: number) {
  return distances.map((distance, index) => ({
    distance,
    startsAt: (distance - 18) / speed + index * NAV_SNAKE.biteDuration,
  }));
}

export function snakeCycleDuration(
  length: number,
  speed: number,
  meals: SnakeMeal[],
  continuous = false,
) {
  return (
    length / speed +
    meals.length * NAV_SNAKE.biteDuration +
    (continuous ? 0 : NAV_SNAKE.holdDuration + NAV_SNAKE.resetDuration)
  );
}

export type SnakeRouteClock = {
  exit: number;
  entry: number;
  finish: number;
  loop: number;
};

export function snakeTravelTime(
  distance: number,
  speed: number,
  meals: SnakeMeal[],
) {
  return (
    distance / speed +
    meals.filter((meal) => meal.distance - 18 < distance).length *
      NAV_SNAKE.biteDuration
  );
}

export function snakeReflowTime(
  time: number,
  previous: SnakeRouteClock,
  next: SnakeRouteClock,
) {
  if (time >= previous.finish)
    return next.finish + ((time - previous.finish) / previous.loop) * next.loop;
  const before = [0, previous.exit, previous.entry, previous.finish];
  const after = [0, next.exit, next.entry, next.finish];
  const phase = before.findIndex(
    (boundary, index) => index > 0 && time < boundary,
  );
  if (phase < 1) return time;
  const progress =
    (time - before[phase - 1]) / (before[phase] - before[phase - 1]);
  return after[phase - 1] + progress * (after[phase] - after[phase - 1]);
}

export function snakeFrame(
  time: number,
  length: number,
  speed: number,
  meals: SnakeMeal[],
  continuous = false,
) {
  // One clock controls travel, the jaw, the swallowed logo and tail growth.
  const paused = meals.reduce(
    (total, meal) =>
      total +
      clampSnake((time - meal.startsAt) / NAV_SNAKE.biteDuration) *
        NAV_SNAKE.biteDuration,
    0,
  );
  const distance = Math.min(length, Math.max(0, (time - paused) * speed));
  const eaten = meals.filter(
    (meal) => time >= meal.startsAt + NAV_SNAKE.consumeAt,
  ).length;
  const fade = continuous
    ? 0
    : clampSnake(
        (time -
          (snakeCycleDuration(length, speed, meals) -
            NAV_SNAKE.resetDuration)) /
          NAV_SNAKE.resetDuration,
      );
  return { time, distance, eaten, fade };
}
