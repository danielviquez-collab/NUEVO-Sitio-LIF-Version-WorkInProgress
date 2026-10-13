import emojiRegex from 'emoji-regex';

export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 12;

const segmenter = new Intl.Segmenter('es-CR', { granularity: 'grapheme' });
const emoji = new RegExp(`^(?:${emojiRegex().source})$`);
const text = /^(?:[\p{L}\p{N}][\p{L}\p{N}\p{M}]*|[_ .-])$/u;

export function normalizeNickname(value: string) {
  return value.trim().normalize('NFC');
}

export function nicknameCharacters(value: string) {
  return Array.from(segmenter.segment(value), ({ segment }) => segment);
}

export function limitNickname(value: string) {
  return nicknameCharacters(value).slice(0, NICKNAME_MAX_LENGTH).join('');
}

export function nicknameValidationMessage(value: string) {
  const characters = nicknameCharacters(normalizeNickname(value));
  if (
    characters.length < NICKNAME_MIN_LENGTH ||
    characters.length > NICKNAME_MAX_LENGTH
  )
    return 'El nickname debe tener entre 2 y 12 caracteres, incluyendo emojis.';
  if (
    !characters.every(
      (character) => text.test(character) || emoji.test(character),
    )
  )
    return 'Usá letras, números, espacios, guiones, puntos o emojis en tu nickname.';
  return '';
}
