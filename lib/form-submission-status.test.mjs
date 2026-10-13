import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('All three forms announce the pending action and preserve confirmation-only success', () => {
  const status = read('../components/form-submission-status.tsx');
  assert.match(status, /aria-live="polite"/);
  assert.match(status, /hidden=\{!busy\}/);
  assert.match(status, /No cerrés esta ventana hasta recibir la confirmación/);
  assert.match(status, /scrollIntoView/);
  assert.match(status, /document\.addEventListener\('keydown', keepPendingOpen, true\)/);
  assert.match(status, /document\.removeEventListener\('keydown', keepPendingOpen, true\)/);
  for (const [path, message] of [
    ['../components/confession-form.tsx', 'Enviando tu confesión'],
    ['../components/contact-modal.tsx', 'Enviando tu mensaje'],
    ['../components/gaming/game-experience.tsx', 'Registrando tu participación'],
  ]) {
    const source = read(path);
    assert.match(source, /<FormSubmissionStatus\s+busy=\{busy\}/);
    assert.ok(source.includes(`message="${message}`));
    assert.match(source, /aria-busy=\{busy\}/);
    assert.match(source, /disabled=\{busy\}/);
    assert.match(source, /if \((?:sending|registrationSending)\.current\) return/);
  }
  const contact = read('../components/contact-modal.tsx');
  assert.match(contact, /if \(!response\.ok \|\| !result\.saved\) throw/);
  assert.match(contact, /signal: pending\.signal/);
  const modal = read('../components/gaming/game-modal.tsx');
  assert.match(modal, /dialog\.addEventListener\('cancel', preventNativeClose\)/);
  assert.match(modal, /event\.preventDefault\(\)/);
  assert.match(modal, /dialog\.removeEventListener\('cancel', preventNativeClose\)/);
  assert.match(modal, /document\.addEventListener\('keydown', requestKeyboardClose, true\)/);
  assert.match(modal, /document\.removeEventListener\('keydown', requestKeyboardClose, true\)/);
});

test('Pending status preserves the form area, hides its fields and respects reduced motion', () => {
  const css = postcss.parse(read('../app/form-status.css'));
  const overlay = css.nodes.find((node) => node.selector === '.form-with-status > .form-submission-status');
  assert.equal(overlay.nodes.find((node) => node.prop === 'position').value, 'absolute');
  const hidden = css.nodes.find((node) => node.selector === '.form-with-status[aria-busy="true"] > :not(.form-submission-status)');
  assert.equal(hidden.nodes.find((node) => node.prop === 'visibility').value, 'hidden');
  const reduced = css.nodes.find((node) => node.name === 'media' && node.params.includes('prefers-reduced-motion'));
  assert.ok(reduced.nodes.some((node) => node.selector.includes('.form-submission-copy > svg')));
});
