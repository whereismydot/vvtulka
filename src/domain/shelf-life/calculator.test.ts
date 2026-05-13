import { describe, expect, it } from 'vitest';
import { calculateExpiryDate } from './calculator';
import type { ShelfLifeUnit } from '../types';

interface DateFixture {
  readonly input: string;
  readonly term: number;
  readonly unit: ShelfLifeUnit;
  readonly expected: string;
}

interface DateTimeFixture {
  readonly inputDate: string;
  readonly inputTime: string;
  readonly term: number;
  readonly unit: ShelfLifeUnit;
  readonly expected: string;
}

function parseDate(value: string): { year: number; month: number; day: number } {
  const [dayRaw, monthRaw, yearRaw] = value.split('.');
  return {
    day: Number(dayRaw),
    month: Number(monthRaw),
    year: Number(yearRaw)
  };
}

function parseTime(value: string): { hours: number; minutes: number } {
  const [hoursRaw, minutesRaw] = value.split(':');
  return {
    hours: Number(hoursRaw),
    minutes: Number(minutesRaw)
  };
}

function buildDateFromFixture(date: string, time?: string): Date {
  const parsedDate = parseDate(date);
  const parsedTime = time ? parseTime(time) : { hours: 0, minutes: 0 };
  return new Date(parsedDate.year, parsedDate.month - 1, parsedDate.day, parsedTime.hours, parsedTime.minutes, 0, 0);
}

function formatDateOnly(value: Date): string {
  return `${String(value.getDate()).padStart(2, '0')}.${String(value.getMonth() + 1).padStart(2, '0')}.${value.getFullYear()}`;
}

function formatDateTime(value: Date): string {
  return `${formatDateOnly(value)} ${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

const dayFixtures: readonly DateFixture[] = [
  { input: '03.05.2026', term: 3, unit: 'days', expected: '06.05.2026' },
  { input: '16.05.2026', term: 3, unit: 'days', expected: '19.05.2026' },
  { input: '31.01.2026', term: 1, unit: 'days', expected: '01.02.2026' },
  { input: '28.02.2026', term: 1, unit: 'days', expected: '01.03.2026' },
  { input: '28.02.2024', term: 1, unit: 'days', expected: '29.02.2024' },
  { input: '29.02.2024', term: 1, unit: 'days', expected: '01.03.2024' },
  { input: '30.04.2026', term: 1, unit: 'days', expected: '01.05.2026' },
  { input: '30.06.2026', term: 1, unit: 'days', expected: '01.07.2026' },
  { input: '30.09.2026', term: 1, unit: 'days', expected: '01.10.2026' },
  { input: '30.11.2026', term: 1, unit: 'days', expected: '01.12.2026' },
  { input: '31.12.2026', term: 1, unit: 'days', expected: '01.01.2027' }
];

const weekFixtures: readonly DateFixture[] = [
  { input: '03.05.2026', term: 1, unit: 'weeks', expected: '10.05.2026' },
  { input: '28.12.2026', term: 1, unit: 'weeks', expected: '04.01.2027' },
  { input: '25.02.2024', term: 1, unit: 'weeks', expected: '03.03.2024' }
];

const monthFixtures: readonly DateFixture[] = [
  { input: '03.05.2026', term: 1, unit: 'months', expected: '03.06.2026' },
  { input: '31.01.2026', term: 1, unit: 'months', expected: '28.02.2026' },
  { input: '31.01.2024', term: 1, unit: 'months', expected: '29.02.2024' },
  { input: '30.01.2026', term: 1, unit: 'months', expected: '28.02.2026' },
  { input: '30.01.2024', term: 1, unit: 'months', expected: '29.02.2024' },
  { input: '31.03.2026', term: 1, unit: 'months', expected: '30.04.2026' },
  { input: '31.12.2026', term: 1, unit: 'months', expected: '31.01.2027' },
  { input: '30.11.2026', term: 3, unit: 'months', expected: '28.02.2027' },
  { input: '30.11.2023', term: 3, unit: 'months', expected: '29.02.2024' }
];

const yearFixtures: readonly DateFixture[] = [
  { input: '03.05.2026', term: 1, unit: 'years', expected: '03.05.2027' },
  { input: '31.12.2026', term: 1, unit: 'years', expected: '31.12.2027' },
  { input: '29.02.2024', term: 1, unit: 'years', expected: '28.02.2025' },
  { input: '29.02.2024', term: 4, unit: 'years', expected: '29.02.2028' },
  { input: '28.02.2023', term: 1, unit: 'years', expected: '28.02.2024' },
  { input: '29.02.2000', term: 1, unit: 'years', expected: '28.02.2001' },
  { input: '29.02.2000', term: 4, unit: 'years', expected: '29.02.2004' }
];

const withTimeFixtures: readonly DateTimeFixture[] = [
  { inputDate: '03.05.2026', inputTime: '14:00', term: 3, unit: 'days', expected: '06.05.2026 14:00' },
  { inputDate: '31.12.2026', inputTime: '23:59', term: 1, unit: 'days', expected: '01.01.2027 23:59' },
  { inputDate: '28.02.2024', inputTime: '00:00', term: 1, unit: 'days', expected: '29.02.2024 00:00' },
  { inputDate: '28.02.2025', inputTime: '00:00', term: 1, unit: 'days', expected: '01.03.2025 00:00' },
  { inputDate: '29.02.2024', inputTime: '23:59', term: 1, unit: 'years', expected: '28.02.2025 23:59' },
  { inputDate: '31.01.2026', inputTime: '08:30', term: 1, unit: 'months', expected: '28.02.2026 08:30' }
];

describe('calculateExpiryDate fixtures', () => {
  it('matches mandatory day fixtures', () => {
    dayFixtures.forEach((item) => {
      const result = calculateExpiryDate(buildDateFromFixture(item.input), item.term, item.unit);
      expect(formatDateOnly(result)).toBe(item.expected);
    });
  });

  it('matches mandatory week fixtures', () => {
    weekFixtures.forEach((item) => {
      const result = calculateExpiryDate(buildDateFromFixture(item.input), item.term, item.unit);
      expect(formatDateOnly(result)).toBe(item.expected);
    });
  });

  it('matches mandatory month fixtures', () => {
    monthFixtures.forEach((item) => {
      const result = calculateExpiryDate(buildDateFromFixture(item.input), item.term, item.unit);
      expect(formatDateOnly(result)).toBe(item.expected);
    });
  });

  it('matches mandatory year fixtures', () => {
    yearFixtures.forEach((item) => {
      const result = calculateExpiryDate(buildDateFromFixture(item.input), item.term, item.unit);
      expect(formatDateOnly(result)).toBe(item.expected);
    });
  });

  it('matches mandatory datetime fixtures', () => {
    withTimeFixtures.forEach((item) => {
      const result = calculateExpiryDate(buildDateFromFixture(item.inputDate, item.inputTime), item.term, item.unit);
      expect(formatDateTime(result)).toBe(item.expected);
    });
  });
});

describe('calculateExpiryDate validation', () => {
  it('throws for non-positive term', () => {
    expect(() => calculateExpiryDate(buildDateFromFixture('03.05.2026'), 0, 'days')).toThrow(RangeError);
    expect(() => calculateExpiryDate(buildDateFromFixture('03.05.2026'), -1, 'days')).toThrow(RangeError);
  });

  it('throws for non-integer term', () => {
    expect(() => calculateExpiryDate(buildDateFromFixture('03.05.2026'), 1.5, 'days')).toThrow(RangeError);
    expect(() => calculateExpiryDate(buildDateFromFixture('03.05.2026'), Number.NaN, 'days')).toThrow(RangeError);
    expect(() => calculateExpiryDate(buildDateFromFixture('03.05.2026'), Number.POSITIVE_INFINITY, 'days')).toThrow(RangeError);
  });

  it('throws for unknown unit at runtime', () => {
    expect(() => calculateExpiryDate(buildDateFromFixture('03.05.2026'), 3, 'hours' as ShelfLifeUnit)).toThrow(
      /Unsupported shelf-life unit/
    );
  });
});
