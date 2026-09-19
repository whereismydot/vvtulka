import { describe, expect, it, vi } from 'vitest';
import { createScheduleClient, isNewbieColor, isTemporaryLeaderColor, isUrgentColor, ScheduleLoadError, serialToDate, type FetchLike } from './schedule-client';

// 46266 = 01.09.2026, 46267 = 02.09.2026 (дни от 30.12.1899)
const SEP_FIRST = 46266;

function cell(value: string | undefined, urgent = false): object {
  return {
    formattedValue: value,
    effectiveFormat: { backgroundColor: urgent ? { red: 1, blue: 1 } : { red: 1, green: 1, blue: 1 } }
  };
}

function row(name: string | undefined, tag: string, first: string, second: string, urgentSecond = false, nameColor?: object): object {
  const nameCell = { formattedValue: name, effectiveFormat: { backgroundColor: nameColor } };
  const cells: object[] = [{}, {}, {}, nameCell, { formattedValue: tag }, cell(first), cell(second, urgentSecond)];
  return { values: cells };
}

function okResponse(payload: unknown): Awaited<ReturnType<FetchLike>> {
  return { ok: true, status: 200, text: async () => JSON.stringify(payload) };
}

function createFetch(overrides: { grid?: unknown; headerSerial?: number } = {}): ReturnType<typeof vi.fn> {
  return vi.fn(async (url: string) => {
    if (url.includes('values:batchGet')) {
      return okResponse({ valueRanges: [{ values: [[overrides.headerSerial ?? SEP_FIRST, (overrides.headerSerial ?? SEP_FIRST) + 1]] }] });
    }
    if (url.includes('includeGridData')) {
      return okResponse(
        overrides.grid ?? {
          sheets: [
            {
              data: [
                {
                  rowData: [
                    {}, {}, {}, {}, {}, {},
                    row('Команда №1 (Лидер Один)', ' @Lead1 ', '08/20', '08/20'),
                    row('Иванов Иван  Иванович', '@ivan', '8/20', '08/20', true),
                    row('Иванов Иван Иванович', '@dup', '08/20', '08/20'),
                    row(undefined, '', '08/20', '08/20'),
                    row('Одно', '', '08/20', '08/20'),
                    row('Петров Пётр', '', 'В', '12/24'),
                    row('Временный Лидер Иванович', '@tmp', '08/20', '08/20', false, { red: 0.69, green: 0.988, blue: 0.988 }),
                    row('Команда Ночная поддержка (ДВ)', '@night_lead', '', ''),
                    row('Ночной Никита Ночевич', '@night', '08/20', '08/20')
                  ]
                }
              ]
            }
          ]
        }
      );
    }
    return okResponse({
      sheets: [
        { properties: { title: 'Лист1', sheetId: 1 } },
        { properties: { title: 'График операторов - СЕНТЯБРЬ', sheetId: 42 } },
        { properties: { title: 'График операторов - скрытый', hidden: true, sheetId: 5 } }
      ]
    });
  });
}

describe('schedule client helpers', () => {
  it('detects magenta fill only', () => {
    expect(isUrgentColor({ red: 1, blue: 1 })).toBe(true);
    expect(isUrgentColor({ red: 1, green: 1, blue: 1 })).toBe(false);
    expect(isUrgentColor({ green: 1 })).toBe(false);
    expect(isUrgentColor(undefined)).toBe(false);
  });

  it('detects the turquoise temporary leader fill with small shade tolerance', () => {
    expect(isTemporaryLeaderColor({ red: 0.69, green: 0.988, blue: 0.988 })).toBe(true);
    expect(isTemporaryLeaderColor({ red: 0.686, green: 0.988, blue: 0.988 })).toBe(true);
    expect(isTemporaryLeaderColor({ red: 0, green: 1, blue: 1 })).toBe(false);
    expect(isTemporaryLeaderColor({ red: 1, green: 1, blue: 1 })).toBe(false);
    expect(isTemporaryLeaderColor(undefined)).toBe(false);
  });

  it('detects the light green newbie fill only', () => {
    expect(isNewbieColor({ red: 0.851, green: 0.918, blue: 0.827 })).toBe(true);
    expect(isNewbieColor({ red: 0.69, green: 0.988, blue: 0.988 })).toBe(false);
    expect(isNewbieColor({ red: 1, green: 1, blue: 1 })).toBe(false);
    expect(isNewbieColor(undefined)).toBe(false);
  });

  it('converts sheet serials to calendar dates in UTC', () => {
    expect(serialToDate(SEP_FIRST)).toEqual({ year: 2026, month: 9, day: 1 });
    expect(serialToDate(SEP_FIRST + 30)).toEqual({ year: 2026, month: 10, day: 1 });
    expect(serialToDate(Number.NaN)).toBeNull();
  });
});

describe('schedule client', () => {
  it('loads the month sheet, people, shifts and urgent days', async () => {
    const fetchFn = createFetch();
    const progress: string[] = [];
    const load = createScheduleClient({ spreadsheetId: 'ID', apiKey: 'KEY', fetchFn });

    const schedule = await load({ year: 2026, month: 9, day: 20 }, (message) => progress.push(message));

    expect(schedule).toMatchObject({ sheetTitle: 'График операторов - СЕНТЯБРЬ', sheetGid: 42, spreadsheetId: 'ID' });
    expect(schedule.people).toEqual([
      { name: 'Иванов Иван Иванович', tag: '@ivan', team: 1, temporaryLeader: false, newbie: false, row: 8, shifts: { 1: '08/20', 2: '08/20' }, urgentDays: [2] },
      { name: 'Петров Пётр', tag: '', team: 1, temporaryLeader: false, newbie: false, row: 12, shifts: { 2: '12/24' }, urgentDays: [] },
      { name: 'Временный Лидер Иванович', tag: '@tmp', team: 1, temporaryLeader: true, newbie: false, row: 13, shifts: { 1: '08/20', 2: '08/20' }, urgentDays: [] },
      { name: 'Ночной Никита Ночевич', tag: '@night', team: null, temporaryLeader: false, newbie: false, row: 15, shifts: { 1: '08/20', 2: '08/20' }, urgentDays: [] }
    ]);
    expect(schedule.leaderTags).toEqual(['@lead1']);
    expect(progress.length).toBeGreaterThanOrEqual(4);
    expect(fetchFn.mock.calls.every(([url]) => String(url).includes('key=KEY'))).toBe(true);
  });

  it('keeps the first of people with the same name ignoring case and yo and reports duplicates', async () => {
    const grid = {
      sheets: [
        {
          data: [
            {
              rowData: [
                {}, {}, {}, {}, {}, {},
                row('Команда №1 (Лидер Один)', '@lead1', '', ''),
                row('Королёв Пётр', '@a', '08/20', '08/20'),
                row('королев пётр', '@b', '08/20', '08/20'),
                row('Королёв  Пётр', '@c', '08/20', '08/20')
              ]
            }
          ]
        }
      ]
    };
    const load = createScheduleClient({ spreadsheetId: 'ID', apiKey: 'KEY', fetchFn: createFetch({ grid }) });

    const schedule = await load({ year: 2026, month: 9, day: 1 });

    expect(schedule.people.map((person) => person.tag)).toEqual(['@a']);
    expect(schedule.duplicateNames).toEqual(['Королёв Пётр']);
    expect(schedule.truncated).toBe(false);
  });

  it('does not report duplicate names outside teams 1-4', async () => {
    const grid = {
      sheets: [
        {
          data: [
            {
              rowData: [
                {}, {}, {}, {}, {}, {},
                row('Команда №1 (Лидер Один)', '@lead1', '', ''),
                row('Королёв Пётр', '@a', '08/20', '08/20'),
                row('Команда Стажёры', '', '', ''),
                row('Королёв Пётр', '@b', '08/20', '08/20')
              ]
            }
          ]
        }
      ]
    };
    const load = createScheduleClient({ spreadsheetId: 'ID', apiKey: 'KEY', fetchFn: createFetch({ grid }) });

    const schedule = await load({ year: 2026, month: 9, day: 1 });

    expect(schedule.people.map((person) => person.tag)).toEqual(['@a']);
    expect(schedule.duplicateNames).toEqual([]);
  });

  it('marks the schedule as truncated when the last requested row still has a name', async () => {
    const filler = Array.from({ length: 6 }, () => ({}));
    const middle = Array.from({ length: 1000 - 6 - 1 }, () => ({}));
    const grid = { sheets: [{ data: [{ rowData: [...filler, ...middle, row('Хвостов Хвост', '@tail', '08/20', '08/20')] }] }] };
    const load = createScheduleClient({ spreadsheetId: 'ID', apiKey: 'KEY', fetchFn: createFetch({ grid }) });

    const schedule = await load({ year: 2026, month: 9, day: 1 });

    expect(schedule.truncated).toBe(true);
  });

  it('escapes apostrophes in sheet titles inside A1 ranges', async () => {
    const calls: string[] = [];
    const fetchFn = vi.fn(async (url: string) => {
      calls.push(url);
      if (url.includes('values:batchGet')) {
        return okResponse({ valueRanges: [{ values: [[SEP_FIRST]] }] });
      }
      if (url.includes('includeGridData')) {
        return okResponse({ sheets: [{ data: [{ rowData: [] }] }] });
      }
      return okResponse({ sheets: [{ properties: { title: "График операторов - Иван's", sheetId: 3 } }] });
    });
    const load = createScheduleClient({ spreadsheetId: 'ID', apiKey: 'KEY', fetchFn });

    await load({ year: 2026, month: 9, day: 1 });

    const decoded = calls.map((url) => decodeURIComponent(url.replace(/\+/g, ' ')));
    expect(decoded.some((url) => url.includes("'График операторов - Иван''s'!F3:AJ3"))).toBe(true);
    expect(decoded.some((url) => url.includes("'График операторов - Иван''s'!A1:AK1000"))).toBe(true);
  });

  it('reports a readable error when Google returns a non-JSON body', async () => {
    const load = createScheduleClient({
      spreadsheetId: 'ID',
      apiKey: 'KEY',
      fetchFn: async () => ({ ok: true, status: 200, text: async () => '<html>oops</html>' })
    });

    await expect(load({ year: 2026, month: 9, day: 1 })).rejects.toThrow('неожиданный ответ');
  });

  it('fails before any request when the API key is not configured', async () => {
    const fetchFn = createFetch();
    const load = createScheduleClient({ spreadsheetId: 'ID', apiKey: '', fetchFn });

    await expect(load({ year: 2026, month: 9, day: 1 })).rejects.toThrow('Ключ Google Sheets API не задан');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('fails clearly when there is no sheet for the requested month', async () => {
    const load = createScheduleClient({ spreadsheetId: 'ID', apiKey: 'KEY', fetchFn: createFetch() });

    await expect(load({ year: 2026, month: 11, day: 2 })).rejects.toThrow('за 11.2026');
  });

  it('fails when the spreadsheet has no schedule sheets', async () => {
    const fetchFn = vi.fn(async () => okResponse({ sheets: [{ properties: { title: 'Другое' } }] }));
    const load = createScheduleClient({ spreadsheetId: 'ID', apiKey: 'KEY', fetchFn });

    await expect(load({ year: 2026, month: 9, day: 1 })).rejects.toBeInstanceOf(ScheduleLoadError);
  });

  it('maps HTTP and network failures to readable messages', async () => {
    const forbidden = createScheduleClient({
      spreadsheetId: 'ID',
      apiKey: 'KEY',
      fetchFn: async () => ({ ok: false, status: 403, text: async () => '' })
    });
    const broken = createScheduleClient({
      spreadsheetId: 'ID',
      apiKey: 'KEY',
      fetchFn: async () => ({ ok: false, status: 500, text: async () => '' })
    });
    const offline = createScheduleClient({
      spreadsheetId: 'ID',
      apiKey: 'KEY',
      fetchFn: async () => {
        throw new TypeError('Failed to fetch');
      }
    });
    const target = { year: 2026, month: 9, day: 1 };

    await expect(forbidden(target)).rejects.toThrow('ограничения по домену');
    await expect(broken(target)).rejects.toThrow('ошибкой 500');
    await expect(offline(target)).rejects.toThrow('Нет связи с Google');
  });
});
