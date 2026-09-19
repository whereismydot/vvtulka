import { sortPlanRows, type PlanSortKey, type SortDirection } from '../../domain/urgent-swaps/plan-sort';
import type { PersonUsage, PlanRow, ProgressEvent, ProgressStage, UrgentPlan } from '../../domain/urgent-swaps/types';

type StepStatus = 'wait' | 'run' | 'ok' | 'err';

export interface StepView {
  readonly status: StepStatus;
  readonly message: string;
}

export interface PlanFilter {
  readonly query: string;
  readonly onlySwaps: boolean;
  /** Сортировка таблицы; по умолчанию — порядок текста бота с заголовками групп. */
  readonly sort?: { readonly key: PlanSortKey; readonly direction: SortDirection };
}

const STEP_TITLES: Readonly<Record<ProgressStage, string>> = {
  1: 'Текст бота',
  2: 'Таблица',
  3: 'Подсчёт срочных',
  4: 'Подбор замен'
};
const STEP_ICONS: Readonly<Record<StepStatus, string>> = { wait: '○', run: '', ok: '✓', err: '✗' };
const STAGES: readonly ProgressStage[] = [1, 2, 3, 4];

/**
 * Создаёт элемент с классом и текстом.
 */
function createElement<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className !== undefined) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

/**
 * Переводит событие прогресса в новое состояние шага (`info` состояние шага не меняет).
 *
 * @param views Текущие состояния шагов.
 * @param event Событие прогресса.
 * @returns Обновлённые состояния.
 */
export function applyProgressEvent(views: Readonly<Partial<Record<ProgressStage, StepView>>>, event: ProgressEvent): Partial<Record<ProgressStage, StepView>> {
  if (event.state === 'info') {
    return views;
  }
  const status: StepStatus = event.state;
  return { ...views, [event.stage]: { status, message: event.message } };
}

/**
 * Рисует степпер из четырёх шагов.
 *
 * @param container Контейнер степпера.
 * @param views Состояния шагов (отсутствующие считаются ожидающими).
 */
export function renderSteps(container: HTMLElement, views: Readonly<Partial<Record<ProgressStage, StepView>>>): void {
  container.replaceChildren(
    ...STAGES.map((stage) => {
      const view = views[stage] ?? { status: 'wait' as const, message: '' };
      const step = createElement('div', `urgent-step urgent-step-${view.status}`);
      const title = createElement('b');
      title.append(createElement('span', 'urgent-step-icon', STEP_ICONS[view.status]), `${stage}. ${STEP_TITLES[stage]}`);
      step.append(title);
      if (view.status !== 'err') {
        step.append(createElement('small', undefined, view.message));
      }
      return step;
    })
  );
}

/**
 * Рисует предупреждения.
 *
 * @param container Контейнер предупреждений.
 * @param warnings Тексты предупреждений.
 */
export function renderWarnings(container: HTMLElement, warnings: readonly string[]): void {
  container.replaceChildren(...warnings.map((warning) => createElement('div', 'urgent-warning', warning)));
}

/**
 * Добавляет в родителя текст с подсветкой найденного фрагмента.
 */
function appendHighlighted(parent: HTMLElement, text: string, query: string): void {
  const index = query === '' ? -1 : text.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) {
    parent.append(text);
    return;
  }
  parent.append(text.slice(0, index), createElement('mark', undefined, text.slice(index, index + query.length)), text.slice(index + query.length));
}

/**
 * Возвращает CSS-модификатор бейджа по числу срочных.
 */
function countClass(count: number): string {
  if (count === 0) {
    return 'urgent-count-low';
  }
  return count <= 2 ? 'urgent-count-mid' : 'urgent-count-high';
}

/**
 * Подпись команды для карточки человека.
 */
function teamLabel(team: number | null): string {
  return team === null ? 'вне команд 1–4' : `Команда ${team}`;
}

/**
 * Строит ячейки «человек» и «срочных» для одной стороны замены.
 */
function createPersonCells(
  person: PersonUsage,
  shift: string,
  query: string,
  known = true,
  groupLabel?: string
): [HTMLTableCellElement, HTMLTableCellElement] {
  const personCell = createElement('td');
  const box = createElement('div', 'urgent-person');

  const name = createElement('button', 'urgent-copy urgent-name');
  name.type = 'button';
  name.title = 'Скопировать ФИО';
  name.dataset.copy = person.name;
  appendHighlighted(name, person.name, query);

  const tag = createElement('button', 'urgent-copy urgent-tag');
  tag.type = 'button';
  tag.title = 'Скопировать тег';
  tag.dataset.copy = person.tag;
  appendHighlighted(tag, person.tag === '' ? 'нет тега' : person.tag, query);

  const meta = createElement('span', 'urgent-shift');
  if (groupLabel !== undefined) {
    meta.append(createElement('span', 'urgent-group-chip', groupLabel), ' ');
  }
  meta.append(known ? `${teamLabel(person.team)} · ${shift} · ` : `${shift} · `);
  if (known) {
    const link = createElement('a', 'urgent-link', 'строка в таблице ↗');
    link.href = person.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    meta.append(link);
  }

  box.append(name, tag, meta);
  personCell.append(box);

  const countCell = createElement('td');
  if (known) {
    countCell.append(
      createElement('span', `urgent-count ${countClass(person.count)}`, String(person.count)),
      createElement('span', 'urgent-days', person.count > 0 ? `числа: ${person.days.join(', ')}` : 'не ходил(а)')
    );
  } else {
    countCell.append(createElement('span', 'urgent-count', '?'), createElement('span', 'urgent-days', 'нет в таблице'));
  }
  return [personCell, countCell];
}

/**
 * Проверяет, подходит ли строка под поисковый запрос по ФИО или тегу (обе стороны).
 */
function matchesQuery(row: PlanRow, query: string): boolean {
  if (query === '') {
    return true;
  }
  const needle = query.toLowerCase();
  return [row.current, row.replacement].some(
    (person) => person !== null && (person.name.toLowerCase().includes(needle) || person.tag.toLowerCase().includes(needle))
  );
}

/**
 * Рисует таблицу «Было → Станет» с учётом фильтра.
 *
 * @param container Контейнер таблицы.
 * @param plan План замен.
 * @param filter Поисковый запрос и режим «только замены».
 */
export function renderPlanTable(container: HTMLElement, plan: UrgentPlan, filter: PlanFilter): void {
  const table = createElement('table', 'urgent-table');
  const head = createElement('tr');
  ['Было', 'Срочных', '', 'Станет', 'Срочных'].forEach((title) => head.append(createElement('th', undefined, title)));
  const thead = createElement('thead');
  thead.append(head);
  table.append(thead);

  const body = createElement('tbody');
  const query = filter.query.trim();
  const sort = filter.sort ?? { key: 'text' as const, direction: 'asc' as const };
  const grouped = sort.key === 'text';
  let lastGroup = '';
  let shown = 0;

  for (const row of sortPlanRows(plan.rows, sort.key, sort.direction)) {
    if ((filter.onlySwaps && row.replacement === null) || !matchesQuery(row, query)) {
      continue;
    }
    shown += 1;

    if (grouped && row.group !== lastGroup) {
      lastGroup = row.group;
      const groupRow = createElement('tr', 'urgent-group');
      const cell = createElement('td', undefined, row.group);
      cell.colSpan = 5;
      groupRow.append(cell);
      body.append(groupRow);
    }

    const tr = createElement('tr', row.replacement === null ? 'urgent-row-same' : undefined);
    const current: PersonUsage = row.current ?? { name: row.name, tag: row.tag, team: null, count: 0, days: [], link: '#' };
    tr.append(...createPersonCells(current, row.shift, query, row.current !== null, grouped ? undefined : row.group));
    tr.append(createElement('td', 'urgent-arrow', row.replacement === null ? '=' : '→'));
    if (row.replacement === null) {
      const same = createElement('td', 'urgent-hint', row.current === null ? 'не найден в таблице' : 'без изменений');
      same.colSpan = 2;
      tr.append(same);
    } else {
      tr.append(...createPersonCells(row.replacement, row.shift, query));
    }
    body.append(tr);
  }

  if (shown === 0) {
    const empty = createElement('tr');
    const cell = createElement('td', 'urgent-hint', 'Ничего не найдено');
    cell.colSpan = 5;
    empty.append(cell);
    body.append(empty);
  }

  table.append(body);
  container.replaceChildren(table);
}

/**
 * Рисует итоговый текст построчно, подсвечивая изменённые строки.
 *
 * @param container Контейнер текста.
 * @param plan План замен.
 */
export function renderOutput(container: HTMLElement, plan: UrgentPlan): void {
  const original = plan.originalText.split('\n');
  container.replaceChildren(
    ...plan.text.split('\n').map((line, index) => {
      const changed = line !== original[index];
      return createElement('div', changed ? 'urgent-line urgent-line-changed' : 'urgent-line', line === '' ? ' ' : line);
    })
  );
}
