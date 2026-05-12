export interface ClipboardAdapter {
  copyText(value: string): Promise<boolean>;
}

/**
 * Пытается скопировать текст через современный Clipboard API.
 *
 * @param value Текст для копирования.
 * @returns `true`, если копирование успешно.
 */
async function copyWithClipboardApi(value: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Резервный способ копирования через `document.execCommand('copy')`.
 *
 * @param value Текст для копирования.
 * @returns `true`, если браузер подтвердил копирование.
 */
function copyWithExecCommand(value: string): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

/**
 * Создаёт адаптер копирования с graceful fallback для разных браузеров.
 *
 * @returns Объект с методом копирования текста.
 */
export function createClipboardAdapter(): ClipboardAdapter {
  return {
    /**
     * Копирует переданный текст в буфер обмена.
     * Сначала использует Clipboard API, затем fallback через `execCommand`.
     *
     * @param value Текст для копирования.
     * @returns `true`, если копирование выполнено успешно.
     */
    async copyText(value: string): Promise<boolean> {
      if (!value) {
        return false;
      }

      const copiedWithApi = await copyWithClipboardApi(value);
      if (copiedWithApi) {
        return true;
      }

      return copyWithExecCommand(value);
    }
  };
}
