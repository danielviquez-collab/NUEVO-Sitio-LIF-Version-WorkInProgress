export type ShowcaseSize = { width: number; height: number; slideWidth: number; viewportWidth: number; viewportHeight: number };

export function sameShowcaseSize(a: ShowcaseSize, b: ShowcaseSize) {
  return (Object.keys(a) as (keyof ShowcaseSize)[]).every((key) => Math.abs(a[key] - b[key]) < .5);
}

export function needsCarouselRebuild(a: ShowcaseSize, b: ShowcaseSize) {
  return Math.abs(a.width - b.width) >= .5 || Math.abs(a.slideWidth - b.slideWidth) >= .5;
}

export function changedOrientation(a: ShowcaseSize, b: ShowcaseSize) {
  return (a.viewportWidth > a.viewportHeight) !== (b.viewportWidth > b.viewportHeight);
}
