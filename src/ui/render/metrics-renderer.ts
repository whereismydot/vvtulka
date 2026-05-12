import { formatDecimalForDisplay } from '../../domain/decimal/decimal';
import type { Metrics } from '../../domain/types';

interface MetricsTargets {
  readonly metricOrders: HTMLParagraphElement;
  readonly metricVkusback: HTMLParagraphElement;
  readonly metricCashback: HTMLButtonElement;
}

/**
 * Рендерит агрегированные метрики в карточки интерфейса.
 *
 * @param targets DOM-элементы для вывода метрик.
 * @param metrics Подготовленные значения метрик.
 */
export function renderMetrics(targets: MetricsTargets, metrics: Metrics): void {
  const cashbackDisplay = formatDecimalForDisplay(metrics.cashbackRaw);
  targets.metricOrders.textContent = String(metrics.ordersCount);
  targets.metricVkusback.textContent = formatDecimalForDisplay(metrics.vkusbackTotalRaw);
  targets.metricCashback.textContent = cashbackDisplay;
  targets.metricCashback.dataset.copyValue = cashbackDisplay;
}
