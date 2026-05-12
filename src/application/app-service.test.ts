import { describe, expect, it } from 'vitest';
import { AppService } from './app-service';
import type { AppState } from './app-state';
import type { ParseResult } from '../domain/types';

function createService(parseResult: ParseResult, initialState?: AppState) {
  const persistedSnapshots: AppState[] = [];
  let idCounter = 0;

  const service = new AppService(
    initialState ?? {
      orders: [],
      percentRaw: '5'
    },
    {
      parseOrderText: () => parseResult,
      createOrderId: () => `id-${++idCounter}`,
      nowIso: () => '2026-01-01T10:00:00.000Z',
      persistState: (state) => {
        persistedSnapshots.push(state);
      }
    }
  );

  return { service, persistedSnapshots };
}

const validParseResult: ParseResult = {
  items: [{ name: 'A', quantityRaw: '1', sumRaw: '100', isVkusbackEligible: true, sourceRow: 1 }],
  warnings: [],
  errors: []
};

describe('AppService', () => {
  it('adds order successfully', () => {
    const { service, persistedSnapshots } = createService(validParseResult);

    const result = service.addOrder('чек', '');

    expect(result.orderAdded).toBe(true);
    expect(result.tone).toBe('success');
    expect(result.message).toBe('Заказ успешно добавлен.');
    expect(service.getState().orders).toHaveLength(1);
    expect(service.getState().orders[0].title).toBe('Заказ 1');
    expect(persistedSnapshots).toHaveLength(1);
  });

  it('returns warning for empty input', () => {
    const { service, persistedSnapshots } = createService(validParseResult);

    const result = service.addOrder('   ', 'title');

    expect(result.orderAdded).toBe(false);
    expect(result.tone).toBe('warning');
    expect(result.message).toBe('Вставьте чек в текстовое поле.');
    expect(persistedSnapshots).toHaveLength(0);
  });

  it('returns warning when parser has warnings but order was added', () => {
    const { service } = createService({
      items: validParseResult.items,
      warnings: ['line skipped'],
      errors: []
    });

    const result = service.addOrder('чек', 'Название');

    expect(result.orderAdded).toBe(true);
    expect(result.tone).toBe('warning');
    expect(result.message).toBe('Заказ добавлен. Предупреждений: 1.');
  });

  it('handles rename, delete and clear use-cases', () => {
    const { service } = createService(validParseResult);

    service.addOrder('чек 1', '');
    service.addOrder('чек 2', '');
    const secondOrderId = service.getState().orders[1].id;

    const renameEmpty = service.renameOrder(secondOrderId, '   ');
    expect(renameEmpty.changed).toBe(false);
    expect(renameEmpty.tone).toBe('warning');

    const renameOk = service.renameOrder(secondOrderId, 'Новое название');
    expect(renameOk.changed).toBe(true);
    expect(service.getState().orders[1].title).toBe('Новое название');

    const deleteResult = service.deleteOrder(secondOrderId);
    expect(deleteResult.changed).toBe(true);
    expect(service.getState().orders).toHaveLength(1);

    const clearResult = service.clearOrders();
    expect(clearResult.changed).toBe(true);
    expect(service.getState().orders).toHaveLength(0);
  });

  it('sanitizes negative percent to zero', () => {
    const { service, persistedSnapshots } = createService(validParseResult);

    service.updatePercent('-15');

    expect(service.getState().percentRaw).toBe('0');
    expect(persistedSnapshots).toHaveLength(1);
  });
});
