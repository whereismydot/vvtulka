import { AppService } from '../../application/app-service';
import { createClipboardAdapter } from '../../infrastructure/browser/clipboard';
import type { ThemePreference } from '../../infrastructure/browser/theme-preference';
import type { Order } from '../../domain/types';
import type { AppElements } from '../dom/elements';
import { renderMetrics } from '../render/metrics-renderer';
import { renderOrders } from '../render/orders-renderer';
import { createStatusRenderer } from '../render/status-renderer';
import { createScrollTopController } from './scroll-top-controller';
import { createServiceTabsController } from './service-tabs-controller';
import { createTextCleanerController } from './text-cleaner-controller';
import { createThemeController } from './theme-controller';

interface AppControllerDependencies {
  readonly service: AppService;
  readonly elements: AppElements;
  readonly themePreference: ThemePreference;
}

const PERCENT_PRESETS = ['3', '5', '8', '10'] as const;

/**
 * Проверяет, что значение процента относится к доступным пресетам.
 *
 * @param value Строковое значение процента.
 * @returns `true`, если значение есть среди preset-кнопок.
 */
function isPresetPercent(value: string): value is (typeof PERCENT_PRESETS)[number] {
  return PERCENT_PRESETS.includes(value as (typeof PERCENT_PRESETS)[number]);
}

/**
 * Связывает сервис приложения с DOM: рендерит состояние и регистрирует обработчики UI-событий.
 *
 * @param dependencies Зависимости контроллера: сервис, элементы и адаптер темы.
 */
export function createAppController(dependencies: AppControllerDependencies): void {
  const { service, elements, themePreference } = dependencies;
  const clipboard = createClipboardAdapter();
  const statusRenderer = createStatusRenderer(elements.statusBox);

  /**
   * Обновляет карточки метрик на основе текущего состояния сервиса.
   */
  function renderCurrentMetrics(): void {
    renderMetrics(
      {
        metricOrders: elements.metricOrders,
        metricVkusback: elements.metricVkusback,
        metricCashback: elements.metricCashback
      },
      service.getMetrics()
    );
  }

  /**
   * Полностью перерисовывает метрики и список заказов из текущего состояния сервиса.
   */
  function renderAll(): void {
    renderCurrentMetrics();

    renderOrders(elements.ordersList, service.getState().orders, {
      onCopyTitle(title: string): void {
        void copyOrderTitle(title);
      },
      onEditTitle(order: Order): void {
        editOrderTitle(order);
      },
      onDeleteOrder(order: Order): void {
        deleteOrder(order);
      }
    });
  }

  /**
   * Копирует название заказа в буфер обмена и показывает статус операции.
   *
   * @param title Название заказа для копирования.
   */
  async function copyOrderTitle(title: string): Promise<void> {
    const copied = await clipboard.copyText(title);
    if (copied) {
      statusRenderer.setStatus(`Название скопировано: ${title}`, 'success');
      return;
    }

    statusRenderer.setStatus('Не удалось скопировать название заказа.', 'error');
  }

  /**
   * Копирует итоговый кэшбэк из карточки метрик и отображает результат.
   */
  async function copyCashbackValue(): Promise<void> {
    const valueToCopy = elements.metricCashback.dataset.copyValue ?? elements.metricCashback.textContent?.trim() ?? '';
    const copied = await clipboard.copyText(valueToCopy);
    if (copied) {
      statusRenderer.setStatus(`Итоговый кэшбэк скопирован: ${valueToCopy}`, 'success');
      return;
    }

    statusRenderer.setStatus('Не удалось скопировать итоговый кэшбэк.', 'error');
  }

  /**
   * Запрашивает новое название заказа и применяет переименование через сервис.
   *
   * @param order Заказ, который нужно переименовать.
   */
  function editOrderTitle(order: Order): void {
    const nextTitleRaw = window.prompt('Введите новое название заказа:', order.title);
    if (nextTitleRaw === null) {
      return;
    }

    const result = service.renameOrder(order.id, nextTitleRaw);
    if (result.changed) {
      renderAll();
    }
    statusRenderer.setStatus(result.message, result.tone);
  }

  /**
   * Подтверждает и выполняет удаление заказа через сервис.
   *
   * @param order Заказ, который нужно удалить.
   */
  function deleteOrder(order: Order): void {
    const isConfirmed = window.confirm(`Удалить заказ "${order.title}"?`);
    if (!isConfirmed) {
      return;
    }

    const result = service.deleteOrder(order.id);
    if (result.changed) {
      renderAll();
    }
    statusRenderer.setStatus(result.message, result.tone);
  }

  /**
   * Обновляет выделение активной preset-кнопки процента.
   *
   * @param value Активное значение процента.
   */
  function setActivePercentButton(value: string): void {
    elements.percentButtons.forEach((button) => {
      const isActive = button.dataset.percentValue === value;
      button.classList.toggle('percent-preset-button-active', isActive);
      button.setAttribute('aria-checked', String(isActive));
    });
  }

  const initialPercentValue = service.getState().percentRaw;
  const selectedPercent = isPresetPercent(initialPercentValue) ? initialPercentValue : '5';
  if (selectedPercent !== initialPercentValue) {
    service.updatePercent(selectedPercent);
  }
  setActivePercentButton(selectedPercent);

  createThemeController(elements.themeToggleButton, themePreference);
  createScrollTopController(elements.scrollTopButton);
  createServiceTabsController(elements);
  createTextCleanerController({
    elements,
    copyText: (value: string) => clipboard.copyText(value),
    setStatus: (message, tone) => statusRenderer.setStatus(message, tone)
  });

  elements.metricCashback.addEventListener('click', () => {
    void copyCashbackValue();
  });

  elements.addOrderButton.addEventListener('click', () => {
    const result = service.addOrder(elements.orderInput.value, elements.orderTitleInput.value);
    if (result.orderAdded) {
      elements.orderTitleInput.value = '';
      elements.orderInput.value = '';
      renderAll();
    }

    statusRenderer.setStatus(result.message, result.tone);
  });

  elements.percentButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextPercent = button.dataset.percentValue;
      if (!nextPercent || !isPresetPercent(nextPercent)) {
        return;
      }

      service.updatePercent(nextPercent);
      setActivePercentButton(nextPercent);
      renderCurrentMetrics();
    });
  });

  elements.clearAllButton.addEventListener('click', () => {
    const isConfirmed = window.confirm('Очистить список заказов? Это действие нельзя отменить.');
    if (!isConfirmed) {
      return;
    }

    const result = service.clearOrders();
    renderAll();
    statusRenderer.setStatus(result.message, result.tone);
  });

  renderAll();
  statusRenderer.setStatus('Готово к работе. Данные хранятся локально в браузере.', 'info');
}
