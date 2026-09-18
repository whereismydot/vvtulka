import { parseBotText } from '../domain/urgent-swaps/bot-text-parser';
import { planUrgentSwaps } from '../domain/urgent-swaps/planner';
import type { PlanDate, ProgressEvent, UrgentPlan } from '../domain/urgent-swaps/types';
import type { ScheduleLoader } from '../infrastructure/google-sheets/schedule-client';

export interface UrgentSwapsRequest {
  /** Дата в формате `ГГГГ-ММ-ДД` (значение `<input type="date">`). */
  readonly dateIso: string;
  readonly botText: string;
}

export interface UrgentSwapsDependencies {
  readonly loadSchedule: ScheduleLoader;
  readonly onProgress: (event: ProgressEvent) => void;
}

/**
 * Разбирает дату из `<input type="date">` без участия часового пояса.
 *
 * @param value Строка `ГГГГ-ММ-ДД`.
 * @returns Дата или `null`, если строка некорректна.
 */
export function parsePlanDate(value: string): PlanDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (match === null) {
    return null;
  }

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    return null;
  }

  return { year, month, day };
}

/**
 * Возвращает завтрашнюю дату в формате `ГГГГ-ММ-ДД` для значения по умолчанию.
 *
 * @param now Текущий момент.
 * @returns Строка даты.
 */
export function tomorrowIso(now: Date): string {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
}

/**
 * Выполняет подбор замен: разбор текста, чтение графика, расчёт. Шаги сообщаются через `onProgress`.
 *
 * @param request Дата и текст бота.
 * @param dependencies Загрузчик графика и приёмник прогресса.
 * @returns План замен.
 */
export async function runUrgentSwaps(request: UrgentSwapsRequest, dependencies: UrgentSwapsDependencies): Promise<UrgentPlan> {
  const { loadSchedule, onProgress } = dependencies;

  const date = parsePlanDate(request.dateIso);
  if (date === null) {
    throw new Error('Укажите корректную дату распределения.');
  }

  onProgress({ stage: 1, state: 'run', message: 'Читаю текст бота' });
  const parsed = parseBotText(request.botText);
  if (parsed.duties.length === 0) {
    throw new Error('В тексте не найден список «Дежурные на линию Срочные».');
  }
  const late = parsed.duties.filter((duty) => duty.group === 'Поздние').length;
  onProgress({ stage: 1, state: 'info', message: `Поздние: ${late}, Ранние: ${parsed.duties.length - late}` });
  onProgress({ stage: 1, state: 'ok', message: `Найдено дежурных: ${parsed.duties.length}, лидеров: ${parsed.leaders.size}` });

  onProgress({ stage: 2, state: 'run', message: 'Подключаюсь к таблице' });
  const startedAt = Date.now();
  const schedule = await loadSchedule(date, (message) => onProgress({ stage: 2, state: 'info', message }));
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  onProgress({ stage: 2, state: 'ok', message: `Лист «${schedule.sheetTitle}»: ${schedule.people.length} сотрудников, ${seconds} с` });

  return planUrgentSwaps({ date, botText: request.botText, schedule, onProgress });
}
