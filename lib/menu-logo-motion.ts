export type LogoPose = { x: number; y: number; width: number; angle: number };
export type LogoBounds = { left: number; top: number; width: number; height: number };

export const LOGO_BASE_WIDTH = 125;
export const LOGO_BASE_HEIGHT = LOGO_BASE_WIDTH * 600 / 956;
export const MENU_LOGO_TIMING = { enter: 1040, return: 780 } as const;

export function logoPose(bounds: LogoBounds, viewportHeight?: number): LogoPose {
  const centerY = bounds.top + bounds.height / 2;
  return {
    x: bounds.left + bounds.width / 2,
    // Keep an offscreen footer offscreen, without travelling the entire document.
    y: viewportHeight !== undefined && bounds.top >= viewportHeight
      ? viewportHeight + bounds.height / 2 + 16
      : centerY,
    width: bounds.width,
    angle: 0,
  };
}

export function logoTransform(pose: LogoPose): string {
  return `translate3d(${pose.x - LOGO_BASE_WIDTH / 2}px, ${pose.y - LOGO_BASE_HEIGHT / 2}px, 0) rotate(${pose.angle}deg) scale(${pose.width / LOGO_BASE_WIDTH})`;
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const blend = (a: LogoPose, b: LogoPose, t: number): LogoPose => ({
  x: mix(a.x, b.x, t), y: mix(a.y, b.y, t),
  width: mix(a.width, b.width, t), angle: mix(a.angle, b.angle, t),
});
const cubic = (a: number, b: number, c: number, d: number, t: number) =>
  (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d;

export function logoFlightFrames(from: LogoPose, to: LogoPose, entering: boolean) {
  const anticipation = {
    ...from, y: from.y + (entering ? 10 : -7),
    width: from.width * .975, angle: from.angle + (entering ? -5 : 4),
  };
  const arrival = { ...to, y: to.y + (entering ? -5 : 3), width: to.width * 1.025, angle: entering ? 1.5 : -1 };
  return Array.from({ length: 65 }, (_, index) => {
    const t = index / 64;
    let pose: LogoPose;
    if (t <= .13) {
      pose = blend(from, anticipation, smooth(t / .13));
    } else if (t < .84) {
      const travel = smooth((t - .13) / .71);
      pose = blend(anticipation, arrival, travel);
      const bend = Math.min(42, Math.abs(from.y - to.y) * .12);
      pose.x = cubic(anticipation.x, anticipation.x - bend, arrival.x + bend * .3, arrival.x, travel);
      pose.y = cubic(anticipation.y, mix(anticipation.y, arrival.y, .16), mix(anticipation.y, arrival.y, .86), arrival.y, travel);
      pose.angle += Math.sin(travel * Math.PI) * (entering ? -7 : 5);
    } else {
      pose = blend(arrival, to, smooth((t - .84) / .16));
    }
    return { offset: t, transform: logoTransform(pose) };
  });
}
