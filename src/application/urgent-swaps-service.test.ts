import { describe, expect, it, vi } from 'vitest';
import type { MonthSchedule, ProgressEvent } from '../domain/urgent-swaps/types';
import { parsePlanDate, runUrgentSwaps, tomorrowIso } from './urgent-swaps-service';

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

describe('urgent swaps service', () => {
  it('parses valid ISO dates and rejects invalid ones', () => {
    expect(parsePlanDate('2026-09-20')).toEqual({ year: 2026, month: 9, day: 20 });
    expect(parsePlanDate('2026-02-30')).toBeNull();
    expect(parsePlanDate('20.09.2026')).toBeNull();
    expect(parsePlanDate('')).toBeNull();
  });

  it('builds tomorrow date across month and year boundaries', () => {
    expect(tomorrowIso(new Date(2026, 8, 19, 23, 30))).toBe('2026-09-20');
    expect(tomorrowIso(new Date(2026, 11, 31, 10, 0))).toBe('2027-01-01');
  });

  it('runs all steps and returns a plan', async () => {
    const events: ProgressEvent[] = [];
    const loadSchedule = vi.fn(async (_date, onProgress?: (message: string) => void) => {
      onProgress?.('запрос');
      return SCHEDULE;
    });

    const plan = await runUrgentSwaps({ dateIso: '2026-09-20', botText: TEXT }, { loadSchedule, onProgress: (event) => events.push(event) });

    expect(plan.rows[0].replacement?.name).toBe('Свободный Сергей');
    expect(loadSchedule).toHaveBeenCalledWith({ year: 2026, month: 9, day: 20 }, expect.any(Function));
    expect(events.filter((event) => event.state === 'ok').map((event) => event.stage)).toEqual([1, 2, 3, 4]);
    expect(events.some((event) => event.stage === 2 && event.state === 'info' && event.message === 'запрос')).toBe(true);
  });

  it('fails on bad date or missing duties before touching the network', async () => {
    const loadSchedule = vi.fn();
    const onProgress = vi.fn();

    await expect(runUrgentSwaps({ dateIso: 'x', botText: TEXT }, { loadSchedule, onProgress })).rejects.toThrow('дату');
    await expect(runUrgentSwaps({ dateIso: '2026-09-20', botText: 'пусто' }, { loadSchedule, onProgress })).rejects.toThrow('Дежурные');
    expect(loadSchedule).not.toHaveBeenCalled();
  });
});
