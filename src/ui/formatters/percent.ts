import { normalizeDecimalInput } from '../../domain/decimal/decimal';

/**
 * Нормализует процент для поля ввода и заменяет точку на запятую для UI.
 *
 * @param value Сырой процент.
 * @returns Отформатированное значение для отображения в input.
 */
export function formatPercentInput(value: string): string {
  return normalizeDecimalInput(value).replace('.', ',');
}
