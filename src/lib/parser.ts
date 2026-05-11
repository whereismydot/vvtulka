import { normalizeDecimalInput } from './decimal';
import type { OrderItem, ParseResult } from '../types';

interface HeaderIndexes {
  itemIndex: number;
  quantityIndex: number;
  sumIndex: number;
  vkusbackIndex: number;
}

const HEADER_SYNONYMS = {
  item: ['товар'],
  quantity: ['колво', 'количество'],
  sum: ['сумма'],
  vkusback: ['входитвкусбэк', 'входитвкусбек', 'вкусбэк', 'вкусбек']
};

const ELIGIBLE_VALUES = new Set(['да', 'yes', 'true', '1', 'y']);

function normalizeHeaderCell(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]/g, '');
}

function hasDigits(value: string): boolean {
  return /\d/.test(value);
}

function isTotalRow(cells: string[]): boolean {
  return cells.some((cell) => normalizeHeaderCell(cell).startsWith('итого'));
}

function findHeaderLine(lines: string[]): { headerIndex: number; cells: string[] } | null {
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (!line.includes('\t')) {
      continue;
    }

    const cells = line.split('\t').map((cell) => cell.trim());
    const normalizedCells = cells.map(normalizeHeaderCell);

    if (
      normalizedCells.includes('пп') &&
      normalizedCells.some((value) => HEADER_SYNONYMS.item.includes(value)) &&
      normalizedCells.some((value) => HEADER_SYNONYMS.sum.includes(value))
    ) {
      return { headerIndex: lineIndex, cells };
    }
  }

  return null;
}

function findIndex(cells: string[], aliases: string[]): number {
  const normalizedAliases = new Set(aliases.map((alias) => normalizeHeaderCell(alias)));
  for (let index = 0; index < cells.length; index += 1) {
    const normalizedCell = normalizeHeaderCell(cells[index]);
    if (normalizedAliases.has(normalizedCell)) {
      return index;
    }
  }

  return -1;
}

function resolveIndexes(headerCells: string[]): { indexes: HeaderIndexes | null; missing: string[] } {
  const itemIndex = findIndex(headerCells, HEADER_SYNONYMS.item);
  const quantityIndex = findIndex(headerCells, HEADER_SYNONYMS.quantity);
  const sumIndex = findIndex(headerCells, HEADER_SYNONYMS.sum);
  const vkusbackIndex = findIndex(headerCells, HEADER_SYNONYMS.vkusback);

  const missing: string[] = [];

  if (itemIndex === -1) {
    missing.push('Товар');
  }
  if (quantityIndex === -1) {
    missing.push('Колво');
  }
  if (sumIndex === -1) {
    missing.push('Сумма');
  }
  if (vkusbackIndex === -1) {
    missing.push('ВходитВкусБэк');
  }

  if (missing.length > 0) {
    return { indexes: null, missing };
  }

  return {
    indexes: {
      itemIndex,
      quantityIndex,
      sumIndex,
      vkusbackIndex
    },
    missing
  };
}

function parseEligibility(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return ELIGIBLE_VALUES.has(normalized);
}

function buildItem(cells: string[], indexes: HeaderIndexes, sourceRow: number): OrderItem | null {
  const name = (cells[indexes.itemIndex] ?? '').trim();
  const quantityCell = (cells[indexes.quantityIndex] ?? '').trim();
  const sumCell = (cells[indexes.sumIndex] ?? '').trim();
  const vkusbackCell = (cells[indexes.vkusbackIndex] ?? '').trim();

  if (!name && !sumCell) {
    return null;
  }

  if (!hasDigits(sumCell)) {
    return null;
  }

  return {
    name: name || 'Без названия',
    quantityRaw: normalizeDecimalInput(quantityCell || '0'),
    sumRaw: normalizeDecimalInput(sumCell),
    isVkusbackEligible: parseEligibility(vkusbackCell),
    sourceRow
  };
}

export function parseOrderText(rawInput: string): ParseResult {
  const lines = rawInput.split(/\r?\n/);
  const warnings: string[] = [];
  const errors: string[] = [];
  const items: OrderItem[] = [];

  const header = findHeaderLine(lines);

  if (!header) {
    return {
      items,
      warnings,
      errors: ['Не найдена строка заголовков. Ожидается строка с колонкой "п.п.".']
    };
  }

  const resolved = resolveIndexes(header.cells);

  if (!resolved.indexes) {
    return {
      items,
      warnings,
      errors: [`В заголовке отсутствуют обязательные колонки: ${resolved.missing.join(', ')}.`]
    };
  }

  for (let lineIndex = header.headerIndex + 1; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (!line.trim()) {
      continue;
    }

    const cells = line.split('\t').map((cell) => cell.trim());

    if (cells.every((cell) => cell.length === 0)) {
      continue;
    }

    if (isTotalRow(cells)) {
      continue;
    }

    const item = buildItem(cells, resolved.indexes, lineIndex + 1);

    if (!item) {
      warnings.push(`Строка ${lineIndex + 1} пропущена: не удалось извлечь корректную сумму.`);
      continue;
    }

    items.push(item);
  }

  return { items, warnings, errors };
}
