import { describe, expect, it } from 'vitest';
import { calculateShelfLife } from './shelf-life-service';

describe('calculateShelfLife', () => {
  it('calculates validUntil for days without time', () => {
    const result = calculateShelfLife({
      manufactureDateRaw: '03.05.2026',
      shelfLifeTermRaw: '3',
      shelfLifeUnitRaw: 'days',
      includeTime: false,
      manufactureTimeRaw: ''
    });

    expect(result).toMatchObject({
      ok: true,
      formattedValidUntil: '06.05.2026'
    });
  });

  it('calculates validUntil when includeTime is false and time is undefined', () => {
    const result = calculateShelfLife({
      manufactureDateRaw: '03.05.2026',
      shelfLifeTermRaw: '3',
      shelfLifeUnitRaw: 'days',
      includeTime: false,
      manufactureTimeRaw: undefined
    });

    expect(result).toMatchObject({
      ok: true,
      formattedValidUntil: '06.05.2026'
    });
  });

  it('calculates validUntil for days with time', () => {
    const result = calculateShelfLife({
      manufactureDateRaw: '03.05.2026',
      shelfLifeTermRaw: '3',
      shelfLifeUnitRaw: 'days',
      includeTime: true,
      manufactureTimeRaw: '14:00'
    });

    expect(result).toMatchObject({
      ok: true,
      formattedValidUntil: '06.05.2026 14:00'
    });
  });

  it('returns time error when includeTime is true and time is empty', () => {
    const result = calculateShelfLife({
      manufactureDateRaw: '03.05.2026',
      shelfLifeTermRaw: '3',
      shelfLifeUnitRaw: 'days',
      includeTime: true,
      manufactureTimeRaw: '   '
    });

    expect(result).toEqual({
      ok: false,
      invalidFields: ['time'],
      message: 'Invalid manufacture time.'
    });
  });

  it('returns time error when includeTime is true and time is null/undefined', () => {
    const nullCase = calculateShelfLife({
      manufactureDateRaw: '03.05.2026',
      shelfLifeTermRaw: '3',
      shelfLifeUnitRaw: 'days',
      includeTime: true,
      manufactureTimeRaw: null
    });
    const undefinedCase = calculateShelfLife({
      manufactureDateRaw: '03.05.2026',
      shelfLifeTermRaw: '3',
      shelfLifeUnitRaw: 'days',
      includeTime: true,
      manufactureTimeRaw: undefined
    });

    expect(nullCase).toEqual({
      ok: false,
      invalidFields: ['time'],
      message: 'Invalid manufacture time.'
    });
    expect(undefinedCase).toEqual({
      ok: false,
      invalidFields: ['time'],
      message: 'Invalid manufacture time.'
    });
  });

  it('returns date error for invalid date', () => {
    const invalidDates = [
      '',
      '31.04.2026',
      '30.02.2026',
      '29.02.2025',
      '00.01.2026',
      '32.01.2026',
      '01.00.2026',
      '01.13.2026',
      '03.05.00',
      '03.05.01',
      '03.05.24',
      '03.05.26',
      '03.05.69',
      '03.05.70',
      '03.05.99'
    ];
    invalidDates.forEach((manufactureDateRaw) => {
      const result = calculateShelfLife({
        manufactureDateRaw,
        shelfLifeTermRaw: '3',
        shelfLifeUnitRaw: 'days',
        includeTime: false,
        manufactureTimeRaw: ''
      });

      expect(result).toEqual({
        ok: false,
        invalidFields: ['date'],
        message: 'Invalid manufacture date.'
      });
    });
  });

  it('returns time error for invalid time', () => {
    const invalidTimes = ['24:00', '23:60', '-01:00', 'ab:cd'];
    invalidTimes.forEach((manufactureTimeRaw) => {
      const result = calculateShelfLife({
        manufactureDateRaw: '03.05.2026',
        shelfLifeTermRaw: '3',
        shelfLifeUnitRaw: 'days',
        includeTime: true,
        manufactureTimeRaw
      });

      expect(result).toEqual({
        ok: false,
        invalidFields: ['time'],
        message: 'Invalid manufacture time.'
      });
    });
  });

  it('returns term error for invalid term values', () => {
    const invalidTerms = ['', '0', '-1', '1.5', 'NaN', 'Infinity', '999999999999999999999999999'];

    invalidTerms.forEach((termRaw) => {
      const result = calculateShelfLife({
        manufactureDateRaw: '03.05.2026',
        shelfLifeTermRaw: termRaw,
        shelfLifeUnitRaw: 'days',
        includeTime: false,
        manufactureTimeRaw: ''
      });

      expect(result).toEqual({
        ok: false,
        invalidFields: ['term'],
        message: 'Invalid shelf-life term.'
      });
    });
  });

  it('accepts term with surrounding spaces', () => {
    const result = calculateShelfLife({
      manufactureDateRaw: '03.05.2026',
      shelfLifeTermRaw: ' 3 ',
      shelfLifeUnitRaw: 'days',
      includeTime: false,
      manufactureTimeRaw: ''
    });

    expect(result).toMatchObject({
      ok: true,
      formattedValidUntil: '06.05.2026'
    });
  });

  it('returns unit error for unknown unit', () => {
    const result = calculateShelfLife({
      manufactureDateRaw: '03.05.2026',
      shelfLifeTermRaw: '3',
      shelfLifeUnitRaw: 'hours',
      includeTime: false,
      manufactureTimeRaw: ''
    });

    expect(result).toEqual({
      ok: false,
      invalidFields: ['unit'],
      message: 'Unknown shelf-life unit.'
    });
  });

  it('does not mutate input object', () => {
    const input = {
      manufactureDateRaw: '03.05.2026',
      shelfLifeTermRaw: '3',
      shelfLifeUnitRaw: 'days',
      includeTime: true,
      manufactureTimeRaw: '14:00'
    };
    const snapshot = { ...input };

    calculateShelfLife(input);

    expect(input).toEqual(snapshot);
  });
});
