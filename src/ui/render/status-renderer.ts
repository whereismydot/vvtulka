import type { StatusTone } from '../../application/app-results';

export interface StatusRenderer {
  setStatus(message: string, tone?: StatusTone): void;
}

/**
 * Создаёт рендерер плавающих статусных сообщений с автоскрытием.
 *
 * @param statusBox Элемент, в который выводится текст статуса.
 * @returns Объект с методом показа статуса.
 */
export function createStatusRenderer(statusBox: HTMLElement): StatusRenderer {
  let statusTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    /**
     * Отображает статусное сообщение и запускает таймер скрытия.
     *
     * @param message Текст сообщения.
     * @param tone Тон сообщения (`info`, `success`, `warning`, `error`).
     */
    setStatus(message: string, tone: StatusTone = 'info'): void {
      if (statusTimer !== null) {
        clearTimeout(statusTimer);
        statusTimer = null;
      }

      statusBox.textContent = message;
      statusBox.className = `status status-floating status-${tone} status-visible`;

      const hideDelay = tone === 'error' ? 5500 : tone === 'warning' ? 4500 : 3000;

      statusTimer = setTimeout(() => {
        statusBox.classList.remove('status-visible');
      }, hideDelay);
    }
  };
}
