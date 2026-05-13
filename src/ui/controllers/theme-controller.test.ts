/** @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vitest';
import type { ThemeMode, ThemePreference } from '../../infrastructure/browser/theme-preference';
import { createThemeController } from './theme-controller';

function createThemePreferenceMock(storedTheme: ThemeMode | null): {
  preference: ThemePreference;
  triggerSystemChange: (mode: ThemeMode) => void;
  applyTheme: ReturnType<typeof vi.fn>;
  saveTheme: ReturnType<typeof vi.fn>;
} {
  let listener: ((mode: ThemeMode) => void) | null = null;
  const applyTheme = vi.fn();
  const saveTheme = vi.fn();

  return {
    preference: {
      getStoredTheme: () => storedTheme,
      resolveInitialTheme: () => 'light',
      applyTheme,
      saveTheme,
      watchSystemTheme: (onChange) => {
        listener = onChange;
      }
    },
    triggerSystemChange: (mode) => {
      listener?.(mode);
    },
    applyTheme,
    saveTheme
  };
}

describe('theme controller', () => {
  it('applies initial theme and toggles on button click', () => {
    const button = document.createElement('button');
    const { preference, applyTheme, saveTheme } = createThemePreferenceMock(null);

    createThemeController(button, preference);

    expect(applyTheme).toHaveBeenCalledWith('light');
    button.click();
    expect(applyTheme).toHaveBeenLastCalledWith('dark');
    expect(saveTheme).toHaveBeenCalledWith('dark');
  });

  it('applies system theme updates only when there is no stored theme', () => {
    const button = document.createElement('button');
    const noStored = createThemePreferenceMock(null);
    createThemeController(button, noStored.preference);
    noStored.triggerSystemChange('dark');
    expect(noStored.applyTheme).toHaveBeenCalledWith('dark');

    const withStored = createThemePreferenceMock('light');
    createThemeController(document.createElement('button'), withStored.preference);
    withStored.triggerSystemChange('dark');
    expect(withStored.applyTheme).not.toHaveBeenCalledWith('dark');
  });
});

