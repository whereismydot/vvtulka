import { describe, expect, it } from 'vitest';
import {
  TEXT_CLEANER_SETTINGS_STORAGE_KEY,
  createDefaultTextCleanerSettings,
  hydrateTextCleanerSettings,
  loadTextCleanerSettings,
  saveTextCleanerSettings
} from './text-cleaner-settings-storage';
import type { TextCleanerSettings } from '../../domain/types';

class MemoryStorage implements Storage {
  private readonly map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key) ?? null : null;
  }

  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

describe('text cleaner settings storage', () => {
  it('returns defaults for invalid hydrate payload', () => {
    const defaults = createDefaultTextCleanerSettings();
    const hydrated = hydrateTextCleanerSettings(null);

    expect(hydrated).toEqual(defaults);
  });

  it('hydrates known flags and falls back for invalid values', () => {
    const hydrated = hydrateTextCleanerSettings({
      version: 2,
      normalizeLineBreaks: false,
      replaceTabsWithSpaces: 'yes',
      replaceNbspWithSpace: false,
      collapseInnerSpaces: true,
      trimLineStart: false,
      trimLineEnd: true,
      removeEmptyLines: false,
      trimWholeText: true,
      removeDotBeforeEmoji: false,
      excludeSpacesFromCharacterCount: true
    });

    expect(hydrated.version).toBe(createDefaultTextCleanerSettings().version);
    expect(hydrated.normalizeLineBreaks).toBe(false);
    expect(hydrated.replaceTabsWithSpaces).toBe(true);
    expect(hydrated.replaceNbspWithSpace).toBe(false);
    expect(hydrated.trimLineStart).toBe(false);
    expect(hydrated.removeDotBeforeEmoji).toBe(false);
    expect(hydrated.excludeSpacesFromCharacterCount).toBe(true);
  });

  it('loads defaults when storage contains malformed JSON', () => {
    const storage = new MemoryStorage();
    storage.setItem(TEXT_CLEANER_SETTINGS_STORAGE_KEY, '{bad-json');

    const settings = loadTextCleanerSettings(storage);

    expect(settings).toEqual(createDefaultTextCleanerSettings());
  });

  it('saves and loads settings', () => {
    const storage = new MemoryStorage();
    const customSettings: TextCleanerSettings = {
      ...createDefaultTextCleanerSettings(),
      normalizeLineBreaks: false,
      removeEmptyLines: false,
      removeDotBeforeEmoji: false,
      excludeSpacesFromCharacterCount: false
    };

    saveTextCleanerSettings(customSettings, storage);
    const restored = loadTextCleanerSettings(storage);

    expect(restored.normalizeLineBreaks).toBe(false);
    expect(restored.removeEmptyLines).toBe(false);
    expect(restored.removeDotBeforeEmoji).toBe(false);
    expect(restored.excludeSpacesFromCharacterCount).toBe(false);
  });

  it('ignores unknown fields and keeps schema version', () => {
    const hydrated = hydrateTextCleanerSettings({
      version: 999,
      normalizeLineBreaks: true,
      unknownFlag: false
    });

    expect(hydrated.version).toBe(createDefaultTextCleanerSettings().version);
    expect(hydrated.normalizeLineBreaks).toBe(true);
  });

  it('falls back to defaults for missing new fields in legacy payload', () => {
    const hydrated = hydrateTextCleanerSettings({
      normalizeLineBreaks: false
    });

    expect(hydrated.normalizeLineBreaks).toBe(false);
    expect(hydrated.removeDotBeforeEmoji).toBe(true);
    expect(hydrated.excludeSpacesFromCharacterCount).toBe(true);
  });

  it('returns defaults when storage is unavailable', () => {
    const restored = loadTextCleanerSettings(null);

    expect(restored).toEqual(createDefaultTextCleanerSettings());
  });
});
