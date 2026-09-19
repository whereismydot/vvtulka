/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MonthSchedule } from '../../domain/urgent-swaps/types';
import type { AppElements } from '../dom/elements';
import { createUrgentSwapsController } from './urgent-swaps-controller';

const SCHEDULE: MonthSchedule = {
  sheetTitle: 'График',
  sheetGid: 1,
  spreadsheetId: 'S',
  leaderTags: [],
  truncated: false,
  duplicateNames: [],
  people: [
    { name: 'Иванов Иван', tag: '@ivan', team: 1, temporaryLeader: false, row: 8, shifts: { 20: '08/20' }, urgentDays: [1, 2, 3] },
    { name: 'Свободный Сергей', tag: '@free', team: 1, temporaryLeader: false, row: 9, shifts: { 20: '08/20' }, urgentDays: [] }
  ]
};
const TEXT = 'Дежурные на линию "Срочные"\nПоздние:\nИванов Иван  @ivan  08/20';

function createElements(): AppElements {
  const searchInput = document.createElement('input');
  const onlySwaps = document.createElement('input');
  onlySwaps.type = 'checkbox';
  onlySwaps.checked = true;
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  const sortSelect = document.createElement('select');
  ['text', 'name-current:asc', 'name-current:desc', 'count-current:desc', 'count-current:asc'].forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    sortSelect.append(option);
  });

  return {
    urgentDateInput: dateInput,
    urgentTextInput: document.createElement('textarea'),
    urgentRunButton: document.createElement('button'),
    urgentSteps: document.createElement('div'),
    urgentLogDetails: document.createElement('details'),
    urgentLog: document.createElement('pre'),
    urgentError: document.createElement('div'),
    urgentResult: document.createElement('section'),
    urgentStat: document.createElement('span'),
    urgentKpiTotal: document.createElement('p'),
    urgentKpiSwaps: document.createElement('p'),
    urgentKpiUnchanged: document.createElement('p'),
    urgentWarnings: document.createElement('div'),
    urgentSearchInput: searchInput,
    urgentOnlySwapsInput: onlySwaps,
    urgentSortSelect: sortSelect,
    urgentTable: document.createElement('div'),
    urgentOutputPanel: document.createElement('section'),
    urgentOutput: document.createElement('div'),
    urgentCopyButton: document.createElement('button')
  } as unknown as AppElements;
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('urgent swaps controller', () => {
  let elements: AppElements;
  const copyText = vi.fn(async () => true);
  const setStatus = vi.fn();

  beforeEach(() => {
    elements = createElements();
    copyText.mockClear();
    setStatus.mockClear();
  });

  it('defaults the date to tomorrow', () => {
    createUrgentSwapsController({ elements, copyText, setStatus, loadSchedule: vi.fn(), now: () => new Date(2026, 8, 19, 12) });

    expect(elements.urgentDateInput.value).toBe('2026-09-20');
  });

  it('asks for text when the input is empty', async () => {
    const loadSchedule = vi.fn();
    createUrgentSwapsController({ elements, copyText, setStatus, loadSchedule });

    elements.urgentRunButton.click();
    await settle();

    expect(elements.urgentError.hidden).toBe(false);
    expect(elements.urgentError.textContent).toContain('вставьте текст');
    expect(loadSchedule).not.toHaveBeenCalled();
  });

  it('runs the flow, renders result, log and supports search and copy', async () => {
    const loadSchedule = vi.fn(async (_date, onProgress?: (message: string) => void) => {
      onProgress?.('читаю лист');
      return SCHEDULE;
    });
    createUrgentSwapsController({ elements, copyText, setStatus, loadSchedule });
    elements.urgentDateInput.value = '2026-09-20';
    elements.urgentTextInput.value = TEXT;

    elements.urgentRunButton.click();
    expect(elements.urgentRunButton.disabled).toBe(true);
    await settle();

    expect(elements.urgentRunButton.disabled).toBe(false);
    expect(elements.urgentResult.hidden).toBe(false);
    expect(elements.urgentOutputPanel.hidden).toBe(false);
    expect(elements.urgentStat.textContent).toContain('20.09.2026');
    expect(elements.urgentKpiTotal.textContent).toBe('1');
    expect(elements.urgentKpiSwaps.textContent).toBe('1');
    expect(elements.urgentKpiUnchanged.textContent).toBe('0');
    expect(elements.urgentLog.textContent).toContain('читаю лист');
    expect(elements.urgentLog.textContent).toContain('Готово');
    expect(elements.urgentOutput.textContent).toContain('Свободный Сергей  @free  08/20');
    expect(elements.urgentSteps.querySelectorAll('.urgent-step-ok')).toHaveLength(4);

    elements.urgentTable.querySelector<HTMLElement>('.urgent-tag')?.click();
    await settle();
    expect(copyText).toHaveBeenCalledWith('@ivan');
    expect(setStatus).toHaveBeenCalledWith('Скопировано: @ivan', 'success');

    elements.urgentCopyButton.click();
    await settle();
    expect(copyText).toHaveBeenLastCalledWith(expect.stringContaining('Свободный Сергей'));

    elements.urgentSearchInput.value = 'нет такого';
    elements.urgentSearchInput.dispatchEvent(new Event('input'));
    expect(elements.urgentTable.textContent).toContain('Ничего не найдено');

    elements.urgentSearchInput.value = '';
    elements.urgentOnlySwapsInput.checked = false;
    elements.urgentOnlySwapsInput.dispatchEvent(new Event('change'));
    expect(elements.urgentTable.querySelectorAll('tbody tr:not(.urgent-group)')).toHaveLength(1);
  });

  it('sorts the table without changing the final text', async () => {
    const schedule: MonthSchedule = {
      ...SCHEDULE,
      people: [
        { name: 'Иванов Иван', tag: '@ivan', team: 1, temporaryLeader: false, row: 8, shifts: { 20: '08/20' }, urgentDays: [1, 2, 3] },
        { name: 'Петров Пётр', tag: '@petr', team: 2, temporaryLeader: false, row: 9, shifts: { 20: '08/20' }, urgentDays: [4] }
      ]
    };
    const text = 'Дежурные на линию "Срочные"\nПоздние:\nИванов Иван  @ivan  08/20\nПетров Пётр  @petr  08/20';
    createUrgentSwapsController({ elements, copyText, setStatus, loadSchedule: vi.fn(async () => schedule) });
    elements.urgentDateInput.value = '2026-09-20';
    elements.urgentTextInput.value = text;
    elements.urgentOnlySwapsInput.checked = false;
    elements.urgentRunButton.click();
    await settle();

    const tags = (): (string | null)[] => [...elements.urgentTable.querySelectorAll('.urgent-tag')].map((element) => element.textContent);
    const outputBefore = elements.urgentOutput.innerHTML;
    const choose = (value: string): void => {
      elements.urgentSortSelect.value = value;
      elements.urgentSortSelect.dispatchEvent(new Event('change'));
    };
    expect(tags()).toEqual(['@ivan', '@petr']);

    choose('name-current:asc');
    expect(tags()).toEqual(['@ivan', '@petr']);

    choose('name-current:desc');
    expect(tags()).toEqual(['@petr', '@ivan']);

    choose('count-current:desc');
    expect(tags()).toEqual(['@ivan', '@petr']);

    choose('count-current:asc');
    expect(tags()).toEqual(['@petr', '@ivan']);

    choose('text');
    expect(tags()).toEqual(['@ivan', '@petr']);
    expect(elements.urgentTable.querySelectorAll('.urgent-group')).toHaveLength(1);

    elements.urgentCopyButton.click();
    await settle();
    expect(copyText).toHaveBeenLastCalledWith(text);
    expect(elements.urgentOutput.innerHTML).toBe(outputBefore);
  });

  it('shows an error, marks the failed step and re-enables the button', async () => {
    const loadSchedule = vi.fn(async () => {
      throw new Error('Нет связи с Google.');
    });
    createUrgentSwapsController({ elements, copyText, setStatus, loadSchedule });
    elements.urgentDateInput.value = '2026-09-20';
    elements.urgentTextInput.value = TEXT;

    elements.urgentRunButton.click();
    await settle();

    expect(elements.urgentError.textContent).toBe('Нет связи с Google.');
    expect(elements.urgentSteps.querySelector('.urgent-step-err')).not.toBeNull();
    expect(elements.urgentLogDetails.open).toBe(true);
    expect(elements.urgentLog.textContent).toContain('ОШИБКА');
    expect(elements.urgentResult.hidden).toBe(true);
    expect(elements.urgentRunButton.disabled).toBe(false);
  });

  it('reports copy failure', async () => {
    const failingCopy = vi.fn(async () => false);
    createUrgentSwapsController({ elements, copyText: failingCopy, setStatus, loadSchedule: vi.fn(async () => SCHEDULE) });
    elements.urgentDateInput.value = '2026-09-20';
    elements.urgentTextInput.value = TEXT;
    elements.urgentRunButton.click();
    await settle();

    elements.urgentCopyButton.click();
    await settle();

    expect(setStatus).toHaveBeenLastCalledWith('Не удалось скопировать.', 'error');
  });
});
