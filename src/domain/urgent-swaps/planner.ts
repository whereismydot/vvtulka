import { normalizeName, parseBotText } from './bot-text-parser';
import type {
  BotDutyLine,
  MonthSchedule,
  PersonUsage,
  PlanCheck,
  PlanDate,
  PlanRow,
  ProgressEvent,
  SchedulePerson,
  UrgentPlan
} from './types';

export interface PlanInput {
  readonly date: PlanDate;
  readonly botText: string;
  readonly schedule: MonthSchedule;
  /** Минимальная разница в срочных, при которой имеет смысл менять. */
  readonly minDifference?: number;
  readonly onProgress?: (event: ProgressEvent) => void;
}

/**
 * Форматирует дату как `ДД.ММ.ГГГГ`.
 *
 * @param date Дата распределения.
 * @returns Строка даты.
 */
export function formatPlanDate(date: PlanDate): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${pad(date.day)}.${pad(date.month)}.${date.year}`;
}

/**
 * Считает срочные выходы человека строго до выбранного дня месяца.
 *
 * @param person Сотрудник.
 * @param day День месяца, на который делается распределение.
 * @returns Отсортированные дни срочных.
 */
function urgentDaysBefore(person: SchedulePerson, day: number): number[] {
  return person.urgentDays.filter((value) => value < day).sort((a, b) => a - b);
}

/**
 * Находит замену для одного дежурного среди свободных сотрудников с тем же графиком.
 *
 * @returns Лучший кандидат (меньше всего срочных) или `null`.
 */
function pickReplacement(
  duty: BotDutyLine,
  currentCount: number,
  schedule: MonthSchedule,
  day: number,
  usedNames: ReadonlySet<string>,
  usedTags: ReadonlySet<string>,
  minDifference: number
): SchedulePerson | null {
  let best: { person: SchedulePerson; count: number } | null = null;

  for (const person of schedule.people) {
    if (usedNames.has(normalizeName(person.name))) {
      continue;
    }
    if (person.tag !== '' && usedTags.has(person.tag.toLowerCase())) {
      continue;
    }
    if (person.shifts[day] !== duty.shift) {
      continue;
    }

    const count = urgentDaysBefore(person, day).length;
    if (count <= currentCount - minDifference && (best === null || count < best.count)) {
      best = { person, count };
    }
  }

  return best === null ? null : best.person;
}

/**
 * Подбирает замены дежурным на срочные: тот же график в выбранный день, не в списке, не лидер, срочных меньше.
 *
 * @param input Дата, текст бота и график месяца.
 * @returns План со строками, итоговым текстом, предупреждениями и проверками.
 */
export function planUrgentSwaps(input: PlanInput): UrgentPlan {
  const { date, botText, schedule, onProgress } = input;
  const minDifference = input.minDifference ?? 1;
  const emit = (stage: ProgressEvent['stage'], state: ProgressEvent['state'], message: string): void => {
    onProgress?.({ stage, state, message });
  };

  const parsed = parseBotText(botText);
  if (parsed.duties.length === 0) {
    throw new Error('В тексте не найден список «Дежурные на линию Срочные».');
  }

  emit(3, 'run', 'Считаю срочные');
  const warnings: string[] = [];
  const byName = new Map(schedule.people.map((person) => [normalizeName(person.name), person] as const));
  const linkFor = (person: SchedulePerson): string =>
    `https://docs.google.com/spreadsheets/d/${schedule.spreadsheetId}/edit#gid=${schedule.sheetGid}&range=D${person.row}`;
  const usageOf = (person: SchedulePerson): PersonUsage => {
    const days = urgentDaysBefore(person, date.day);
    return { name: person.name, tag: person.tag, count: days.length, days, link: linkFor(person) };
  };

  const nameCounts = new Map<string, number>();
  parsed.duties.forEach((duty) => {
    const key = normalizeName(duty.name);
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
    if (parsed.leaders.has(key)) {
      warnings.push(`${duty.name} есть и в лидерах, и в срочных`);
    }
  });
  nameCounts.forEach((count, key) => {
    if (count > 1) {
      warnings.push(`В тексте бота «${key}» указан в срочных больше одного раза`);
    }
  });

  const usedNames = new Set<string>(parsed.leaders);
  const usedTags = new Set<string>();
  const currents = new Map<number, SchedulePerson>();
  parsed.duties.forEach((duty) => {
    const person = byName.get(normalizeName(duty.name));
    usedNames.add(normalizeName(duty.name));
    usedTags.add(duty.tag.toLowerCase());
    if (person === undefined) {
      warnings.push(`${duty.name}: не найден в таблице, замена не подбиралась`);
      emit(3, 'info', `${duty.name} (${duty.shift}): НЕ НАЙДЕН в таблице`);
      return;
    }
    currents.set(duty.lineIndex, person);
    const usage = usageOf(person);
    const suffix = usage.days.length > 0 ? ` — ${usage.days.join(', ')} числа` : '';
    emit(3, 'info', `${duty.name} (${duty.shift}): срочных ${usage.count}${suffix}`);
  });
  emit(3, 'ok', `Сопоставлено с таблицей: ${currents.size} из ${parsed.duties.length}`);

  emit(4, 'run', 'Подбираю замены');
  const replacements = new Map<number, SchedulePerson>();
  const ordered = parsed.duties
    .filter((duty) => currents.has(duty.lineIndex))
    .sort((a, b) => usageOf(currents.get(b.lineIndex)!).count - usageOf(currents.get(a.lineIndex)!).count);

  for (const duty of ordered) {
    const currentUsage = usageOf(currents.get(duty.lineIndex)!);
    const candidate = pickReplacement(duty, currentUsage.count, schedule, date.day, usedNames, usedTags, minDifference);
    if (candidate === null) {
      emit(4, 'info', `${duty.name} (${currentUsage.count}): замена не найдена`);
      continue;
    }
    usedNames.add(normalizeName(candidate.name));
    if (candidate.tag !== '') {
      usedTags.add(candidate.tag.toLowerCase());
    }
    replacements.set(duty.lineIndex, candidate);
    emit(4, 'info', `${duty.name} (${currentUsage.count}) → ${candidate.name} (${usageOf(candidate).count})`);
  }

  const outLines = [...parsed.lines];
  const rows: PlanRow[] = parsed.duties.map((duty) => {
    const current = currents.get(duty.lineIndex);
    const replacement = replacements.get(duty.lineIndex);
    if (replacement !== undefined) {
      if (replacement.tag === '') {
        warnings.push(`${replacement.name}: в таблице нет тега`);
      }
      outLines[duty.lineIndex] = `${replacement.name}  ${replacement.tag}  ${duty.shift}`;
    }
    return {
      group: duty.group,
      name: duty.name,
      tag: duty.tag,
      shift: duty.shift,
      current: current === undefined ? null : usageOf(current),
      replacement: replacement === undefined ? null : usageOf(replacement)
    };
  });

  const checks = buildChecks(rows, parsed.leaders, schedule, date);
  checks.filter((check) => !check.ok).forEach((check) => warnings.push(`ПРОВЕРКА НЕ ПРОЙДЕНА: ${check.text}`));
  emit(4, 'ok', `Найдено замен: ${replacements.size}; проверок пройдено ${checks.filter((check) => check.ok).length}/${checks.length}`);

  return {
    dateLabel: formatPlanDate(date),
    rows,
    text: outLines.join('\n'),
    originalText: parsed.lines.join('\n'),
    warnings,
    checks
  };
}

/**
 * Проверяет инварианты итогового списка (уникальность, график, лидеры, счётчики).
 */
function buildChecks(
  rows: readonly PlanRow[],
  leaders: ReadonlySet<string>,
  schedule: MonthSchedule,
  date: PlanDate
): PlanCheck[] {
  const finalPeople = rows.map((row) => (row.replacement === null ? { name: row.name, tag: row.tag } : row.replacement));
  const names = finalPeople.map((person) => normalizeName(person.name));
  const tags = finalPeople.filter((person) => person.tag !== '').map((person) => person.tag.toLowerCase());
  const swapped = rows.filter((row) => row.replacement !== null);
  const swappedNames = swapped.map((row) => row.replacement!.name);
  const shiftOf = new Map(schedule.people.map((person) => [person.name, person.shifts[date.day]] as const));

  return [
    {
      ok: new Set(names).size === names.length,
      text: `Итог: ${finalPeople.length} дежурных, ${new Set(names).size} уникальных по ФИО`
    },
    { ok: new Set(tags).size === tags.length, text: 'Теги в итоговом списке не повторяются' },
    { ok: new Set(swappedNames).size === swappedNames.length, text: `Замены не повторяются (${swapped.length} шт.)` },
    {
      ok: swapped.every((row) => shiftOf.get(row.replacement!.name) === row.shift),
      text: `У каждой замены тот же график в ${formatPlanDate(date).slice(0, 5)}`
    },
    { ok: !swappedNames.some((name) => leaders.has(normalizeName(name))), text: 'Замены не пересекаются с лидерами' },
    {
      ok: swapped.every((row) => row.replacement!.count < (row.current?.count ?? 0)),
      text: 'У каждой замены срочных меньше, чем у заменяемого'
    }
  ];
}
