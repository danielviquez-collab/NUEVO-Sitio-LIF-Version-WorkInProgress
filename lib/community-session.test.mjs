import { test } from 'node:test';
import assert from 'node:assert/strict';
import { communityOrder, COMMUNITY_SESSION_KEY } from './community-session.ts';
import { communityVideos, confessionStories } from './confession-stories.ts';

const videos = communityVideos.map((v) => v.id);
const stories = confessionStories.map((s) => s.slug);
function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
test('catalog has seven attributed videos and four complete stories, without the removed video', () => {
  assert.equal(videos.length, 7); assert.equal(stories.length, 4);
  assert.equal(new Set(videos).size, 7);
  assert.ok(!videos.includes('video-1'));
  for (const video of communityVideos) {
    assert.equal(video.network, 'TikTok'); assert.match(video.creator, /^@[a-z0-9._]+$/i);
  }
});
test('the same session restores all positions across page navigation and viewport changes', () => {
  const session = storage();
  const first = communityOrder(videos, stories, session, () => .25);
  const next = communityOrder(videos, stories, session, () => { throw new Error('Must reuse the saved order'); });
  assert.deepEqual(next, first);
  for (const size of [2, 3, 4, 7]) assert.equal(new Set(first.videos.slice(0, size)).size, size);
  assert.deepEqual(first.videos.slice(0, 2), next.videos.slice(0, 4).slice(0, 2));
});
test('all seven videos can occupy the first position in a fresh session', () => {
  const firstPositions = new Set();
  for (let seed = 1; seed <= 200; seed++) {
    let state = seed;
    const random = () => { state = (1664525 * state + 1013904223) >>> 0; return state / 2 ** 32; };
    const order = communityOrder(videos, stories, storage(), random);
    firstPositions.add(order.videos[0]);
    assert.deepEqual([...order.videos].sort(), [...videos].sort());
    assert.deepEqual([...order.stories].sort(), [...stories].sort());
  }
  assert.equal(firstPositions.size, 7);
});
test('invalid, duplicate, missing and outdated saved ids regenerate a complete catalog', () => {
  for (const value of ['not json', 'null', '{}', JSON.stringify({ videos: ['video-1'], stories }), JSON.stringify({ videos: videos.map(() => videos[0]), stories }), JSON.stringify({ videos, stories: [] })]) {
    const session = storage(); session.setItem(COMMUNITY_SESSION_KEY, value);
    const result = communityOrder(videos, stories, session);
    assert.deepEqual([...result.videos].sort(), [...videos].sort());
    assert.deepEqual([...result.stories].sort(), [...stories].sort());
  }
});
test('unavailable storage never prevents accessing videos or stories', () => {
  const blocked = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); } };
  assert.equal(communityOrder(videos, stories, blocked).videos.length, 7);
  assert.equal(communityOrder(videos, stories).stories.length, 4);
});
