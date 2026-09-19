import { calculateMetrics, computeOrderVkusbackSumRaw } from '../domain/metrics/calculations';
import { normalizeDecimalInput } from '../domain/decimal/decimal';
import type { ParseResult, Metrics, Order } from '../domain/types';
import type { AppState } from './app-state';
import type { AddOrderResult, AppActionResult } from './app-results';

interface AppServiceDependencies {
  readonly parseOrderText: (rawInput: string) => ParseResult;
  readonly createOrderId: () => string;
  readonly nowIso: () => string;
  /** Возвращает `false`, если сохранить состояние не удалось. */
  readonly persistState: (state: AppState) => boolean | void;
}

const SAVE_FAILED_NOTE = 'Но сохранить в браузере не удалось (память переполнена или недоступна): после перезагрузки страницы данные пропадут.';

/**
 * Добавляет к результату предупреждение, если состояние не удалось сохранить.
 *
 * @param result Результат операции.
 * @param saved Удалось ли сохранить состояние.
 * @returns Исходный результат или его копия с предупреждением.
 */
function withSaveNote<T extends AppActionResult>(result: T, saved: boolean): T {
  return saved ? result : { ...result, tone: 'warning', message: `${result.message} ${SAVE_FAILED_NOTE}` };
}

/**
 * Формирует дефолтное название заказа по его порядковому номеру.
 *
 * @param orderIndex Порядковый номер заказа в списке.
 * @returns Текст вида `Заказ N`.
 */
function buildDefaultOrderTitle(orderIndex: number): string {
  return `Заказ ${orderIndex}`;
}

/**
 * Нормализует процент кэшбэка и не допускает отрицательные значения.
 *
 * @param value Сырой ввод процента.
 * @returns Нормализованное неотрицательное значение.
 */
function sanitizePercentInput(value: string): string {
  const normalized = normalizeDecimalInput(value);
  if (normalized.startsWith('-')) {
    return '0';
  }
  return normalized;
}

/**
 * Сервис сценариев приложения:
 * управляет состоянием заказов, выполняет бизнес-операции и сохраняет изменения.
 */
export class AppService {
  private readonly dependencies: AppServiceDependencies;
  private orders: Order[];
  private percentRaw: string;

  /**
   * Инициализирует сервис начальными данными и адаптерами инфраструктуры.
   *
   * @param initialState Начальное состояние приложения.
   * @param dependencies Внешние зависимости для парсинга, генерации id и сохранения.
   */
  constructor(initialState: AppState, dependencies: AppServiceDependencies) {
    this.orders = [...initialState.orders];
    this.percentRaw = initialState.percentRaw;
    this.dependencies = dependencies;
  }

  /**
   * Возвращает текущий снимок состояния приложения.
   *
   * @returns Копия текущего списка заказов и процента кэшбэка.
   */
  getState(): AppState {
    return {
      orders: [...this.orders],
      percentRaw: this.percentRaw
    };
  }

  /**
   * Вычисляет агрегированные метрики по текущему состоянию.
   *
   * @returns Метрики для отображения в UI.
   */
  getMetrics(): Metrics {
    return calculateMetrics(this.orders, this.percentRaw);
  }

  /**
   * Добавляет новый заказ на основе введённого текста чека.
   * При успешном добавлении обновляет in-memory состояние и сохраняет его.
   *
   * @param rawInputValue Текст чека из формы.
   * @param orderTitleValue Пользовательское название заказа.
   * @returns Результат операции с тоном и сообщением для UI.
   */
  addOrder(rawInputValue: string, orderTitleValue: string): AddOrderResult {
    const rawInput = rawInputValue.trim();
    if (!rawInput) {
      return {
        changed: false,
        orderAdded: false,
        warningsCount: 0,
        tone: 'warning',
        message: 'Вставьте чек в текстовое поле.'
      };
    }

    const parseResult = this.dependencies.parseOrderText(rawInput);

    if (parseResult.errors.length > 0) {
      return {
        changed: false,
        orderAdded: false,
        warningsCount: 0,
        tone: 'error',
        message: parseResult.errors.join(' ')
      };
    }

    if (parseResult.items.length === 0) {
      return {
        changed: false,
        orderAdded: false,
        warningsCount: parseResult.warnings.length,
        tone: 'warning',
        message: 'Не удалось найти товарные строки в чеке.'
      };
    }

    const order: Order = {
      id: this.dependencies.createOrderId(),
      title: orderTitleValue.trim() || buildDefaultOrderTitle(this.orders.length + 1),
      createdAt: this.dependencies.nowIso(),
      items: parseResult.items,
      vkusbackSumRaw: computeOrderVkusbackSumRaw(parseResult.items),
      rawInput
    };

    this.orders = [order, ...this.orders];
    const saved = this.persistState();

    if (parseResult.warnings.length > 0) {
      return withSaveNote(
        {
          changed: true,
          orderAdded: true,
          warningsCount: parseResult.warnings.length,
          tone: 'warning',
          message: `Заказ добавлен. Предупреждений: ${parseResult.warnings.length}.`
        },
        saved
      );
    }

    return withSaveNote(
      {
        changed: true,
        orderAdded: true,
        warningsCount: 0,
        tone: 'success',
        message: 'Заказ успешно добавлен.'
      },
      saved
    );
  }

  /**
   * Переименовывает существующий заказ и сохраняет изменения.
   *
   * @param orderId Идентификатор заказа.
   * @param nextTitleRaw Новое имя заказа.
   * @returns Результат операции с признаком успешности.
   */
  renameOrder(orderId: string, nextTitleRaw: string): AppActionResult {
    const nextTitle = nextTitleRaw.trim();
    if (!nextTitle) {
      return {
        changed: false,
        tone: 'warning',
        message: 'Название не может быть пустым.'
      };
    }

    const orderIndex = this.orders.findIndex((order) => order.id === orderId);
    if (orderIndex === -1) {
      return {
        changed: false,
        tone: 'error',
        message: 'Заказ не найден.'
      };
    }

    const order = this.orders[orderIndex];
    const nextOrder: Order = { ...order, title: nextTitle };

    this.orders = [...this.orders.slice(0, orderIndex), nextOrder, ...this.orders.slice(orderIndex + 1)];
    const saved = this.persistState();

    return withSaveNote({ changed: true, tone: 'success', message: 'Название заказа обновлено.' }, saved);
  }

  /**
   * Удаляет заказ по идентификатору и сохраняет состояние.
   *
   * @param orderId Идентификатор удаляемого заказа.
   * @returns Результат операции с признаком изменения состояния.
   */
  deleteOrder(orderId: string): AppActionResult {
    const nextOrders = this.orders.filter((order) => order.id !== orderId);
    if (nextOrders.length === this.orders.length) {
      return {
        changed: false,
        tone: 'error',
        message: 'Заказ не найден.'
      };
    }

    this.orders = nextOrders;
    const saved = this.persistState();

    return withSaveNote({ changed: true, tone: 'info', message: 'Заказ удален.' }, saved);
  }

  /**
   * Очищает список заказов и сохраняет пустое состояние.
   *
   * @returns Результат операции очистки.
   */
  clearOrders(): AppActionResult {
    this.orders = [];
    const saved = this.persistState();

    return withSaveNote({ changed: true, tone: 'info', message: 'Все заказы очищены.' }, saved);
  }

  /**
   * Обновляет процент кэшбэка в состоянии и сохраняет изменения.
   *
   * @param rawPercentInput Сырой ввод процента из UI.
   */
  updatePercent(rawPercentInput: string): void {
    this.percentRaw = sanitizePercentInput(rawPercentInput);
    this.persistState();
  }

  /**
   * Сохраняет текущее состояние через внешний persistence-адаптер.
   *
   * @returns `false`, если адаптер сообщил о неудачном сохранении.
   */
  private persistState(): boolean {
    return this.dependencies.persistState(this.getState()) !== false;
  }
}
