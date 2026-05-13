export interface ShelfLifeDateParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export interface ShelfLifeTimeParts {
  readonly hours: number;
  readonly minutes: number;
}

interface ParseSuccess<T> {
  readonly ok: true;
  readonly value: T;
}

interface ParseFailure {
  readonly ok: false;
}

export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

const DATE_PATTERN = /^\s*(\d{2})\.(\d{2})\.(\d{4})\s*$/;
const TIME_PATTERN = /^\s*([01]\d|2[0-3]):([0-5]\d)\s*$/;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function isValidDateParts(parts: ShelfLifeDateParts): boolean {
  const value = new Date(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0);
  return value.getFullYear() === parts.year && value.getMonth() === parts.month - 1 && value.getDate() === parts.day;
}

export function parseShelfLifeDateInput(value: string): ParseResult<ShelfLifeDateParts> {
  const match = value.match(DATE_PATTERN);
  if (match === null) {
    return { ok: false };
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const parts: ShelfLifeDateParts = { year, month, day };
  if (!isValidDateParts(parts)) {
    return { ok: false };
  }

  return { ok: true, value: parts };
}

export function parseShelfLifeTimeInput(value: string | null | undefined, includeTime: boolean): ParseResult<ShelfLifeTimeParts> {
  if (!includeTime) {
    return {
      ok: true,
      value: { hours: 0, minutes: 0 }
    };
  }

  if (typeof value !== 'string') {
    return { ok: false };
  }

  if (value.trim().length === 0) {
    return { ok: false };
  }

  const match = value.match(TIME_PATTERN);
  if (match === null) {
    return { ok: false };
  }

  return {
    ok: true,
    value: {
      hours: Number(match[1]),
      minutes: Number(match[2])
    }
  };
}

export function buildShelfLifeDateTime(date: ShelfLifeDateParts, time: ShelfLifeTimeParts): Date {
  return new Date(date.year, date.month - 1, date.day, time.hours, time.minutes, 0, 0);
}

export function formatShelfLifeDateTime(value: Date, includeTime: boolean): string {
  const datePart = `${pad2(value.getDate())}.${pad2(value.getMonth() + 1)}.${value.getFullYear()}`;
  if (!includeTime) {
    return datePart;
  }

  return `${datePart} ${pad2(value.getHours())}:${pad2(value.getMinutes())}`;
}
