/** @vitest-environment jsdom */

import { describe, expect, it } from 'vitest';
import type { PersonUsage, PlanRow, UrgentPlan } from '../../domain/urgent-swaps/types';
import {
  applyProgressEvent,
  renderOutput,
  renderPlanTable,
  renderSteps,
  renderWarnings
} from './urgent-swaps-renderer';

function usage(name: string, tag: string, count: number, days: number[] = [], team: number | null = 1): PersonUsage {
  return { name, tag, team, count, days, link: 'https://example.test/row' };
}

function row(overrides: Partial<PlanRow> & Pick<PlanRow, 'name'>): PlanRow {
  return { group: 'Поздние', tag: '@x', shift: '08/20', current: null, replacement: null, ...overrides };
}

const PLAN: UrgentPlan = {
  dateLabel: '20.09.2026',
  rows: [
    row({ name: 'Иванов Иван', tag: '@ivan', current: usage('Иванов Иван', '@ivan', 3, [1, 2, 3], 2), replacement: usage('Новый Никита', '@new', 0, [], 4) }),
    row({ name: 'Петров Пётр', tag: '@petr', group: 'Ранние', current: usage('Петров Пётр', '@petr', 1, [4], null) }),
    row({ name: 'Неизвестный Никто', tag: '@nobody', group: 'Ранние' })
  ],
  text: 'Поздние:\nНовый Никита  @new  08/20\n\nРанние:',
  originalText: 'Поздние:\nИванов Иван  @ivan  08/20\n\nРанние:',
  warnings: ['Внимание'],
  checks: []
};

describe('urgent swaps renderer', () => {
  it('applies progress events without changing steps on info', () => {
    const started = applyProgressEvent({}, { stage: 1, state: 'run', message: 'начали' });
    const info = applyProgressEvent(started, { stage: 1, state: 'info', message: 'деталь' });
    const done = applyProgressEvent(info, { stage: 1, state: 'ok', message: 'готово' });

    expect(info).toBe(started);
    expect(done[1]).toEqual({ status: 'ok', message: 'готово' });
  });

  it('renders four steps with statuses', () => {
    const container = document.createElement('div');

    renderSteps(container, { 1: { status: 'ok', message: 'a' }, 2: { status: 'run', message: 'b' }, 3: { status: 'err', message: 'c' } });

    expect(container.children).toHaveLength(4);
    expect(container.children[0].className).toContain('urgent-step-ok');
    expect(container.children[1].className).toContain('urgent-step-run');
    expect(container.children[2].className).toContain('urgent-step-err');
    expect(container.children[3].className).toContain('urgent-step-wait');
  });

  it('renders warnings', () => {
    const warnings = document.createElement('div');

    renderWarnings(warnings, PLAN.warnings);

    expect(warnings.textContent).toBe('Внимание');
  });

  it('renders swaps only by default filter and keeps copyable name and tag', () => {
    const container = document.createElement('div');

    renderPlanTable(container, PLAN, { query: '', onlySwaps: true });

    expect(container.querySelectorAll('tbody tr:not(.urgent-group)')).toHaveLength(1);
    const copyValues = [...container.querySelectorAll<HTMLElement>('[data-copy]')].map((element) => element.dataset.copy);
    expect(copyValues).toEqual(['Иванов Иван', '@ivan', 'Новый Никита', '@new']);
    expect(container.querySelector('.urgent-count-high')?.textContent).toBe('3');
    expect(container.querySelector('.urgent-count-low')?.textContent).toBe('0');
    expect(container.textContent).toContain('числа: 1, 2, 3');
    expect(container.textContent).toContain('не ходил(а)');
  });

  it('shows all rows, unchanged and unknown people', () => {
    const container = document.createElement('div');

    renderPlanTable(container, PLAN, { query: '', onlySwaps: false });

    expect(container.querySelectorAll('tbody tr:not(.urgent-group)')).toHaveLength(3);
    expect(container.querySelectorAll('.urgent-group')).toHaveLength(2);
    expect(container.textContent).toContain('без изменений');
    expect(container.textContent).toContain('не найден в таблице');
  });

  it('filters by name or tag on both sides and highlights the match', () => {
    const container = document.createElement('div');

    renderPlanTable(container, PLAN, { query: '@NEW', onlySwaps: false });
    expect(container.querySelectorAll('tbody tr:not(.urgent-group)')).toHaveLength(1);
    expect(container.querySelector('mark')?.textContent).toBe('@new');

    renderPlanTable(container, PLAN, { query: 'петров', onlySwaps: false });
    expect(container.querySelectorAll('tbody tr:not(.urgent-group)')).toHaveLength(1);

    renderPlanTable(container, PLAN, { query: 'нет такого', onlySwaps: false });
    expect(container.textContent).toContain('Ничего не найдено');
  });

  it('shows the team of each person and marks people outside teams 1-4', () => {
    const container = document.createElement('div');

    renderPlanTable(container, PLAN, { query: '', onlySwaps: false });

    const meta = [...container.querySelectorAll('.urgent-shift')].map((element) => element.textContent);
    expect(meta[0]).toContain('Команда 2 · 08/20');
    expect(meta[1]).toContain('Команда 4 · 08/20');
    expect(meta[2]).toContain('вне команд 1–4 · 08/20');
    expect(meta[3]).not.toContain('Команда');
  });

  it('sorts rows flat with a group chip and without group headers', () => {
    const container = document.createElement('div');

    renderPlanTable(container, PLAN, { query: '', onlySwaps: false, sort: { key: 'count-current', direction: 'asc' } });

    const tags = [...container.querySelectorAll('.urgent-tag')].map((element) => element.textContent);
    expect(tags.slice(0, 2)).toEqual(['@petr', '@ivan']);
    expect(container.querySelectorAll('.urgent-group')).toHaveLength(0);
    expect([...container.querySelectorAll('.urgent-group-chip')].map((element) => element.textContent)).toEqual(['Ранние', 'Поздние', 'Ранние']);
  });

  it('combines sorting with search and the swaps-only filter', () => {
    const container = document.createElement('div');

    renderPlanTable(container, PLAN, { query: 'петров', onlySwaps: false, sort: { key: 'name-current', direction: 'desc' } });
    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);

    renderPlanTable(container, PLAN, { query: '', onlySwaps: true, sort: { key: 'name-replacement', direction: 'asc' } });
    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
  });

  it('highlights changed lines in the output', () => {
    const container = document.createElement('div');

    renderOutput(container, PLAN);

    expect(container.children).toHaveLength(4);
    expect(container.children[1].className).toContain('urgent-line-changed');
    expect(container.children[0].className).not.toContain('urgent-line-changed');
  });
});
