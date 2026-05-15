import { describe, expect, it } from 'vitest';
import { countCharacters } from './character-counter';

describe('countCharacters', () => {
  it('returns zero for empty text', () => {
    expect(countCharacters('', { excludeWhitespace: true })).toBe(0);
  });

  it('counts ascii symbols', () => {
    expect(countCharacters('abc', { excludeWhitespace: true })).toBe(3);
  });

  it('can exclude spaces', () => {
    expect(countCharacters('a b c', { excludeWhitespace: true })).toBe(3);
  });

  it('can include spaces', () => {
    expect(countCharacters('a b c', { excludeWhitespace: false })).toBe(5);
  });

  it('counts cyrillic text without spaces', () => {
    expect(countCharacters('Привет мир', { excludeWhitespace: true })).toBe(9);
  });

  it('counts cyrillic text with spaces', () => {
    expect(countCharacters('Привет мир', { excludeWhitespace: false })).toBe(10);
  });

  it('excludes newline when whitespace mode is enabled', () => {
    expect(countCharacters('Привет\nмир', { excludeWhitespace: true })).toBe(9);
  });

  it('counts newline as a character when whitespace is included', () => {
    expect(countCharacters('Привет\nмир', { excludeWhitespace: false })).toBe(10);
  });

  it('excludes tabs and non-breaking spaces in whitespace mode', () => {
    expect(countCharacters('a\tb\u00A0c', { excludeWhitespace: true })).toBe(3);
  });

  it('keeps multiple spaces when whitespace is included', () => {
    expect(countCharacters('a   b', { excludeWhitespace: false })).toBe(5);
  });

  it('treats emoji sequences as user-visible symbols', () => {
    expect(countCharacters('A🙏🏻B', { excludeWhitespace: false })).toBe(3);
    expect(countCharacters('👨‍👩‍👧‍👦', { excludeWhitespace: false })).toBe(1);
  });
});
