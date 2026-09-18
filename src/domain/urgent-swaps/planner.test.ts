import { describe, expect, it } from 'vitest';
import { formatPlanDate, planUrgentSwaps } from './planner';
import type { MonthSchedule, ProgressEvent, SchedulePerson } from './types';

function person(
  name: string,
  tag: string,
  shift: string | null,
  urgentDays: number[] = [],
  extra: Partial<Pick<SchedulePerson, 'team' | 'temporaryLeader' | 'row'>> = {}
): SchedulePerson {
  return { name, tag, team: 1, temporaryLeader: false, row: 10, shifts: shift === null ? {} : { 20: shift }, urgentDays, ...extra };
}

function scheduleOf(...people: SchedulePerson[]): MonthSchedule {
  return { sheetTitle: 'График', sheetGid: 7, spreadsheetId: 'SHEET', people, leaderTags: ['@teamlead'] };
}

const DATE = { year: 2026, month: 9, day: 20 };

function botText(...duties: string[]): string {
  return ['График лидеров', 'Лидер Лидеров  @lead  08/20', '', 'Дежурные на линию "Срочные"', '', 'Поздние:', ...duties].join('\n');
}

describe('urgent swaps planner', () => {
  it('formats date as DD.MM.YYYY', () => {
    expect(formatPlanDate({ year: 2026, month: 3, day: 5 })).toBe('05.03.2026');
  });

  it('swaps a frequent duty for a same-shift person with fewer urgent days', () => {
    const plan = planUrgentSwaps({
      date: DATE,
      botText: botText('Иванов Иван  @ivan  08/20'),
      schedule: scheduleOf(person('Иванов Иван', '@ivan', '08/20', [3, 8, 19]), person('Свободный Сергей', '@free', '08/20', [5]))
    });

    expect(plan.rows[0].current?.count).toBe(3);
    expect(plan.rows[0].replacement).toMatchObject({ name: 'Свободный Сергей', tag: '@free', count: 1, days: [5] });
    expect(plan.text).toContain('Свободный Сергей  @free  08/20');
    expect(plan.text).not.toContain('Иванов Иван');
    expect(plan.checks.every((check) => check.ok)).toBe(true);
    expect(plan.rows[0].current?.link).toBe('https://docs.google.com/spreadsheets/d/SHEET/edit#gid=7&range=D10');
  });

  it('counts only urgent days before the selected day', () => {
    const plan = planUrgentSwaps({
      date: DATE,
      botText: botText('Иванов Иван  @ivan  08/20'),
      schedule: scheduleOf(person('Иванов Иван', '@ivan', '08/20', [3, 20, 25]))
    });

    expect(plan.rows[0].current).toMatchObject({ count: 1, days: [3] });
  });

  it('does not swap when candidate has no fewer urgent days or another shift', () => {
    const plan = planUrgentSwaps({
      date: DATE,
      botText: botText('Иванов Иван  @ivan  08/20'),
      schedule: scheduleOf(
        person('Иванов Иван', '@ivan', '08/20', [3]),
        person('Равный Роман', '@equal', '08/20', [4]),
        person('Другой Дмитрий', '@other', '12/24', []),
        person('Выходной Вадим', '@off', null, [])
      )
    });

    expect(plan.rows[0].replacement).toBeNull();
    expect(plan.text).toContain('Иванов Иван  @ivan  08/20');
  });

  it('never picks a candidate twice, nor anyone already on duty or a leader', () => {
    const plan = planUrgentSwaps({
      date: DATE,
      botText: botText('Иванов Иван  @ivan  08/20', 'Петров Пётр  @petr  08/20', 'Сидоров Сидор  @sid  08/20'),
      schedule: scheduleOf(
        person('Иванов Иван', '@ivan', '08/20', [1, 2, 3]),
        person('Петров Пётр', '@petr', '08/20', [1, 2, 3, 4]),
        person('Сидоров Сидор', '@sid', '08/20', [1, 2]),
        person('Лидер Лидеров', '@lead', '08/20', []),
        person('Первый Пётр', '@first', '08/20', []),
        person('Второй Павел', '@second', '08/20', [1])
      )
    });

    const replacements = plan.rows.map((row) => row.replacement?.name ?? null);
    expect(replacements).toEqual(['Второй Павел', 'Первый Пётр', null]);
    const picked = replacements.filter((name): name is string => name !== null);
    expect(new Set(picked).size).toBe(picked.length);
    expect(picked).not.toContain('Лидер Лидеров');
    expect(picked).not.toContain('Иванов Иван');
    expect(plan.checks.every((check) => check.ok)).toBe(true);
  });

  it('skips candidates whose tag is already taken', () => {
    const plan = planUrgentSwaps({
      date: DATE,
      botText: botText('Иванов Иван  @ivan  08/20'),
      schedule: scheduleOf(person('Иванов Иван', '@ivan', '08/20', [3, 4]), person('Двойник Дмитрий', '@IVAN', '08/20', []))
    });

    expect(plan.rows[0].replacement).toBeNull();
  });

  it('warns about unknown people and missing tags', () => {
    const plan = planUrgentSwaps({
      date: DATE,
      botText: botText('Неизвестный Никто  @nobody  08/20', 'Иванов Иван  @ivan  08/20'),
      schedule: scheduleOf(person('Иванов Иван', '@ivan', '08/20', [1, 2]), person('Без Тега', '', '08/20', []))
    });

    expect(plan.rows[0].current).toBeNull();
    expect(plan.rows[0].replacement).toBeNull();
    expect(plan.warnings.some((warning) => warning.includes('Неизвестный Никто'))).toBe(true);
    expect(plan.warnings.some((warning) => warning.includes('нет тега'))).toBe(true);
  });

  it('warns about duplicates and leaders inside the duty list', () => {
    const plan = planUrgentSwaps({
      date: DATE,
      botText: botText('Иванов Иван  @ivan  08/20', 'иванов иван  @ivan2  08/20', 'Лидер Лидеров  @lead  08/20'),
      schedule: scheduleOf(person('Иванов Иван', '@ivan', '08/20', []), person('Лидер Лидеров', '@lead', '08/20', []))
    });

    expect(plan.warnings.some((warning) => warning.includes('больше одного раза'))).toBe(true);
    expect(plan.warnings.some((warning) => warning.includes('и в лидерах, и в срочных'))).toBe(true);
  });

  it('reports progress and throws when there are no duties', () => {
    const events: ProgressEvent[] = [];
    planUrgentSwaps({
      date: DATE,
      botText: botText('Иванов Иван  @ivan  08/20'),
      schedule: scheduleOf(person('Иванов Иван', '@ivan', '08/20', [1])),
      onProgress: (event) => events.push(event)
    });

    expect(events.map((event) => event.stage)).toContain(3);
    expect(events.filter((event) => event.state === 'ok').map((event) => event.stage)).toEqual([3, 4]);
    expect(() => planUrgentSwaps({ date: DATE, botText: 'нет списка', schedule: scheduleOf() })).toThrow('Дежурные на линию');
  });

  it('never picks temporary leaders, team leaders or people outside teams 1-4', () => {
    const plan = planUrgentSwaps({
      date: DATE,
      botText: botText('Иванов Иван  @ivan  08/20'),
      schedule: scheduleOf(
        person('Иванов Иван', '@ivan', '08/20', [1, 2, 3]),
        person('Временный Тимур', '@tmp', '08/20', [], { temporaryLeader: true }),
        person('Лидер Команды', '@TeamLead', '08/20', []),
        person('Ночной Никита', '@night', '08/20', [], { team: null })
      )
    });

    expect(plan.rows[0].replacement).toBeNull();
  });

  it('still recognises current duties who work outside teams 1-4', () => {
    const plan = planUrgentSwaps({
      date: DATE,
      botText: botText('Ночной Никита  @night  08/20'),
      schedule: scheduleOf(person('Ночной Никита', '@night', '08/20', [1, 2], { team: null }), person('Свободный Сергей', '@free', '08/20', []))
    });

    expect(plan.rows[0].current?.count).toBe(2);
    expect(plan.rows[0].replacement?.name).toBe('Свободный Сергей');
  });

  it('respects minDifference', () => {
    const plan = planUrgentSwaps({
      date: DATE,
      botText: botText('Иванов Иван  @ivan  08/20'),
      minDifference: 2,
      schedule: scheduleOf(person('Иванов Иван', '@ivan', '08/20', [1, 2]), person('Чуть Меньше', '@less', '08/20', [1]))
    });

    expect(plan.rows[0].replacement).toBeNull();
  });
});
