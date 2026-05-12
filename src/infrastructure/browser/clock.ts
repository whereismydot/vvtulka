export interface Clock {
  nowIso(): string;
}

/**
 * Создаёт адаптер времени для получения текущего момента в ISO-формате.
 *
 * @returns Объект доступа к системному времени.
 */
export function createClock(): Clock {
  return {
    /**
     * Возвращает текущие дату и время в ISO-формате.
     *
     * @returns Текущее время в формате ISO 8601.
     */
    nowIso(): string {
      return new Date().toISOString();
    }
  };
}
