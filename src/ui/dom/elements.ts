import { must } from './must';

export interface AppElements {
  readonly orderInput: HTMLTextAreaElement;
  readonly orderTitleInput: HTMLInputElement;
  readonly addOrderButton: HTMLButtonElement;
  readonly percentInput: HTMLInputElement;
  readonly clearAllButton: HTMLButtonElement;
  readonly themeToggleButton: HTMLButtonElement;
  readonly ordersList: HTMLDivElement;
  readonly metricOrders: HTMLParagraphElement;
  readonly metricVkusback: HTMLParagraphElement;
  readonly metricCashback: HTMLButtonElement;
  readonly statusBox: HTMLElement;
  readonly scrollTopButton: HTMLButtonElement;
}

/**
 * Возвращает корневой контейнер приложения.
 *
 * @returns DOM-элемент `#app`.
 * @throws {Error} Если элемент `#app` отсутствует в документе.
 */
export function getAppRoot(): HTMLDivElement {
  return must(document.querySelector<HTMLDivElement>('#app'), 'Элемент #app не найден.');
}

/**
 * Получает и валидирует все DOM-элементы, используемые приложением.
 *
 * @returns Набор типизированных ссылок на элементы интерфейса.
 * @throws {Error} Если какой-либо обязательный элемент не найден.
 */
export function getAppElements(): AppElements {
  return {
    orderInput: must(document.querySelector<HTMLTextAreaElement>('#order-input'), 'Не найден #order-input'),
    orderTitleInput: must(
      document.querySelector<HTMLInputElement>('#order-title-input'),
      'Не найден #order-title-input'
    ),
    addOrderButton: must(document.querySelector<HTMLButtonElement>('#add-order'), 'Не найден #add-order'),
    percentInput: must(document.querySelector<HTMLInputElement>('#percent-input'), 'Не найден #percent-input'),
    clearAllButton: must(document.querySelector<HTMLButtonElement>('#clear-all-btn'), 'Не найден #clear-all-btn'),
    themeToggleButton: must(document.querySelector<HTMLButtonElement>('#theme-toggle'), 'Не найден #theme-toggle'),
    ordersList: must(document.querySelector<HTMLDivElement>('#orders-list'), 'Не найден #orders-list'),
    metricOrders: must(document.querySelector<HTMLParagraphElement>('#metric-orders'), 'Не найден #metric-orders'),
    metricVkusback: must(
      document.querySelector<HTMLParagraphElement>('#metric-vkusback'),
      'Не найден #metric-vkusback'
    ),
    metricCashback: must(
      document.querySelector<HTMLButtonElement>('#metric-cashback'),
      'Не найден #metric-cashback'
    ),
    statusBox: must(document.querySelector<HTMLElement>('#status-box'), 'Не найден #status-box'),
    scrollTopButton: must(document.querySelector<HTMLButtonElement>('#scroll-top-btn'), 'Не найден #scroll-top-btn')
  };
}
