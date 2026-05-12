import type { ThemeMode, ThemePreference } from '../../infrastructure/browser/theme-preference';

/**
 * Обновляет подпись и иконку кнопки переключения темы.
 *
 * @param themeToggleButton Кнопка переключения темы.
 * @param mode Текущая активная тема.
 */
function renderThemeToggleLabel(themeToggleButton: HTMLButtonElement, mode: ThemeMode): void {
  const currentModeName = mode === 'dark' ? 'тёмная' : 'светлая';
  const nextMode = mode === 'dark' ? 'light' : 'dark';
  const nextModeName = nextMode === 'dark' ? 'тёмную' : 'светлую';
  themeToggleButton.textContent = mode === 'dark' ? '☀' : '🌙';
  themeToggleButton.setAttribute('aria-label', `Сейчас ${currentModeName} тема. Переключить на ${nextModeName}.`);
  themeToggleButton.setAttribute('title', `Переключить на ${nextModeName} тему`);
}

/**
 * Инициализирует управление темой:
 * применяет стартовое значение, обрабатывает клик по кнопке и реакцию на системную тему.
 *
 * @param themeToggleButton Кнопка переключения темы.
 * @param themePreference Адаптер предпочтений темы.
 */
export function createThemeController(themeToggleButton: HTMLButtonElement, themePreference: ThemePreference): void {
  let currentTheme = themePreference.resolveInitialTheme();
  themePreference.applyTheme(currentTheme);
  renderThemeToggleLabel(themeToggleButton, currentTheme);

  themeToggleButton.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    themePreference.applyTheme(currentTheme);
    themePreference.saveTheme(currentTheme);
    renderThemeToggleLabel(themeToggleButton, currentTheme);
  });

  themePreference.watchSystemTheme((systemTheme) => {
    if (themePreference.getStoredTheme() !== null) {
      return;
    }

    currentTheme = systemTheme;
    themePreference.applyTheme(systemTheme);
    renderThemeToggleLabel(themeToggleButton, systemTheme);
  });
}
