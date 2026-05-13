import { describe, expect, it } from 'vitest';
import { decimalFromRaw, formatDecimalForDisplay, normalizeDecimalInput, rawFromDecimal } from './decimal';

describe('decimal helpers', () => {
  it('normalizes numbers with comma and spaces', () => {
    expect(normalizeDecimalInput('1 264,00')).toBe('1264.00');
    expect(normalizeDecimalInput('0,475')).toBe('0.475');
  });

  it('normalizes empty and invalid input to zero', () => {
    expect(normalizeDecimalInput('')).toBe('0');
    expect(normalizeDecimalInput('   ')).toBe('0');
    expect(normalizeDecimalInput('abc')).toBe('0');
    expect(normalizeDecimalInput('--..,,')).toBe('0');
  });

  it('keeps sign and resolves the last decimal separator', () => {
    expect(normalizeDecimalInput('-001,20')).toBe('-1.20');
    expect(normalizeDecimalInput('1,234.56')).toBe('1234.56');
    expect(normalizeDecimalInput('1.234,56')).toBe('1234.56');
  });

  it('normalizes signed zero variants to plain zero', () => {
    expect(normalizeDecimalInput('-0')).toBe('0');
    expect(normalizeDecimalInput('-0,000')).toBe('0');
    expect(rawFromDecimal(decimalFromRaw('-0.000'))).toBe('0');
  });

  it('keeps exact arithmetic', () => {
    const sum = decimalFromRaw('0.1').add(decimalFromRaw('0.2'));
    expect(rawFromDecimal(sum)).toBe('0.3');
  });

  it('formats value for display with comma separator', () => {
    expect(formatDecimalForDisplay('1200.5')).toBe('1200,5');
    expect(formatDecimalForDisplay('1 200,50')).toBe('1200,5');
  });
});
