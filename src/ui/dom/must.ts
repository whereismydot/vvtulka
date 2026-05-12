/**
 * Проверяет, что значение не `null`, и возвращает его в суженном типе.
 *
 * @param value Проверяемое значение.
 * @param message Текст ошибки для исключения.
 * @returns Непустое значение.
 * @throws {Error} Если передано `null`.
 */
export function must<T>(value: T | null, message: string): T {
  if (value === null) {
    throw new Error(message);
  }

  return value;
}
