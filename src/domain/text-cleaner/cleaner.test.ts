import { describe, expect, it } from 'vitest';
import type { TextCleanerSettings } from '../types';
import { cleanText } from './cleaner';
import { createDefaultTextCleanerSettings } from '../../infrastructure/storage/text-cleaner-settings-storage';

function buildSettings(overrides: Partial<TextCleanerSettings> = {}): TextCleanerSettings {
  return {
    ...createDefaultTextCleanerSettings(),
    ...overrides
  };
}

describe('cleanText', () => {
  it('normalizes mixed line breaks to LF', () => {
    const input = 'A\r\nB\rC\nD';
    const result = cleanText(input, buildSettings());

    expect(result.output).toBe('A\nB\nC\nD');
    expect(result.stats.normalizedLineBreaksCount).toBe(2);
  });

  it('applies and skips tab replacement based on settings', () => {
    const input = 'A\tB';
    const withTabsReplace = cleanText(input, buildSettings({ replaceTabsWithSpaces: true }));
    const withoutTabsReplace = cleanText(input, buildSettings({ replaceTabsWithSpaces: false }));

    expect(withTabsReplace.output).toBe('A B');
    expect(withTabsReplace.stats.replacedTabsCount).toBe(1);
    expect(withoutTabsReplace.output).toBe('A\tB');
    expect(withoutTabsReplace.stats.replacedTabsCount).toBe(0);
  });

  it('replaces NBSP and collapses multiple spaces', () => {
    const input = 'A\u00A0\u00A0B   C';
    const result = cleanText(input, buildSettings());

    expect(result.output).toBe('A B C');
    expect(result.stats.replacedNbspCount).toBe(2);
    expect(result.stats.collapsedSpaceGroupsCount).toBe(2);
  });

  it('trims leading spaces line-by-line when enabled', () => {
    const input = '  one\n    two\nthree';
    const withTrim = cleanText(input, buildSettings({ trimLineStart: true }));
    const withoutTrim = cleanText(input, buildSettings({ trimLineStart: false, collapseInnerSpaces: false, trimWholeText: false }));

    expect(withTrim.output).toBe('one\ntwo\nthree');
    expect(withTrim.stats.trimmedLineStartCount).toBe(2);
    expect(withoutTrim.output).toBe('  one\n    two\nthree');
    expect(withoutTrim.stats.trimmedLineStartCount).toBe(0);
  });

  it('removes all empty lines when the rule is enabled', () => {
    const input = 'A\n\n\n \nB\n\t\nC';
    const withRemoveEmpty = cleanText(input, buildSettings({ removeEmptyLines: true }));
    const withoutRemoveEmpty = cleanText(input, buildSettings({ removeEmptyLines: false }));

    expect(withRemoveEmpty.output).toBe('A\nB\nC');
    expect(withRemoveEmpty.stats.removedEmptyLinesCount).toBe(4);
    expect(withoutRemoveEmpty.output).toContain('\n\n');
  });

  it('keeps clean text unchanged', () => {
    const input = 'Alpha beta\nGamma';
    const result = cleanText(input, buildSettings());

    expect(result.output).toBe(input);
    expect(result.stats.inputLength).toBe(result.stats.outputLength);
  });

  it('respects trim line end and trim whole text flags', () => {
    const input = '  A  \nB   \n';
    const withTrim = cleanText(input, buildSettings({ trimLineEnd: true, trimWholeText: true }));
    const withoutTrim = cleanText(
      input,
      buildSettings({ trimLineEnd: false, trimWholeText: false, trimLineStart: false, removeEmptyLines: false })
    );

    expect(withTrim.output).toBe('A\nB');
    expect(withTrim.stats.trimmedLineEndCount).toBeGreaterThan(0);
    expect(withoutTrim.output.endsWith('\n')).toBe(true);
  });

  it('is idempotent for already processed output', () => {
    const input = ' A\t\tB \n\n C ';
    const once = cleanText(input, buildSettings());
    const twice = cleanText(once.output, buildSettings());

    expect(twice.output).toBe(once.output);
    expect(twice.stats.outputLength).toBe(once.stats.outputLength);
  });
});
