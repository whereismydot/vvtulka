import { parseBotText } from './bot-text-parser';
import type { PlanDate } from './types';

const HEADER_PATTERN = /^Распределение на (\d{2})\.(\d{2})\.(\d{4})/i;
const DUTY_LINE_PATTERN = /^(\S.*?)\s+(@\S+)\s+(\d{1,2}\/\d{1,2})$/;

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
  if (header === undefined || header === null) {
    problems.push('нет строки «Распределение на ДД.ММ.ГГГГ»');
  } else {
    const [, day, month, year] = header;
    if (Number(day) !== date.day || Number(month) !== date.month || Number(year) !== date.year) {
      problems.push(`в тексте дата ${day}.${month}.${year}, а выбрана ${pad(date.day)}.${pad(date.month)}.${date.year}`);
    }
  }

  if (!lower.some((line) => line.includes('график лидеров'))) {
    problems.push('нет блока «График лидеров»');
  }
  if (!lower.some((line) => line.includes('дежурные на линию') && line.includes('срочные'))) {
    problems.push('нет заголовка «Дежурные на линию "Срочные"»');
  }
  if (!lower.some((line) => line.startsWith('поздние'))) {
    problems.push('нет списка «Поздние:»');
  }
  if (!lower.some((line) => line.startsWith('ранние'))) {
    problems.push('нет списка «Ранние:»');
  }
  if (!lower.some((line) => line.startsWith('продуктивного'))) {
    problems.push('нет последней строки «Продуктивного рабочего дня» (текст скопирован не целиком?)');
  }

  const urgentStart = lower.findIndex((line) => line.includes('дежурные на линию'));
  const urgentEnd = lower.findIndex((line, index) => index > urgentStart && line.startsWith('продуктивного'));
  if (urgentStart >= 0) {
    const block = lines.slice(urgentStart + 1, urgentEnd > urgentStart ? urgentEnd : lines.length);
    const odd = block.filter((line) => line !== '' && !/^(поздние|ранние)/i.test(line) && !DUTY_LINE_PATTERN.test(line));
    if (odd.length > 0) {
      problems.push(`строки не похожи на «ФИО @тег ЧЧ/ЧЧ»: ${odd.length} (например: «${odd[0].slice(0, 40)}»)`);
    }
  }

  if (parseBotText(text).leaders.size === 0) {
    problems.push('в графике лидеров нет ни одной строки «ФИО @тег ЧЧ/ЧЧ»');
  }

  return problems;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
