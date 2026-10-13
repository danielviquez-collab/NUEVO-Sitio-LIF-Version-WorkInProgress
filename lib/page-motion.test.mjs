import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';

const css = postcss.parse(readFileSync(new URL('../app/page-motion.css', import.meta.url), 'utf8'));
const value = (rule, prop) => rule.nodes.find((node) => node.type === 'decl' && node.prop === prop)?.value;

test('Page groups rise immediately without hiding content or transforming fixed-dialog ancestors', () => {
  const rules = css.nodes.filter((node) => node.type === 'rule' && node.selector.startsWith('.lif-site main :where('));
  assert.equal(rules.length, 2);
  assert.equal(value(rules[0], 'animation'), 'lif-page-arrive 560ms cubic-bezier(0.22, 0.61, 0.36, 1) backwards');
  assert.equal(value(rules[1], 'animation-duration'), '620ms');
  const frames = css.nodes.find((node) => node.type === 'atrule' && node.name === 'keyframes');
  assert.equal(value(frames.nodes[0], 'translate'), '0 28px');
  assert.equal(value(frames.nodes[0], 'opacity'), '0.18');
  css.walkDecls((node) => {
    assert.notEqual(node.prop, 'animation-delay');
    assert.notEqual(node.prop, 'transform');
  });
});

test('Only a Home menu return suppresses the welcome; reduced motion is respected', () => {
  const home = css.nodes.find((node) => node.type === 'rule' && node.selector.includes('data-home-entry'));
  assert.equal(home.selector, 'html[data-home-entry="content"] .home-entrance .logo-entry-overlay');
  assert.equal(value(home, 'display'), 'none');
  const reduce = css.nodes.find((node) => node.type === 'atrule' && node.name === 'media');
  assert.equal(reduce.params, '(prefers-reduced-motion: reduce)');
  assert.equal(value(reduce.nodes[0], 'animation-name'), 'none');
});
