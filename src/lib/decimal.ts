import Decimal from 'decimal.js';

Decimal.set({
  precision: 50,
  toExpNeg: -1000000,
  toExpPos: 1000000
});

export const ZERO_RAW = '0';

function stripLeadingZeros(value: string): string {
  const stripped = value.replace(/^0+(?=\d)/, '');
  return stripped || '0';
}

function normalizeSignedZero(value: string): string {
  if (/^-?0(?:\.0+)?$/.test(value)) {
    return ZERO_RAW;
  }
  return value;
}

export function normalizeDecimalInput(raw: string): string {
  const trimmed = raw.replace(/\u00A0/g, ' ').trim();
  if (!trimmed) {
    return ZERO_RAW;
  }

  const sign = trimmed.startsWith('-') ? '-' : '';
  const unsigned = sign ? trimmed.slice(1) : trimmed;
  const compact = unsigned.replace(/\s+/g, '');
  const cleaned = compact.replace(/[^0-9,.-]/g, '').replace(/-/g, '');

  if (!cleaned || !/[0-9]/.test(cleaned)) {
    return ZERO_RAW;
  }

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  const decimalIndex = Math.max(lastComma, lastDot);

  if (decimalIndex === -1) {
    const integer = stripLeadingZeros(cleaned.replace(/[,.]/g, ''));
    return normalizeSignedZero(`${sign}${integer}`);
  }

  const integerPartRaw = cleaned.slice(0, decimalIndex).replace(/[,.]/g, '');
  const fractionalPartRaw = cleaned.slice(decimalIndex + 1).replace(/[,.]/g, '');

  const integerPart = stripLeadingZeros(integerPartRaw);
  const fractionalPart = fractionalPartRaw || '0';

  return normalizeSignedZero(`${sign}${integerPart}.${fractionalPart}`);
}

export function decimalFromRaw(raw: string): Decimal {
  return new Decimal(normalizeDecimalInput(raw));
}

export function rawFromDecimal(value: Decimal): string {
  return normalizeSignedZero(value.toFixed());
}

export function formatDecimalForDisplay(raw: string): string {
  const normalized = rawFromDecimal(decimalFromRaw(raw));
  return normalized.replace('.', ',');
}
