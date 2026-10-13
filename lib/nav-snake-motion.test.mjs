import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NAV_SNAKE as C,
  snakeMeals,
  snakeFrame,
  snakeCycleDuration,
  snakeBannerContour,
  snakeSafeBannerContour,
  snakeBannerBonusRoute,
  snakeTextProgress,
  snakeCopyFrame,
  snakeTickDuration,
  snakeDescentPaths,
  snakeTravelTime,
  snakeReflowTime,
} from './nav-snake-motion.ts';

const COPY_SWEEPS = [
  {
    start: 430,
    end: 840,
    left: 36,
    right: 446,
    y: 320,
    direction: 'right',
    bonusDistance: 460,
  },
  {
    start: 900,
    end: 1310,
    left: 36,
    right: 446,
    y: 350,
    direction: 'left',
    bonusDistance: 930,
  },
];

test('Compact banner route encloses both heading and copy without crossing either', () => {
  for (const width of [360, 390, 768, 1024]) {
    const blocks = [
      { left: 56, right: Math.min(width - 32, 340), top: 150, bottom: 270 },
      { left: 56, right: Math.min(width - 32, 355), top: 310, bottom: 370 },
    ];
    const route = snakeSafeBannerContour(blocks, width, 118, 150);
    assert.ok(route.top + 4 < blocks[0].top - 8);
    assert.ok(route.bottom - 4 > blocks[1].bottom + 8);
    assert.ok(route.left + 4 < blocks[0].left - 8);
    assert.equal((route.path.match(/ V /g) ?? []).length, 2);
    assert.ok(!/[QLCA]/.test(route.path));
  }
});

test('Text bonus sweeps every wrapped copy row on portrait, landscape, tablet and desktop', () => {
  for (const width of [
    320, 360, 390, 430, 640, 844, 768, 1024, 1100, 1101, 1440, 1920,
  ]) {
    for (const rowCount of [2, 3, 4]) {
      const title = [
        { left: 56, right: Math.min(width - 32, 400), top: 150, bottom: 270 },
      ];
      const copy = Array.from({ length: rowCount }, (_, index) => ({
        left: 56,
        right: Math.min(width - 32, 350 - index * 20),
        top: 310 + index * 28,
        bottom: 338 + index * 28,
      }));
      const route = snakeBannerBonusRoute(title, copy, width, 118, 150);
      assert.equal(route.sweeps.length, rowCount);
      assert.deepEqual(route.points.at(-1), route.points[0]);
      assert.ok(
        route.points.every((point) => point.x >= 4 && point.x <= width - 10),
      );
      route.sweeps.forEach((sweep, index) => {
        assert.equal(sweep.y, (copy[index].top + copy[index].bottom) / 2);
        assert.equal(sweep.direction, index % 2 ? 'left' : 'right');
        assert.ok(
          sweep.bonusDistance > sweep.start && sweep.bonusDistance < sweep.end,
        );
        assert.equal(snakeTextProgress(sweep.start - 1, sweep, copy[index]), 0);
        const halfway = (sweep.start + sweep.end) / 2;
        assert.ok(snakeTextProgress(halfway, sweep, copy[index]) > 0);
        assert.ok(snakeTextProgress(halfway, sweep, copy[index]) < 1);
        assert.equal(snakeTextProgress(sweep.end, sweep, copy[index]), 1);
      });
      for (let index = 1; index < route.points.length; index++) {
        const before = route.points[index - 1],
          after = route.points[index];
        assert.ok(before.x === after.x || before.y === after.y);
      }
      assert.ok(route.restoreAt > route.sweeps.at(-1).end);
    }
  }
});

test('Copy stays eaten until the entire tail clears it, not just the head', () => {
  const tail = 11 + 51 * C.segmentSpacing;
  const clearAt = COPY_SWEEPS.at(-1).end + tail + 16;
  for (let distance = 1450; distance < 1500; distance += 5) {
    assert.equal(
      snakeCopyFrame(distance, 0, 1500, COPY_SWEEPS, 1450, 52).restoring,
      false,
    );
  }
  assert.equal(
    snakeCopyFrame(clearAt - 1500 - 1, 1, 1500, COPY_SWEEPS, 1450, 52)
      .restoring,
    false,
  );
  assert.equal(
    snakeCopyFrame(clearAt - 1500, 1, 1500, COPY_SWEEPS, 1450, 52).restoring,
    true,
  );
});

test('Crossing a lap boundary does not reveal text still covered by the tail', () => {
  for (let lap = 1; lap <= 4; lap++) {
    const phase = snakeCopyFrame(0, lap, 1500, COPY_SWEEPS, 1450, 52);
    assert.equal(phase.lap, lap - 1);
    assert.equal(phase.distance, 1500);
    assert.equal(phase.restoring, false);
    COPY_SWEEPS.forEach((sweep) => {
      assert.equal(
        snakeTextProgress(phase.distance, sweep, { left: 64, right: 420 }),
        1,
      );
    });
    const nextBite = snakeCopyFrame(431, lap, 1500, COPY_SWEEPS, 1450, 52);
    assert.equal(nextBite.lap, lap);
    assert.equal(nextBite.distance, 431);
    assert.equal(nextBite.restoring, false);
  }
});

test('Copy restoration also waits for the original return-to-title point', () => {
  assert.equal(
    snakeCopyFrame(1399, 0, 1500, COPY_SWEEPS, 1400, 4).restoring,
    false,
  );
  assert.equal(
    snakeCopyFrame(1400, 0, 1500, COPY_SWEEPS, 1400, 4).restoring,
    true,
  );
  assert.equal(snakeCopyFrame(0, 0, 1500, COPY_SWEEPS, 1400, 4).lap, -1);
});

test('Descent exits the menu bottom directly, without completing an upward return or a U-turn', () => {
  const { menuExit, bridge } = snakeDescentPaths(
    { x: 550, y: 24, width: 160, height: 62 },
    { left: 16, top: 220 },
    126,
  );
  assert.ok(menuExit.endsWith('H 562'));
  assert.equal((menuExit.match(/ V /g) ?? []).length, 1);
  assert.equal(bridge, ' V 126 H 20 V 224 H 28');
  assert.ok(!/[QLCA]/.test(bridge));
});

test('Portrait, landscape, tablet and desktop entry uses straight cardinal travel, never a U-turn', () => {
  for (const [width, menuBottom, headingTop, headingLeft] of [
    [320, 58, 98, 42],
    [390, 66, 114, 70],
    [844, 58, 105, 32],
    [768, 74, 128, 32],
    [1024, 86, 165, 32],
    [1280, 82, 244, 32],
    [1920, 82, 244, 288],
  ]) {
    for (const rail of [menuBottom - 12, menuBottom + 28, headingTop + 20]) {
      const { points, bridge } = snakeDescentPaths(
        { x: width - 100, y: menuBottom - 58, width: 70, height: 62 },
        { left: headingLeft, top: headingTop - 24 },
        rail,
      );
      assert.ok(!/[QLCA]/.test(bridge));
      const vectors = points.slice(1).map((point, i) => ({
        x: point.x - points[i].x,
        y: point.y - points[i].y,
      }));
      for (const vector of vectors) {
        assert.ok(vector.x === 0 || vector.y === 0);
        assert.ok(vector.y >= 0, `No upward entry at width ${width}`);
      }
      const moving = vectors.filter((vector) => vector.x || vector.y);
      for (let i = 1; i < moving.length; i++) {
        assert.ok(
          moving[i].x * moving[i - 1].x + moving[i].y * moving[i - 1].y >= 0,
          `No reversal at width ${width}`,
        );
      }
    }
  }
});

test('Banner follows the two title lines with an outward step, not a single rectangle', () => {
  const outline = snakeBannerContour(
    [
      { left: 40, top: 140, right: 280, bottom: 230 },
      { left: 40, top: 230, right: 410, bottom: 320 },
    ],
    1000,
  );
  assert.equal(outline.left, 10);
  assert.equal(outline.top, 108);
  assert.equal(outline.bottom, 344);
  assert.match(outline.path, /H 308 V 210 H 438/);
});
test('Descent turns before the brand and crosses below it with cardinal travel', () => {
  const logo = { left: 28, right: 190, top: 14, bottom: 124 };
  const contour = snakeBannerContour(
    [
      { left: 32, right: 274, top: 153, bottom: 243 },
      { left: 32, right: 388, top: 243, bottom: 333 },
    ],
    1280,
    logo.bottom + 16,
  );
  const { points } = snakeDescentPaths(
    { x: 578, y: 24, width: 160, height: 62 },
    contour,
    100,
    logo,
  );
  assert.equal(points[2].x, logo.right + 12);
  assert.equal(points[3].y, logo.bottom + 12);
  const vectors = points.slice(1).map((p, i) => ({
    x: p.x - points[i].x,
    y: p.y - points[i].y,
  }));
  for (const [i, v] of vectors.entries()) {
    assert.ok(v.x === 0 || v.y === 0);
    assert.ok(v.y >= 0);
    if (i) assert.ok(v.x * vectors[i - 1].x + v.y * vectors[i - 1].y >= 0);
    const a = points[i],
      b = points[i + 1];
    assert.ok(
      Math.max(a.x, b.x) <= logo.left - 10 ||
        Math.min(a.x, b.x) >= logo.right + 10 ||
        Math.max(a.y, b.y) <= logo.top - 10 ||
        Math.min(a.y, b.y) >= logo.bottom + 10,
    );
  }
});
test('Banner contour keeps its rails inside narrow mobile viewports', () => {
  const outline = snakeBannerContour(
    [
      { left: 20, top: 140, right: 240, bottom: 200 },
      { left: 20, top: 200, right: 310, bottom: 260 },
    ],
    320,
  );
  assert.equal(outline.left, 10);
  assert.match(outline.path, /H 306/);
});
test('Direct banner entry descends at the first food lane and continues forward without a left-edge detour', () => {
  const logo = { left: 28, right: 190, top: 14, bottom: 124 };
  const route = snakeBannerBonusRoute(
    [
      { left: 32, right: 274, top: 153, bottom: 243 },
      { left: 32, right: 388, top: 243, bottom: 333 },
    ],
    [
      { left: 32, right: 228, top: 370, bottom: 398 },
      { left: 32, right: 328, top: 398, bottom: 426 },
    ],
    1280,
    logo.bottom + 16,
    logo.right + 12,
  );
  const { points, bridge } = snakeDescentPaths(
    { x: 578, y: 24, width: 160, height: 62 },
    route,
    100,
    logo,
  );
  assert.equal(route.entryX, 202);
  assert.equal(route.firstFoodDistance, 26);
  assert.equal(points.at(-1).x, route.points[0].x);
  assert.equal(points.at(-1).y, route.points[0].y);
  assert.ok(!bridge.includes(`H ${route.left + 4}`));
  assert.ok(route.points[1].x > route.points[0].x);
  assert.deepEqual(route.points.at(-1), route.points[0]);
  for (let i = 1; i < points.length; i++) {
    assert.ok(points[i].x >= logo.right + 12);
    assert.ok(points[i].y >= points[i - 1].y);
  }
});

test('Menu, descent and banner use the same pixel speed, not the same lap duration', () => {
  const speed = 400 / C.lapDuration;
  for (const length of [400, 1000, 2000]) {
    assert.equal(snakeFrame(1000, length, speed, []).distance, speed * 1000);
  }
  assert.equal(
    snakeCycleDuration(2000, speed, []) - snakeCycleDuration(400, speed, []),
    1600 / speed,
  );
});

test('Entry horizontal lane leaves the complete head and body inside the yellow surface', () => {
  const bannerTop = 110;
  const { points } = snakeDescentPaths(
    { x: 578, y: 24, width: 160, height: 62 },
    { left: 32, top: 136, entryX: 202, surfaceTop: bannerTop },
    112,
    { left: 28, right: 190, top: 14, bottom: 124 },
  );
  assert.equal(points[1].y, bannerTop + C.bannerInset);
  assert.equal(points[2].y, points[1].y);
  assert.ok(points[1].y - 11 > bannerTop);
  const vectors = points.slice(1).map((point, index) => ({
    x: point.x - points[index].x,
    y: point.y - points[index].y,
  }));
  for (const [index, vector] of vectors.entries()) {
    assert.ok(vector.x === 0 || vector.y === 0);
    assert.ok(vector.y >= 0);
    if (index) {
      const previous = vectors[index - 1];
      assert.ok(vector.x * previous.x + vector.y * previous.y >= 0);
    }
  }
});

test('Orientation changes preserve menu, travel and banner stages in both directions', () => {
  const mobile = { exit: 2000, entry: 10000, finish: 30000, loop: 18000 };
  const desktop = { exit: 8000, entry: 28000, finish: 62000, loop: 28000 };
  for (const [previous, next] of [
    [mobile, desktop],
    [desktop, mobile],
  ]) {
    const before = [0, previous.exit, previous.entry, previous.finish];
    const after = [0, next.exit, next.entry, next.finish];
    for (let phase = 1; phase < before.length; phase++) {
      for (const progress of [0, 0.1, 0.5, 0.99]) {
        const time =
          before[phase - 1] + progress * (before[phase] - before[phase - 1]);
        const reflowed = snakeReflowTime(time, previous, next);
        assert.ok(reflowed >= after[phase - 1] && reflowed < after[phase]);
        assert.ok(
          Math.abs(snakeReflowTime(reflowed, next, previous) - time) < 1e-7,
        );
      }
    }
  }
});

test('Banner loops do not restart on orientation change, and unchanged geometry preserves the clock', () => {
  const previous = { exit: 2000, entry: 10000, finish: 30000, loop: 18000 };
  const next = { exit: 8000, entry: 28000, finish: 62000, loop: 28000 };
  for (const cycles of [0, 0.25, 1.5, 8.75]) {
    const time = previous.finish + cycles * previous.loop;
    assert.equal(
      snakeReflowTime(time, previous, next),
      next.finish + cycles * next.loop,
    );
    assert.equal(snakeReflowTime(time, previous, previous), time);
  }
});

test('Resize phase boundaries include only meals reached before that point', () => {
  const meals = snakeMeals([100, 300, 800], 0.05);
  assert.equal(snakeTravelTime(82, 0.05, meals), 1640);
  assert.equal(snakeTravelTime(150, 0.05, meals), 3400);
  assert.equal(snakeTravelTime(400, 0.05, meals), 8800);
});
test('Travel pauses during the original 400ms bite; consumption and four-segment growth share the clock', () => {
  const speed = 0.05,
    meals = snakeMeals([100, 300], speed);
  const begin = meals[0].startsAt;
  assert.equal(snakeFrame(begin, 600, speed, meals).distance, 82);
  assert.equal(snakeFrame(begin + 180, 600, speed, meals).distance, 82);
  assert.equal(
    snakeFrame(begin + C.biteDuration, 600, speed, meals).distance,
    82,
  );
  assert.equal(snakeFrame(begin + 179, 600, speed, meals).eaten, 0);
  assert.equal(snakeFrame(begin + 180, 600, speed, meals).eaten, 1);
  assert.equal(C.initialSegments + C.segmentsPerFood, 8);
  assert.equal(meals[1].startsAt, (300 - 18) / speed + C.biteDuration);
});
test('No fade or reset at the menu-to-banner handoff; only the completed lap resets', () => {
  const speed = 0.05,
    meals = snakeMeals([100, 350, 800, 1300], speed);
  const travelLength = 1600;
  const crossing = snakeFrame(14000, travelLength, speed, meals);
  assert.ok(crossing.distance > 400 && crossing.distance < 800);
  assert.equal(crossing.eaten, 2);
  assert.equal(crossing.fade, 0);
  const duration = snakeCycleDuration(travelLength, speed, meals);
  assert.equal(
    snakeFrame(duration - C.resetDuration, travelLength, speed, meals).fade,
    0,
  );
  assert.equal(snakeFrame(duration, travelLength, speed, meals).fade, 1);
});
test('Continuous banner laps keep moving and never fade at the closed-path handoff', () => {
  const speed = 0.05;
  const meals = snakeMeals([100, 350, 800], speed);
  const duration = snakeCycleDuration(1000, speed, meals, true);
  assert.equal(duration, 1000 / speed + meals.length * C.biteDuration);
  assert.equal(
    snakeCycleDuration(1000, speed, meals) - duration,
    C.holdDuration + C.resetDuration,
  );
  for (const time of [0, 100, duration - 500, duration - 1, duration]) {
    assert.equal(snakeFrame(time, 1000, speed, meals, true).fade, 0);
  }
  assert.ok(
    Math.abs(
      snakeFrame(duration - 1, 1000, speed, meals, true).distance -
        (1000 - speed),
    ) < 1e-7,
  );
});

const title = [
  { left: 40, top: 140, right: 280, bottom: 230 },
  { left: 40, top: 230, right: 410, bottom: 320 },
];
const copy = [
  { left: 40, top: 358, right: 270, bottom: 386 },
  { left: 40, top: 386, right: 345, bottom: 414 },
];

test('Compact desktop headline keeps the full head away from text on every contour leg', () => {
  const lines = [
    { left: 64, top: 162, right: 205, bottom: 215 },
    { left: 64, top: 215, right: 272, bottom: 268 },
  ];
  const route = snakeBannerBonusRoute(
    lines,
    [{ left: 64, top: 308, right: 344, bottom: 333 }],
    1280,
    136,
    202,
  );
  const clearance = 18;
  for (const [index, point] of route.points.slice(1).entries()) {
    const previous = route.points[index];
    for (const line of lines) {
      assert.ok(
        Math.max(previous.x, point.x) <= line.left - clearance ||
          Math.min(previous.x, point.x) >= line.right + clearance ||
          Math.max(previous.y, point.y) <= line.top - clearance ||
          Math.min(previous.y, point.y) >= line.bottom + clearance,
        `Title clearance on leg ${index}`,
      );
    }
  }
  assert.equal(route.firstFoodDistance, C.foodWidth);
  assert.deepEqual(route.points.at(-1), route.points[0]);
});

test('Bonus route continues left below the title, then down and right through the first sentence', () => {
  const route = snakeBannerBonusRoute(title, copy, 1000);
  assert.match(route.path, /V 340 H 14 V 372 H 363 V 400 H 14/);
  assert.equal(route.sweeps[0].direction, 'right');
  assert.equal(route.sweeps[1].direction, 'left');
  assert.ok(route.titleEnd < route.sweeps[0].start);
  assert.ok(route.sweeps[0].end < route.sweeps[1].start);
});

test('Bonus route returns to the top before restoring the text, without reversing on a turn', () => {
  for (const rows of [
    copy.slice(0, 1),
    copy,
    [...copy, { left: 40, top: 414, right: 240, bottom: 442 }],
  ]) {
    const route = snakeBannerBonusRoute(title, rows, 1000);
    const vectors = route.points
      .slice(1)
      .map((point, index) => ({
        x: point.x - route.points[index].x,
        y: point.y - route.points[index].y,
      }))
      .filter((vector) => vector.x || vector.y);
    for (let index = 0; index < vectors.length; index++) {
      const current = vectors[index],
        previous = vectors[(index + vectors.length - 1) % vectors.length];
      assert.ok(current.x === 0 || current.y === 0);
      assert.ok(current.x * previous.x + current.y * previous.y >= 0);
    }
    assert.ok(route.restoreAt > route.sweeps.at(-1).end);
    assert.deepEqual(route.points.at(-2), { x: 6, y: 112 });
    assert.deepEqual(route.points.at(-1), route.points[0]);
  }
});

test('Text is consumed at the mouth, in opposing directions, without changing its layout', () => {
  const route = snakeBannerBonusRoute(title, copy, 1000);
  const right = route.sweeps[0],
    left = route.sweeps[1];
  const word = { left: 40, right: 80 };
  const mouthAtWord = word.left - right.left - 9;
  assert.equal(snakeTextProgress(right.start - 1, right, word), 0);
  assert.equal(snakeTextProgress(right.start + mouthAtWord, right, word), 0);
  assert.equal(
    snakeTextProgress(right.start + mouthAtWord + 20, right, word),
    0.5,
  );
  assert.equal(snakeTextProgress(right.end, right, word), 1);
  assert.equal(snakeTextProgress(right.end, left, word), 0);
  assert.equal(snakeTextProgress(left.start + 274, left, word), 0);
  assert.equal(snakeTextProgress(left.start + 294, left, word), 0.5);
  assert.equal(snakeTextProgress(left.end, left, word), 1);
});

test('One bonus per text row uses the same bite clock and travel speed', () => {
  const route = snakeBannerBonusRoute(title, copy, 1000);
  const speed = 0.05;
  const meals = snakeMeals(
    route.sweeps.map((sweep) => sweep.bonusDistance),
    speed,
  );
  route.sweeps.forEach((sweep, index) => {
    assert.ok(
      sweep.bonusDistance > sweep.start && sweep.bonusDistance < sweep.end,
    );
    const meal = meals[index];
    assert.equal(
      snakeFrame(meal.startsAt + 150, route.restoreAt, speed, meals).distance,
      meal.distance - 18,
    );
    assert.equal(
      snakeFrame(meal.startsAt + 250, route.restoreAt, speed, meals).distance,
      meal.distance - 18,
    );
  });
});

test('Only text consumption accelerates travel, mouth and bite clock by exactly 1.5x', () => {
  assert.equal(snakeTickDuration(20, false), 20);
  assert.equal(snakeTickDuration(20, true), 30);
  const speed = 0.05,
    meals = snakeMeals([100], speed);
  for (const bonus of [false, true]) {
    const multiplier = bonus ? C.bonusSpeed : 1;
    const realElapsed = Array.from({ length: 10 }).reduce(
      (total) => total + snakeTickDuration(20, bonus),
      0,
    );
    assert.equal(
      snakeFrame(realElapsed, 600, speed, []).distance,
      200 * multiplier * speed,
    );
    assert.equal(C.biteDuration / multiplier, bonus ? 400 / 1.5 : 400);
    assert.equal(
      snakeFrame(meals[0].startsAt + realElapsed, 600, speed, meals).distance,
      82,
    );
  }
  assert.equal(snakeTickDuration(1000, true), 120);
  assert.equal(snakeTickDuration(1000, false), 80);
});
