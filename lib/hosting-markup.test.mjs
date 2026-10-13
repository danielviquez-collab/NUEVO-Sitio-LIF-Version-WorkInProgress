import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { normalizeNetlifyHead, hostingMarkupBootstrap } from './hosting-markup.ts';

function fixture(comment, text = '\n', type = 3) {
  const previous = { nodeType: type, textContent: text, removed: false, remove() { this.removed = true; } };
  const annotation = { nodeType: 8, textContent: comment, previousSibling: previous };
  return { previous, head: { childNodes: [previous, annotation] } };
}

test('Removes only the whitespace preceding Netlify hosting annotations', () => {
  const { head, previous } = fixture(' This site is hosted on Netlify. Hosting facts');
  normalizeNetlifyHead(head);
  assert.equal(previous.removed, true);
});

test('Preserves unrelated whitespace, nonempty text and HTML elements', () => {
  for (const [comment, text, type] of [
    ['Other annotation', '\n', 3],
    [' This site is hosted on Netlify.', 'Content', 3],
    [' This site is hosted on Netlify.', '', 1],
  ]) {
    const { head, previous } = fixture(comment, text, type);
    normalizeNetlifyHead(head);
    assert.equal(previous.removed, false);
  }
  assert.doesNotThrow(() => normalizeNetlifyHead({ childNodes: [] }));
});

test('The before-hydration bootstrap is self-contained', () => {
  const { head, previous } = fixture('This site is hosted on Netlify.');
  runInNewContext(hostingMarkupBootstrap, { document: { head } });
  assert.equal(previous.removed, true);
});
