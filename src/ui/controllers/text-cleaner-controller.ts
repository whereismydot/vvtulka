import type { StatusTone } from '../../application/app-results';
import { cleanText } from '../../domain/text-cleaner/cleaner';
import type { TextCleanerSettings } from '../../domain/types';
import { loadTextCleanerSettings, saveTextCleanerSettings } from '../../infrastructure/storage/text-cleaner-settings-storage';
import type { AppElements } from '../dom/elements';

type SettingFlag = Exclude<keyof TextCleanerSettings, 'version'>;

interface TextCleanerControllerDependencies {
  readonly elements: AppElements;
  readonly copyText: (value: string) => Promise<boolean>;
  readonly setStatus: (message: string, tone?: StatusTone) => void;
}

/**
 * Applies pressed style and aria-state for settings button.
 */
function setSettingsButtonState(button: HTMLButtonElement, isOpen: boolean): void {
  button.classList.toggle('cleaner-settings-toggle-open', isOpen);
  button.setAttribute('aria-expanded', String(isOpen));
}

/**
 * Initializes second-tab text cleaner interactions.
 */
export function createTextCleanerController(dependencies: TextCleanerControllerDependencies): void {
  const { elements, copyText, setStatus } = dependencies;
  const sourceInput = elements.textCleanerSourceInput;
  const outputInput = elements.textCleanerOutputInput;
  const settingsPanel = elements.textCleanerSettingsPanel;
  const settingsToggleButton = elements.textCleanerSettingsToggleButton;
  const copyButton = elements.textCleanerCopyButton;
  const clearButton = elements.textCleanerClearButton;

  const settingInputs: Record<SettingFlag, HTMLInputElement> = {
    normalizeLineBreaks: elements.textCleanerNormalizeLineBreaksInput,
    replaceTabsWithSpaces: elements.textCleanerReplaceTabsInput,
    replaceNbspWithSpace: elements.textCleanerReplaceNbspInput,
    collapseInnerSpaces: elements.textCleanerCollapseInnerSpacesInput,
    trimLineStart: elements.textCleanerTrimLineStartInput,
    trimLineEnd: elements.textCleanerTrimLineEndInput,
    removeEmptyLines: elements.textCleanerRemoveEmptyLinesInput,
    trimWholeText: elements.textCleanerTrimWholeTextInput
  };

  let settings = loadTextCleanerSettings();

  function renderSettings(nextSettings: TextCleanerSettings): void {
    (Object.keys(settingInputs) as SettingFlag[]).forEach((key) => {
      settingInputs[key].checked = nextSettings[key];
    });
  }

  function readSettingsFromInputs(version: number): TextCleanerSettings {
    return {
      version,
      normalizeLineBreaks: settingInputs.normalizeLineBreaks.checked,
      replaceTabsWithSpaces: settingInputs.replaceTabsWithSpaces.checked,
      replaceNbspWithSpace: settingInputs.replaceNbspWithSpace.checked,
      collapseInnerSpaces: settingInputs.collapseInnerSpaces.checked,
      trimLineStart: settingInputs.trimLineStart.checked,
      trimLineEnd: settingInputs.trimLineEnd.checked,
      removeEmptyLines: settingInputs.removeEmptyLines.checked,
      trimWholeText: settingInputs.trimWholeText.checked
    };
  }

  function renderOutput(): void {
    const result = cleanText(sourceInput.value, settings);
    outputInput.value = result.output;
  }

  function toggleSettingsPanel(): void {
    const nextOpenState = settingsPanel.hidden;
    settingsPanel.hidden = !nextOpenState;
    setSettingsButtonState(settingsToggleButton, nextOpenState);
  }

  settingsToggleButton.addEventListener('click', () => {
    toggleSettingsPanel();
  });

  sourceInput.addEventListener('input', () => {
    renderOutput();
  });

  (Object.keys(settingInputs) as SettingFlag[]).forEach((key) => {
    settingInputs[key].addEventListener('change', () => {
      settings = readSettingsFromInputs(settings.version);
      saveTextCleanerSettings(settings);
      renderOutput();
    });
  });

  copyButton.addEventListener('click', () => {
    void (async () => {
      const value = outputInput.value;
      if (!value) {
        setStatus('Нет текста для копирования.', 'warning');
        return;
      }

      const copied = await copyText(value);
      if (copied) {
        setStatus('Очищенный текст скопирован.', 'success');
        return;
      }

      setStatus('Не удалось скопировать очищенный текст.', 'error');
    })();
  });

  clearButton.addEventListener('click', () => {
    sourceInput.value = '';
    outputInput.value = '';
    sourceInput.focus();
    setStatus('Поля очищены.', 'info');
  });

  renderSettings(settings);
  setSettingsButtonState(settingsToggleButton, false);
  renderOutput();
}
