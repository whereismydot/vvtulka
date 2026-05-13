import { describe, expect, it } from 'vitest';
import { formatDate } from './date';

describe('formatDate', () => {
  it('returns fallback for invalid date', () => {
    expect(formatDate('invalid')).toBe('Неизвестная дата');
  });

  it('formats valid ISO date', () => {
    const value = formatDate('2026-01-01T12:00:00.000Z');
    expect(value).not.toBe('Неизвестная дата');
    expect(value).toContain('2026');
  });
});

