import { describe, expect, it } from 'vitest';
import { formatPercentInput } from './percent';

describe('formatPercentInput', () => {
  it('formats decimal with comma', () => {
    expect(formatPercentInput('12.5')).toBe('12,5');
    expect(formatPercentInput('12,50')).toBe('12,50');
  });

  it('normalizes invalid input to zero', () => {
    expect(formatPercentInput('abc')).toBe('0');
  });
});

