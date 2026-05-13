/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClipboardAdapter } from './clipboard';

describe('clipboard adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false for empty value', async () => {
    const adapter = createClipboardAdapter();
    await expect(adapter.copyText('')).resolves.toBe(false);
  });

  it('uses Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    });

    const adapter = createClipboardAdapter();
    await expect(adapter.copyText('hello')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to execCommand when Clipboard API fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand
    });

    const adapter = createClipboardAdapter();
    await expect(adapter.copyText('fallback')).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('returns false when Clipboard API and fallback both fail', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    const execCommand = vi.fn().mockReturnValue(false);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand
    });

    const adapter = createClipboardAdapter();
    await expect(adapter.copyText('x')).resolves.toBe(false);
  });
});

