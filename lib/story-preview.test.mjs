import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitStoryPreview } from './story-preview.ts';
import { confessionStories } from './confession-stories.ts';

test('retains complete paragraphs without adding an ellipsis when everything fits', () => {
  const original = ['Primero pasó esto.', 'Después aquello.'];
  assert.deepEqual(fitStoryPreview(original, () => true), original);
});

test('uses the largest exact word-boundary prefix, not a rewritten summary', () => {
  const original = ['Entró al súper por tres cosas.', 'Ya sabemos cómo terminan estas historias.'];
  const fits = text => text.join('\n').length <= 47;
  const result = fitStoryPreview(original, fits);
  assert.deepEqual(result, ['Entró al súper por tres cosas.', 'Ya sabemos cómo…']);
  assert.equal(fits(result), true);
  assert.equal(fits(['Entró al súper por tres cosas.', 'Ya sabemos cómo terminan…']), false);
});

test('handles empty space and preserves accents, dialogue and paragraph order', () => {
  assert.deepEqual(fitStoryPreview(['Hola mundo.'], () => false), []);
  assert.deepEqual(fitStoryPreview([], () => true), []);
  const story = ['—¡De una! 🔥', 'En ese momento sonaba espectacular.'];
  assert.deepEqual(fitStoryPreview(story, parts => parts.join('\n').length <= 12), ['—¡De una! 🔥']);
});

test('a cut between paragraphs preserves the original punctuation without extra dots', () => {
  assert.deepEqual(fitStoryPreview(['Tres cosas.', 'Fácil en teoría.'], parts => parts.join('\n').length <= 11), ['Tres cosas.']);
});

test('each provided story stays verbatim and responds to smaller and larger space', () => {
  for (const story of confessionStories) {
    for (const length of [100, 200, 350, 500]) {
      const preview = fitStoryPreview(story.paragraphs, parts => parts.join('\n').length <= length);
      assert.ok(preview.join('\n').length <= length);
      assert.ok(story.paragraphs.join('\n').startsWith(preview.join('\n').replace(/…$/, '')));
      assert.ok(preview.length > 0);
    }
  }
});
