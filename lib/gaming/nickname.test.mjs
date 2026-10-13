import test from 'node:test';
import assert from 'node:assert/strict';
import {
  limitNickname,
  nicknameCharacters,
  nicknameValidationMessage,
  normalizeNickname,
} from './nickname.ts';

test('Nickname limits count visible characters, not UTF-16 units', () => {
  for (const nickname of ['AB', 'A'.repeat(12), '🏆'.repeat(12)])
    assert.equal(nicknameValidationMessage(nickname), '');
  for (const nickname of ['', 'A', '🏆', 'A'.repeat(13), '🏆'.repeat(13)])
    assert.notEqual(nicknameValidationMessage(nickname), '');
});

test('Joined emojis, flags, skin tones, keycaps and accented letters count once', () => {
  for (const character of ['👨‍👩‍👧‍👦', '👩🏽‍🚀', '🇨🇷', '1️⃣', '🏝️', 'e\u0301']) {
    assert.equal(nicknameCharacters(character).length, 1);
    assert.equal(nicknameValidationMessage(`A${character}`), '');
    assert.equal(nicknameValidationMessage(character.repeat(12)), '');
    assert.notEqual(nicknameValidationMessage(character.repeat(13)), '');
  }
});

test('Pasting a long nickname never splits an emoji or a combining sequence', () => {
  assert.equal(limitNickname(`ABCDEFGHIJK👩🏽‍🚀Z`), 'ABCDEFGHIJK👩🏽‍🚀');
  assert.equal(limitNickname('👨‍👩‍👧‍👦'.repeat(13)), '👨‍👩‍👧‍👦'.repeat(12));
  assert.equal(
    nicknameCharacters(limitNickname('e\u0301'.repeat(13))).length,
    12,
  );
});

test('Nickname normalization preserves emojis and blocks markup and invisible controls', () => {
  assert.equal(normalizeNickname('  Jose\u0301 🏆  '), 'José 🏆');
  for (const nickname of ['José 🏆', 'A_B .-2', '你好🐍'])
    assert.equal(nicknameValidationMessage(nickname), '');
  for (const nickname of [
    '<b>A</b>',
    'A\nB',
    'A\u202eB',
    'A\u200bB',
    '\u0301\u0301',
  ])
    assert.notEqual(nicknameValidationMessage(nickname), '');
});
