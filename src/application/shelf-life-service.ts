import { calculateExpiryDate } from '../domain/shelf-life/calculator';
import {
  buildShelfLifeDateTime,
  formatShelfLifeDateTime,
  parseShelfLifeDateInput,
  parseShelfLifeTimeInput
} from '../domain/shelf-life/date-time-io';
import type { ShelfLifeUnit } from '../domain/types';

export type ShelfLifeField = 'date' | 'term' | 'time' | 'unit';

export interface CalculateShelfLifeInput {
  readonly manufactureDateRaw: string;
  readonly shelfLifeTermRaw: string;
  readonly shelfLifeUnitRaw: string;
  readonly includeTime: boolean;
  readonly manufactureTimeRaw: string | null | undefined;
}

export interface CalculateShelfLifeSuccess {
  readonly ok: true;
  readonly validUntil: Date;
  readonly formattedValidUntil: string;
}

export interface CalculateShelfLifeFailure {
  readonly ok: false;
  readonly invalidFields: readonly ShelfLifeField[];
  readonly message: string;
}

export type CalculateShelfLifeResult = CalculateShelfLifeSuccess | CalculateShelfLifeFailure;

function isShelfLifeUnit(value: string): value is ShelfLifeUnit {
  return value === 'days' || value === 'weeks' || value === 'months' || value === 'years';
}

function parseTerm(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const term = Number(normalized);
  if (!Number.isFinite(term) || !Number.isSafeInteger(term) || term <= 0) {
    return null;
  }

  return term;
}

function fail(invalidFields: readonly ShelfLifeField[], message: string): CalculateShelfLifeFailure {
  return {
    ok: false,
    invalidFields,
    message
  };
}

export function calculateShelfLife(input: CalculateShelfLifeInput): CalculateShelfLifeResult {
  const unit = input.shelfLifeUnitRaw;
  if (!isShelfLifeUnit(unit)) {
    return fail(['unit'], 'Unknown shelf-life unit.');
  }

  const parsedDate = parseShelfLifeDateInput(input.manufactureDateRaw);
  if (!parsedDate.ok) {
    return fail(['date'], 'Invalid manufacture date.');
  }

  const parsedTime = parseShelfLifeTimeInput(input.manufactureTimeRaw, input.includeTime);
  if (!parsedTime.ok) {
    return fail(['time'], 'Invalid manufacture time.');
  }

  const term = parseTerm(input.shelfLifeTermRaw);
  if (term === null) {
    return fail(['term'], 'Invalid shelf-life term.');
  }

  const manufacturedAt = buildShelfLifeDateTime(parsedDate.value, parsedTime.value);

  try {
    const validUntil = calculateExpiryDate(manufacturedAt, term, unit);
    if (Number.isNaN(validUntil.getTime())) {
      return fail(['term'], 'Shelf-life term is out of supported range.');
    }

    return {
      ok: true,
      validUntil,
      formattedValidUntil: formatShelfLifeDateTime(validUntil, input.includeTime)
    };
  } catch {
    return fail(['term'], 'Shelf-life term is out of supported range.');
  }
}
