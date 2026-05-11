import { describe, expect, it } from 'vitest';
import { decimalFromRaw, normalizeDecimalInput, rawFromDecimal } from './decimal';

describe('decimal helpers', () => {
  it('normalizes numbers with comma and spaces', () => {
    expect(normalizeDecimalInput('1 264,00')).toBe('1264.00');
    expect(normalizeDecimalInput('0,475')).toBe('0.475');
  });

  it('keeps exact arithmetic', () => {
    const sum = decimalFromRaw('0.1').add(decimalFromRaw('0.2'));
    expect(rawFromDecimal(sum)).toBe('0.3');
  });
});
