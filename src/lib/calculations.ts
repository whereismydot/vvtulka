import { decimalFromRaw, normalizeDecimalInput, rawFromDecimal } from './decimal';
import type { Metrics, Order, OrderItem } from '../types';

export function computeOrderVkusbackSumRaw(items: OrderItem[]): string {
  const total = items.reduce((acc, item) => {
    if (!item.isVkusbackEligible) {
      return acc;
    }
    return acc.add(decimalFromRaw(item.sumRaw));
  }, decimalFromRaw('0'));

  return rawFromDecimal(total);
}

export function calculateMetrics(orders: Order[], percentRaw: string): Metrics {
  const vkusbackTotal = orders.reduce((acc, order) => {
    return acc.add(decimalFromRaw(order.vkusbackSumRaw));
  }, decimalFromRaw('0'));

  const normalizedPercentRaw = normalizeDecimalInput(percentRaw);
  const percent = decimalFromRaw(normalizedPercentRaw);
  const safePercent = percent.isNegative() ? decimalFromRaw('0') : percent;
  const cashback = vkusbackTotal.mul(safePercent).div(decimalFromRaw('100'));

  return {
    ordersCount: orders.length,
    vkusbackTotalRaw: rawFromDecimal(vkusbackTotal),
    percentRaw: rawFromDecimal(safePercent),
    cashbackRaw: rawFromDecimal(cashback)
  };
}
