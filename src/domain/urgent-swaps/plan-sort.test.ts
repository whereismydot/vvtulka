import { describe, expect, it } from 'vitest';
import { sortPlanRows } from './plan-sort';
import type { PersonUsage, PlanRow } from './types';

function usage(name: string, count: number, team: number | null): PersonUsage {
  return { name, tag: `@${name}`, team, count, days: [], link: '#' };
}

function row(name: string, shift: string, current: PersonUsage | null, replacement: PersonUsage | null = null): PlanRow {
  return { group: 'Поздние', name, tag: `@${name}`, shift, current, replacement };
}

const ROWS: readonly PlanRow[] = [
  row('Борис', '12/24', usage('Борис', 2, 3), usage('Яков', 0, 2)),
  row('Алла', '08/20', usage('Алла', 3, 1)),
  row('Ёлкин', '08/20', usage('Ёлкин', 2, null), usage('Эдуард', 1, 4)),
  row('Вера', '07/19', null)
];

const names = (rows: readonly PlanRow[]): string[] => rows.map((item) => item.name);

describe('plan sort', () => {
  it('keeps the original order for the text key and returns a copy', () => {
    const sorted = sortPlanRows(ROWS, 'text', 'desc');

    expect(names(sorted)).toEqual(['Борис', 'Алла', 'Ёлкин', 'Вера']);
    expect(sorted).not.toBe(ROWS);
  });

  it('sorts by current name with russian collation in both directions', () => {
    expect(names(sortPlanRows(ROWS, 'name-current', 'asc'))).toEqual(['Алла', 'Борис', 'Вера', 'Ёлкин']);
    expect(names(sortPlanRows(ROWS, 'name-current', 'desc'))).toEqual(['Ёлкин', 'Вера', 'Борис', 'Алла']);
  });

  it('sorts by counts and keeps rows without value at the end in both directions', () => {
    expect(names(sortPlanRows(ROWS, 'count-current', 'desc'))).toEqual(['Алла', 'Борис', 'Ёлкин', 'Вера']);
    expect(names(sortPlanRows(ROWS, 'count-current', 'asc'))).toEqual(['Борис', 'Ёлкин', 'Алла', 'Вера']);
    expect(names(sortPlanRows(ROWS, 'count-replacement', 'asc'))).toEqual(['Борис', 'Ёлкин', 'Алла', 'Вера']);
    expect(names(sortPlanRows(ROWS, 'count-replacement', 'desc'))).toEqual(['Ёлкин', 'Борис', 'Алла', 'Вера']);
  });

  it('sorts by team and puts people outside teams 1-4 at the end', () => {
    expect(names(sortPlanRows(ROWS, 'team-current', 'asc'))).toEqual(['Алла', 'Борис', 'Ёлкин', 'Вера']);
    expect(names(sortPlanRows(ROWS, 'team-replacement', 'asc'))).toEqual(['Борис', 'Ёлкин', 'Алла', 'Вера']);
  });

  it('sorts by shift and is stable for equal values', () => {
    expect(names(sortPlanRows(ROWS, 'shift', 'asc'))).toEqual(['Вера', 'Алла', 'Ёлкин', 'Борис']);
    expect(names(sortPlanRows(ROWS, 'shift', 'desc'))).toEqual(['Борис', 'Алла', 'Ёлкин', 'Вера']);
  });

  it('never mutates the source rows', () => {
    const before = names(ROWS);

    sortPlanRows(ROWS, 'name-current', 'asc');

    expect(names(ROWS)).toEqual(before);
  });
});
