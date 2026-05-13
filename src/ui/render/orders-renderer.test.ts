/** @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vitest';
import type { Order } from '../../domain/types';
import { renderOrders } from './orders-renderer';

function buildOrder(): Order {
  return {
    id: 'order-1',
    title: 'Заказ 1',
    createdAt: '2026-01-01T10:00:00.000Z',
    rawInput: 'raw',
    vkusbackSumRaw: '100',
    items: [
      { name: 'A', quantityRaw: '1', sumRaw: '100', isVkusbackEligible: true, sourceRow: 1 },
      { name: 'B', quantityRaw: '2', sumRaw: '50', isVkusbackEligible: false, sourceRow: 2 }
    ]
  };
}

describe('renderOrders', () => {
  it('renders empty state', () => {
    const container = document.createElement('div') as HTMLDivElement;
    renderOrders(container, [], {
      onCopyTitle: vi.fn(),
      onEditTitle: vi.fn(),
      onDeleteOrder: vi.fn()
    });

    expect(container.querySelector('.orders-empty')).not.toBeNull();
  });

  it('renders order cards and binds actions', () => {
    const onCopyTitle = vi.fn();
    const onEditTitle = vi.fn();
    const onDeleteOrder = vi.fn();
    const container = document.createElement('div') as HTMLDivElement;
    const order = buildOrder();

    renderOrders(container, [order], { onCopyTitle, onEditTitle, onDeleteOrder });

    const card = container.querySelector('.order-card');
    expect(card).not.toBeNull();
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(container.querySelectorAll('.items-row-eligible')).toHaveLength(1);

    (container.querySelector('.order-title-copy') as HTMLButtonElement).click();
    (container.querySelector('.order-title-edit') as HTMLButtonElement).click();
    (container.querySelector('.btn-danger') as HTMLButtonElement).click();

    expect(onCopyTitle).toHaveBeenCalledWith('Заказ 1');
    expect(onEditTitle).toHaveBeenCalledWith(order);
    expect(onDeleteOrder).toHaveBeenCalledWith(order);
  });
});

