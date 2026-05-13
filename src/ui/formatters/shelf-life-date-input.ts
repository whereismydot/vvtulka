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
