export type IntroFrame = {
  at: number;
  x: number;
  y: number;
  rotation?: number;
  sx?: number;
  sy?: number;
  opacity?: number;
};
export type IntroProposal = {
  id: string;
  name: string;
  source: string;
  raw: string;
  refined: string;
  durationMs: number;
  cues: number[];
  frames: IntroFrame[];
};
const frame = (
  at: number,
  x: number,
  y: number,
  rotation = 0,
  sx = 1,
  sy = 1,
): IntroFrame => ({ at, x, y, rotation, sx, sy });
export const INTRO_PROPOSALS: IntroProposal[] = [
  {
    id: 'actual',
    name: 'Servido suave',
    source: 'Audio actual de LIF',
    raw: '/audio/lif-pour.mp3',
    refined: '/audio/intro-proposals/actual-refined.wav',
    durationMs: 1860,
    cues: [225, 455, 1085, 1295],
    frames: [
      frame(0, 320, -155, -70),
      frame(110, 290, -170, -55),
      frame(225, 235, -135, -30),
      frame(455, 155, 2, 0, 1.12, 0.87),
      frame(600, 115, -75, 28),
      frame(785, 55, -60, 8),
      frame(1010, 7, -12),
      frame(1085, 0, 0, 0, 1.04, 0.96),
      frame(1170, 0, -12),
      frame(1295, 0, 0, 0, 1.015, 0.985),
      frame(1460, 0, 0),
      frame(1860, 0, 0),
    ],
  },
  {
    id: 'drinking',
    name: 'Sorbos',
    source: 'Drinking Liquid Sound',
    raw: '/audio/intro-proposals/drinking-original.mp3',
    refined: '/audio/intro-proposals/drinking-refined.wav',
    durationMs: 2688,
    cues: [625, 1145, 1725, 2355],
    frames: [
      frame(0, -435, 145, -540),
      frame(200, -410, 145, -510),
      frame(535, -290, 145, -340),
      frame(625, -285, 145, -330, 1.15, 0.83),
      frame(735, -240, 5, -245, 0.94, 1.08),
      frame(1000, -180, 92, -180),
      frame(1145, -180, 92, -180, 1.14, 0.85),
      frame(1260, -135, -85, -95, 0.95, 1.07),
      frame(1570, -85, 45, -30),
      frame(1725, -85, 45, -30, 1.12, 0.87),
      frame(1835, -40, -115, 35, 0.96, 1.05),
      frame(2190, -4, 4),
      frame(2355, 0, 0, 0, 1.09, 0.91),
      frame(2445, 0, -16),
      frame(2600, 0, 0),
      frame(2688, 0, 0),
    ],
  },
  {
    id: 'ice4',
    name: 'Hielo fluido',
    source: 'Ice Water Shift Tall Glass 4',
    raw: '/audio/intro-proposals/ice4-original.mp3',
    refined: '/audio/intro-proposals/ice4-refined.wav',
    durationMs: 2612.25,
    cues: [185, 405, 1345, 1545, 1725],
    frames: [
      frame(0, 330, -40, 160),
      frame(70, 315, -42, 155),
      frame(185, 275, -65, 125, 0.95, 1.06),
      frame(405, 200, 35, 90, 1.13, 0.86),
      frame(670, 150, -75, 60),
      frame(1000, 60, -140, 22),
      frame(1260, 5, -22, 0),
      frame(1345, 0, 0, 0, 1.12, 0.86),
      frame(1440, 0, -24, -8),
      frame(1545, 0, 0, 0, 1.06, 0.94),
      frame(1630, 0, -10, 3),
      frame(1725, 0, 0, 0, 1.025, 0.975),
      frame(1950, 0, 0),
      frame(2612.25, 0, 0),
    ],
  },
  {
    id: 'ice2',
    name: 'Cristal',
    source: 'Ice Water Shift Tall Glass 2',
    raw: '/audio/intro-proposals/ice2-original.mp3',
    refined: '/audio/intro-proposals/ice2-refined.wav',
    durationMs: 1645.75,
    cues: [85, 265, 485, 755, 935, 1355],
    frames: [
      frame(0, -315, 15, -145),
      frame(85, -275, 15, -115, 1.05, 0.95),
      frame(160, -240, -68, -85),
      frame(265, -205, 8, -60, 1.1, 0.89),
      frame(370, -165, -90, -25),
      frame(485, -125, 2, 0, 1.13, 0.86),
      frame(620, -70, -100, 20),
      frame(755, -35, 0, 5, 1.07, 0.93),
      frame(845, -10, -30),
      frame(935, 0, 0, 0, 1.06, 0.94),
      frame(1090, 0, -9),
      frame(1230, 0, 0),
      frame(1355, 0, 0, 0, 1.025, 0.975),
      frame(1500, 0, 0),
      frame(1645.75, 0, 0),
    ],
  },
  {
    id: 'ice1',
    name: 'Giro fresco',
    source: 'Ice Water Shift Tall Glass 1',
    raw: '/audio/intro-proposals/ice1-original.mp3',
    refined: '/audio/intro-proposals/ice1-refined.wav',
    durationMs: 2063.6875,
    cues: [225, 455, 655, 845, 1115, 1295, 1535],
    frames: [
      frame(0, 265, 130, 320),
      frame(80, 250, 130, 300),
      frame(225, 215, 88, 255, 1.13, 0.86),
      frame(340, 175, -62, 190),
      frame(455, 140, 35, 140, 1.07, 0.92),
      frame(555, 100, -105, 100),
      frame(655, 70, 10, 55, 1.1, 0.88),
      frame(750, 30, -60, 20),
      frame(845, 0, 0, 0, 1.09, 0.91),
      frame(950, 0, -28, -10),
      frame(1115, 0, 0, 0, 1.05, 0.95),
      frame(1210, 0, -12, 4),
      frame(1295, 0, 0, 0, 1.025, 0.975),
      frame(1440, 0, -4),
      frame(1535, 0, 0),
      frame(1740, 0, 0),
      frame(2063.6875, 0, 0),
    ],
  },
];
const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));
function tangent(
  frames: IntroFrame[],
  index: number,
  key: 'x' | 'y' | 'rotation',
) {
  const value = (i: number) => frames[i][key] ?? 0;
  const slope = (a: number, b: number) =>
    (value(b) - value(a)) / (frames[b].at - frames[a].at);
  if (index === 0) return slope(0, 1);
  if (index === frames.length - 1) return slope(index - 1, index);
  const previous = slope(index - 1, index),
    next = slope(index, index + 1);
  if (previous * next <= 0) return 0;
  const before = frames[index].at - frames[index - 1].at,
    after = frames[index + 1].at - frames[index].at;
  const w1 = 2 * after + before,
    w2 = after + 2 * before;
  return (w1 + w2) / (w1 / previous + w2 / next);
}
export function introPose(proposal: IntroProposal, timeMs: number) {
  const t = clamp(timeMs, 0, proposal.durationMs);
  const end = proposal.frames.findIndex((f) => f.at > t);
  const a =
    proposal.frames[
      end < 0 ? proposal.frames.length - 1 : Math.max(0, end - 1)
    ];
  const b = proposal.frames[end < 0 ? proposal.frames.length - 1 : end];
  const p = a === b ? 1 : clamp((t - a.at) / (b.at - a.at));
  const ease = p * p * (3 - 2 * p);
  const mix = (x: number, y: number) => x + (y - x) * ease;
  // Continuous velocity preserves the authored accents without stopping at every keyframe.
  const travel = (key: 'x' | 'y' | 'rotation') => {
    if (a === b) return a[key] ?? 0;
    const index = Math.max(0, end - 1),
      duration = b.at - a.at;
    return (
      (2 * p ** 3 - 3 * p ** 2 + 1) * (a[key] ?? 0) +
      (p ** 3 - 2 * p ** 2 + p) *
        duration *
        tangent(proposal.frames, index, key) +
      (-2 * p ** 3 + 3 * p ** 2) * (b[key] ?? 0) +
      (p ** 3 - p ** 2) * duration * tangent(proposal.frames, index + 1, key)
    );
  };
  const arrive = clamp(t / 380);
  return {
    x: travel('x'),
    y: travel('y'),
    rotation: travel('rotation'),
    sx: mix(a.sx ?? 1, b.sx ?? 1),
    sy: mix(a.sy ?? 1, b.sy ?? 1),
    opacity: clamp(t / 80),
    leafOpacity: clamp(t / 160),
    leafY: (1 - arrive) * 13,
    letterOpacity: [0, 1, 2].map((i) => clamp((t - 90 - i * 55) / 240)),
    signatureOpacity: clamp((t - proposal.durationMs + 440) / 240),
    cameraScale: 0.975 + 0.025 * clamp(t / proposal.durationMs),
  };
}
export function audibleIntroTime(
  context: {
    currentTime: number;
    baseLatency?: number;
    getOutputTimestamp?: () => {
      contextTime?: number;
      performanceTime?: number;
    };
  },
  startsAt: number,
  durationMs: number,
  offsetMs = 0,
) {
  const timestamp = context.getOutputTimestamp?.();
  const time =
    timestamp?.performanceTime && timestamp.contextTime !== undefined
      ? timestamp.contextTime
      : context.currentTime - (context.baseLatency ?? 0);
  return clamp(offsetMs + (time - startsAt) * 1000, offsetMs, durationMs);
}
