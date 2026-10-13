import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VisibleMediaCoordinator } from './visible-media.ts';

test('the most visible video pauses the previous video before starting', () => {
  const coordinator = new VisibleMediaCoordinator();
  const events = [];
  const hero = coordinator.register(active => events.push(['hero', active]));
  const reel = coordinator.register(active => events.push(['reel', active]));
  hero.update(.8, true);
  reel.update(.2, true);
  hero.update(.35, true);
  reel.update(.9, true);
  assert.deepEqual(events, [['hero', true], ['hero', false], ['reel', true]]);
  reel.update(0, true);
  assert.deepEqual(events.slice(-2), [['reel', false], ['hero', true]]);
});

test('near-equal visibility does not oscillate; leaving the viewport stops playback', () => {
  const coordinator = new VisibleMediaCoordinator();
  const events = [];
  const first = coordinator.register(active => events.push(['first', active]));
  const second = coordinator.register(active => events.push(['second', active]));
  first.update(.6, true);
  second.update(.64, true);
  assert.deepEqual(events, [['first', true]]);
  first.update(0, true);
  second.update(0, true);
  assert.deepEqual(events.at(-1), ['second', false]);
});

test('reduced motion/manual pause prevent autoplay but allow explicit visible play', () => {
  const coordinator = new VisibleMediaCoordinator();
  const events = [];
  const item = coordinator.register(active => events.push(active));
  item.update(1, false);
  assert.deepEqual(events, []);
  item.select();
  assert.deepEqual(events, [true]);
  item.update(.8, false);
  assert.deepEqual(events, [true]);
  item.update(0, false);
  item.select();
  assert.deepEqual(events, [true, false]);
});

test('an overlay cancels manual playback without losing reduced-motion protection', () => {
  const coordinator = new VisibleMediaCoordinator();
  const events = [];
  const item = coordinator.register(active => events.push(active));
  item.update(1, false);
  item.select();
  item.update(1, false, false);
  item.select();
  item.update(1, false, true);
  assert.deepEqual(events, [true, false]);
  item.select();
  assert.deepEqual(events, [true, false, true]);
});

test('overlay block stops both candidates and cleanup releases the next candidate', () => {
  const coordinator = new VisibleMediaCoordinator();
  const events = [];
  const a = coordinator.register(active => events.push(['a', active]));
  const b = coordinator.register(active => events.push(['b', active]));
  a.update(1, true); b.update(.5, true);
  a.update(1, false); b.update(.5, false);
  assert.deepEqual(events.at(-1), ['b', false]);
  a.update(1, true); b.update(.5, true);
  a.dispose(); a.dispose();
  assert.deepEqual(events.at(-1), ['b', true]);
  b.dispose();
  assert.deepEqual(events.at(-1), ['b', false]);
});

test('hover/click-only media never autoplay and explicit selection takes priority over the reel', () => {
  const coordinator = new VisibleMediaCoordinator();
  const events = [];
  const reel = coordinator.register(active => events.push(['reel', active]));
  const community = coordinator.register(active => events.push(['community', active]));
  reel.update(1, true);
  community.update(.4, false);
  assert.deepEqual(events, [['reel', true]]);
  community.select();
  reel.update(1, true);
  assert.deepEqual(events.slice(-2), [['reel', false], ['community', true]]);
  community.update(0, false);
  assert.deepEqual(events.slice(-2), [['community', false], ['reel', true]]);
});

test('switching between community videos does not restart the previous manual selection', () => {
  const coordinator = new VisibleMediaCoordinator();
  const events = [];
  const first = coordinator.register(active => events.push(['first', active]));
  const second = coordinator.register(active => events.push(['second', active]));
  first.update(1, false); second.update(1, false);
  first.select(); second.select();
  second.update(0, false);
  assert.deepEqual(events, [['first', true], ['first', false], ['second', true], ['second', false]]);
});
