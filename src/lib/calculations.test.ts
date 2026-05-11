import { describe, expect, it } from 'vitest';
import { calculateMetrics, computeOrderVkusbackSumRaw } from './calculations';
import type { Order, OrderItem } from '../types';

function buildOrder(id: string, items: OrderItem[]): Order {
  return {
    id,
    createdAt: '2026-01-01T10:00:00.000Z',
    rawInput: 'raw',
    items,
    vkusbackSumRaw: computeOrderVkusbackSumRaw(items)
  };
}

describe('calculations', () => {
  it('filters only vkusback items per order', () => {
    const items: OrderItem[] = [
      { name: 'A', quantityRaw: '1', sumRaw: '100', isVkusbackEligible: true, sourceRow: 1 },
      { name: 'B', quantityRaw: '1', sumRaw: '40', isVkusbackEligible: false, sourceRow: 2 },
      { name: 'C', quantityRaw: '1', sumRaw: '25', isVkusbackEligible: true, sourceRow: 3 }
    ];

    expect(computeOrderVkusbackSumRaw(items)).toBe('125');
  });

  it('calculates cashback for several orders', () => {
    const order1 = buildOrder('1', [
      { name: 'A', quantityRaw: '1', sumRaw: '100', isVkusbackEligible: true, sourceRow: 1 },
      { name: 'B', quantityRaw: '1', sumRaw: '40', isVkusbackEligible: false, sourceRow: 2 }
    ]);

    const order2 = buildOrder('2', [
      { name: 'C', quantityRaw: '1', sumRaw: '200', isVkusbackEligible: true, sourceRow: 1 }
    ]);

    const metrics = calculateMetrics([order1, order2], '5');

    expect(metrics.vkusbackTotalRaw).toBe('300');
    expect(metrics.cashbackRaw).toBe('15');
  });
});
