import { GAME_CONFIG as C, type GameId } from './config.ts';

export type RandomState = { rng: number };
export function random(state: RandomState) {
  state.rng = (state.rng + 0x6d2b79f5) | 0;
  let t = Math.imul(state.rng ^ (state.rng >>> 15), 1 | state.rng);
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export function stream(seed: number, label: string): RandomState {
  let hash = seed >>> 0;
  for (const character of label)
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return { rng: hash >>> 0 };
}
export function between(state: RandomState, min: number, max: number) {
  return min + Math.floor(random(state) * (max - min + 1));
}
export function shuffled<T>(state: RandomState, values: readonly T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = between(state, 0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export type ScheduledEvent = {
  at: number;
  kind:
    | 'flavor'
    | 'logo'
    | 'double'
    | 'shield'
    | 'boost'
    | 'hazard'
    | 'peek'
    | 'radar';
  flavor: number;
};
export type SessionPlan = {
  game: GameId;
  events: ScheduledEvent[];
  shuffles: number[];
};

function makePlan(game: GameId, seed: number): SessionPlan {
  const rng = stream(seed, `${C.VERSION}:schedule:${game}`);
  const events: ScheduledEvent[] = [];
  const shuffles: number[] = [];
  if (game === 'snake') {
    const flavors = shuffled(rng, [0, 1, 2]);
    const hazards = shuffled(rng, [0, 0, 0, 1, 1, 1]);
    [
      [2000, 9000],
      [19000, 28000],
      [37000, 48000],
    ].forEach(([min, max], i) => {
      events.push({
        at: between(rng, min, max),
        kind: 'flavor',
        flavor: flavors[i],
      });
    });
    // Every 30-second window has equal opportunities; order and exact timing vary.
    for (let window = 0; window < 6; window++) {
      const kinds = shuffled(rng, [
        'logo',
        'double',
        'shield',
        'boost',
        'hazard',
      ] as const);
      kinds.forEach((kind, i) =>
        events.push({
          at: window * 30000 + i * 5500 + between(rng, 1000, 3500),
          kind,
          flavor: kind === 'hazard' ? hazards[window] : -1,
        }),
      );
    }
    // Equal normal-product exposure independent of whether previous food was eaten.
    const flavorsBag = shuffled(
      rng,
      Array.from({ length: 10 }, (_, i) => i + 3),
    );
    for (let i = 0; i < 15; i++)
      events.push({
        at:
          i === 0
            ? 0
            : i * C.SNAKE_NORMAL_SPAWN_SECONDS * 1000 +
              between(rng, -1600, 1600),
        kind: 'flavor',
        flavor: flavorsBag[i % 10],
      });
  } else {
    for (let window = 0; window < 3; window++) {
      const kinds = shuffled(rng, ['double', 'peek'] as const);
      kinds.forEach((kind, i) =>
        events.push({
          at: window * 60000 + 12000 + i * 22000 + between(rng, -3500, 3500),
          kind,
          flavor: -1,
        }),
      );
      if (C.MEMORY_RADAR_ENABLED)
        events.push({
          at: window * 60000 + 46000 + between(rng, -3000, 3000),
          kind: 'radar',
          flavor: -1,
        });
    }
    let at = 0;
    while (true) {
      at += between(
        rng,
        C.MEMORY_SHUFFLE_MIN_INTERVAL_SECONDS * 1000,
        C.MEMORY_SHUFFLE_MAX_INTERVAL_SECONDS * 1000,
      );
      if (at >= 170000) break;
      shuffles.push(at);
    }
  }
  events.sort((a, b) => a.at - b.at);
  return { game, events, shuffles };
}
export function inspectPlan(plan: SessionPlan) {
  const counts: Record<string, number> = {};
  for (const event of plan.events)
    counts[event.kind] = (counts[event.kind] ?? 0) + 1;
  return {
    counts,
    normal: plan.events.filter((e) => e.kind === 'flavor' && e.flavor >= 3)
      .length,
    newFlavors: plan.events
      .filter((e) => e.kind === 'flavor' && e.flavor < 3)
      .map((e) => e.flavor),
    // Comparison metric, not a promised player score; excludes skill-dependent x2/Super.
    basePotential: plan.events.reduce(
      (sum, e) =>
        sum +
        (e.kind === 'logo'
          ? C.LIF_LOGO_POINTS
          : e.kind === 'flavor'
            ? e.flavor < 3
              ? C.NEW_FLAVOR_POINTS
              : C.NORMAL_FLAVOR_POINTS
            : 0),
      0,
    ),
    // A fixed collection-latency proxy also bounds favorable x2/turbo coincidences.
    // It is an audit metric, not a prediction or a cap on the player's score.
    timedPotential: plan.events.reduce((sum, e) => {
      const value =
        e.kind === 'logo'
          ? C.LIF_LOGO_POINTS
          : e.kind === 'flavor'
            ? e.flavor < 3
              ? C.NEW_FLAVOR_POINTS
              : C.NORMAL_FLAVOR_POINTS
            : 0;
      const doubled = plan.events.some(
        (b) =>
          (b.kind === 'double' || b.kind === 'boost') &&
          b.at <= e.at &&
          b.at +
            (b.kind === 'double'
              ? C.POWERUP_DURATION_SECONDS
              : C.BOOST_DURATION_SECONDS) *
              1000 >
            e.at,
      );
      return sum + value * (doubled ? 2 : 1);
    }, 0),
  };
}
export function validPlan(plan: SessionPlan) {
  const stats = inspectPlan(plan);
  if (plan.events.some((e) => e.at < 0 || e.at >= 180000)) return false;
  if (plan.game === 'snake')
    return (
      stats.normal === 15 &&
      new Set(stats.newFlavors).size === 3 &&
      ['logo', 'double', 'shield', 'boost', 'hazard'].every(
        (kind) => stats.counts[kind] === 6,
      ) &&
      stats.basePotential === 2550 &&
      stats.timedPotential >= C.SNAKE_FAIRNESS_TIMED_POTENTIAL_MIN &&
      stats.timedPotential <= C.SNAKE_FAIRNESS_TIMED_POTENTIAL_MAX
    );
  return (
    stats.counts.double === 3 &&
    stats.counts.peek === 3 &&
    plan.shuffles.every((at, i) => {
      const gap = at - (plan.shuffles[i - 1] ?? 0);
      return gap >= 35000 && gap <= 55000 && at < 170000;
    })
  );
}
export function createSessionPlan(game: GameId, seed: number): SessionPlan {
  for (let retry = 0; retry < C.SESSION_PLAN_MAX_RETRIES; retry++) {
    const plan = makePlan(game, (seed + retry * 0x9e3779b9) >>> 0);
    if (validPlan(plan)) return plan;
  }
  throw new Error('Session plan failed fairness constraints');
}

export function memoryPairBag(
  rng: RandomState,
  stage: number,
  initial = false,
  previous = -2,
): number[] {
  const normal = shuffled(
    rng,
    Array.from(
      { length: stage === 0 ? 6 : stage === 1 ? 8 : 10 },
      (_, i) => i + 3,
    ),
  ).slice(0, 4);
  // Fixed value quota, variable flavor frequency. Initial bag guarantees all campaign packs.
  const fresh = initial
    ? [0, 1, 2]
    : [between(rng, 0, 2), between(rng, 0, 2), between(rng, 0, 2)];
  for (let retry = 0; retry < 64; retry++) {
    const bag = shuffled(rng, [...normal, ...fresh, -1]);
    if (
      bag[0] === previous ||
      bag.some((f, i) => i > 0 && f === bag[i - 1]) ||
      bag.some(
        (f, i) =>
          i >= 2 &&
          f >= 0 &&
          f < 3 &&
          bag[i - 1] >= 0 &&
          bag[i - 1] < 3 &&
          bag[i - 2] >= 0 &&
          bag[i - 2] < 3,
      )
    )
      continue;
    return bag;
  }
  // Alternation always satisfies category cooldowns while retaining the same quotas.
  const freshOrder = shuffled(rng, fresh);
  const rest = shuffled(rng, [...normal, -1]);
  const bag = [
    rest[0],
    freshOrder[0],
    rest[1],
    freshOrder[1],
    rest[2],
    freshOrder[2],
    rest[3],
    rest[4],
  ];
  if (bag[0] === previous) [bag[0], bag[7]] = [bag[7], bag[0]];
  return bag;
}
