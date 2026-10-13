import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';

const styles = postcss.parse(
  readFileSync(new URL('../app/form-motion.css', import.meta.url), 'utf8'),
);
const entries = [
  '.confession-dialog[open]',
  '.lif-contact-dialog[open]',
  '.game-phase-register > .game-view',
];

function ruleFor(selector, parent = styles) {
  return parent.nodes.find(
    (node) => node.type === 'rule' && node.selectors.includes(selector),
  );
}
function declaration(rule, name) {
  return rule.nodes.find((node) => node.type === 'decl' && node.prop === name)
    ?.value;
}

test('All three forms share the same controlled ascent timing without changing layout or validation', () => {
  const shared = styles.nodes.find(
    (node) =>
      node.type === 'rule' &&
      entries.every((selector) => node.selectors.includes(selector)),
  );
  assert.equal(
    declaration(shared, 'animation'),
    'lif-form-rise 700ms cubic-bezier(0.4, 0, 0.2, 1) backwards',
  );
  for (const entry of entries) assert.ok(ruleFor(entry));
  styles.walkDecls((node) =>
    assert.ok(
      ['--form-rise-distance', 'animation', 'opacity', 'transform'].includes(
        node.prop,
      ),
    ),
  );
});

test('Dialogs rise from below the viewport; the embedded game form stays within its existing window', () => {
  for (const entry of entries.slice(0, 2))
    assert.equal(
      declaration(ruleFor(entry), '--form-rise-distance'),
      'calc(50dvh + 50%)',
    );
  assert.equal(
    declaration(ruleFor(entries[2]), '--form-rise-distance'),
    'min(120px, 18dvh)',
  );
  const rise = styles.nodes.find(
    (node) =>
      node.type === 'atrule' &&
      node.name === 'keyframes' &&
      node.params === 'lif-form-rise',
  );
  assert.equal(
    declaration(ruleFor('from', rise), 'transform'),
    'translateY(var(--form-rise-distance))',
  );
  assert.equal(declaration(ruleFor('from', rise), 'opacity'), '0');
  assert.equal(declaration(ruleFor('to', rise), 'transform'), 'translateY(0)');
  assert.equal(declaration(ruleFor('to', rise), 'opacity'), '1');
});

test('Backdrops share the entrance timing and reduced-motion users get a stable form without movement', () => {
  const backdrops = styles.nodes.find(
    (node) =>
      node.type === 'rule' &&
      node.selectors.includes('.lif-contact-dialog[open]::backdrop'),
  );
  assert.equal(
    declaration(backdrops, 'animation'),
    'lif-form-backdrop 700ms cubic-bezier(0.4, 0, 0.2, 1) backwards',
  );
  const reduced = styles.nodes.find(
    (node) =>
      node.type === 'atrule' &&
      node.name === 'media' &&
      node.params === '(prefers-reduced-motion: reduce)',
  );
  for (const entry of [
    ...entries,
    '.lif-contact-dialog[open]::backdrop',
    '.confession-dialog[open]::backdrop',
  ])
    assert.equal(declaration(ruleFor(entry, reduced), 'animation'), 'none');
});
