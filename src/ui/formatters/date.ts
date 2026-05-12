/**
 * Форматирует ISO-дату для отображения пользователю.
 *
 * @param iso Дата в формате ISO 8601.
 * @returns Локализованная строка даты или сообщение о неизвестной дате.
 */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Неизвестная дата';
  }

  return date.toLocaleString('ru-RU');
}
