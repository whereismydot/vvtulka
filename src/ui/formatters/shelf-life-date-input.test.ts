import { describe, expect, it } from 'vitest';
import { formatDateInput, formatDateInputWithCaret } from './shelf-life-date-input';

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
