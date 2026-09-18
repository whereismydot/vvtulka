import type { PlanRow } from './types';

export type PlanSortKey =
  | 'text'
  | 'name-current'
  | 'name-replacement'
  | 'count-current'
  | 'count-replacement'
  | 'team-current'
  | 'team-replacement'
  | 'shift';

export type SortDirection = 'asc' | 'desc';

type SortValue = string | number | null;

/**
 * Возвращает значение строки для выбранного ключа сортировки.
 *
 * @param row Строка плана.
 * @param key Ключ сортировки.
 * @returns Значение или `null`, если у строки его нет (такие строки всегда идут в конец).
 */
function valueOf(row: PlanRow, key: Exclude<PlanSortKey, 'text'>): SortValue {
  switch (key) {
    case 'name-current':
      return row.current?.name ?? row.name;
    case 'name-replacement':
      return row.replacement?.name ?? null;
    case 'count-current':
      return row.current?.count ?? null;
    case 'count-replacement':
      return row.replacement?.count ?? null;
    case 'team-current':
      return row.current?.team ?? null;
    case 'team-replacement':
      return row.replacement?.team ?? null;
    case 'shift':
      return row.shift;
  }
}

/**
 * Сравнивает два непустых значения: числа по величине, строки по русской локали.
 */
function compareValues(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  return String(a).localeCompare(String(b), 'ru');
}

/**
 * Сортирует строки плана для отображения в таблице. Порядок строк в итоговом тексте не затрагивается:
 * функция возвращает новый массив и не изменяет исходный.
 *
 * Сортировка устойчивая: при равных значениях сохраняется исходный порядок, а строки без значения
 * (нет замены, нет команды) всегда идут в конце независимо от направления.
 *
 * @param rows Строки плана в исходном порядке (как в тексте бота).
 * @param key Ключ сортировки; `text` оставляет исходный порядок.
 * @param direction Направление сортировки.
 * @returns Новый массив строк.
 */
export function sortPlanRows(rows: readonly PlanRow[], key: PlanSortKey, direction: SortDirection): PlanRow[] {
  if (key === 'text') {
    return [...rows];
  }

  const sign = direction === 'asc' ? 1 : -1;
  return rows
    .map((row, index) => ({ row, index, value: valueOf(row, key) }))
    .sort((left, right) => {
      if (left.value === null || right.value === null) {
        if (left.value === right.value) {
          return left.index - right.index;
        }
        return left.value === null ? 1 : -1;
      }
      return compareValues(left.value, right.value) * sign || left.index - right.index;
    })
    .map((entry) => entry.row);
}
