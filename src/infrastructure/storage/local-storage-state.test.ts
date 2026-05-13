import { describe, expect, it } from 'vitest';
import { buildStorageState, hydrateState, loadState, saveState, STORAGE_KEY, STORAGE_VERSION } from './local-storage-state';
import type { Order } from '../../domain/types';

class MemoryStorage implements Storage {
  private readonly map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key) ?? null : null;
  }

  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

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

  it('saves and loads state via storage adapter', () => {
    const storage = new MemoryStorage();
    const state = buildStorageState([], '8');

    saveState(state, storage);
    const restored = loadState(storage);

    expect(storage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(restored.version).toBe(STORAGE_VERSION);
    expect(restored.percentRaw).toBe('8');
    expect(restored.orders).toEqual([]);
  });

  it('returns defaults for malformed JSON in storage', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{broken-json');

    const restored = loadState(storage);

    expect(restored.version).toBe(STORAGE_VERSION);
    expect(restored.percentRaw).toBe('5');
    expect(restored.orders).toEqual([]);
  });

  it('returns defaults when storage is unavailable', () => {
    const restored = loadState(null);

    expect(restored.version).toBe(STORAGE_VERSION);
    expect(restored.percentRaw).toBe('5');
    expect(restored.orders).toEqual([]);
  });
});
