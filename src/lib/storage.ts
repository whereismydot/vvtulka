import { computeOrderVkusbackSumRaw } from './calculations';
import { normalizeDecimalInput } from './decimal';
import type { Order, OrderItem, StorageState } from '../types';

export const STORAGE_KEY = 'vv_local_tool_state';
export const STORAGE_VERSION = 1;

function createDefaultState(): StorageState {
  return {
    version: STORAGE_VERSION,
    orders: [],
    percentRaw: '5',
    updatedAt: new Date().toISOString()
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

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

function sanitizeOrder(input: unknown): Order | null {
  if (!isRecord(input)) {
    return null;
  }

  if (typeof input.id !== 'string') {
    return null;
  }

  const createdAt = typeof input.createdAt === 'string' ? input.createdAt : new Date().toISOString();
  const rawInput = typeof input.rawInput === 'string' ? input.rawInput : '';

  const itemsRaw = Array.isArray(input.items) ? input.items : [];
  const items = itemsRaw
    .map((entry) => sanitizeItem(entry))
    .filter((entry): entry is OrderItem => entry !== null);

  return {
    id: input.id,
    createdAt,
    rawInput,
    items,
    vkusbackSumRaw: computeOrderVkusbackSumRaw(items)
  };
}

export function buildStorageState(orders: Order[], percentRaw: string): StorageState {
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

export function loadState(): StorageState {
  if (typeof localStorage === 'undefined') {
    return createDefaultState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }

    const parsed = JSON.parse(raw) as unknown;
    return hydrateState(parsed);
  } catch {
    return createDefaultState();
  }
}

export function saveState(state: StorageState): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
