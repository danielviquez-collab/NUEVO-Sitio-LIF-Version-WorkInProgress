import test from 'node:test';
import assert from 'node:assert/strict';
import { logoPose, logoFlightFrames, logoTransform, MENU_LOGO_TIMING } from './menu-logo-motion.ts';

test('an offscreen footer enters from below the screen, not the document bottom', () => {
  const pose = logoPose({ left: 130, top: 9000, width: 125, height: 78 }, 844);
  assert.equal(pose.y, 899);
  assert.equal(pose.x, 192.5);
});

test('a visible footer keeps its real coordinates', () => {
  assert.equal(logoPose({ left: 130, top: 720, width: 125, height: 78 }, 844).y, 759);
});

for (const entering of [true, false]) {
  test(`${entering ? 'entrance' : 'return'} is continuous, ends at the exact destination and preserves a reversed pose`, () => {
    const from = { x: 191, y: 799, width: 113, angle: -8 };
    const to = { x: 232, y: 552, width: 125, angle: 0 };
    const frames = logoFlightFrames(from, to, entering);
    assert.equal(frames[0].transform, logoTransform(from));
    assert.equal(frames.at(-1).transform, logoTransform(to));
    assert.equal(frames.length, 65);
    assert.ok(frames.every((frame) => !frame.transform.includes('NaN')));
    assert.ok(frames.every((frame, index) => index === 0 || frame.offset > frames[index - 1].offset));
  });
}

test('the entrance leads the return in duration for a measured arrival and responsive dismissal', () => {
  assert.equal(MENU_LOGO_TIMING.enter, 1040);
  assert.equal(MENU_LOGO_TIMING.return, 780);
});
