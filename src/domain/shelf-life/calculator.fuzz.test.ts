import { describe, expect, it } from 'vitest';
import { calculateExpiryDate } from './calculator';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randomInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function daysInMonth(year: number, monthIndexZeroBased: number): number {
  return new Date(year, monthIndexZeroBased + 1, 0).getDate();
}

function buildRandomDate(rng: () => number): Date {
  const year = randomInt(rng, 1970, 2100);
  const monthIndex = randomInt(rng, 0, 11);
  const day = randomInt(rng, 1, daysInMonth(year, monthIndex));
  const hours = randomInt(rng, 0, 23);
  const minutes = randomInt(rng, 0, 59);
  return new Date(year, monthIndex, day, hours, minutes, 0, 0);
}

function toUtcLocal(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds()
    )
  );
}

function fromUtcAsLocal(date: Date): Date {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds()
  );
}

function oracleAddDays(source: Date, days: number): Date {
  const utc = toUtcLocal(source);
  const shifted = new Date(utc.getTime() + days * MS_PER_DAY);
  return fromUtcAsLocal(shifted);
}

function oracleAddMonths(source: Date, months: number): Date {
  const year = source.getFullYear();
  const month = source.getMonth();
  const day = source.getDate();
  const targetMonthAbsolute = year * 12 + month + months;
  const targetYear = Math.floor(targetMonthAbsolute / 12);
  const targetMonth = targetMonthAbsolute % 12;
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));
  return new Date(targetYear, targetMonth, targetDay, source.getHours(), source.getMinutes(), source.getSeconds(), source.getMilliseconds());
}

function oracleAddYears(source: Date, years: number): Date {
  const targetYear = source.getFullYear() + years;
  const targetMonth = source.getMonth();
  const targetDay = Math.min(source.getDate(), daysInMonth(targetYear, targetMonth));
  return new Date(targetYear, targetMonth, targetDay, source.getHours(), source.getMinutes(), source.getSeconds(), source.getMilliseconds());
}

function dayIndex(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY;
}

function assertValidDate(value: Date): void {
  expect(Number.isNaN(value.getTime())).toBe(false);
}

function assertTimePreserved(source: Date, target: Date): void {
  expect(target.getHours()).toBe(source.getHours());
  expect(target.getMinutes()).toBe(source.getMinutes());
}

describe('calculateExpiryDate fuzz invariants', () => {
  it('days: deterministic and calendar-day accurate', () => {
    const rng = createRng(20260513);
    for (let i = 0; i < 250; i += 1) {
      const source = buildRandomDate(rng);
      const term = randomInt(rng, 1, 10000);

      const result = calculateExpiryDate(source, term, 'days');
      const oracle = oracleAddDays(source, term);

      assertValidDate(result);
      expect(result.getTime()).toBeGreaterThan(source.getTime());
      assertTimePreserved(source, result);
      expect(dayIndex(result) - dayIndex(source)).toBe(term);
      expect(result.getTime()).toBe(oracle.getTime());
    }
  });

  it('weeks: deterministic and calendar-day accurate', () => {
    const rng = createRng(20260514);
    for (let i = 0; i < 220; i += 1) {
      const source = buildRandomDate(rng);
      const term = randomInt(rng, 1, 1000);

      const result = calculateExpiryDate(source, term, 'weeks');
      const oracle = oracleAddDays(source, term * 7);

      assertValidDate(result);
      expect(result.getTime()).toBeGreaterThan(source.getTime());
      assertTimePreserved(source, result);
      expect(dayIndex(result) - dayIndex(source)).toBe(term * 7);
      expect(result.getTime()).toBe(oracle.getTime());
    }
  });

  it('months: no overflow jumps and clamp is correct', () => {
    const rng = createRng(20260515);
    for (let i = 0; i < 220; i += 1) {
      const source = buildRandomDate(rng);
      const term = randomInt(rng, 1, 1200);

      const result = calculateExpiryDate(source, term, 'months');
      const oracle = oracleAddMonths(source, term);

      assertValidDate(result);
      expect(result.getTime()).toBeGreaterThan(source.getTime());
      assertTimePreserved(source, result);
      expect(result.getTime()).toBe(oracle.getTime());
    }
  });

  it('years: leap years and clamp remain correct', () => {
    const rng = createRng(20260516);
    for (let i = 0; i < 220; i += 1) {
      const source = buildRandomDate(rng);
      const term = randomInt(rng, 1, 200);

      const result = calculateExpiryDate(source, term, 'years');
      const oracle = oracleAddYears(source, term);

      assertValidDate(result);
      expect(result.getTime()).toBeGreaterThan(source.getTime());
      assertTimePreserved(source, result);
      expect(result.getTime()).toBe(oracle.getTime());
    }
  });
});
