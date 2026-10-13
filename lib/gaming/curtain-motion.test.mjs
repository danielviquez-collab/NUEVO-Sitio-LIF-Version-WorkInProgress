import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  curtainContentOffset,
  curtainDropProgress,
  curtainLogoOffset,
  curtainLogoOpacity,
  curtainLogoShine,
  curtainLogoWidth,
  curtainOpenProgress,
  curtainPanelWidth,
  curtainSpotlightsAt,
  CURTAIN_HOLD_MS,
  CURTAIN_LOGO_REVEAL_MS,
  CURTAIN_LOGO_START_MS,
  CURTAIN_LOGO_FADE_START_MS,
  CURTAIN_LOGO_FADE_END_MS,
  CURTAIN_CONTENT_REVEAL_MS,
  CURTAIN_CONTENT_READY_MS,
  CURTAIN_FABRIC_OPEN_END_MS,
  CURTAIN_LOGO_SHINE_START_MS,
  CURTAIN_LOGO_SHINE_DURATION_MS,
} from './curtain-motion.ts';
import { GAME_CONFIG as C } from './config.ts';

test('Closed curtain holds for 1.5 seconds with three lights moving before opening', () => {
  assert.equal(CURTAIN_HOLD_MS, 1500);
  for (let elapsed = 0; elapsed <= CURTAIN_HOLD_MS; elapsed += 25) {
    assert.equal(curtainOpenProgress(elapsed), 0);
    assert.equal(curtainLogoOpacity(elapsed), 0);
    assert.ok(curtainContentOffset(elapsed, 720) < -720);
    for (const y of [0, 0.25, 0.56, 0.75, 1])
      assert.equal(curtainPanelWidth(y, curtainOpenProgress(elapsed)), 1);
  }
  const initial = curtainSpotlightsAt(0, 1280, 720);
  const moving = curtainSpotlightsAt(750, 1280, 720);
  assert.equal(initial.length, 3);
  for (let i = 0; i < 3; i++) assert.notDeepEqual(initial[i], moving[i]);
});
test('Original opening length stays intact and the logo rises while the fabric opens', () => {
  assert.ok(
    Math.abs(CURTAIN_FABRIC_OPEN_END_MS - CURTAIN_HOLD_MS - 66496 / 48) < 0.001,
  );
  const middle =
    CURTAIN_HOLD_MS + (CURTAIN_FABRIC_OPEN_END_MS - CURTAIN_HOLD_MS) / 2;
  const progress = curtainOpenProgress(middle);
  assert.ok(progress > 0 && progress < 1);
  assert.ok(curtainPanelWidth(0, progress) < curtainPanelWidth(0.56, progress));
  assert.ok(curtainPanelWidth(0.56, progress) < curtainPanelWidth(1, progress));
  assert.ok(curtainLogoOpacity(middle) > 0.3);
  assert.ok(curtainLogoOffset(middle, 720) < 720 * 0.52);
  assert.equal(curtainOpenProgress(CURTAIN_FABRIC_OPEN_END_MS), 1);
  assert.ok(curtainLogoOpacity(CURTAIN_FABRIC_OPEN_END_MS) > 0.99);
});
test('Exactly three moving lights stay within the cloth bounds for the entire sequence', () => {
  for (let elapsed = 0; elapsed <= C.CURTAIN_OPEN_DURATION_MS; elapsed += 10)
    for (const light of curtainSpotlightsAt(elapsed, 1280, 720)) {
      assert.ok(light.x > 0 && light.x < 1280);
      assert.ok(light.y > 0 && light.y < 720);
    }
});
test('Logo rises without reversals and levitates gently before the incoming screen', () => {
  assert.equal(CURTAIN_LOGO_REVEAL_MS - CURTAIN_LOGO_START_MS, 1350);
  assert.equal(curtainLogoOpacity(CURTAIN_LOGO_START_MS), 0);
  let previous = curtainLogoOffset(0, 720);
  for (let elapsed = 0; elapsed <= CURTAIN_LOGO_REVEAL_MS; elapsed += 5) {
    const offset = curtainLogoOffset(elapsed, 720);
    assert.ok(offset <= previous);
    previous = offset;
  }
  assert.equal(curtainLogoOffset(CURTAIN_LOGO_REVEAL_MS, 720), 0);
  for (const height of [390, 720, 844])
    for (
      let elapsed = CURTAIN_LOGO_REVEAL_MS;
      elapsed <= CURTAIN_LOGO_FADE_START_MS;
      elapsed += 5
    ) {
      assert.ok(Math.abs(curtainLogoOffset(elapsed, height)) <= 4.001);
      assert.equal(curtainLogoOpacity(elapsed), 1);
    }
});
test('The lighter ascent reduces peak travel speed while keeping the same opening duration', () => {
  const height = 844;
  let peak = 0;
  for (
    let elapsed = CURTAIN_LOGO_START_MS;
    elapsed < CURTAIN_LOGO_REVEAL_MS;
    elapsed += 5
  ) {
    const speed =
      (curtainLogoOffset(elapsed, height) -
        curtainLogoOffset(elapsed + 5, height)) /
      5;
    peak = Math.max(peak, speed);
  }
  const previousPeak = (height * 0.52 * 1.875) / 1250;
  assert.ok(peak < previousPeak * 0.8);
  assert.equal(CURTAIN_LOGO_REVEAL_MS, 2870);
  assert.equal(C.CURTAIN_OPEN_DURATION_MS, 5470);
});
test('Selection enters from above with controlled acceleration and a soft landing', () => {
  assert.ok(CURTAIN_CONTENT_REVEAL_MS > CURTAIN_FABRIC_OPEN_END_MS);
  assert.ok(CURTAIN_CONTENT_REVEAL_MS > CURTAIN_LOGO_REVEAL_MS);
  const duration = CURTAIN_CONTENT_READY_MS - CURTAIN_CONTENT_REVEAL_MS;
  assert.equal(duration, 780);
  for (const height of [390, 720, 844]) {
    assert.equal(
      curtainContentOffset(CURTAIN_CONTENT_REVEAL_MS, height),
      -1.04 * height,
    );
    const halfway = curtainContentOffset(
      CURTAIN_CONTENT_REVEAL_MS + duration / 2,
      height,
    );
    assert.ok(Math.abs(halfway + height * 1.04 * 0.5) < 0.001);
    assert.ok(
      Math.abs(curtainContentOffset(CURTAIN_CONTENT_READY_MS, height)) < 0.001,
    );
  }
  assert.equal(curtainDropProgress(CURTAIN_CONTENT_REVEAL_MS), 0);
  assert.equal(curtainDropProgress(CURTAIN_CONTENT_READY_MS), 1);
});
test('Selection travels in one direction, brakes gently and settles without impact or rebounds', () => {
  for (const height of [390, 720, 844]) {
    let previous = curtainContentOffset(CURTAIN_CONTENT_REVEAL_MS, height);
    for (
      let elapsed = CURTAIN_CONTENT_REVEAL_MS;
      elapsed <= C.CURTAIN_OPEN_DURATION_MS;
      elapsed += 5
    ) {
      const offset = curtainContentOffset(elapsed, height);
      assert.ok(offset >= previous && offset <= 0);
      assert.ok(offset - previous < height * 0.014);
      previous = offset;
    }
    for (const boundary of [
      CURTAIN_CONTENT_REVEAL_MS,
      CURTAIN_CONTENT_READY_MS,
    ]) {
      const before = curtainContentOffset(boundary - 0.001, height);
      const after = curtainContentOffset(boundary + 0.001, height);
      assert.ok(Math.abs(before - after) < 0.02);
    }
    assert.ok(
      Math.abs(curtainContentOffset(CURTAIN_CONTENT_READY_MS - 10, height)) <
        0.03,
    );
    assert.equal(curtainContentOffset(CURTAIN_CONTENT_READY_MS, height), 0);
  }
});
test('Logo retires with a small ascent and a 500 ms fade, never pushed downward', () => {
  assert.equal(CURTAIN_LOGO_FADE_END_MS - CURTAIN_LOGO_FADE_START_MS, 500);
  for (const height of [390, 720, 844]) {
    let previous = curtainLogoOffset(CURTAIN_LOGO_FADE_START_MS, height);
    let opacity = 1;
    for (
      let elapsed = CURTAIN_LOGO_FADE_START_MS;
      elapsed <= CURTAIN_LOGO_FADE_END_MS;
      elapsed += 5
    ) {
      const next = curtainLogoOffset(elapsed, height);
      const nextOpacity = curtainLogoOpacity(elapsed);
      assert.ok(next <= previous + 0.001);
      assert.ok(next >= -22);
      assert.ok(nextOpacity <= opacity);
      previous = next;
      opacity = nextOpacity;
    }
    assert.equal(
      curtainLogoOffset(CURTAIN_LOGO_FADE_END_MS, height),
      -Math.min(22, height * 0.025),
    );
  }
  assert.equal(curtainLogoOpacity(CURTAIN_LOGO_FADE_END_MS), 0);
});
test('Incoming selection never touches or obscures the visible brand logo', () => {
  for (const [width, height] of [
    [1280, 720],
    [390, 844],
    [1440, 500],
    [844, 390],
  ]) {
    const logoHeight = (curtainLogoWidth(width, height) * 600) / 956;
    for (
      let elapsed = CURTAIN_CONTENT_REVEAL_MS;
      elapsed <= CURTAIN_LOGO_FADE_END_MS;
      elapsed += 5
    ) {
      const incomingBottom = height + curtainContentOffset(elapsed, height);
      const logoTop =
        height / 2 - logoHeight / 2 + curtainLogoOffset(elapsed, height);
      if (curtainLogoOpacity(elapsed) > 0.001)
        assert.ok(incomingBottom + 24 < logoTop);
    }
  }
});
test('Fall and logo motion stay continuous, with no opacity flash before the fall', () => {
  let previous = curtainContentOffset(0, 720);
  let logo = curtainLogoOffset(0, 720);
  let opacity = 0;
  for (let elapsed = 0; elapsed <= C.CURTAIN_OPEN_DURATION_MS; elapsed += 5) {
    const next = curtainContentOffset(elapsed, 720);
    const nextLogo = curtainLogoOffset(elapsed, 720);
    const nextOpacity = curtainLogoOpacity(elapsed);
    assert.ok(Math.abs(next - previous) < 20);
    assert.ok(Math.abs(nextLogo - logo) < 4);
    assert.ok(Math.abs(nextOpacity - opacity) < 0.04);
    if (elapsed < CURTAIN_CONTENT_REVEAL_MS) assert.ok(next <= -720);
    previous = next;
    logo = nextLogo;
    opacity = nextOpacity;
  }
});
test('Selection is at rest for 120 ms before removing the transition layer', () => {
  assert.equal(C.CURTAIN_OPEN_DURATION_MS, 5470);
  assert.equal(C.CURTAIN_OPEN_DURATION_MS - CURTAIN_CONTENT_READY_MS, 120);
  for (
    let elapsed = CURTAIN_CONTENT_READY_MS;
    elapsed <= C.CURTAIN_OPEN_DURATION_MS;
    elapsed += 5
  ) {
    assert.equal(curtainLogoOpacity(elapsed), 0);
    assert.equal(curtainContentOffset(elapsed, 720), 0);
    assert.equal(curtainOpenProgress(elapsed), 1);
  }
});
test('Fabric edges remain continuous, bounded and never reverse', () => {
  let previous = 0;
  const widths = Array(21).fill(1);
  for (
    let elapsed = 0;
    elapsed <= C.CURTAIN_OPEN_DURATION_MS + 40;
    elapsed += 5
  ) {
    const progress = curtainOpenProgress(elapsed);
    assert.ok(progress >= previous && progress <= 1);
    assert.ok(progress - previous < 0.025);
    for (let band = 0; band < widths.length; band++) {
      const width = curtainPanelWidth(band / (widths.length - 1), progress);
      assert.ok(width >= 0 && width <= widths[band]);
      widths[band] = width;
    }
    previous = progress;
  }
});
test('Official logo keeps its native ratio, with a larger mobile presentation and unchanged desktop scale', () => {
  const progress = curtainOpenProgress(CURTAIN_LOGO_REVEAL_MS);
  for (const [width, height] of [
    [1280, 720],
    [390, 844],
    [1440, 500],
    [844, 390],
  ]) {
    const logoWidth = curtainLogoWidth(width, height);
    const logoHeight = (logoWidth * 600) / 956;
    const top = (height - logoHeight) / 2 / height;
    for (const y of [top, 0.5, 1 - top]) {
      const opening = width * (1 - curtainPanelWidth(y, progress));
      assert.ok(opening > logoWidth);
    }
    assert.equal(
      logoWidth,
      Math.min(width * (width <= 700 ? 0.48 : 0.2), height * 0.35) * 1.2,
    );
  }
  for (const [width, height] of [
    [320, 568],
    [360, 640],
    [390, 844],
  ]) {
    assert.ok(curtainLogoWidth(width, height) >= width * 0.55);
    assert.ok(curtainLogoWidth(width, height) < width * 0.6);
  }
});
test('Logo appears on plain white without a beam; the three cloth lights remain intact', () => {
  const component = readFileSync(
    new URL('../../components/gaming/curtain.tsx', import.meta.url),
    'utf8',
  );
  const css = readFileSync(
    new URL('../../app/gaming.css', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(
    component,
    /lif-game-curtain-light|curtainLogoLightOpacity/,
  );
  assert.doesNotMatch(css, /\.lif-game-curtain-light\s*\{/);
  assert.match(css, /\.lif-game-curtain-stage\s*\{\s*background:\s*white;/);
  assert.match(component, /for \(const light of curtainSpotlightsAt\(/);
});

test('A single left-to-right shine starts only after the ascent and open fabric, without changing their timing', () => {
  assert.equal(CURTAIN_LOGO_START_MS, 1520);
  assert.equal(CURTAIN_LOGO_REVEAL_MS, 2870);
  assert.equal(CURTAIN_LOGO_SHINE_START_MS, 2890);
  assert.ok(CURTAIN_LOGO_SHINE_START_MS > CURTAIN_FABRIC_OPEN_END_MS);
  assert.equal(
    CURTAIN_LOGO_FADE_START_MS - CURTAIN_LOGO_SHINE_START_MS,
    CURTAIN_LOGO_SHINE_DURATION_MS + 80,
  );
  const duration = (52157 / 44100) * 1000;
  assert.deepEqual(curtainLogoShine(-100, duration), {
    offset: -75,
    opacity: 0,
  });
  assert.deepEqual(curtainLogoShine(0, duration), { offset: -75, opacity: 0 });
  assert.deepEqual(curtainLogoShine(duration, duration), {
    offset: 75,
    opacity: 0,
  });
  assert.deepEqual(curtainLogoShine(duration * 2, duration), {
    offset: 75,
    opacity: 0,
  });
  assert.equal(curtainLogoShine(duration / 2, duration).offset, 0);
  assert.equal(curtainLogoShine(duration / 2, duration).opacity, 1);
  let previous = -75;
  for (let time = 0; time <= duration; time += 5) {
    const state = curtainLogoShine(time, duration);
    assert.ok(state.offset >= previous && state.offset <= 75);
    assert.ok(state.opacity >= 0 && state.opacity <= 1);
    assert.equal(curtainLogoOpacity(CURTAIN_LOGO_SHINE_START_MS + time), 1);
    previous = state.offset;
  }
});

test('Shine is clipped to the official logo, uses its audio clock and cancels on cleanup', () => {
  const component = readFileSync(
    new URL('../../components/gaming/curtain.tsx', import.meta.url),
    'utf8',
  );
  const css = readFileSync(
    new URL('../../app/gaming.css', import.meta.url),
    'utf8',
  );
  assert.match(component, /shinePlayback\?\.elapsedMs\(\)/);
  assert.match(component, /shinePlayback\?\.durationMs/);
  assert.match(component, /shinePlayback\?\.stop\(\)/);
  assert.match(
    css,
    /mask: url\('\/brand\/lif-official\.svg'\) center \/ contain no-repeat/,
  );
  assert.match(css, /aspect-ratio: 956 \/ 600/);
  assert.doesNotMatch(component, /setTimeout|setInterval/);
});
