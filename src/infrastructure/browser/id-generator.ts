export interface IdGenerator {
  nextId(): string;
}

/**
 * Создаёт генератор идентификаторов заказов с fallback для старых окружений.
 *
 * @returns Генератор строковых идентификаторов.
 */
export function createIdGenerator(): IdGenerator {
  return {
    /**
     * Возвращает новый идентификатор заказа.
     * При наличии использует `crypto.randomUUID`, иначе формирует id вручную.
     *
     * @returns Уникальный идентификатор заказа.
     */
    nextId(): string {
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
      }

      return `order-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
  };
}
