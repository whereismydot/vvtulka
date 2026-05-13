import type { ShelfLifeUnit } from '../types';

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function assertValidTerm(term: number): void {
  if (!Number.isFinite(term) || !Number.isSafeInteger(term) || term <= 0) {
    throw new RangeError('Shelf-life term must be a positive integer.');
  }
}

function buildDateFromUtcAsLocal(value: Date): Date {
  return new Date(
    value.getUTCFullYear(),
    value.getUTCMonth(),
    value.getUTCDate(),
    value.getUTCHours(),
    value.getUTCMinutes(),
    value.getUTCSeconds(),
    value.getUTCMilliseconds()
  );
}

function addDaysUtc(source: Date, days: number): Date {
  const utc = new Date(
    Date.UTC(
      source.getFullYear(),
      source.getMonth(),
      source.getDate(),
      source.getHours(),
      source.getMinutes(),
      source.getSeconds(),
      source.getMilliseconds()
    )
  );
  utc.setUTCDate(utc.getUTCDate() + days);
  return buildDateFromUtcAsLocal(utc);
}

function addMonthsClamped(source: Date, months: number): Date {
  const sourceYear = source.getFullYear();
  const sourceMonth = source.getMonth();
  const sourceDay = source.getDate();

  const totalMonths = sourceYear * 12 + sourceMonth + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = totalMonths % 12;
  const targetDay = Math.min(sourceDay, getDaysInMonth(targetYear, targetMonth));

  return new Date(
    targetYear,
    targetMonth,
    targetDay,
    source.getHours(),
    source.getMinutes(),
    source.getSeconds(),
    source.getMilliseconds()
  );
}

export function calculateExpiryDate(manufacturedAt: Date, term: number, unit: ShelfLifeUnit): Date {
  assertValidTerm(term);

  switch (unit) {
    case 'days':
      return addDaysUtc(manufacturedAt, term);
    case 'weeks':
      return addDaysUtc(manufacturedAt, term * 7);
    case 'months':
      return addMonthsClamped(manufacturedAt, term);
    case 'years':
      return addMonthsClamped(manufacturedAt, term * 12);
    default:
      throw new Error('Unsupported shelf-life unit.');
  }
}
