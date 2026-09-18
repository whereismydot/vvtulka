import type { MonthSchedule, PlanDate, SchedulePerson } from '../../domain/urgent-swaps/types';
import { normalizeShift } from '../../domain/urgent-swaps/bot-text-parser';

const API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const SHEET_TITLE_MARKER = 'график операторов';
const NAME_COLUMN = 3;
const TAG_COLUMN = 4;
const FIRST_DAY_COLUMN = 5;
const FIRST_DATA_ROW = 6;
const LAST_ROW = 700;
const SHIFT_PATTERN = /^\d{1,2}\/\d{1,2}$/;
const EPOCH_UTC = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 86_400_000;

export type FetchLike = (url: string) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

export interface ScheduleClientOptions {
  readonly spreadsheetId: string;
  readonly apiKey: string;
  readonly fetchFn?: FetchLike;
}

interface ChosenSheet {
  readonly title: string;
  readonly gid: number;
  readonly dayColumns: ReadonlyMap<number, number>;
}

interface SheetMeta {
  readonly sheets?: ReadonlyArray<{ properties: { title: string; hidden?: boolean; sheetId?: number } }>;
}

interface CellData {
  readonly formattedValue?: string;
  readonly effectiveFormat?: { backgroundColor?: { red?: number; green?: number; blue?: number } };
}

interface GridResponse {
  readonly sheets?: ReadonlyArray<{ data?: ReadonlyArray<{ rowData?: ReadonlyArray<{ values?: readonly CellData[] }> }> }>;
}

interface ValuesResponse {
  readonly valueRanges?: ReadonlyArray<{ values?: unknown[][] }>;
}

/**
 * Ошибка чтения таблицы с сообщением, пригодным для показа пользователю.
 */
export class ScheduleLoadError extends Error {}

/**
 * Проверяет, что цвет заливки — «срочный» (#FF00FF).
 *
 * @param color Цвет из ответа API (компоненты 0..1, нулевые опускаются).
 * @returns `true` для фиолетово-пурпурной заливки.
 */
export function isUrgentColor(color: { red?: number; green?: number; blue?: number } | undefined): boolean {
  if (color === undefined) {
    return false;
  }
  return (color.red ?? 0) > 0.95 && (color.green ?? 0) < 0.05 && (color.blue ?? 0) > 0.95;
}

/**
 * Переводит серийный номер даты Google Sheets в год/месяц/день (UTC, без влияния часового пояса).
 *
 * @param serial Число дней от 30.12.1899.
 * @returns Дата или `null`, если число не подходит.
 */
export function serialToDate(serial: number): PlanDate | null {
  if (!Number.isFinite(serial)) {
    return null;
  }
  const date = new Date(EPOCH_UTC + Math.trunc(serial) * MS_PER_DAY);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export type ScheduleLoader = (target: PlanDate, onProgress?: (message: string) => void) => Promise<MonthSchedule>;

/**
 * Создаёт клиент чтения графика операторов (только GET-запросы к Sheets API).
 *
 * @param options Идентификатор таблицы, ключ API и (опционально) fetch.
 * @returns Функция загрузки графика за месяц выбранной даты.
 */
export function createScheduleClient(options: ScheduleClientOptions): ScheduleLoader {
  const fetchFn: FetchLike = options.fetchFn ?? ((url) => fetch(url));

  async function getJson<T>(path: string, params: ReadonlyArray<readonly [string, string]>): Promise<T> {
    const query = new URLSearchParams([...params.map(([name, value]) => [name, value]), ['key', options.apiKey]]);
    let response;
    try {
      response = await fetchFn(`${API_BASE}/${options.spreadsheetId}${path}?${query.toString()}`);
    } catch {
      throw new ScheduleLoadError('Нет связи с Google. Проверьте интернет и повторите.');
    }
    const body = await response.text();
    if (!response.ok) {
      if (response.status === 403 || response.status === 400) {
        throw new ScheduleLoadError(`Google отклонил запрос (${response.status}). Проверьте ключ API и его ограничения по домену.`);
      }
      throw new ScheduleLoadError(`Google ответил ошибкой ${response.status}.`);
    }
    return JSON.parse(body) as T;
  }

  return async function loadSchedule(target, log = () => undefined): Promise<MonthSchedule> {
    if (options.apiKey === '') {
      throw new ScheduleLoadError('Ключ Google Sheets API не задан. Укажите VITE_SHEETS_API_KEY при сборке.');
    }
    log('Запрашиваю список листов');
    const meta = await getJson<SheetMeta>('', [['fields', 'sheets.properties(title,hidden,sheetId)']]);
    const candidates = (meta.sheets ?? [])
      .map((sheet) => sheet.properties)
      .filter((props) => props.hidden !== true && props.title.toLowerCase().includes(SHEET_TITLE_MARKER));
    log(`Листов «График операторов» (видимых): ${candidates.length}`);
    if (candidates.length === 0) {
      throw new ScheduleLoadError('В таблице нет видимых листов «График операторов».');
    }

    const headers = await getJson<ValuesResponse>('/values:batchGet', [
      ...candidates.map((props) => ['ranges', `'${props.title}'!F3:AJ3`] as const),
      ['valueRenderOption', 'UNFORMATTED_VALUE'],
      ['dateTimeRenderOption', 'SERIAL_NUMBER']
    ]);

    let chosen: ChosenSheet | null = null;
    for (const [index, props] of candidates.entries()) {
      const row = headers.valueRanges?.[index]?.values?.[0] ?? [];
      const dayColumns = new Map<number, number>();
      let first: PlanDate | null = null;
      row.forEach((value, offset) => {
        const date = typeof value === 'number' ? serialToDate(value) : null;
        if (date !== null) {
          first = first ?? date;
          dayColumns.set(FIRST_DAY_COLUMN + offset, date.day);
        }
      });
      const firstDate = first as PlanDate | null;
      if (firstDate !== null && firstDate.year === target.year && firstDate.month === target.month) {
        chosen = { title: props.title, gid: props.sheetId ?? 0, dayColumns };
        break;
      }
    }
    if (chosen === null) {
      const label = `${String(target.month).padStart(2, '0')}.${target.year}`;
      throw new ScheduleLoadError(`Не найден лист «График операторов» за ${label}.`);
    }

    const { title, gid, dayColumns } = chosen;
    log(`Выбран лист «${title}». Запрашиваю ячейки A1:AK${LAST_ROW}`);
    const grid = await getJson<GridResponse>('', [
      ['ranges', `'${title}'!A1:AK${LAST_ROW}`],
      ['includeGridData', 'true'],
      ['fields', 'sheets.data.rowData.values(formattedValue,effectiveFormat.backgroundColor)']
    ]);
    const rows = grid.sheets?.[0]?.data?.[0]?.rowData ?? [];
    log(`Получено строк: ${rows.length}`);

    const people: SchedulePerson[] = [];
    const seen = new Set<string>();
    for (let rowIndex = FIRST_DATA_ROW; rowIndex < rows.length; rowIndex += 1) {
      const cells = rows[rowIndex].values ?? [];
      const rawName = cells[NAME_COLUMN]?.formattedValue;
      if (rawName === undefined) {
        continue;
      }
      const name = rawName.split(/\s+/).filter(Boolean).join(' ');
      if (name.split(' ').length < 2 || name.startsWith('Команда') || seen.has(name)) {
        continue;
      }
      seen.add(name);

      const shifts: Record<number, string> = {};
      const urgentDays: number[] = [];
      dayColumns.forEach((day, column) => {
        const value = (cells[column]?.formattedValue ?? '').trim();
        if (!SHIFT_PATTERN.test(value)) {
          return;
        }
        shifts[day] = normalizeShift(value);
        if (isUrgentColor(cells[column]?.effectiveFormat?.backgroundColor)) {
          urgentDays.push(day);
        }
      });
      people.push({ name, tag: cells[TAG_COLUMN]?.formattedValue ?? '', row: rowIndex + 1, shifts, urgentDays });
    }

    return { sheetTitle: title, sheetGid: gid, spreadsheetId: options.spreadsheetId, people };
  };
}
