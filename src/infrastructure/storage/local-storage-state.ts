import { computeOrderVkusbackSumRaw } from '../../domain/metrics/calculations';
import { normalizeDecimalInput } from '../../domain/decimal/decimal';
import type { Order, OrderItem, StorageState } from '../../domain/types';

export const STORAGE_KEY = 'vv_local_tool_state';
export const STORAGE_VERSION = 1;

/**
 * Создаёт дефолтное состояние приложения для первичной инициализации.
 *
 * @returns Базовое состояние без заказов и с процентом `5`.
 */
function createDefaultState(): StorageState {
  return {
    version: STORAGE_VERSION,
    orders: [],
    percentRaw: '5',
    updatedAt: new Date().toISOString()
  };
}

/**
 * Проверяет, что значение является непустым объектом.
 *
 * @param value Проверяемое значение.
 * @returns `true`, если значение можно безопасно читать как объект.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Санитизирует одну позицию заказа, полученную из внешнего источника.
 *
 * @param input Сырой объект позиции.
 * @returns Нормализованную позицию или `null`, если структура невалидна.
 */
function sanitizeItem(input: unknown): OrderItem | null {
  if (!isRecord(input)) {
    return null;
  }

  if (typeof input.name !== 'string') {
    return null;
  }

  if (typeof input.sourceRow !== 'number') {
    return null;
  }

  return {
    name: input.name,
    quantityRaw: normalizeDecimalInput(String(input.quantityRaw ?? '0')),
    sumRaw: normalizeDecimalInput(String(input.sumRaw ?? '0')),
    isVkusbackEligible: Boolean(input.isVkusbackEligible),
    sourceRow: input.sourceRow
  };
}

/**
 * Санитизирует заказ и пересчитывает сумму ВкусБэк по его позициям.
 *
 * @param input Сырой объект заказа.
 * @returns Нормализованный заказ или `null`, если структура невалидна.
 */
function sanitizeOrder(input: unknown): Order | null {
  if (!isRecord(input)) {
    return null;
  }

  if (typeof input.id !== 'string') {
    return null;
  }

  const titleRaw = typeof input.title === 'string' ? input.title.trim() : '';
  const createdAt = typeof input.createdAt === 'string' ? input.createdAt : new Date().toISOString();
  const rawInput = typeof input.rawInput === 'string' ? input.rawInput : '';

  const itemsRaw = Array.isArray(input.items) ? input.items : [];
  const items = itemsRaw
    .map((entry) => sanitizeItem(entry))
    .filter((entry): entry is OrderItem => entry !== null);

  return {
    id: input.id,
    title: titleRaw || 'Без названия',
    createdAt,
    rawInput,
    items,
    vkusbackSumRaw: computeOrderVkusbackSumRaw(items)
  };
}

/**
 * Возвращает доступный экземпляр хранилища.
 *
 * @param storageOverride Явно переданное хранилище для тестов или подмены.
 * @returns Переданное хранилище, `localStorage` браузера или `null`, если недоступно.
 */
function getStorage(storageOverride?: Storage | null): Storage | null {
  if (storageOverride !== undefined) {
    return storageOverride;
  }

  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage;
}

/**
 * Формирует состояние для сохранения в storage с предварительной санитизацией.
 *
 * @param orders Список заказов.
 * @param percentRaw Текущее значение процента.
 * @returns Нормализованное состояние хранилища.
 */
export function buildStorageState(orders: readonly Order[], percentRaw: string): StorageState {
  const sanitizedOrders = orders
    .map((order) => sanitizeOrder(order))
    .filter((order): order is Order => order !== null);

  return {
    version: STORAGE_VERSION,
    orders: sanitizedOrders,
    percentRaw: normalizeDecimalInput(percentRaw),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Гидратирует состояние из произвольного JSON-объекта.
 * При некорректной структуре возвращает безопасные значения.
 *
 * @param input Сырые данные из storage.
 * @returns Валидное состояние приложения.
 */
export function hydrateState(input: unknown): StorageState {
  if (!isRecord(input)) {
    return createDefaultState();
  }

  const percentRaw = normalizeDecimalInput(String(input.percentRaw ?? '5'));
  const ordersRaw = Array.isArray(input.orders) ? input.orders : [];

  const orders = ordersRaw
    .map((entry) => sanitizeOrder(entry))
    .filter((entry): entry is Order => entry !== null);

  const updatedAt = typeof input.updatedAt === 'string' ? input.updatedAt : new Date().toISOString();

  return {
    version: STORAGE_VERSION,
    orders,
    percentRaw,
    updatedAt
  };
}

/**
 * Загружает состояние из хранилища с fallback на дефолтное состояние.
 *
 * @param storageOverride Явно переданное хранилище для тестов или подмены.
 * @returns Восстановленное состояние приложения.
 */
export function loadState(storageOverride?: Storage | null): StorageState {
  const storage = getStorage(storageOverride);
  if (!storage) {
    return createDefaultState();
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }

    const parsed = JSON.parse(raw) as unknown;
    return hydrateState(parsed);
  } catch {
    return createDefaultState();
  }
}

/**
 * Сохраняет состояние приложения в выбранное хранилище.
 *
 * @param state Состояние для сохранения.
 * @param storageOverride Явно переданное хранилище для тестов или подмены.
 */
export function saveState(state: StorageState, storageOverride?: Storage | null): void {
  const storage = getStorage(storageOverride);
  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}
