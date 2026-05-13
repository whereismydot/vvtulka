/** @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vitest';
import { createStatusRenderer } from './status-renderer';

describe('status renderer', () => {
  it('renders message and tone class', () => {
    const statusBox = document.createElement('section');
    const renderer = createStatusRenderer(statusBox);

    renderer.setStatus('hello', 'success');

    expect(statusBox.textContent).toBe('hello');
    expect(statusBox.className).toContain('status-success');
    expect(statusBox.className).toContain('status-visible');
  });

  it('hides status after timeout and resets previous timer', () => {
    vi.useFakeTimers();

    const statusBox = document.createElement('section');
    const renderer = createStatusRenderer(statusBox);

    renderer.setStatus('first', 'warning');
    renderer.setStatus('second', 'info');
    vi.advanceTimersByTime(2999);
    expect(statusBox.classList.contains('status-visible')).toBe(true);

    vi.advanceTimersByTime(1);
    expect(statusBox.classList.contains('status-visible')).toBe(false);

    vi.useRealTimers();
  });
});

