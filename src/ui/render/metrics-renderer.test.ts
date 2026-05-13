/** @vitest-environment jsdom */

import { describe, expect, it } from 'vitest';
import { renderMetrics } from './metrics-renderer';

describe('renderMetrics', () => {
  it('renders metrics values and copy payload', () => {
    const metricOrders = document.createElement('p');
    const metricVkusback = document.createElement('p');
    const metricCashback = document.createElement('button');

    renderMetrics(
      { metricOrders, metricVkusback, metricCashback },
      { ordersCount: 2, vkusbackTotalRaw: '123.4', percentRaw: '5', cashbackRaw: '6.17' }
    );

    expect(metricOrders.textContent).toBe('2');
    expect(metricVkusback.textContent).toBe('123,4');
    expect(metricCashback.textContent).toBe('6,17');
    expect(metricCashback.dataset.copyValue).toBe('6,17');
  });
});

