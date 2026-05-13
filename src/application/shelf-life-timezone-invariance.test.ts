import { describe, expect, it } from 'vitest';
import { calculateShelfLife } from './shelf-life-service';

interface Fixture {
  readonly manufactureDateRaw: string;
  readonly manufactureTimeRaw: string;
  readonly shelfLifeTermRaw: string;
  readonly shelfLifeUnitRaw: 'days' | 'weeks' | 'months' | 'years';
  readonly expected: string;
}

const fixtures: readonly Fixture[] = [
  {
    manufactureDateRaw: '31.12.2026',
    manufactureTimeRaw: '23:59',
    shelfLifeTermRaw: '1',
    shelfLifeUnitRaw: 'days',
    expected: '01.01.2027 23:59'
  },
  {
    manufactureDateRaw: '28.02.2024',
    manufactureTimeRaw: '00:00',
    shelfLifeTermRaw: '1',
    shelfLifeUnitRaw: 'days',
    expected: '29.02.2024 00:00'
  },
  {
    manufactureDateRaw: '29.02.2024',
    manufactureTimeRaw: '23:59',
    shelfLifeTermRaw: '1',
    shelfLifeUnitRaw: 'years',
    expected: '28.02.2025 23:59'
  },
  {
    manufactureDateRaw: '31.01.2026',
    manufactureTimeRaw: '08:30',
    shelfLifeTermRaw: '1',
    shelfLifeUnitRaw: 'months',
    expected: '28.02.2026 08:30'
  }
];

describe('shelf-life timezone invariance', () => {
  it('keeps mandatory datetime fixtures stable in current TZ', () => {
    fixtures.forEach((fixture) => {
      const result = calculateShelfLife({
        manufactureDateRaw: fixture.manufactureDateRaw,
        shelfLifeTermRaw: fixture.shelfLifeTermRaw,
        shelfLifeUnitRaw: fixture.shelfLifeUnitRaw,
        includeTime: true,
        manufactureTimeRaw: fixture.manufactureTimeRaw
      });

      expect(result).toMatchObject({
        ok: true,
        formattedValidUntil: fixture.expected
      });
    });
  });
});
