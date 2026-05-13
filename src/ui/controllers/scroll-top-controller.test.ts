/** @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vitest';
import { createScrollTopController } from './scroll-top-controller';

describe('scroll top controller', () => {
  it('toggles visibility by scroll position and scrolls to top on click', () => {
    const button = document.createElement('button');
    const scrollTo = vi.fn();
    Object.defineProperty(window, 'scrollTo', { configurable: true, value: scrollTo });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0, writable: true });

    createScrollTopController(button);
    expect(button.classList.contains('scroll-top-visible')).toBe(false);

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 500, writable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(button.classList.contains('scroll-top-visible')).toBe(true);

    button.click();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});

