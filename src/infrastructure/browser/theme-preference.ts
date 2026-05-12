export type ThemeMode = 'light' | 'dark';

export interface ThemePreference {
  getStoredTheme(): ThemeMode | null;
  resolveInitialTheme(): ThemeMode;
  applyTheme(mode: ThemeMode): void;
  saveTheme(mode: ThemeMode): void;
  watchSystemTheme(onChange: (mode: ThemeMode) => void): void;
}

const THEME_STORAGE_KEY = 'vv_theme_preference';

/**
 * Определяет системную тему пользователя.
 *
 * @returns `dark`, если система в тёмной теме, иначе `light`.
 */
function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Считывает сохранённую тему из localStorage.
 *
 * @returns `light`/`dark` или `null`, если сохранённого значения нет.
 */
function getStorageTheme(): ThemeMode | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === 'light' || raw === 'dark') {
    return raw;
  }

  return null;
}

/**
 * Создаёт адаптер для чтения, применения и отслеживания темы в браузере.
 *
 * @returns Объект управления темой интерфейса.
 */
export function createThemePreference(): ThemePreference {
  return {
    /**
     * Возвращает явно сохранённую пользователем тему.
     *
     * @returns Сохранённая тема или `null`.
     */
    getStoredTheme(): ThemeMode | null {
      return getStorageTheme();
    },

    /**
     * Вычисляет стартовую тему: сохранённая настройка приоритетнее системной.
     *
     * @returns Тема для начальной инициализации UI.
     */
    resolveInitialTheme(): ThemeMode {
      return getStorageTheme() ?? getSystemTheme();
    },

    /**
     * Применяет тему к корневому DOM-элементу через `data-theme`.
     *
     * @param mode Целевая тема интерфейса.
     */
    applyTheme(mode: ThemeMode): void {
      if (typeof document === 'undefined') {
        return;
      }
      document.documentElement.dataset.theme = mode;
    },

    /**
     * Сохраняет тему пользователя в localStorage.
     *
     * @param mode Тема для сохранения.
     */
    saveTheme(mode: ThemeMode): void {
      if (typeof localStorage === 'undefined') {
        return;
      }
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    },

    /**
     * Подписывает обработчик на изменения системной темы.
     *
     * @param onChange Колбэк, вызываемый при смене системной темы.
     */
    watchSystemTheme(onChange: (mode: ThemeMode) => void): void {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return;
      }

      const colorSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
      colorSchemeMedia.addEventListener('change', () => {
        onChange(colorSchemeMedia.matches ? 'dark' : 'light');
      });
    }
  };
}
