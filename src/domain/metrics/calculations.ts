import { decimalFromRaw, normalizeDecimalInput, rawFromDecimal } from '../decimal/decimal';
import type { Metrics, Order, OrderItem } from '../types';

/**
 * Считает сумму позиций заказа, которые участвуют в ВкусБэк.
 *
 * @param items Позиции заказа.
 * @returns Сумма подходящих позиций в строковом decimal-формате.
 */
export function computeOrderVkusbackSumRaw(items: readonly OrderItem[]): string {
  const total = items.reduce((acc, item) => {
    if (!item.isVkusbackEligible) {
      return acc;
    }
    return acc.add(decimalFromRaw(item.sumRaw));
  }, decimalFromRaw('0'));

  return rawFromDecimal(total);
}

/**
 * Вычисляет агрегированные метрики по списку заказов и проценту кэшбэка.
 * Отрицательный процент принудительно ограничивается значением `0`.
 *
 * @param orders Список заказов.
 * @param percentRaw Введённый процент кэшбэка.
 * @returns Набор метрик для отображения в интерфейсе.
 */
export function calculateMetrics(orders: readonly Order[], percentRaw: string): Metrics {
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
