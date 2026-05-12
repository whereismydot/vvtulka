import type { AppElements } from '../dom/elements';

type ServiceTabId = 'vkusback' | 'service-2';

const ACTIVE_TAB_STORAGE_KEY = 'vv-local-tool.active-service-tab';

/**
 * Возвращает доступный localStorage или `null`, если среда его не поддерживает.
 *
 * @returns Экземпляр Storage или `null` при недоступности.
 */
function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Проверяет, что строка соответствует поддерживаемому идентификатору вкладки.
 *
 * @param value Проверяемое значение.
 * @returns `true`, если значение можно использовать как идентификатор вкладки.
 */
function isServiceTabId(value: string): value is ServiceTabId {
  return value === 'vkusback' || value === 'service-2';
}

/**
 * Загружает сохранённый идентификатор активной вкладки.
 *
 * @param storage Хранилище браузера или `null`.
 * @returns Идентификатор вкладки; по умолчанию — `vkusback`.
 */
function loadActiveTab(storage: Storage | null): ServiceTabId {
  if (storage === null) {
    return 'vkusback';
  }

  const raw = storage.getItem(ACTIVE_TAB_STORAGE_KEY);
  if (raw === null || !isServiceTabId(raw)) {
    return 'vkusback';
  }

  return raw;
}

/**
 * Сохраняет активную вкладку в localStorage.
 *
 * @param storage Хранилище браузера или `null`.
 * @param tab Идентификатор вкладки.
 */
function saveActiveTab(storage: Storage | null, tab: ServiceTabId): void {
  if (storage === null) {
    return;
  }

  storage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
}

/**
 * Переключает активную вкладку и синхронизирует атрибуты доступности.
 *
 * @param elements DOM-элементы приложения.
 * @param tab Целевая вкладка.
 */
function applyActiveTab(elements: AppElements, tab: ServiceTabId): void {
  const vkusbackActive = tab === 'vkusback';

  elements.serviceTabVkusbackButton.classList.toggle('service-tab-active', vkusbackActive);
  elements.serviceTabVkusbackButton.setAttribute('aria-selected', String(vkusbackActive));
  elements.servicePaneVkusback.classList.toggle('service-pane-active', vkusbackActive);
  elements.servicePaneVkusback.hidden = !vkusbackActive;

  elements.serviceTabTwoButton.classList.toggle('service-tab-active', !vkusbackActive);
  elements.serviceTabTwoButton.setAttribute('aria-selected', String(!vkusbackActive));
  elements.servicePaneTwo.classList.toggle('service-pane-active', !vkusbackActive);
  elements.servicePaneTwo.hidden = vkusbackActive;
}

/**
 * Инициализирует переключение вкладок сервисов и сохранение активной вкладки.
 *
 * @param elements DOM-элементы приложения.
 */
export function createServiceTabsController(elements: AppElements): void {
  const storage = getStorage();

  const switchTo = (nextTab: ServiceTabId): void => {
    applyActiveTab(elements, nextTab);
    saveActiveTab(storage, nextTab);
  };

  elements.serviceTabVkusbackButton.addEventListener('click', () => {
    switchTo('vkusback');
  });

  elements.serviceTabTwoButton.addEventListener('click', () => {
    switchTo('service-2');
  });

  switchTo(loadActiveTab(storage));
}
