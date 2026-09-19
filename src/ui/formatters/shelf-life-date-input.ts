const DIGIT_PATTERN = /\d/g;

function clampCaret(value: string, caret: number | null | undefined): number {
  if (typeof caret !== 'number' || Number.isNaN(caret)) {
    return value.length;
  }

  return Math.min(Math.max(Math.trunc(caret), 0), value.length);
}

function countDigitsBefore(value: string, caret: number): number {
  const text = value.slice(0, caret);
  const matches = text.match(DIGIT_PATTERN);
  return matches === null ? 0 : matches.length;
}

function getCaretForDigits(formatted: string, digitsBeforeCaret: number): number {
  if (digitsBeforeCaret <= 0) {
    return 0;
  }

  let seenDigits = 0;
  for (let index = 0; index < formatted.length; index += 1) {
    if (/\d/.test(formatted[index])) {
      seenDigits += 1;
      if (seenDigits >= digitsBeforeCaret) {
        return index + 1;
      }
    }
  }

  return formatted.length;
}

function formatFromDigits(digits: string): string {
  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

function formatFromSegments(value: string): string | null {
  const segments = value
    .split(/[^\d]+/)
    .map((part) => part.replace(/\D+/g, ''))
    .filter((part) => part.length > 0)
    .slice(0, 3);

  if (segments.length < 2) {
    return null;
  }

  const maxByPart = [2, 2, 4] as const;
  const hasOverflow = segments.some((segment, index) => segment.length > maxByPart[index]);
  if (hasOverflow) {
    return null;
  }

  const [day = '', month = '', year = ''] = segments;
  if (year.length > 0) {
    return `${day}.${month}.${year}`;
  }
  return `${day}.${month}`;
}

export function formatDateInput(value: string): string {
  const segmented = formatFromSegments(value);
  if (segmented !== null) {
    return segmented;
  }

  const digits = value.replace(/\D+/g, '').slice(0, 8);
  return formatFromDigits(digits);
}

export interface DateInputFormatWithCaretResult {
  readonly formatted: string;
  readonly caret: number;
}

export function formatDateInputWithCaret(value: string, caret: number | null | undefined): DateInputFormatWithCaretResult {
  const normalizedCaret = clampCaret(value, caret);
  const formatted = formatDateInput(value);
  if (formatted === value) {
    return {
      formatted,
      caret: normalizedCaret
    };
  }

  const digitsBeforeCaret = countDigitsBefore(value, normalizedCaret);
  const nextCaret = getCaretForDigits(formatted, digitsBeforeCaret);

  return {
    formatted,
    caret: nextCaret
  };
}

const ISO_DATE_PATTERN = /^\s*(\d{4})[-./](\d{1,2})[-./](\d{1,2})\s*$/;

/**
 * Форматирует дату при наборе «в конец» строки: ставит точки автоматически и дополняет цифры нулями.
 *
 * Правила: день начинается с 4–9 → `04.`; месяц начинается с 2–9 → `02.`; ручной разделитель после одной цифры
 * дополняет ноль (`1.` → `01.`); после полного дня и месяца точка ставится сама; год — не больше 4 цифр.
 * Вставка вида `2026-09-01` приводится к `01.09.2026`. Календарную корректность функция не проверяет.
 *
 * @param value Текущее значение поля.
 * @returns Значение в формате `ДД.ММ.ГГГГ` (возможно, неполное, с завершающей точкой).
 */
export function formatDateTyping(value: string): string {
  const iso = ISO_DATE_PATTERN.exec(value);
  if (iso !== null) {
    const [, isoYear, isoMonth, isoDay] = iso;
    return `${isoDay.padStart(2, '0')}.${isoMonth.padStart(2, '0')}.${isoYear}`;
  }

  let day = '';
  let month = '';
  let year = '';
  let stage: 'day' | 'month' | 'year' = 'day';

  for (const char of value) {
    const isDigit = char >= '0' && char <= '9';

    if (stage === 'day') {
      if (isDigit) {
        if (day === '' && char >= '4') {
          day = `0${char}`;
          stage = 'month';
        } else {
          day += char;
          if (day.length === 2) {
            stage = 'month';
          }
        }
      } else if (day.length === 1) {
        day = `0${day}`;
        stage = 'month';
      }
    } else if (stage === 'month') {
      if (isDigit) {
        if (month === '' && char >= '2') {
          month = `0${char}`;
          stage = 'year';
        } else {
          month += char;
          if (month.length === 2) {
            stage = 'year';
          }
        }
      } else if (month.length === 1) {
        month = `0${month}`;
        stage = 'year';
      }
    } else if (isDigit && year.length < 4) {
      year += char;
    }
  }

  let result = day;
  if (stage !== 'day') {
    result += '.';
  }
  result += month;
  if (stage === 'year') {
    result += '.';
  }
  return result + year;
}

/**
 * Приводит введённую дату к окончательному виду (при потере фокуса или отправке):
 * дополняет нулями день и месяц и расширяет двузначный год до `20YY`.
 *
 * @param value Значение поля.
 * @returns Нормализованная строка; неполные даты возвращаются без завершающей точки.
 */
export function normalizeDateInput(value: string): string {
  const typed = formatDateTyping(value);
  const [day = '', month = '', year = ''] = typed.split('.');
  if (day.length === 2 && month.length === 2 && year.length === 2) {
    return `${day}.${month}.20${year}`;
  }
  return typed.replace(/\.$/, '');
}
