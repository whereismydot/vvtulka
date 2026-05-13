/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createThemePreference } from './theme-preference';

describe('theme preference adapter', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = '';
  });

  it('returns stored theme and prefers it over system theme', () => {
    localStorage.setItem('vv_theme_preference', 'dark');
    const matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn() });
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: matchMedia });

    const preference = createThemePreference();

    expect(preference.getStoredTheme()).toBe('dark');
    expect(preference.resolveInitialTheme()).toBe('dark');
  });

  it('falls back to system theme when storage is empty', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn() });
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: matchMedia });

    const preference = createThemePreference();

    expect(preference.resolveInitialTheme()).toBe('dark');
  });

  it('applies and saves theme', () => {
    const preference = createThemePreference();

    preference.applyTheme('light');
    preference.saveTheme('light');

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('vv_theme_preference')).toBe('light');
  });

  it('watches system theme changes', () => {
    let emitChange: (() => void) | undefined;
    const mediaQueryList = {
      matches: false,
      addEventListener: (_event: string, listener: unknown) => {
        emitChange = () => {
          if (typeof listener === 'function') {
            (listener as EventListener)(new Event('change'));
          }
        };
      }
    };
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue(mediaQueryList)
    });

    const preference = createThemePreference();
    const onChange = vi.fn();

    preference.watchSystemTheme(onChange);
    mediaQueryList.matches = true;
    emitChange?.();

    expect(onChange).toHaveBeenCalledWith('dark');
  });
});
