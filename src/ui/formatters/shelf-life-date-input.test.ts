import { describe, expect, it } from 'vitest';
import { formatDateInput, formatDateInputWithCaret, formatDateTyping, normalizeDateInput } from './shelf-life-date-input';

describe('formatDateInput', () => {
  it('formats incremental typing as DD.MM.YYYY shape', () => {
    expect(formatDateInput('')).toBe('');
    expect(formatDateInput('3')).toBe('3');
    expect(formatDateInput('31')).toBe('31');
    expect(formatDateInput('311')).toBe('31.1');
    expect(formatDateInput('3112')).toBe('31.12');
    expect(formatDateInput('31122')).toBe('31.12.2');
    expect(formatDateInput('311220')).toBe('31.12.20');
    expect(formatDateInput('3112202')).toBe('31.12.202');
    expect(formatDateInput('31122026')).toBe('31.12.2026');
  });

  it('normalizes separators and strips non-digits', () => {
    expect(formatDateInput('31.12.2026')).toBe('31.12.2026');
    expect(formatDateInput('31/12/2026')).toBe('31.12.2026');
    expect(formatDateInput('31-12-2026')).toBe('31.12.2026');
    expect(formatDateInput('abc31xx12yy2026')).toBe('31.12.2026');
  });

  it('cuts off extra digits after YYYY', () => {
    expect(formatDateInput('31122026123')).toBe('31.12.2026');
  });

  it('does not validate calendar correctness', () => {
    expect(formatDateInput('00002026')).toBe('00.00.2026');
    expect(formatDateInput('32012026')).toBe('32.01.2026');
  });

  it('keeps separated parts stable during middle edits', () => {
    expect(formatDateInput('3.12.2026')).toBe('3.12.2026');
    expect(formatDateInput('31.2.2026')).toBe('31.2.2026');
    expect(formatDateInput('31.12.026')).toBe('31.12.026');
    expect(formatDateInput('31.12.')).toBe('31.12');
  });

  it('falls back to digits regrouping when separated parts overflow', () => {
    expect(formatDateInput('3112.2026')).toBe('31.12.2026');
  });
});

describe('formatDateInputWithCaret', () => {
  it('moves caret naturally when formatting digits-only typing', () => {
    expect(formatDateInputWithCaret('311', 3)).toEqual({
      formatted: '31.1',
      caret: 4
    });
    expect(formatDateInputWithCaret('31122026', 8)).toEqual({
      formatted: '31.12.2026',
      caret: 10
    });
    expect(formatDateInputWithCaret('.311', 0)).toEqual({
      formatted: '31.1',
      caret: 0
    });
  });

  it('preserves caret when value is already formatted', () => {
    expect(formatDateInputWithCaret('31.12.2026', 3)).toEqual({
      formatted: '31.12.2026',
      caret: 3
    });
    expect(formatDateInputWithCaret('31.12.2026', 6)).toEqual({
      formatted: '31.12.2026',
      caret: 6
    });
  });

  it('keeps caret predictable for backspace/delete style edits in the middle', () => {
    expect(formatDateInputWithCaret('3.12.2026', 1)).toEqual({
      formatted: '3.12.2026',
      caret: 1
    });
    expect(formatDateInputWithCaret('31.2.2026', 3)).toEqual({
      formatted: '31.2.2026',
      caret: 3
    });
    expect(formatDateInputWithCaret('31.12.026', 6)).toEqual({
      formatted: '31.12.026',
      caret: 6
    });
  });

  it('normalizes paste input and remaps caret by entered digits', () => {
    expect(formatDateInputWithCaret('31122026', 8)).toEqual({
      formatted: '31.12.2026',
      caret: 10
    });
    expect(formatDateInputWithCaret('31/12/2026', 10)).toEqual({
      formatted: '31.12.2026',
      caret: 10
    });
    expect(formatDateInputWithCaret('abc31xx12yy2026', 15)).toEqual({
      formatted: '31.12.2026',
      caret: 10
    });
  });

  it('keeps caret on middle replacements for month, day and year', () => {
    expect(formatDateInputWithCaret('31.02.2026', 4)).toEqual({
      formatted: '31.02.2026',
      caret: 4
    });
    expect(formatDateInputWithCaret('30.12.2026', 2)).toEqual({
      formatted: '30.12.2026',
      caret: 2
    });
    expect(formatDateInputWithCaret('31.12.2027', 10)).toEqual({
      formatted: '31.12.2027',
      caret: 10
    });
  });

  it('clamps invalid caret inputs safely', () => {
    expect(formatDateInputWithCaret('31.12.2026', Number.NaN)).toEqual({
      formatted: '31.12.2026',
      caret: 10
    });
    expect(formatDateInputWithCaret('31.12.2026', -5)).toEqual({
      formatted: '31.12.2026',
      caret: 0
    });
    expect(formatDateInputWithCaret('31.12.2026', 999)).toEqual({
      formatted: '31.12.2026',
      caret: 10
    });
  });

  it('puts caret at the end when input contains more than 8 digits', () => {
    expect(formatDateInputWithCaret('31122026123', 11)).toEqual({
      formatted: '31.12.2026',
      caret: 10
    });
  });
});

describe('formatDateTyping', () => {
  it('puts dots automatically right after a complete day and month', () => {
    expect(formatDateTyping('')).toBe('');
    expect(formatDateTyping('0')).toBe('0');
    expect(formatDateTyping('01')).toBe('01.');
    expect(formatDateTyping('01.0')).toBe('01.0');
    expect(formatDateTyping('01.09')).toBe('01.09.');
    expect(formatDateTyping('01.09.2')).toBe('01.09.2');
    expect(formatDateTyping('01.09.2026')).toBe('01.09.2026');
  });

  it('is stable when the already formatted value is fed back', () => {
    for (const value of ['01.', '01.0', '01.09.', '01.09.2', '01.09.2026']) {
      expect(formatDateTyping(value)).toBe(value);
    }
  });

  it('pads day and month when the first digit cannot start two-digit values', () => {
    expect(formatDateTyping('4')).toBe('04.');
    expect(formatDateTyping('9')).toBe('09.');
    expect(formatDateTyping('3')).toBe('3');
    expect(formatDateTyping('04.7')).toBe('04.07.');
    expect(formatDateTyping('04.1')).toBe('04.1');
  });

  it('pads a single digit when a separator is typed by hand', () => {
    expect(formatDateTyping('1.')).toBe('01.');
    expect(formatDateTyping('1.9')).toBe('01.09.');
    expect(formatDateTyping('1.9.')).toBe('01.09.');
    expect(formatDateTyping('1/9/26')).toBe('01.09.26');
    expect(formatDateTyping('1,9,2026')).toBe('01.09.2026');
    expect(formatDateTyping('1 9 2026')).toBe('01.09.2026');
  });

  it('formats pasted digits and other pasted shapes', () => {
    expect(formatDateTyping('01092026')).toBe('01.09.2026');
    expect(formatDateTyping('010926')).toBe('01.09.26');
    expect(formatDateTyping('2026-09-01')).toBe('01.09.2026');
    expect(formatDateTyping('2026.9.1')).toBe('01.09.2026');
    expect(formatDateTyping('abc')).toBe('');
  });

  it('limits the year to four digits and ignores extra separators', () => {
    expect(formatDateTyping('01.09.20261')).toBe('01.09.2026');
    expect(formatDateTyping('01.09.2026.')).toBe('01.09.2026');
    expect(formatDateTyping('..01')).toBe('01.');
  });
});

describe('normalizeDateInput', () => {
  it('expands a two-digit year to 20YY and pads day and month', () => {
    expect(normalizeDateInput('01.09.26')).toBe('01.09.2026');
    expect(normalizeDateInput('1.9.26')).toBe('01.09.2026');
    expect(normalizeDateInput('010926')).toBe('01.09.2026');
    expect(normalizeDateInput('1.9.2026')).toBe('01.09.2026');
  });

  it('keeps incomplete input without a trailing dot and complete dates unchanged', () => {
    expect(normalizeDateInput('01.09.')).toBe('01.09');
    expect(normalizeDateInput('01.')).toBe('01');
    expect(normalizeDateInput('')).toBe('');
    expect(normalizeDateInput('01.09.2026')).toBe('01.09.2026');
    expect(normalizeDateInput('01.09.202')).toBe('01.09.202');
  });
});
