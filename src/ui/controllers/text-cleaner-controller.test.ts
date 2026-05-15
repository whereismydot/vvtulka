/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppElements } from '../dom/elements';
import { TEXT_CLEANER_SETTINGS_STORAGE_KEY, createDefaultTextCleanerSettings } from '../../infrastructure/storage/text-cleaner-settings-storage';
import { createTextCleanerController } from './text-cleaner-controller';

function createElements(): AppElements {
  const sourceInput = document.createElement('textarea');
  sourceInput.id = 'source';
  const outputInput = document.createElement('textarea');
  const outputCharacterCount = document.createElement('p');
  const settingsToggleButton = document.createElement('button');
  const copyButton = document.createElement('button');
  const clearButton = document.createElement('button');
  const settingsPanel = document.createElement('div');
  settingsPanel.hidden = true;

  const normalizeLineBreaks = document.createElement('input');
  normalizeLineBreaks.type = 'checkbox';
  const replaceTabs = document.createElement('input');
  replaceTabs.type = 'checkbox';
  const replaceNbsp = document.createElement('input');
  replaceNbsp.type = 'checkbox';
  const collapseInnerSpaces = document.createElement('input');
  collapseInnerSpaces.type = 'checkbox';
  const trimLineStart = document.createElement('input');
  trimLineStart.type = 'checkbox';
  const trimLineEnd = document.createElement('input');
  trimLineEnd.type = 'checkbox';
  const removeEmptyLines = document.createElement('input');
  removeEmptyLines.type = 'checkbox';
  const trimWholeText = document.createElement('input');
  trimWholeText.type = 'checkbox';
  const removeDotBeforeEmoji = document.createElement('input');
  removeDotBeforeEmoji.type = 'checkbox';
  const excludeSpacesFromCharacterCount = document.createElement('input');
  excludeSpacesFromCharacterCount.type = 'checkbox';

  const host = document.createElement('div');
  host.append(
    sourceInput,
    outputInput,
    outputCharacterCount,
    settingsToggleButton,
    copyButton,
    clearButton,
    settingsPanel,
    normalizeLineBreaks,
    replaceTabs,
    replaceNbsp,
    collapseInnerSpaces,
    trimLineStart,
    trimLineEnd,
    removeEmptyLines,
    trimWholeText,
    removeDotBeforeEmoji,
    excludeSpacesFromCharacterCount
  );
  document.body.appendChild(host);

  return {
    textCleanerSourceInput: sourceInput,
    textCleanerOutputInput: outputInput,
    textCleanerOutputCharacterCount: outputCharacterCount,
    textCleanerSettingsToggleButton: settingsToggleButton,
    textCleanerCopyButton: copyButton,
    textCleanerClearButton: clearButton,
    textCleanerSettingsPanel: settingsPanel,
    textCleanerNormalizeLineBreaksInput: normalizeLineBreaks,
    textCleanerReplaceTabsInput: replaceTabs,
    textCleanerReplaceNbspInput: replaceNbsp,
    textCleanerCollapseInnerSpacesInput: collapseInnerSpaces,
    textCleanerTrimLineStartInput: trimLineStart,
    textCleanerTrimLineEndInput: trimLineEnd,
    textCleanerRemoveEmptyLinesInput: removeEmptyLines,
    textCleanerTrimWholeTextInput: trimWholeText,
    textCleanerRemoveDotBeforeEmojiInput: removeDotBeforeEmoji,
    textCleanerExcludeSpacesFromCharacterCountInput: excludeSpacesFromCharacterCount
  } as unknown as AppElements;
}

describe('text cleaner controller', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('cleans output automatically on input', () => {
    const elements = createElements();
    const setStatus = vi.fn();
    createTextCleanerController({
      elements,
      copyText: async () => true,
      setStatus
    });

    elements.textCleanerSourceInput.value = 'A  \n\nB';
    elements.textCleanerSourceInput.dispatchEvent(new Event('input'));

    expect(elements.textCleanerOutputInput.value).toBe('A\nB');
    expect(elements.textCleanerOutputCharacterCount.textContent).toContain('2');
    expect(setStatus).not.toHaveBeenCalled();
  });

  it('renders new settings with default enabled state', () => {
    const elements = createElements();
    createTextCleanerController({
      elements,
      copyText: async () => true,
      setStatus: vi.fn()
    });

    expect(elements.textCleanerRemoveDotBeforeEmojiInput.checked).toBe(true);
    expect(elements.textCleanerExcludeSpacesFromCharacterCountInput.checked).toBe(true);
  });

  it('restores new settings from storage', () => {
    localStorage.setItem(
      TEXT_CLEANER_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...createDefaultTextCleanerSettings(),
        removeDotBeforeEmoji: false,
        excludeSpacesFromCharacterCount: false
      })
    );

    const elements = createElements();
    createTextCleanerController({
      elements,
      copyText: async () => true,
      setStatus: vi.fn()
    });

    expect(elements.textCleanerRemoveDotBeforeEmojiInput.checked).toBe(false);
    expect(elements.textCleanerExcludeSpacesFromCharacterCountInput.checked).toBe(false);
  });

  it('toggles settings panel and button state', () => {
    const elements = createElements();
    createTextCleanerController({
      elements,
      copyText: async () => true,
      setStatus: vi.fn()
    });

    expect(elements.textCleanerSettingsPanel.hidden).toBe(true);
    expect(elements.textCleanerSettingsToggleButton.getAttribute('aria-expanded')).toBe('false');

    elements.textCleanerSettingsToggleButton.click();
    expect(elements.textCleanerSettingsPanel.hidden).toBe(false);
    expect(elements.textCleanerSettingsToggleButton.getAttribute('aria-expanded')).toBe('true');
    expect(elements.textCleanerSettingsToggleButton.classList.contains('cleaner-settings-toggle-open')).toBe(true);
  });

  it('persists settings changes and re-renders output', () => {
    const elements = createElements();
    createTextCleanerController({
      elements,
      copyText: async () => true,
      setStatus: vi.fn()
    });

    elements.textCleanerSourceInput.value = 'A\n\nB';
    elements.textCleanerSourceInput.dispatchEvent(new Event('input'));
    expect(elements.textCleanerOutputInput.value).toBe('A\nB');

    elements.textCleanerRemoveEmptyLinesInput.checked = false;
    elements.textCleanerRemoveEmptyLinesInput.dispatchEvent(new Event('change'));

    expect(elements.textCleanerOutputInput.value).toBe('A\n\nB');
    const persistedRaw = localStorage.getItem(TEXT_CLEANER_SETTINGS_STORAGE_KEY);
    expect(persistedRaw).not.toBeNull();
    const persisted = JSON.parse(persistedRaw ?? '{}') as ReturnType<typeof createDefaultTextCleanerSettings>;
    expect(persisted.removeEmptyLines).toBe(false);
  });

  it('toggles dot-before-emoji setting and updates output', () => {
    const elements = createElements();
    createTextCleanerController({
      elements,
      copyText: async () => true,
      setStatus: vi.fn()
    });

    elements.textCleanerSourceInput.value = 'Спасибо. 😊 Хорошего дня.';
    elements.textCleanerSourceInput.dispatchEvent(new Event('input'));
    expect(elements.textCleanerOutputInput.value).toBe('Спасибо 😊 Хорошего дня.');

    elements.textCleanerRemoveDotBeforeEmojiInput.checked = false;
    elements.textCleanerRemoveDotBeforeEmojiInput.dispatchEvent(new Event('change'));
    expect(elements.textCleanerOutputInput.value).toBe('Спасибо. 😊 Хорошего дня.');
  });

  it('toggles whitespace counting mode and updates counter', () => {
    const elements = createElements();
    createTextCleanerController({
      elements,
      copyText: async () => true,
      setStatus: vi.fn()
    });

    elements.textCleanerSourceInput.value = 'a b';
    elements.textCleanerSourceInput.dispatchEvent(new Event('input'));
    expect(elements.textCleanerOutputCharacterCount.textContent).toContain('2');

    elements.textCleanerExcludeSpacesFromCharacterCountInput.checked = false;
    elements.textCleanerExcludeSpacesFromCharacterCountInput.dispatchEvent(new Event('change'));
    expect(elements.textCleanerOutputCharacterCount.textContent).toContain('3');
  });

  it('copies output and shows statuses', async () => {
    const elements = createElements();
    const setStatus = vi.fn();
    const copyText = vi.fn().mockResolvedValue(true);
    createTextCleanerController({ elements, copyText, setStatus });

    elements.textCleanerOutputInput.value = '';
    elements.textCleanerCopyButton.click();
    await Promise.resolve();
    expect(setStatus).toHaveBeenCalledWith('Нет текста для копирования.', 'warning');

    elements.textCleanerOutputInput.value = 'clean text';
    elements.textCleanerCopyButton.click();
    await Promise.resolve();
    expect(copyText).toHaveBeenCalledWith('clean text');
    expect(setStatus).toHaveBeenCalledWith('Очищенный текст скопирован.', 'success');
  });

  it('clears both fields, resets counter and focuses source input', () => {
    const elements = createElements();
    const setStatus = vi.fn();
    createTextCleanerController({
      elements,
      copyText: async () => true,
      setStatus
    });

    elements.textCleanerSourceInput.value = 'A';
    elements.textCleanerSourceInput.dispatchEvent(new Event('input'));
    elements.textCleanerClearButton.click();

    expect(elements.textCleanerSourceInput.value).toBe('');
    expect(elements.textCleanerOutputInput.value).toBe('');
    expect(elements.textCleanerOutputCharacterCount.textContent).toContain('0');
    expect(document.activeElement).toBe(elements.textCleanerSourceInput);
    expect(setStatus).toHaveBeenCalledWith('Поля очищены.', 'info');
  });
});
