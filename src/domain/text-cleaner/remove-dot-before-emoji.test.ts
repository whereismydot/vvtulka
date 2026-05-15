import { describe, expect, it } from 'vitest';
import { removeDotBeforeEmoji } from './remove-dot-before-emoji';

describe('removeDotBeforeEmoji', () => {
  it('removes dot before emoji with one space', () => {
    expect(removeDotBeforeEmoji('Спасибо. 🙏🏻')).toBe('Спасибо 🙏🏻');
  });

  it('removes dot before emoji without spaces', () => {
    expect(removeDotBeforeEmoji('Спасибо.😊')).toBe('Спасибо😊');
  });

  it('keeps all spaces between dot and emoji', () => {
    expect(removeDotBeforeEmoji('Спасибо.   😊')).toBe('Спасибо   😊');
  });

  it('works with heart emoji', () => {
    expect(removeDotBeforeEmoji('Спасибо. ❤️')).toBe('Спасибо ❤️');
  });

  it('works with variation selector emoji', () => {
    expect(removeDotBeforeEmoji('Спасибо. ☺️')).toBe('Спасибо ☺️');
  });

  it('works with zwj sequences', () => {
    expect(removeDotBeforeEmoji('Спасибо. 👨‍👩‍👧‍👦')).toBe('Спасибо 👨‍👩‍👧‍👦');
  });

  it('works with skin tone modifiers', () => {
    expect(removeDotBeforeEmoji('Спасибо. 👍🏽')).toBe('Спасибо 👍🏽');
  });

  it('works with multiple emoji in a row', () => {
    expect(removeDotBeforeEmoji('Спасибо. 🙏🏻🙏🏻')).toBe('Спасибо 🙏🏻🙏🏻');
  });

  it('removes in non-final positions as well', () => {
    expect(removeDotBeforeEmoji('Спасибо. 😊 Хорошего дня.')).toBe('Спасибо 😊 Хорошего дня.');
  });

  it('keeps plain sentence ending dots', () => {
    expect(removeDotBeforeEmoji('Спасибо.')).toBe('Спасибо.');
  });

  it('does not touch ellipsis', () => {
    expect(removeDotBeforeEmoji('Спасибо... 😊')).toBe('Спасибо... 😊');
  });

  it('does not touch exclamation before emoji', () => {
    expect(removeDotBeforeEmoji('Спасибо! 😊')).toBe('Спасибо! 😊');
  });

  it('does not touch question mark before emoji', () => {
    expect(removeDotBeforeEmoji('Спасибо? 😊')).toBe('Спасибо? 😊');
  });

  it('does not touch text without emoji after dot', () => {
    expect(removeDotBeforeEmoji('Это первое предложение. Это второе предложение.')).toBe(
      'Это первое предложение. Это второе предложение.'
    );
  });

  it('returns empty string unchanged', () => {
    expect(removeDotBeforeEmoji('')).toBe('');
  });
});
