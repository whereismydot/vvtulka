import { describe, expect, it, vi } from 'vitest';
import { createClock } from './clock';

describe('clock adapter', () => {
  it('returns current time in ISO format', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-05T10:11:12.000Z'));

    const clock = createClock();

    expect(clock.nowIso()).toBe('2026-04-05T10:11:12.000Z');
    vi.useRealTimers();
  });
});

