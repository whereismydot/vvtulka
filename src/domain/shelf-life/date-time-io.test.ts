import { describe, expect, it } from 'vitest';
import {
  buildShelfLifeDateTime,
  formatShelfLifeDateTime,
  parseShelfLifeDateInput,
  parseShelfLifeTimeInput
} from './date-time-io';

describe('parseShelfLifeDateInput', () => {
  it('parses DD.MM.YYYY', () => {
    const result = parseShelfLifeDateInput('03.05.2026');
    expect(result).toEqual({
      ok: true,
      value: { day: 3, month: 5, year: 2026 }
    });
  });

  it('handles surrounding spaces', () => {
    const result = parseShelfLifeDateInput('  03.05.2026  ');
    expect(result).toEqual({
      ok: true,
      value: { day: 3, month: 5, year: 2026 }
    });
  });

  it('rejects format without leading zeros', () => {
    expect(parseShelfLifeDateInput('3.5.2026')).toEqual({ ok: false });
  });

  it('rejects DD.MM.YY to avoid century ambiguity', () => {
    const twoDigitYearSamples = ['03.05.00', '03.05.01', '03.05.24', '03.05.26', '03.05.69', '03.05.70', '03.05.99'];
    twoDigitYearSamples.forEach((value) => {
      expect(parseShelfLifeDateInput(value)).toEqual({ ok: false });
    });
  });

  it('rejects invalid dates that JS usually normalizes', () => {
    const invalidValues = ['31.04.2026', '30.02.2026', '29.02.2025', '32.01.2026', '00.01.2026', '01.13.2026', '01.00.2026'];
    invalidValues.forEach((value) => {
      expect(parseShelfLifeDateInput(value)).toEqual({ ok: false });
    });
  });

  it('accepts leap-day date', () => {
    expect(parseShelfLifeDateInput('29.02.2024')).toEqual({
      ok: true,
      value: { day: 29, month: 2, year: 2024 }
    });
  });

  it('handles century leap-year rules', () => {
    expect(parseShelfLifeDateInput('29.02.1900')).toEqual({ ok: false });
    expect(parseShelfLifeDateInput('29.02.2000')).toEqual({
      ok: true,
      value: { day: 29, month: 2, year: 2000 }
    });
  });
});

describe('parseShelfLifeTimeInput', () => {
  it('returns midnight when time is disabled', () => {
    expect(parseShelfLifeTimeInput('23:59', false)).toEqual({
      ok: true,
      value: { hours: 0, minutes: 0 }
    });
  });

  it('rejects empty time when time is enabled', () => {
    expect(parseShelfLifeTimeInput('   ', true)).toEqual({ ok: false });
    expect(parseShelfLifeTimeInput('', true)).toEqual({ ok: false });
  });

  it('rejects null/undefined time when time is enabled', () => {
    expect(parseShelfLifeTimeInput(null, true)).toEqual({ ok: false });
    expect(parseShelfLifeTimeInput(undefined, true)).toEqual({ ok: false });
  });

  it('parses valid time values', () => {
    const validValues: Array<{ input: string; hours: number; minutes: number }> = [
      { input: '00:00', hours: 0, minutes: 0 },
      { input: '00:01', hours: 0, minutes: 1 },
      { input: '12:00', hours: 12, minutes: 0 },
      { input: '14:00', hours: 14, minutes: 0 },
      { input: '23:59', hours: 23, minutes: 59 }
    ];

    validValues.forEach((item) => {
      expect(parseShelfLifeTimeInput(item.input, true)).toEqual({
        ok: true,
        value: { hours: item.hours, minutes: item.minutes }
      });
    });
  });

  it('rejects invalid time values', () => {
    const invalidValues = ['24:00', '23:60', '-01:00', '7:00', 'ab:cd'];
    invalidValues.forEach((value) => {
      expect(parseShelfLifeTimeInput(value, true)).toEqual({ ok: false });
    });
  });
});

describe('formatShelfLifeDateTime', () => {
  it('formats date as DD.MM.YYYY', () => {
    const value = new Date(2026, 4, 6, 14, 0, 0, 0);
    expect(formatShelfLifeDateTime(value, false)).toBe('06.05.2026');
  });

  it('formats datetime as DD.MM.YYYY HH:mm', () => {
    const value = new Date(2026, 0, 2, 4, 7, 0, 0);
    expect(formatShelfLifeDateTime(value, true)).toBe('02.01.2026 04:07');
  });

  it('does not emit ISO format', () => {
    const value = new Date(2026, 0, 2, 4, 7, 0, 0);
    expect(formatShelfLifeDateTime(value, true)).not.toContain('T');
    expect(formatShelfLifeDateTime(value, true)).not.toContain('-');
  });
});

describe('buildShelfLifeDateTime', () => {
  it('builds local datetime with expected components', () => {
    const value = buildShelfLifeDateTime({ year: 2026, month: 5, day: 3 }, { hours: 14, minutes: 0 });
    expect(value.getFullYear()).toBe(2026);
    expect(value.getMonth()).toBe(4);
    expect(value.getDate()).toBe(3);
    expect(value.getHours()).toBe(14);
    expect(value.getMinutes()).toBe(0);
  });
});
