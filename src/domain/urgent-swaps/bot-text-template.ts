import type { PlanDate } from './types';

const HEADER_PATTERN = /^Распределение на (\d{2})\.(\d{2})\.(\d{4})/i;
const DUTY_LINE_PATTERN = /^(\S.*?)\s+(@\S+)\s+(\d{1,2}\/\d{1,2})$/;

/**
 * Находит дату в строке «Распределение на ДД.ММ.ГГГГ».
 *
 * @param text Текст бота.
 * @returns Дата или `null`, если строки с датой нет.
 */
export function findBotTextDate(text: string): PlanDate | null {
  for (const line of text.split('\n')) {
    const match = HEADER_PATTERN.exec(line.trim());
    if (match !== null) {
      const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
      const probe = new Date(Date.UTC(year, month - 1, day));
      const valid = probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
      return valid ? { year, month, day } : null;
    }
  }
  return null;
}

/**
 * Проверяет, что вставленный текст похож на привычное сообщение бота, до обращения к таблице.
 * Это защита от случайного мусора (не тот текст, обрезанное сообщение, не та дата), а не от злоумышленника.
 *
 * @param text Текст, вставленный пользователем.
 * @param date Выбранная дата распределения.
 * @returns Список найденных несоответствий; пустой, если текст похож на шаблон.
 */
export function checkBotTextTemplate(text: string, date: PlanDate): string[] {
  const problems: string[] = [];
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim());
  const lower = lines.map((line) => line.toLowerCase());

  const header = lines.map((line) => HEADER_PATTERN.exec(line)).find((match) => match !== null);
  if (header !== undefined && header !== null) {
    const [, day, month, year] = header;
    if (Number(day) !== date.day || Number(month) !== date.month || Number(year) !== date.year) {
      problems.push(`в тексте дата ${day}.${month}.${year}, а выбрана ${pad(date.day)}.${pad(date.month)}.${date.year}`);
    }
  }

  // Достаточно узнаваемого костяка: заголовок блока срочных, хотя бы один из списков и хотя бы одна строка «ФИО @тег ЧЧ/ЧЧ».
  if (!lower.some((line) => line.includes('дежурные на линию'))) {
    problems.push('нет заголовка «Дежурные на линию»');
  }
  if (!lower.some((line) => line.startsWith('поздние') || line.startsWith('ранние'))) {
    problems.push('нет списков «Поздние»/«Ранние»');
  }
  if (lines.filter((line) => DUTY_LINE_PATTERN.test(line)).length < 1) {
    problems.push('нет строк вида «ФИО @тег ЧЧ/ЧЧ»');
  }

  return problems;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
