import type { TextCleanerSettings } from '../../domain/types';

export const TEXT_CLEANER_SETTINGS_STORAGE_KEY = 'vv_local_tool_text_cleaner_settings_v1';
export const TEXT_CLEANER_SETTINGS_VERSION = 1;

const DEFAULT_TEXT_CLEANER_SETTINGS: TextCleanerSettings = {
  version: TEXT_CLEANER_SETTINGS_VERSION,
  normalizeLineBreaks: true,
  replaceTabsWithSpaces: true,
  replaceNbspWithSpace: true,
  collapseInnerSpaces: true,
  trimLineStart: true,
  trimLineEnd: true,
  removeEmptyLines: true,
  trimWholeText: true
};

type SettingFlag = Exclude<keyof TextCleanerSettings, 'version'>;

/**
 * Возвращает дефолтные настройки очистки текста.
 *
 * @returns Копия дефолтного набора правил.
 */
export function createDefaultTextCleanerSettings(): TextCleanerSettings {
  return { ...DEFAULT_TEXT_CLEANER_SETTINGS };
}

/**
 * Проверяет, что значение является непустым объектом.
 *
 * @param value Проверяемое значение.
 * @returns `true`, если значение можно читать как объект.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Возвращает значение boolean-поля или дефолт.
 *
 * @param source Объект с данными.
 * @param key Имя поля.
 * @param fallback Значение по умолчанию.
 * @returns Нормализованное boolean-значение.
 */
function getBooleanSetting(source: Record<string, unknown>, key: SettingFlag, fallback: boolean): boolean {
  const value = source[key];
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Нормализует пользовательские настройки очистки текста.
 *
 * @param input Сырые данные из внешнего источника.
 * @returns Валидный объект настроек.
 */
export function hydrateTextCleanerSettings(input: unknown): TextCleanerSettings {
  if (!isRecord(input)) {
    return createDefaultTextCleanerSettings();
  }

  const defaults = createDefaultTextCleanerSettings();

  return {
    version: defaults.version,
    normalizeLineBreaks: getBooleanSetting(input, 'normalizeLineBreaks', defaults.normalizeLineBreaks),
    replaceTabsWithSpaces: getBooleanSetting(input, 'replaceTabsWithSpaces', defaults.replaceTabsWithSpaces),
    replaceNbspWithSpace: getBooleanSetting(input, 'replaceNbspWithSpace', defaults.replaceNbspWithSpace),
    collapseInnerSpaces: getBooleanSetting(input, 'collapseInnerSpaces', defaults.collapseInnerSpaces),
    trimLineStart: getBooleanSetting(input, 'trimLineStart', defaults.trimLineStart),
    trimLineEnd: getBooleanSetting(input, 'trimLineEnd', defaults.trimLineEnd),
    removeEmptyLines: getBooleanSetting(input, 'removeEmptyLines', defaults.removeEmptyLines),
    trimWholeText: getBooleanSetting(input, 'trimWholeText', defaults.trimWholeText)
  };
}

/**
 * Возвращает доступный экземпляр storage.
 *
 * @param storageOverride Явно переданное хранилище (например, в тестах).
 * @returns Экземпляр Storage или `null`, если недоступен.
 */
function getStorage(storageOverride?: Storage | null): Storage | null {
  if (storageOverride !== undefined) {
    return storageOverride;
  }

  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage;
}

/**
 * Загружает настройки очистки текста из localStorage.
 *
 * @param storageOverride Явно переданное хранилище (например, в тестах).
 * @returns Нормализованные настройки очистки.
 */
export function loadTextCleanerSettings(storageOverride?: Storage | null): TextCleanerSettings {
  const storage = getStorage(storageOverride);
  if (storage === null) {
    return createDefaultTextCleanerSettings();
  }

  try {
    const raw = storage.getItem(TEXT_CLEANER_SETTINGS_STORAGE_KEY);
    if (raw === null) {
      return createDefaultTextCleanerSettings();
    }

    const parsed = JSON.parse(raw) as unknown;
    return hydrateTextCleanerSettings(parsed);
  } catch {
    return createDefaultTextCleanerSettings();
  }
}

/**
 * Сохраняет настройки очистки текста в localStorage.
 *
 * @param settings Настройки очистки.
 * @param storageOverride Явно переданное хранилище (например, в тестах).
 */
export function saveTextCleanerSettings(settings: TextCleanerSettings, storageOverride?: Storage | null): void {
  const storage = getStorage(storageOverride);
  if (storage === null) {
    return;
  }

  storage.setItem(TEXT_CLEANER_SETTINGS_STORAGE_KEY, JSON.stringify(hydrateTextCleanerSettings(settings)));
}
