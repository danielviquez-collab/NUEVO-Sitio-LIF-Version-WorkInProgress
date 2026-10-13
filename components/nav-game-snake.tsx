'use client';

import { useEffect, useRef } from 'react';
import {
  NAV_SNAKE as C,
  clampSnake as clamp,
  snakeCycleDuration,
  snakeFrame,
  snakeMeals,
  snakeBannerContour,
  snakeSafeBannerContour,
  snakeBannerBonusRoute,
  snakeTextProgress,
  snakeCopyFrame,
  snakeTickDuration,
  snakeDescentPaths,
  snakeTravelTime,
  snakeReflowTime,
  type SnakeRouteClock,
  type SnakeMeal,
  type SnakeBonusSweep,
  type SnakeTextLine,
} from '@/lib/nav-snake-motion';

const MAX_SEGMENTS = C.initialSegments + 12 * C.segmentsPerFood;
const FOOD_WIDTH = C.foodWidth;
const FOOD_HEIGHT = (FOOD_WIDTH * 600) / 956;

function roundedRoute(x: number, y: number, width: number, height: number) {
  return `M ${x + 12} ${y + 4} H ${x + width - 12} Q ${x + width - 4} ${y + 4} ${x + width - 4} ${y + 12} V ${y + height - 12} Q ${x + width - 4} ${y + height - 4} ${x + width - 12} ${y + height - 4} H ${x + 12} Q ${x + 4} ${y + height - 4} ${x + 4} ${y + height - 12} V ${y + 12} Q ${x + 4} ${y + 4} ${x + 12} ${y + 4}`;
}

export function NavGameSnake() {
  const svgRef = useRef<SVGSVGElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const foodRef = useRef<SVGGElement>(null);
  const rewardRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    const svg = svgRef.current,
      route = routeRef.current,
      head = headRef.current;
    const food = foodRef.current,
      reward = rewardRef.current;
    const label = document.querySelector<HTMLElement>('.game-nav-label');
    const toggle = document.querySelector<HTMLElement>('.menu-toggle');
    const nav = label?.closest('nav');
    if (
      !svg ||
      !route ||
      !head ||
      !food ||
      !reward ||
      !label ||
      !toggle ||
      !nav
    )
      return;

    const segments = Array.from(
      svg.querySelectorAll<SVGRectElement>('.nav-snake-segment'),
    );
    const jaws = Array.from(
      head.querySelectorAll<SVGGElement>('.nav-snake-jaw'),
    );
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const menuRoute = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path',
    );
    const heroRoute = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path',
    );
    let length = 0,
      menuLength = 0,
      menuExitLength = 0,
      heroLength = 0,
      heroStart = 0,
      speed = 0;
    let height = 0,
      top = 0,
      initialDuration = 0;
    let routeClock: SnakeRouteClock | null = null;
    let meals: SnakeMeal[] = [],
      heroMeals: SnakeMeal[] = [];
    let hero: HTMLElement | null = null;
    let copy: HTMLElement | null = null;
    let copyRows: Array<{
      sweep: SnakeBonusSweep;
      words: Array<{ element: HTMLElement; bounds: DOMRect }>;
    }> = [];
    let restoreAt = 0,
      copyLap = -1;
    let bonusActive = false,
      bonusRow = -1,
      bonusStartedAt = 0;
    const wordProgress = new Map<HTMLElement, number>();
    let bannerBounds: DOMRect | null = null;
    let repeatingHero = false,
      elapsed = 0;
    let previousTime: number | null = null;
    let frame = 0,
      inView = true;

    const resetCopy = () => {
      copyRows.forEach((row) =>
        row.words.forEach(({ element }) => {
          element.style.removeProperty('clip-path');
        }),
      );
      wordProgress.clear();
      bonusActive = false;
      bonusRow = -1;
      if (copy) copy.dataset.snakeState = 'visible';
    };
    const drawCopy = (distance: number, lap: number) => {
      if (!copy || !copyRows.length) return -1;
      const state = snakeCopyFrame(
        distance,
        lap,
        heroLength,
        copyRows.map((row) => row.sweep),
        restoreAt,
        segments.length,
      );
      if (state.lap !== copyLap) {
        resetCopy();
        copyLap = state.lap;
      }
      if (state.restoring) {
        if (copy.dataset.snakeState !== 'restoring') {
          resetCopy();
          copy.dataset.snakeState = 'restoring';
        }
        svg.dataset.textState = 'restoring';
        return -1;
      }
      distance = state.distance;
      let consuming = -1,
        allEaten = true,
        anyEaten = false;
      copyRows.forEach(({ sweep, words }, index) => {
        const left = Math.min(...words.map((word) => word.bounds.left));
        const right = Math.max(...words.map((word) => word.bounds.right));
        const start =
          sweep.start +
          (sweep.direction === 'right'
            ? left - sweep.left
            : sweep.right - right) -
          9;
        const end =
          sweep.start +
          (sweep.direction === 'right'
            ? right - sweep.left
            : sweep.right - left) -
          9;
        if (distance > start && distance < end) consuming = index;
        words.forEach(({ element, bounds }) => {
          const progress =
            Math.round(snakeTextProgress(distance, sweep, bounds) * 1000) /
            1000;
          allEaten &&= progress === 1;
          anyEaten ||= progress > 0;
          if (wordProgress.get(element) === progress) return;
          wordProgress.set(element, progress);
          element.style.clipPath =
            sweep.direction === 'right'
              ? `inset(0 0 0 ${progress * 100}%)`
              : `inset(0 ${progress * 100}% 0 0)`;
        });
      });
      const textState = allEaten ? 'eaten' : anyEaten ? 'eating' : 'visible';
      if (copy.dataset.snakeState !== textState)
        copy.dataset.snakeState = textState;
      svg.dataset.textState = textState;
      return consuming;
    };

    const pointAt = (distance: number) => {
      if (repeatingHero)
        return heroRoute.getPointAtLength(
          ((distance % heroLength) + heroLength) % heroLength,
        );
      if (distance < 0)
        return menuRoute.getPointAtLength(
          ((distance % menuLength) + menuLength) % menuLength,
        );
      if (!hero)
        return menuRoute.getPointAtLength(
          ((distance % menuLength) + menuLength) % menuLength,
        );
      return route.getPointAtLength(Math.min(length, distance));
    };
    const place = (
      element: SVGElement,
      distance: number,
      rotate = false,
      scale = 1,
    ) => {
      const point = pointAt(distance),
        ahead = pointAt(distance + 0.5);
      element.dataset.surface =
        bannerBounds &&
        point.x >= bannerBounds.left &&
        point.x <= bannerBounds.right &&
        point.y >= bannerBounds.top &&
        point.y <= bannerBounds.bottom
          ? 'banner'
          : 'menu';
      let angle = rotate
        ? (Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180) / Math.PI
        : 0;
      if (rotate && hero && (repeatingHero || distance >= menuExitLength))
        angle = Math.round(angle / 90) * 90;
      element.setAttribute(
        'transform',
        `translate(${point.x} ${point.y}) rotate(${angle}) scale(${scale})`,
      );
    };

    const draw = () => {
      if (!length) return;
      repeatingHero = !!hero && elapsed >= initialDuration;
      const activeLength = repeatingHero ? heroLength : length;
      const activeMeals = repeatingHero ? heroMeals : meals;
      const cycleTime = repeatingHero ? elapsed - initialDuration : elapsed;
      const cycle = snakeCycleDuration(
        activeLength,
        speed,
        activeMeals,
        !!hero,
      );
      const { time, distance, eaten, fade } = snakeFrame(
        hero && !repeatingHero ? cycleTime : cycleTime % cycle,
        activeLength,
        speed,
        activeMeals,
        !!hero,
      );
      svg.dataset.region =
        repeatingHero || (hero && distance >= heroStart)
          ? 'banner'
          : hero && distance > menuExitLength
            ? 'travel'
            : 'menu';
      const currentBonusRow = drawCopy(
        repeatingHero ? distance : distance - heroStart,
        repeatingHero ? 1 + Math.floor(cycleTime / cycle) : 0,
      );
      if (currentBonusRow >= 0 && currentBonusRow !== bonusRow)
        bonusStartedAt = time;
      bonusRow = currentBonusRow;
      bonusActive = bonusRow >= 0;
      svg.dataset.bonusActive = String(bonusActive);
      svg.dataset.speedFactor = String(bonusActive ? C.bonusSpeed : 1);
      svg.dataset.speed = String(
        speed * 1000 * (bonusActive ? C.bonusSpeed : 1),
      );
      const inheritedSegments =
        C.initialSegments +
        (repeatingHero
          ? meals.length + Math.floor(cycleTime / cycle) * heroMeals.length
          : 0) *
          C.segmentsPerFood;
      const count = Math.min(
        segments.length,
        inheritedSegments + eaten * C.segmentsPerFood,
      );
      const activeMeal = activeMeals.find(
        (meal) => time < meal.startsAt + C.biteDuration,
      );
      const biteAge = activeMeal ? time - activeMeal.startsAt : -1;
      const foodMouth = activeMeal
        ? biteAge >= 0
          ? 1 - clamp((biteAge - 70) / 190)
          : clamp(1 - (activeMeal.distance - 18 - distance) / 20)
        : 0;
      const mouth = bonusActive
        ? Math.max(foodMouth, 0.35 + 0.65 * Math.abs(Math.sin(time / 105)))
        : foodMouth;
      place(head, distance, true);
      head.style.opacity = String(1 - fade);
      jaws.forEach((jaw, index) =>
        jaw.setAttribute(
          'transform',
          `rotate(${(index === 0 ? -1 : 1) * mouth * 19})`,
        ),
      );
      segments.forEach((segment, index) => {
        const mealIndex = Math.floor(
          (index - inheritedSegments) / C.segmentsPerFood,
        );
        const growth =
          mealIndex < 0
            ? 1
            : activeMeals[mealIndex]
              ? clamp(
                  (time - activeMeals[mealIndex].startsAt - C.consumeAt) / 180,
                )
              : 0;
        const tailScale =
          index === count - 1 ? 0.6 : index === count - 2 ? 0.82 : 1;
        place(
          segment,
          distance - 11 - index * C.segmentSpacing,
          true,
          tailScale * growth,
        );
        segment.style.opacity =
          index < count ? String((1 - fade) * growth) : '0';
      });
      const foodIndex = activeMeals.findIndex(
        (meal) => time < meal.startsAt + C.foodDisappearsAt,
      );
      const nextFood = activeMeals[foodIndex];
      const appearedAt =
        foodIndex > 0
          ? activeMeals[foodIndex - 1].startsAt + C.biteDuration + 160
          : 0;
      food.style.opacity = '0';
      if (nextFood && nextFood.kind !== 'bonus' && time >= appearedAt) {
        food.dataset.kind = nextFood.kind ?? 'logo';
        const swallow = clamp((time - nextFood.startsAt) / C.foodDisappearsAt);
        const reveal = clamp((time - appearedAt) / 160);
        place(
          food,
          nextFood.distance - 10 * swallow,
          false,
          (1 - swallow) * (0.85 + reveal * 0.15),
        );
        food.style.opacity = String((1 - swallow) * reveal);
      }
      const rewardMeal = activeMeals.find(
        (meal) =>
          meal.kind !== 'bonus' &&
          time >= meal.startsAt + C.consumeAt &&
          time < meal.startsAt + C.consumeAt + C.rewardDuration,
      );
      reward.style.opacity = '0';
      if (rewardMeal) {
        reward.dataset.kind = rewardMeal.kind ?? 'logo';
        reward.textContent = rewardMeal.kind === 'bonus' ? '+BONUS' : '+1';
        const progress =
          (time - rewardMeal.startsAt - C.consumeAt) / C.rewardDuration;
        const point = pointAt(rewardMeal.distance);
        const midY =
          (hero && rewardMeal.distance >= heroStart) || repeatingHero
            ? top + height / 2
            : label.getBoundingClientRect().top;
        const y =
          rewardMeal.kind === 'bonus' || point.y < midY
            ? point.y - 13 - progress * 8
            : point.y + 25 - progress * 8;
        reward.setAttribute('transform', `translate(${point.x} ${y})`);
        reward.style.opacity = String(1 - clamp((progress - 0.35) / 0.65));
      }
      if (bonusActive) {
        const period = C.rewardDuration + 300;
        const progress = ((time - bonusStartedAt) % period) / period;
        const point = pointAt(distance);
        reward.dataset.kind = 'bonus';
        reward.textContent = '+BONUS';
        reward.setAttribute(
          'transform',
          `translate(${point.x} ${point.y - 20 - progress * 8})`,
        );
        reward.style.opacity = String(1 - clamp((progress - 0.35) / 0.65));
      }
    };
    const tick = (time: number) => {
      if (previousTime !== null)
        elapsed += snakeTickDuration(time - previousTime, bonusActive);
      previousTime = time;
      draw();
      frame = window.requestAnimationFrame(tick);
    };
    const sync = () => {
      if (length && inView && !media.matches && !document.hidden) {
        if (!frame) frame = window.requestAnimationFrame(tick);
      } else {
        window.cancelAnimationFrame(frame);
        frame = 0;
        previousTime = null;
        if (media.matches) resetCopy();
      }
      svg.dataset.ready =
        length && inView && !media.matches && !document.hidden
          ? 'true'
          : 'false';
    };
    const layout = () => {
      const previousClock = hero && length ? routeClock : null;
      const candidate = document.querySelector<HTMLElement>('.lif-games-hero');
      const heading = candidate?.querySelector('h1');
      const navBox = label.getBoundingClientRect();
      const navVisible = navBox.width > 0 && navBox.height > 0;
      // Mobile's expanded menu keeps the original loop until it closes.
      hero =
        candidate && heading && !nav.classList.contains('is-open')
          ? candidate
          : null;
      bannerBounds = hero?.getBoundingClientRect() ?? null;
      const nextCopy =
        hero?.querySelector<HTMLElement>('[data-snake-copy]') ?? null;
      if (nextCopy !== copy) {
        resetCopy();
        copyRows = [];
        copyLap = -1;
        copy = nextCopy;
      }
      const box = navVisible ? navBox : toggle.getBoundingClientRect();
      if ((!navVisible && !hero) || box.width < 20) {
        length = 0;
        sync();
        return;
      }
      svg.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
      const x = box.left - (navVisible ? 22 : 0),
        y = box.top - (navVisible ? 17 : 0);
      const width = box.width + (navVisible ? 44 : 0);
      height = box.height + (navVisible ? 34 : 0);
      top = y;
      const menuPath = roundedRoute(x, y, width, height);
      menuRoute.setAttribute('d', menuPath);
      menuLength = menuRoute.getTotalLength();
      menuExitLength = menuLength;
      if (navVisible) speed = menuLength / C.lapDuration;
      else {
        const font = getComputedStyle(label);
        const ctx = document.createElement('canvas').getContext('2d');
        if (ctx)
          ctx.font = `${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
        const calibration = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'path',
        );
        calibration.setAttribute(
          'd',
          roundedRoute(
            0,
            0,
            (ctx?.measureText(label.textContent ?? '').width ?? 140) + 44,
            parseFloat(font.fontSize) * 1.2 + 34,
          ),
        );
        speed = calibration.getTotalLength() / C.lapDuration;
      }
      const menuFood = navVisible
        ? [
            width * 0.5 - 12,
            menuLength / 2 + width * 0.24 - 12,
            menuLength / 2 + width * 0.68 - 12,
          ]
        : [];
      let path = menuPath,
        distances = menuFood;
      heroLength = 0;
      if (hero && heading) {
        const logoBounds = label
          .closest('header')
          ?.querySelector('.brand-lockup')
          ?.getBoundingClientRect();
        const minimumTitleRail = Math.max(
          logoBounds ? logoBounds.bottom + 12 : -Infinity,
          hero.getBoundingClientRect().top +
            C.bannerInset +
            C.segmentSpacing * 2 -
            4,
        );
        const minimumEntryX = logoBounds
          ? logoBounds.right + C.bannerInset + 4
          : undefined;
        const r = heading.getBoundingClientRect();
        const lineElements = Array.from(
          heading.querySelectorAll<HTMLElement>('.game-title-line'),
        );
        const titleLines = lineElements.length
          ? lineElements.map((line) => line.getBoundingClientRect())
          : [r];
        const textRows: Array<{
          line: SnakeTextLine;
          words: Array<{ element: HTMLElement; bounds: DOMRect }>;
        }> = [];
        copy
          ?.querySelectorAll<HTMLElement>('[data-snake-word]')
          .forEach((element) => {
            const bounds = element.getBoundingClientRect();
            let row = textRows.find(
              (row) => Math.abs(row.line.top - bounds.top) < 2,
            );
            if (!row) {
              row = {
                line: {
                  left: bounds.left,
                  right: bounds.right,
                  top: bounds.top,
                  bottom: bounds.bottom,
                },
                words: [],
              };
              textRows.push(row);
            }
            row.line.left = Math.min(row.line.left, bounds.left);
            row.line.right = Math.max(row.line.right, bounds.right);
            row.words.push({ element, bounds });
          });
        const compact = window.matchMedia('(max-width: 1100px)').matches;
        const bonusRoute = textRows.length
          ? snakeBannerBonusRoute(
              compact ? [r] : titleLines,
              textRows.map((row) => row.line),
              innerWidth,
              minimumTitleRail,
              minimumEntryX,
            )
          : null;
        const contour =
          bonusRoute ??
          (compact ? snakeSafeBannerContour : snakeBannerContour)(
            compact
              ? [...titleLines, ...textRows.map((row) => row.line)]
              : titleLines,
            innerWidth,
            minimumTitleRail,
            minimumEntryX,
          );
        copyRows = bonusRoute
          ? textRows.map((row, index) => ({
              ...row,
              sweep: bonusRoute.sweeps[index],
            }))
          : [];
        restoreAt = bonusRoute?.restoreAt ?? 0;
        const {
          left,
          top: heroTop,
          bottom: heroBottom,
          width: heroWidth,
        } = contour;
        const rail = Math.min(
          heroTop - 24,
          (label.closest('header')?.getBoundingClientRect().bottom ??
            box.bottom) + 16,
        );
        const { menuExit, bridge } = snakeDescentPaths(
          { x, y, width, height },
          {
            left,
            top: heroTop,
            entryX: contour.entryX,
            surfaceTop: hero.getBoundingClientRect().top,
          },
          rail,
          logoBounds,
        );
        route.setAttribute('d', menuExit);
        menuExitLength = route.getTotalLength();
        route.setAttribute('d', menuExit + bridge);
        heroStart = route.getTotalLength();
        const heroPath = contour.path;
        heroRoute.setAttribute('d', heroPath);
        heroLength = heroRoute.getTotalLength();
        // The bridge belongs to the same path; no head or body is replaced on arrival.
        path = menuExit + bridge + heroPath.slice(heroPath.indexOf(' H'));
        const foodDistances = [
          contour.firstFoodDistance,
          heroWidth - 16 + (heroBottom - heroTop) * 0.28,
          (bonusRoute?.titleEnd ?? heroLength) - (heroBottom - heroTop) * 0.28,
        ];
        const heroFood = [
          ...foodDistances.map((distance) => ({
            distance,
            kind: 'logo' as const,
          })),
          ...(bonusRoute?.sweeps.map((sweep) => ({
            distance: sweep.bonusDistance,
            kind: 'bonus' as const,
          })) ?? []),
        ].sort((a, b) => a.distance - b.distance);
        heroMeals = snakeMeals(
          heroFood.map((food) => food.distance),
          speed,
        ).map((meal, index) => ({ ...meal, kind: heroFood[index].kind }));
        const allFood = [
          ...menuFood.map((distance) => ({ distance, kind: 'logo' as const })),
          ...heroFood.map((food) => ({
            ...food,
            distance: heroStart + food.distance,
          })),
        ];
        distances = allFood.map((food) => food.distance);
        meals = snakeMeals(distances, speed).map((meal, index) => ({
          ...meal,
          kind: allFood[index].kind,
        }));
        top = heroTop;
        height = heroBottom - heroTop;
      }
      route.setAttribute('d', path);
      length = route.getTotalLength();
      if (!hero) meals = snakeMeals(distances, speed);
      initialDuration = snakeCycleDuration(length, speed, meals, !!hero);
      routeClock = hero
        ? {
            exit: snakeTravelTime(menuExitLength, speed, meals),
            entry: snakeTravelTime(heroStart, speed, meals),
            finish: initialDuration,
            loop: snakeCycleDuration(heroLength, speed, heroMeals, true),
          }
        : null;
      // Reflow keeps the current stage; a longer route must not send the head back to the menu.
      if (previousClock && routeClock)
        elapsed = snakeReflowTime(elapsed, previousClock, routeClock);
      const visibleBox = hero?.getBoundingClientRect() ?? box;
      inView = visibleBox.bottom > 0 && visibleBox.top < innerHeight;
      draw();
      sync();
    };
    const resize = new ResizeObserver(layout);
    resize.observe(label);
    resize.observe(document.documentElement);
    const changes = new MutationObserver(layout);
    changes.observe(nav, { attributes: true, attributeFilter: ['class'] });
    const routeChange = () => requestAnimationFrame(layout);
    const pageArrival = (event: AnimationEvent) => {
      if (
        event.animationName === 'lif-page-arrive' &&
        event.target instanceof Element &&
        event.target.matches('.game-legacy-heading, .game-legacy-action')
      )
        routeChange();
    };
    layout();
    let disposed = false;
    void document.fonts.ready.then(() => {
      if (!disposed) layout();
    });
    media.addEventListener('change', layout);
    document.addEventListener('visibilitychange', layout);
    window.addEventListener('resize', layout);
    window.addEventListener('scroll', layout, { passive: true });
    window.addEventListener('lif:snake-route', routeChange);
    document.addEventListener('animationend', pageArrival);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resize.disconnect();
      changes.disconnect();
      media.removeEventListener('change', layout);
      document.removeEventListener('visibilitychange', layout);
      window.removeEventListener('resize', layout);
      window.removeEventListener('scroll', layout);
      window.removeEventListener('lif:snake-route', routeChange);
      document.removeEventListener('animationend', pageArrival);
      resetCopy();
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className="nav-snake"
      aria-hidden="true"
      focusable="false"
    >
      <path ref={routeRef} className="nav-snake-route" />
      <g ref={foodRef} className="nav-snake-food">
        <image
          className="nav-snake-logo"
          href="/brand/lif-official.svg"
          x={-FOOD_WIDTH / 2}
          y={-FOOD_HEIGHT / 2}
          width={FOOD_WIDTH}
          height={FOOD_HEIGHT}
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
      {Array.from({ length: MAX_SEGMENTS }, (_, index) => (
        <rect
          className="nav-snake-segment"
          key={index}
          x="-3"
          y="-3"
          width="6"
          height="6"
          rx=".5"
        />
      ))}
      <g ref={headRef} className="nav-snake-head">
        <g className="nav-snake-jaw">
          <path d="M -8 0 V -6 H -4 V -8 H 6 V -6 H 9 V 0 Z" />
          <rect
            className="nav-snake-eye"
            x="1"
            y="-6"
            width="5"
            height="4"
            rx=".5"
          />
          <rect className="nav-snake-pupil" x="4" y="-5" width="2" height="2" />
        </g>
        <g className="nav-snake-jaw">
          <path d="M -8 0 V 6 H -4 V 8 H 6 V 6 H 9 V 0 Z" />
          <rect
            className="nav-snake-eye"
            x="1"
            y="2"
            width="5"
            height="4"
            rx=".5"
          />
          <rect className="nav-snake-pupil" x="4" y="3" width="2" height="2" />
        </g>
        <path className="nav-snake-mouth" d="M 4 0 H 9" />
      </g>
      <text ref={rewardRef} className="nav-snake-reward" textAnchor="middle">
        +1
      </text>
    </svg>
  );
}
