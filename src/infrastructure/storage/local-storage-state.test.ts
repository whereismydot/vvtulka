import { describe, expect, it } from 'vitest';
import { buildStorageState, hydrateState, STORAGE_VERSION } from './local-storage-state';
import type { Order } from '../../domain/types';

describe('local storage state', () => {
  it('returns default state for invalid payload', () => {
    const state = hydrateState(null);

    expect(state.version).toBe(STORAGE_VERSION);
    expect(state.orders).toEqual([]);
    expect(state.percentRaw).toBe('5');
  });

  it('sanitizes numbers and recomputes order vkusback sum', () => {
    const state = hydrateState({
      percentRaw: ' 7,5 ',
      updatedAt: '2026-01-01T00:00:00.000Z',
      orders: [
        {
          id: '1',
          title: ' ',
          createdAt: '2026-01-01T10:00:00.000Z',
          rawInput: 123,
          vkusbackSumRaw: '9999',
          items: [
            { name: 'A', quantityRaw: '1,5', sumRaw: '10,50', isVkusbackEligible: true, sourceRow: 1 },
            { name: 'B', quantityRaw: '2', sumRaw: '2', isVkusbackEligible: false, sourceRow: 2 }
          ]
        }
      ]
    });

    expect(state.percentRaw).toBe('7.5');
    expect(state.orders).toHaveLength(1);
    expect(state.orders[0].title).toBe('Без названия');
    expect(state.orders[0].rawInput).toBe('');
    expect(state.orders[0].items[0].quantityRaw).toBe('1.5');
    expect(state.orders[0].items[0].sumRaw).toBe('10.50');
    expect(state.orders[0].vkusbackSumRaw).toBe('10.5');
  });

  it('builds sanitized storage state from orders', () => {
    const orders: Order[] = [
      {
        id: 'order-1',
        title: 'Test',
        createdAt: '2026-02-01T10:00:00.000Z',
        rawInput: 'raw',
        vkusbackSumRaw: 'not-used',
        items: [{ name: 'A', quantityRaw: '1', sumRaw: '15,20', isVkusbackEligible: true, sourceRow: 1 }]
      }
    ];

    const state = buildStorageState(orders, '12,5');

    expect(state.version).toBe(STORAGE_VERSION);
    expect(state.percentRaw).toBe('12.5');
    expect(state.orders[0].vkusbackSumRaw).toBe('15.2');
  });
});
