import { afterEach, describe, expect, it, vi } from 'vitest';
import { createIdGenerator } from './id-generator';

describe('id generator adapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('uses crypto.randomUUID when available', () => {
    const randomUUID = vi.fn().mockReturnValue('uuid-123');
    vi.stubGlobal('crypto', { randomUUID });

    const generator = createIdGenerator();

    expect(generator.nextId()).toBe('uuid-123');
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  it('falls back to Date.now and Math.random without crypto', () => {
    vi.stubGlobal('crypto', undefined);
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const generator = createIdGenerator();
    const value = generator.nextId();

    expect(value).toMatch(/^order-1700000000000-/);
    expect(value).toContain('8');
  });
});

