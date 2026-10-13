import { GAME_CONFIG as C } from './config.ts';
import { memoryPairBag, shuffled } from './session-random.ts';
import { emit, type GameState, type Input } from './engine.ts';

export type CardPhase =
  | 'idle'
  | 'flipping'
  | 'revealed'
  | 'matched'
  | 'mismatch'
  | 'closing'
  | 'exiting'
  | 'replacing';
export type MemoryCard = {
  id: number;
  flavor: number;
  phase: CardPhase;
  until: number;
};
export type MemoryState = {
  cards: MemoryCard[];
  selected: number[];
  evaluationAt: number;
  transitionAt: number;
  cycle:
    | 'idle'
    | 'evaluating'
    | 'mismatch'
    | 'closing'
    | 'matched'
    | 'exiting'
    | 'replacing'
    | 'shuffle-warning'
    | 'shuffling';
  bag: number[];
  lastFlavor: number;
  matches: number;
  superProgress: number;
  pendingSuper: boolean;
  peekCharges: number;
  radarCharges: number;
  peekUntil: number;
  radarUntil: number;
  radarSlots: number[];
  shuffleIndex: number;
  notice: string;
  noticeUntil: number;
  stage: number;
};
function card(
  s: GameState,
  flavor: number,
  phase: CardPhase = 'idle',
): MemoryCard {
  return {
    id: s.nextId++,
    flavor,
    phase,
    until: s.activeMs + (phase === 'replacing' ? 320 : 0),
  };
}
export function createMemory(s: GameState): MemoryState {
  const bag = memoryPairBag(s, 0, true);
  const cards = shuffled(
    s,
    bag.flatMap((flavor) => [card(s, flavor), card(s, flavor)]),
  );
  return {
    cards,
    selected: [],
    evaluationAt: 0,
    transitionAt: 0,
    cycle: 'idle',
    bag: [],
    lastFlavor: -2,
    matches: 0,
    superProgress: 0,
    pendingSuper: false,
    peekCharges: 1,
    radarCharges: 0,
    peekUntil: 0,
    radarUntil: 0,
    radarSlots: [],
    shuffleIndex: 0,
    notice: '',
    noticeUntil: 0,
    stage: 0,
  };
}
const safe = (m: MemoryState) =>
  m.cycle === 'idle' &&
  m.selected.length === 0 &&
  m.cards.every((c) => c.phase === 'idle');
export function memoryInput(s: GameState, input: Input): boolean {
  const m = s.memory!;
  if (m.cycle !== 'idle' || m.peekUntil > s.activeMs) return false;
  if (input.action === 'peek') {
    if (!safe(m) || m.peekCharges < 1) return false;
    m.peekCharges--;
    m.peekUntil = s.activeMs + C.MEMORY_PEEK_DURATION_SECONDS * 1000;
    emit(s, 'peek');
    return true;
  }
  if (input.action === 'radar') {
    if (!C.MEMORY_RADAR_ENABLED || !safe(m) || m.radarCharges < 1) return false;
    m.radarCharges--;
    m.radarUntil = s.activeMs + 3000;
    // One card from each of several different flavors; never points to a complete pair.
    const flavors = shuffled(s, [
      ...new Set(m.cards.map((c) => c.flavor)),
    ]).slice(0, 3);
    m.radarSlots = flavors.map(
      (flavor) =>
        shuffled(
          s,
          m.cards
            .map((c, i) => (c.flavor === flavor ? i : -1))
            .filter((i) => i >= 0),
        )[0],
    );
    emit(s, 'radar');
    return true;
  }
  const slot = input.slot;
  if (
    !Number.isInteger(slot) ||
    slot! < 0 ||
    slot! >= m.cards.length ||
    m.selected.length >= 2
  )
    return false;
  const selected = m.cards[slot!];
  if (selected.phase !== 'idle' || m.selected.includes(slot!)) return false;
  selected.phase = 'flipping';
  selected.until = s.activeMs + C.MEMORY_FLIP_MS;
  m.selected.push(slot!);
  emit(s, 'flip', 0, -1, { x: slot! % 4, y: Math.floor(slot! / 4) });
  if (m.selected.length === 2) {
    m.cycle = 'evaluating';
    m.evaluationAt = selected.until + 80;
  }
  return true;
}
function startSuper(s: GameState) {
  const m = s.memory!;
  m.pendingSuper = false;
  m.superProgress = 0;
  s.bonusCount++;
  const points =
    C.COMPETITION_SUPER_BONUS_POINTS *
    (C.MEMORY_X2_SUPER_BONUS && s.doubleUntil > s.activeMs ? 2 : 1);
  s.score += points;
  s.spotlight = 'super';
  s.freezeMs = C.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1000;
  emit(s, 'super', points);
}
function evaluate(s: GameState) {
  const m = s.memory!,
    [a, b] = m.selected.map((i) => m.cards[i]);
  if (a.flavor !== b.flavor) {
    a.phase = b.phase = 'mismatch';
    m.cycle = 'mismatch';
    m.transitionAt = s.activeMs + [800, 700, 600][m.stage];
    emit(s, 'mismatch');
    return;
  }
  a.phase = b.phase = 'matched';
  m.cycle = 'matched';
  m.transitionAt = s.activeMs + 320;
  m.notice = 'Nueva pareja: mezcla breve';
  m.noticeUntil = s.activeMs + 1600;
  m.matches++;
  m.superProgress++;
  const flavor = a.flavor,
    isNew = flavor >= 0 && flavor < 3;
  const points =
    (flavor === -1
      ? C.MEMORY_LOGO_MATCH_POINTS
      : isNew
        ? C.MEMORY_MATCH_NEW_FLAVOR_POINTS
        : C.MEMORY_MATCH_NORMAL_POINTS) * (s.doubleUntil > s.activeMs ? 2 : 1);
  s.score += points;
  emit(s, flavor === -1 ? 'logo' : isNew ? 'new' : 'normal', points, flavor, {
    x: m.selected[0] % 4,
    y: Math.floor(m.selected[0] / 4),
  });
  if (isNew) {
    if (!s.newSeen.includes(flavor)) s.newSeen.push(flavor);
    s.spotlight = flavor;
    s.freezeMs = C.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1000;
  }
  if (m.superProgress >= C.COMPETITION_SUPER_BONUS_ACTIONS) {
    m.pendingSuper = true;
    if (!s.freezeMs) startSuper(s);
  }
}
function replacePair(s: GameState) {
  const m = s.memory!;
  if (!m.bag.length) m.bag = memoryPairBag(s, m.stage, false, m.lastFlavor);
  let flavor = m.bag.shift()!;
  const justMatched = m.cards[m.selected[0]].flavor;
  // Keep the quota intact by exchanging entries rather than rerolling valuable pairs.
  if (flavor === justMatched) {
    const alternative = m.bag.findIndex(
      (f) => f !== justMatched && f !== m.lastFlavor,
    );
    if (alternative >= 0)
      [flavor, m.bag[alternative]] = [m.bag[alternative], flavor];
  }
  m.lastFlavor = flavor;
  for (const slot of m.selected) m.cards[slot] = card(s, flavor, 'replacing');
  // Announced local redistribution prevents farming the same two replacement slots.
  // Preserve every other pair; only closed cards participate, never revealed ones.
  const closed = shuffled(
    s,
    m.cards.map((c, i) => (c.phase === 'idle' ? i : -1)).filter((i) => i >= 0),
  ).slice(0, 4);
  const slots = [...m.selected, ...closed];
  const values = shuffled(
    s,
    slots.map((i) => m.cards[i]),
  );
  slots.forEach((slot, i) => {
    m.cards[slot] = values[i];
    m.cards[slot].phase = 'replacing';
    m.cards[slot].until = s.activeMs + 360;
  });
  m.noticeUntil = s.activeMs + 700;
  m.selected = [];
  m.cycle = 'replacing';
  m.transitionAt = s.activeMs + 360;
}
function shuffleClosed(s: GameState) {
  const m = s.memory!;
  const slots = m.cards
    .map((c, i) => (c.phase === 'idle' ? i : -1))
    .filter((i) => i >= 0);
  const values = slots.map((i) => m.cards[i]);
  // Random non-zero rotation of a randomized traversal guarantees that no card stays put.
  const traversal = shuffled(s, slots),
    shift =
      1 +
      Math.floor((shuffled(s, slots)[0] / slots.length) * (slots.length - 1));
  traversal.forEach((slot, i) => {
    m.cards[slot] =
      values[slots.indexOf(traversal[(i + shift) % slots.length])];
    m.cards[slot].phase = 'replacing';
  });
  m.cycle = 'shuffling';
  m.transitionAt = s.activeMs + 520;
  m.shuffleIndex++;
  emit(s, 'shuffle');
}
export function stepMemory(s: GameState) {
  const m = s.memory!;
  m.stage = Math.min(2, Math.floor(s.activeMs / 60000));
  if (m.pendingSuper) {
    startSuper(s);
    return;
  }
  for (const card of m.cards)
    if (card.phase === 'flipping' && s.activeMs >= card.until)
      card.phase = 'revealed';
  if (m.cycle === 'evaluating' && s.activeMs >= m.evaluationAt) evaluate(s);
  else if (s.activeMs >= m.transitionAt) {
    if (m.cycle === 'mismatch') {
      for (const slot of m.selected) m.cards[slot].phase = 'closing';
      m.cycle = 'closing';
      m.transitionAt = s.activeMs + C.MEMORY_FLIP_MS;
    } else if (m.cycle === 'closing') {
      for (const slot of m.selected) m.cards[slot].phase = 'idle';
      m.selected = [];
      m.cycle = 'idle';
    } else if (m.cycle === 'matched') {
      for (const slot of m.selected) m.cards[slot].phase = 'exiting';
      m.cycle = 'exiting';
      m.transitionAt = s.activeMs + 260;
    } else if (m.cycle === 'exiting') replacePair(s);
    else if (m.cycle === 'replacing' || m.cycle === 'shuffling') {
      for (const card of m.cards)
        if (card.phase === 'replacing') card.phase = 'idle';
      m.cycle = 'idle';
    } else if (m.cycle === 'shuffle-warning') shuffleClosed(s);
  }
  if (!safe(m) || m.peekUntil > s.activeMs || s.freezeMs > 0) return;
  while (
    s.scheduleIndex < s.plan.events.length &&
    s.plan.events[s.scheduleIndex].at <= s.activeMs
  ) {
    const event = s.plan.events[s.scheduleIndex++];
    if (event.kind === 'double') {
      s.doubleUntil = s.activeMs + C.MEMORY_X2_DURATION_SECONDS * 1000;
      emit(s, 'powerup');
    }
    if (event.kind === 'peek') {
      m.peekCharges++;
      emit(s, 'powerup');
    }
    if (event.kind === 'radar') {
      m.radarCharges++;
      emit(s, 'powerup');
    }
  }
  if (
    m.shuffleIndex < s.plan.shuffles.length &&
    s.activeMs >= s.plan.shuffles[m.shuffleIndex] &&
    s.activeMs < 170000 &&
    s.doubleUntil <= s.activeMs
  ) {
    m.cycle = 'shuffle-warning';
    m.transitionAt = s.activeMs + 850;
    m.notice = 'LIF SHUFFLE';
    m.noticeUntil = s.activeMs + 1450;
  }
}

export function memoryPairValue(flavors: readonly number[]) {
  return flavors.reduce(
    (sum, f) =>
      sum +
      (f < 0
        ? C.MEMORY_LOGO_MATCH_POINTS
        : f < 3
          ? C.MEMORY_MATCH_NEW_FLAVOR_POINTS
          : C.MEMORY_MATCH_NORMAL_POINTS),
    0,
  );
}
