import type { BotDutyLine, ParsedBotText, UrgentGroup } from './types';

const DUTY_LINE_PATTERN = /^(\S.*?)\s+(@\S+)\s+(\d{1,2}\/\d{1,2})$/;

/**
 * Приводит ФИО к виду для сравнения: без регистра, без «ё», с одиночными пробелами.
 *
 * @param value Исходное ФИО.
 * @returns Нормализованная строка.
 */
export function normalizeName(value: string): string {
  return value.toLowerCase().replace(/ё/g, 'е').split(/\s+/).filter(Boolean).join(' ');
}

/**
 * Дополняет смену нулями: `7/19` → `07/19`.
 *
 * @param shift Смена вида `H/H`.
 * @returns Смена вида `HH/HH`.
 */
export function normalizeShift(shift: string): string {
  return shift
    .split('/')
    .map((part) => part.trim().padStart(2, '0'))
    .join('/');
}

/**
 * Разбирает текст бота: лидеров и списки «Поздние»/«Ранние» из блока срочных.
 *
 * @param text Текст, вставленный пользователем.
 * @returns Строки текста, дежурные и множество лидеров.
 */
export function parseBotText(text: string): ParsedBotText {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const duties: BotDutyLine[] = [];
  const leaders = new Set<string>();
  let section: 'leaders' | 'urgent' | null = null;
  let group: UrgentGroup | null = null;

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    if (lower.includes('график лидеров')) {
      section = 'leaders';
    } else if (lower.includes('дежурные на линию')) {
      section = 'urgent';
      group = null;
    } else if (section === 'urgent' && lower.startsWith('поздние')) {
      group = 'Поздние';
    } else if (section === 'urgent' && lower.startsWith('ранние')) {
      group = 'Ранние';
    } else if (lower.startsWith('продуктивного')) {
      section = null;
    }

    const match = DUTY_LINE_PATTERN.exec(trimmed);
    if (match === null) {
      return;
    }

    const [, name, tag, shift] = match;
    if (section === 'leaders') {
      leaders.add(normalizeName(name));
    } else if (section === 'urgent' && group !== null) {
      duties.push({ lineIndex, group, name, tag, shift: normalizeShift(shift) });
    }
  });

  return { lines, duties, leaders };
}
