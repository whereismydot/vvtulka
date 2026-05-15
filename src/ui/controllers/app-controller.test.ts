/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppService } from '../../application/app-service';
import type { Order } from '../../domain/types';
import type { ThemePreference } from '../../infrastructure/browser/theme-preference';
import type { AppElements } from '../dom/elements';
import { createAppController } from './app-controller';
import { createClipboardAdapter } from '../../infrastructure/browser/clipboard';
import { renderMetrics } from '../render/metrics-renderer';
import { renderOrders } from '../render/orders-renderer';
import { createStatusRenderer } from '../render/status-renderer';
import { createScrollTopController } from './scroll-top-controller';
import { createServiceTabsController } from './service-tabs-controller';
import { createShelfLifeController } from './shelf-life-controller';
import { createTextCleanerController } from './text-cleaner-controller';
import { createThemeController } from './theme-controller';

vi.mock('../../infrastructure/browser/clipboard', () => ({
  createClipboardAdapter: vi.fn()
}));
vi.mock('../render/metrics-renderer', () => ({
  renderMetrics: vi.fn()
}));
vi.mock('../render/orders-renderer', () => ({
  renderOrders: vi.fn()
}));
vi.mock('../render/status-renderer', () => ({
  createStatusRenderer: vi.fn()
}));
vi.mock('./scroll-top-controller', () => ({
  createScrollTopController: vi.fn()
}));
vi.mock('./service-tabs-controller', () => ({
  createServiceTabsController: vi.fn()
}));
vi.mock('./shelf-life-controller', () => ({
  createShelfLifeController: vi.fn()
}));
vi.mock('./text-cleaner-controller', () => ({
  createTextCleanerController: vi.fn()
}));
vi.mock('./theme-controller', () => ({
  createThemeController: vi.fn()
}));

interface ServiceMocks {
  getState: ReturnType<typeof vi.fn>;
  getMetrics: ReturnType<typeof vi.fn>;
  addOrder: ReturnType<typeof vi.fn>;
  updatePercent: ReturnType<typeof vi.fn>;
  clearOrders: ReturnType<typeof vi.fn>;
  renameOrder: ReturnType<typeof vi.fn>;
  deleteOrder: ReturnType<typeof vi.fn>;
}

function createElements(): AppElements {
  const createPercentButton = (value: string): HTMLButtonElement => {
    const button = document.createElement('button');
    button.dataset.percentValue = value;
    return button;
  };

  return {
    serviceTabVkusbackButton: document.createElement('button'),
    serviceTabTwoButton: document.createElement('button'),
    serviceTabThreeButton: document.createElement('button'),
    servicePaneVkusback: document.createElement('section'),
    servicePaneTwo: document.createElement('section'),
    servicePaneThree: document.createElement('section'),
    orderInput: document.createElement('textarea'),
    orderTitleInput: document.createElement('input'),
    addOrderButton: document.createElement('button'),
    percentButtons: [createPercentButton('3'), createPercentButton('5'), createPercentButton('8'), createPercentButton('10')],
    clearAllButton: document.createElement('button'),
    textCleanerSourceInput: document.createElement('textarea'),
    textCleanerOutputInput: document.createElement('textarea'),
    textCleanerSettingsToggleButton: document.createElement('button'),
    textCleanerCopyButton: document.createElement('button'),
    textCleanerClearButton: document.createElement('button'),
    textCleanerSettingsPanel: document.createElement('div'),
    textCleanerNormalizeLineBreaksInput: document.createElement('input'),
    textCleanerReplaceTabsInput: document.createElement('input'),
    textCleanerReplaceNbspInput: document.createElement('input'),
    textCleanerCollapseInnerSpacesInput: document.createElement('input'),
    textCleanerTrimLineStartInput: document.createElement('input'),
    textCleanerTrimLineEndInput: document.createElement('input'),
    textCleanerRemoveEmptyLinesInput: document.createElement('input'),
    textCleanerTrimWholeTextInput: document.createElement('input'),
    textCleanerRemoveDotBeforeEmojiInput: document.createElement('input'),
    textCleanerExcludeSpacesFromCharacterCountInput: document.createElement('input'),
    textCleanerOutputCharacterCount: document.createElement('p'),
    shelfLifeForm: document.createElement('form'),
    shelfLifeDateInput: document.createElement('input'),
    shelfLifeTermInput: document.createElement('input'),
    shelfLifeUnitSelect: document.createElement('select'),
    shelfLifeUseTimeInput: document.createElement('input'),
    shelfLifeTimeRow: document.createElement('div'),
    shelfLifeTimeInput: document.createElement('input'),
    shelfLifeCheckButton: document.createElement('button'),
    shelfLifeResult: document.createElement('section'),
    shelfLifeResultText: document.createElement('p'),
    themeToggleButton: document.createElement('button'),
    ordersList: document.createElement('div'),
    metricOrders: document.createElement('p'),
    metricVkusback: document.createElement('p'),
    metricCashback: document.createElement('button'),
    statusBox: document.createElement('section'),
    scrollTopButton: document.createElement('button')
  };
}

function createService(overrides?: Partial<ServiceMocks>): { service: AppService; mocks: ServiceMocks } {
  const defaultOrder: Order = {
    id: 'order-1',
    title: 'Заказ 1',
    createdAt: '2026-01-01T00:00:00.000Z',
    items: [],
    rawInput: 'raw',
    vkusbackSumRaw: '0'
  };
  const mocks: ServiceMocks = {
    getState: vi.fn().mockReturnValue({ orders: [defaultOrder], percentRaw: '7' }),
    getMetrics: vi.fn().mockReturnValue({ ordersCount: 1, vkusbackTotalRaw: '100', percentRaw: '5', cashbackRaw: '5' }),
    addOrder: vi.fn().mockReturnValue({
      changed: true,
      orderAdded: true,
      warningsCount: 0,
      tone: 'success',
      message: 'ok'
    }),
    updatePercent: vi.fn(),
    clearOrders: vi.fn().mockReturnValue({ changed: true, tone: 'info', message: 'cleared' }),
    renameOrder: vi.fn().mockReturnValue({ changed: true, tone: 'success', message: 'renamed' }),
    deleteOrder: vi.fn().mockReturnValue({ changed: true, tone: 'info', message: 'deleted' }),
    ...overrides
  };

  return { service: mocks as unknown as AppService, mocks };
}

function createThemePreference(): ThemePreference {
  return {
    getStoredTheme: () => null,
    resolveInitialTheme: () => 'light',
    applyTheme: () => undefined,
    saveTheme: () => undefined,
    watchSystemTheme: () => undefined
  };
}

describe('app controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'confirm', { configurable: true, value: vi.fn().mockReturnValue(true) });
    Object.defineProperty(window, 'prompt', { configurable: true, value: vi.fn().mockReturnValue('Новое имя') });
  });

  it('wires child controllers and normalizes non-preset percent on init', () => {
    const elements = createElements();
    const { service, mocks } = createService();
    const setStatus = vi.fn();
    const copyText = vi.fn().mockResolvedValue(true);

    vi.mocked(createClipboardAdapter).mockReturnValue({ copyText });
    vi.mocked(createStatusRenderer).mockReturnValue({ setStatus });

    createAppController({
      service,
      elements,
      themePreference: createThemePreference()
    });

    expect(mocks.updatePercent).toHaveBeenCalledWith('5');
    expect(elements.percentButtons[1].classList.contains('percent-preset-button-active')).toBe(true);
    expect(vi.mocked(createThemeController)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(createScrollTopController)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(createServiceTabsController)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(createTextCleanerController)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(createShelfLifeController)).toHaveBeenCalledTimes(1);
    expect(setStatus).toHaveBeenCalledWith(expect.any(String), 'info');
  });

  it('handles add order, percent click, clear all and cashback copy', async () => {
    const elements = createElements();
    const { service, mocks } = createService({
      getState: vi.fn().mockReturnValue({ orders: [], percentRaw: '5' })
    });
    const setStatus = vi.fn();
    const copyText = vi.fn().mockResolvedValue(true);

    vi.mocked(createClipboardAdapter).mockReturnValue({ copyText });
    vi.mocked(createStatusRenderer).mockReturnValue({ setStatus });

    createAppController({
      service,
      elements,
      themePreference: createThemePreference()
    });

    elements.orderInput.value = 'raw чек';
    elements.orderTitleInput.value = 'title';
    elements.addOrderButton.click();
    expect(mocks.addOrder).toHaveBeenCalledWith('raw чек', 'title');
    expect(elements.orderInput.value).toBe('');
    expect(elements.orderTitleInput.value).toBe('');

    elements.percentButtons[2].click();
    expect(mocks.updatePercent).toHaveBeenCalledWith('8');
    expect(vi.mocked(renderMetrics).mock.calls.length).toBeGreaterThan(0);

    elements.metricCashback.dataset.copyValue = '9,9';
    elements.metricCashback.click();
    await Promise.resolve();
    expect(copyText).toHaveBeenCalledWith('9,9');

    elements.clearAllButton.click();
    expect(mocks.clearOrders).toHaveBeenCalledTimes(1);
  });

  it('uses renderOrders callbacks for copy, rename and delete', async () => {
    const order: Order = {
      id: 'order-2',
      title: 'Тест',
      createdAt: '2026-01-01T00:00:00.000Z',
      items: [],
      rawInput: 'raw',
      vkusbackSumRaw: '0'
    };
    const elements = createElements();
    const { service, mocks } = createService({
      getState: vi.fn().mockReturnValue({ orders: [order], percentRaw: '5' })
    });
    const setStatus = vi.fn();
    const copyText = vi.fn().mockResolvedValue(true);
    const callbacks: { onCopyTitle: (title: string) => void; onEditTitle: (item: Order) => void; onDeleteOrder: (item: Order) => void } = {
      onCopyTitle: () => undefined,
      onEditTitle: () => undefined,
      onDeleteOrder: () => undefined
    };

    vi.mocked(renderOrders).mockImplementation((_list, _orders, actions) => {
      callbacks.onCopyTitle = actions.onCopyTitle;
      callbacks.onEditTitle = actions.onEditTitle;
      callbacks.onDeleteOrder = actions.onDeleteOrder;
    });
    vi.mocked(createClipboardAdapter).mockReturnValue({ copyText });
    vi.mocked(createStatusRenderer).mockReturnValue({ setStatus });

    createAppController({
      service,
      elements,
      themePreference: createThemePreference()
    });

    callbacks.onCopyTitle(order.title);
    await Promise.resolve();
    expect(copyText).toHaveBeenCalledWith(order.title);

    callbacks.onEditTitle(order);
    expect(mocks.renameOrder).toHaveBeenCalledWith('order-2', 'Новое имя');

    callbacks.onDeleteOrder(order);
    expect(mocks.deleteOrder).toHaveBeenCalledWith('order-2');
  });
});
