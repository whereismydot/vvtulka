import { beforeEach, describe, expect, it, vi } from 'vitest';

const { calculateExpiryDateMock } = vi.hoisted(() => ({
  calculateExpiryDateMock: vi.fn()
}));

vi.mock('../domain/shelf-life/calculator', () => ({
  calculateExpiryDate: calculateExpiryDateMock
}));

import { calculateShelfLife } from './shelf-life-service';

const VALID_INPUT = {
  manufactureDateRaw: '03.05.2026',
  shelfLifeTermRaw: '3',
  shelfLifeUnitRaw: 'days',
  includeTime: false,
  manufactureTimeRaw: ''
} as const;

describe('calculateShelfLife fallback guards', () => {
  beforeEach(() => {
    calculateExpiryDateMock.mockReset();
  });

  it('returns term error when calculator returns an invalid date', () => {
    calculateExpiryDateMock.mockReturnValue(new Date(Number.NaN));

    const result = calculateShelfLife(VALID_INPUT);

    expect(result).toEqual({
      ok: false,
      invalidFields: ['term'],
      message: 'Shelf-life term is out of supported range.'
    });
    expect(calculateExpiryDateMock).toHaveBeenCalledTimes(1);
  });

  it('returns term error when calculator throws unexpected exception', () => {
    calculateExpiryDateMock.mockImplementation(() => {
      throw new Error('unexpected calculation failure');
    });

    const result = calculateShelfLife(VALID_INPUT);

    expect(result).toEqual({
      ok: false,
      invalidFields: ['term'],
      message: 'Shelf-life term is out of supported range.'
    });
    expect(calculateExpiryDateMock).toHaveBeenCalledTimes(1);
  });
});
