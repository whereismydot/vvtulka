import { describe, expect, it } from 'vitest';
import { must } from './must';

describe('must', () => {
  it('returns non-null value', () => {
    expect(must('value', 'err')).toBe('value');
  });

  it('throws for null value', () => {
    expect(() => must(null, 'missing')).toThrowError('missing');
  });
});

