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
  | 'preview';
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
    | 'preview'
    | 'board-closing';
  matches: number;
  errorStreak: number;
  superProgress: number;
  pendingSuper: boolean;
  peekCharges: number;
  radarCharges: number;
  peekUntil: number;
  radarUntil: number;
  radarSlots: number[];
  boardIndex: number;
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
    until: s.activeMs,
  };
}
export function createMemory(s: GameState): MemoryState {
  const bag = memoryPairBag(s, 0, true);
  const cards = shuffled(
    s,
    bag.flatMap((flavor) => [
      card(s, flavor, 'preview'),
      card(s, flavor, 'preview'),
    ]),
  );
  return {
    cards,
    selected: [],
    evaluationAt: 0,
    transitionAt: C.MEMORY_BOARD_PREVIEW_MS,
    cycle: 'preview',
    matches: 0,
    errorStreak: 0,
    superProgress: 0,
    pendingSuper: false,
    peekCharges: 1,
    radarCharges: 0,
    peekUntil: 0,
    radarUntil: 0,
    radarSlots: [],
    boardIndex: 0,
    notice: 'Memorizá los sabores',
    noticeUntil: C.MEMORY_BOARD_PREVIEW_MS,
    stage: 0,
  };
}
const safe = (m: MemoryState) =>
  m.cycle === 'idle' &&
  m.selected.length === 0 &&
  m.cards.every((c) => c.phase === 'idle' || c.phase === 'matched');
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
    C.MEMORY_SUPER_BONUS_POINTS *
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
    m.errorStreak++;
    const penalty =
      m.errorStreak > C.MEMORY_FREE_MISMATCHES_PER_STREAK
        ? C.MEMORY_MISMATCH_PENALTY
        : 0;
    s.score = Math.max(0, s.score - penalty);
    a.phase = b.phase = 'mismatch';
    m.cycle = 'mismatch';
    m.transitionAt = s.activeMs + [800, 700, 600][m.stage];
    m.notice = penalty
      ? `Sin pareja: −${penalty} puntos`
      : 'Primer fallo: sin penalización';
    m.noticeUntil = s.activeMs + 1600;
    emit(s, 'mismatch', -penalty, -1, {
      x: m.selected[0] % 4,
      y: Math.floor(m.selected[0] / 4),
    });
    if (m.errorStreak >= C.MEMORY_MAX_ERROR_STREAK) {
      s.ended = 'error_streak';
      emit(s, 'death');
    }
    return;
  }
  m.errorStreak = 0;
  a.phase = b.phase = 'matched';
  m.cycle = 'matched';
  m.transitionAt = s.activeMs + 320;
  m.notice = '¡Pareja encontrada!';
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
  if (m.superProgress >= C.MEMORY_SUPER_BONUS_MATCHES) {
    m.pendingSuper = true;
    if (!s.freezeMs) startSuper(s);
  }
}
function replaceBoard(s: GameState) {
  const m = s.memory!;
  const previous = m.cards.map((c) => c.flavor);
  m.cards = shuffled(
    s,
    memoryPairBag(s, m.stage, true).flatMap((flavor) => [
      card(s, flavor, 'preview'),
      card(s, flavor, 'preview'),
    ]),
  );
  // Avoid an identical consecutive layout without rerolling the point quota.
  if (m.cards.every((c, i) => c.flavor === previous[i]))
    m.cards.push(m.cards.shift()!);
  m.boardIndex++;
  m.selected = [];
  m.cycle = 'preview';
  m.transitionAt = s.activeMs + C.MEMORY_BOARD_PREVIEW_MS;
  m.notice = 'Nuevo tablero: memorizá los sabores';
  m.noticeUntil = m.transitionAt;
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
      m.selected = [];
      if (m.cards.every((c) => c.phase === 'matched')) {
        for (const card of m.cards) card.phase = 'exiting';
        m.cycle = 'exiting';
        m.transitionAt = s.activeMs + 420;
        m.notice = '¡Tablero completo!';
        m.noticeUntil = m.transitionAt;
      } else m.cycle = 'idle';
    } else if (m.cycle === 'exiting') replaceBoard(s);
    else if (m.cycle === 'preview') {
      for (const card of m.cards) card.phase = 'closing';
      m.cycle = 'board-closing';
      m.transitionAt = s.activeMs + C.MEMORY_FLIP_MS;
    } else if (m.cycle === 'board-closing') {
      for (const card of m.cards) card.phase = 'idle';
      m.cycle = 'idle';
    }
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
