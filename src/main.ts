import './style.css';
import { calculateMetrics, computeOrderVkusbackSumRaw } from './lib/calculations';
import { formatDecimalForDisplay, normalizeDecimalInput } from './lib/decimal';
import { parseOrderText } from './lib/parser';
import { buildStorageState, loadState, saveState } from './lib/storage';
import type { Order, OrderItem } from './types';

interface AppState {
  orders: Order[];
  percentRaw: string;
}

type StatusTone = 'info' | 'success' | 'warning' | 'error';
type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'vv_theme_preference';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('Элемент #app не найден.');
}

function must<T>(value: T | null, message: string): T {
  if (value === null) {
    throw new Error(message);
  }
  return value;
}

app.innerHTML = `
  <main class="layout">
    <div class="topbar">
      <button id="theme-toggle" type="button" class="btn btn-theme" aria-label="Переключить тему" title="Переключить тему"></button>
    </div>
    <section class="workspace">
      <section class="panel panel-input">
        <h2>Новый заказ</h2>
        <div class="control-row control-row-title">
          <label for="order-title-input">Название заказа</label>
          <input id="order-title-input" type="text" placeholder="Например: 442 984 922" />
        </div>
        <textarea id="order-input" rows="10" placeholder="Откройте чек заказа. Выделите всё (Ctrl + A), скопируйте (Ctrl + C) и вставьте сюда (Ctrl + V)."></textarea>
        <div class="input-actions">
          <button id="add-order" class="btn btn-primary">Добавить заказ</button>
        </div>
      </section>

      <aside class="workspace-side">
        <section class="panel panel-controls">
          <div class="control-row">
            <label for="percent-input">Процент ВкусБэк</label>
            <input id="percent-input" type="text" inputmode="decimal" placeholder="5" />
          </div>
        </section>

        <section class="metrics metrics-vertical" aria-live="polite">
          <article class="metric-card">
            <h3>Заказов</h3>
            <p id="metric-orders">0</p>
          </article>
          <article class="metric-card">
            <h3>Сумма ВкусБэк</h3>
            <p id="metric-vkusback">0</p>
          </article>
          <article class="metric-card metric-card-cashback">
            <h3>Итоговый кэшбэк</h3>
            <button
              id="metric-cashback"
              class="metric-copy"
              type="button"
              aria-label="Скопировать итоговый кэшбэк"
              title="Нажмите, чтобы скопировать"
            >
              0
            </button>
          </article>
        </section>

        <button id="clear-all-btn" class="btn btn-danger btn-block clear-all-standalone">Очистить список заказов</button>
      </aside>
    </section>

    <section class="panel panel-orders">
      <h2>Добавленные заказы</h2>
      <div id="orders-list" class="orders-list"></div>
    </section>

    <section id="status-box" class="status status-floating status-info" aria-live="polite"></section>
    <button id="scroll-top-btn" class="btn scroll-top-btn" type="button" aria-label="Вернуться наверх" title="Наверх">
      ↑
    </button>
  </main>
`;

const orderInput = must(document.querySelector<HTMLTextAreaElement>('#order-input'), 'Не найден #order-input');
const orderTitleInput = must(
  document.querySelector<HTMLInputElement>('#order-title-input'),
  'Не найден #order-title-input'
);
const addOrderButton = must(document.querySelector<HTMLButtonElement>('#add-order'), 'Не найден #add-order');
const percentInput = must(document.querySelector<HTMLInputElement>('#percent-input'), 'Не найден #percent-input');
const clearAllButton = must(document.querySelector<HTMLButtonElement>('#clear-all-btn'), 'Не найден #clear-all-btn');
const themeToggleButton = must(document.querySelector<HTMLButtonElement>('#theme-toggle'), 'Не найден #theme-toggle');
const ordersList = must(document.querySelector<HTMLDivElement>('#orders-list'), 'Не найден #orders-list');
const metricOrders = must(document.querySelector<HTMLParagraphElement>('#metric-orders'), 'Не найден #metric-orders');
const metricVkusback = must(
  document.querySelector<HTMLParagraphElement>('#metric-vkusback'),
  'Не найден #metric-vkusback'
);
const metricCashback = must(
  document.querySelector<HTMLButtonElement>('#metric-cashback'),
  'Не найден #metric-cashback'
);
const statusBox = must(document.querySelector<HTMLElement>('#status-box'), 'Не найден #status-box');
const scrollTopButton = must(
  document.querySelector<HTMLButtonElement>('#scroll-top-btn'),
  'Не найден #scroll-top-btn'
);

const loadedState = loadState();
const state: AppState = {
  orders: loadedState.orders,
  percentRaw: loadedState.percentRaw
};
let statusTimer: ReturnType<typeof setTimeout> | null = null;
const SCROLL_TOP_VISIBLE_OFFSET = 360;

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): ThemeMode | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === 'light' || raw === 'dark') {
    return raw;
  }

  return null;
}

function resolveInitialTheme(): ThemeMode {
  return getStoredTheme() ?? getSystemTheme();
}

function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode;
}

function renderThemeToggleLabel(mode: ThemeMode): void {
  const currentModeName = mode === 'dark' ? 'тёмная' : 'светлая';
  const nextMode = mode === 'dark' ? 'light' : 'dark';
  const nextModeName = nextMode === 'dark' ? 'тёмную' : 'светлую';
  themeToggleButton.textContent = mode === 'dark' ? '☀' : '🌙';
  themeToggleButton.setAttribute('aria-label', `Сейчас ${currentModeName} тема. Переключить на ${nextModeName}.`);
  themeToggleButton.setAttribute('title', `Переключить на ${nextModeName} тему`);
}

function toggleTheme(): void {
  const activeTheme = (document.documentElement.dataset.theme as ThemeMode | undefined) ?? resolveInitialTheme();
  const nextTheme: ThemeMode = activeTheme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  renderThemeToggleLabel(nextTheme);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }
}

const initialTheme = resolveInitialTheme();
applyTheme(initialTheme);
renderThemeToggleLabel(initialTheme);

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  const colorSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
  colorSchemeMedia.addEventListener('change', () => {
    if (getStoredTheme() !== null) {
      return;
    }

    const systemTheme = colorSchemeMedia.matches ? 'dark' : 'light';
    applyTheme(systemTheme);
    renderThemeToggleLabel(systemTheme);
  });
}

percentInput.value = formatPercentInput(state.percentRaw);
themeToggleButton.addEventListener('click', toggleTheme);
metricCashback.addEventListener('click', async () => {
  const valueToCopy = metricCashback.dataset.copyValue ?? metricCashback.textContent?.trim() ?? '';
  const copied = await copyTextToClipboard(valueToCopy);

  if (copied) {
    setStatus(`Итоговый кэшбэк скопирован: ${valueToCopy}`, 'success');
    return;
  }

  setStatus('Не удалось скопировать итоговый кэшбэк.', 'error');
});

function buildDefaultOrderTitle(orderIndex: number): string {
  return `Заказ ${orderIndex}`;
}

function createOrderId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `order-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function saveCurrentState(): void {
  saveState(buildStorageState(state.orders, state.percentRaw));
}

function formatPercentInput(value: string): string {
  return normalizeDecimalInput(value).replace('.', ',');
}

function sanitizePercentInput(value: string): string {
  const normalized = normalizeDecimalInput(value);
  if (normalized.startsWith('-')) {
    return '0';
  }
  return normalized;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Неизвестная дата';
  }
  return date.toLocaleString('ru-RU');
}

function setStatus(message: string, tone: StatusTone = 'info'): void {
  if (statusTimer !== null) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }

  statusBox.textContent = message;
  statusBox.className = `status status-floating status-${tone} status-visible`;

  const hideDelay =
    tone === 'error' ? 5500 :
    tone === 'warning' ? 4500 :
    3000;

  statusTimer = setTimeout(() => {
    statusBox.classList.remove('status-visible');
  }, hideDelay);
}

function updateScrollTopVisibility(): void {
  const isVisible = window.scrollY > SCROLL_TOP_VISIBLE_OFFSET;
  scrollTopButton.classList.toggle('scroll-top-visible', isVisible);
}

function scrollToTop(): void {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

async function copyTextToClipboard(value: string): Promise<boolean> {
  if (!value) {
    return false;
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fallback below
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

function countEligibleItems(items: OrderItem[]): number {
  return items.filter((item) => item.isVkusbackEligible).length;
}

function renderMetrics(): void {
  const metrics = calculateMetrics(state.orders, state.percentRaw);
  const cashbackDisplay = formatDecimalForDisplay(metrics.cashbackRaw);
  metricOrders.textContent = String(metrics.ordersCount);
  metricVkusback.textContent = formatDecimalForDisplay(metrics.vkusbackTotalRaw);
  metricCashback.textContent = cashbackDisplay;
  metricCashback.dataset.copyValue = cashbackDisplay;
}

function createOrderTable(items: OrderItem[]): HTMLTableElement {
  const table = document.createElement('table');
  table.className = 'items-table';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const headers = ['#', 'Товар', 'Кол-во', 'Сумма', 'ВкусБэк'];

  for (const header of headers) {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  }

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  for (const [index, item] of items.entries()) {
    const row = document.createElement('tr');
    if (item.isVkusbackEligible) {
      row.classList.add('items-row-eligible');
    }

    const indexCell = document.createElement('td');
    indexCell.textContent = String(index + 1);

    const nameCell = document.createElement('td');
    nameCell.textContent = item.name;

    const qtyCell = document.createElement('td');
    qtyCell.textContent = formatDecimalForDisplay(item.quantityRaw);

    const sumCell = document.createElement('td');
    sumCell.textContent = formatDecimalForDisplay(item.sumRaw);

    const eligibleCell = document.createElement('td');
    eligibleCell.textContent = item.isVkusbackEligible ? 'Да' : 'Нет';

    row.appendChild(indexCell);
    row.appendChild(nameCell);
    row.appendChild(qtyCell);
    row.appendChild(sumCell);
    row.appendChild(eligibleCell);

    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  return table;
}

function renderOrders(): void {
  ordersList.innerHTML = '';

  if (state.orders.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'orders-empty';
    empty.textContent = 'Пока нет заказов. Добавьте первый чек выше.';
    ordersList.appendChild(empty);
    return;
  }

  for (const [index, order] of state.orders.entries()) {
    const card = document.createElement('article');
    card.className = 'order-card';

    const header = document.createElement('div');
    header.className = 'order-header';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'order-title-wrap';

    const titleButton = document.createElement('button');
    titleButton.type = 'button';
    titleButton.className = 'order-title-copy';
    titleButton.textContent = order.title;
    titleButton.title = 'Нажмите, чтобы скопировать название';
    titleButton.addEventListener('click', async () => {
      const copied = await copyTextToClipboard(order.title);
      if (copied) {
        setStatus(`Название скопировано: ${order.title}`, 'success');
        return;
      }
      setStatus('Не удалось скопировать название заказа.', 'error');
    });

    const editTitleButton = document.createElement('button');
    editTitleButton.type = 'button';
    editTitleButton.className = 'order-title-edit';
    editTitleButton.textContent = '✎';
    editTitleButton.title = 'Изменить название';
    editTitleButton.setAttribute('aria-label', 'Изменить название заказа');
    editTitleButton.addEventListener('click', () => {
      const nextTitleRaw = window.prompt('Введите новое название заказа:', order.title);
      if (nextTitleRaw === null) {
        return;
      }

      const nextTitle = nextTitleRaw.trim();
      if (!nextTitle) {
        setStatus('Название не может быть пустым.', 'warning');
        return;
      }

      order.title = nextTitle;
      saveCurrentState();
      renderOrders();
      setStatus('Название заказа обновлено.', 'success');
    });

    const orderNumberBadge = document.createElement('span');
    orderNumberBadge.className = 'order-number';
    orderNumberBadge.textContent = `#${index + 1}`;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn btn-danger';
    deleteButton.textContent = 'Удалить';
    deleteButton.addEventListener('click', () => {
      const isConfirmed = window.confirm(`Удалить заказ "${order.title}"?`);
      if (!isConfirmed) {
        return;
      }

      state.orders = state.orders.filter((current) => current.id !== order.id);
      saveCurrentState();
      renderAll();
      setStatus('Заказ удален.', 'info');
    });

    titleWrap.appendChild(orderNumberBadge);
    titleWrap.appendChild(titleButton);
    titleWrap.appendChild(editTitleButton);
    header.appendChild(titleWrap);
    header.appendChild(deleteButton);

    const meta = document.createElement('p');
    meta.className = 'order-meta';
    meta.textContent = `Дата: ${formatDate(order.createdAt)}`;

    const summary = document.createElement('div');
    summary.className = 'order-summary';

    const itemsCount = document.createElement('p');
    itemsCount.textContent = `Товаров: ${order.items.length}`;

    const eligibleCount = document.createElement('p');
    eligibleCount.textContent = `Подходят под ВкусБэк: ${countEligibleItems(order.items)}`;

    const total = document.createElement('p');
    total.textContent = `Сумма ВкусБэк: ${formatDecimalForDisplay(order.vkusbackSumRaw)}`;

    summary.appendChild(itemsCount);
    summary.appendChild(eligibleCount);
    summary.appendChild(total);

    const details = document.createElement('details');
    const detailsSummary = document.createElement('summary');
    detailsSummary.textContent = 'Показать товары';
    details.appendChild(detailsSummary);
    details.appendChild(createOrderTable(order.items));

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(summary);
    card.appendChild(details);
    ordersList.appendChild(card);
  }
}

function renderAll(): void {
  renderMetrics();
  renderOrders();
}

addOrderButton.addEventListener('click', () => {
  const rawInput = orderInput.value.trim();
  if (!rawInput) {
    setStatus('Вставьте чек в текстовое поле.', 'warning');
    return;
  }

  const parseResult = parseOrderText(rawInput);

  if (parseResult.errors.length > 0) {
    setStatus(parseResult.errors.join(' '), 'error');
    return;
  }

  if (parseResult.items.length === 0) {
    setStatus('Не удалось найти товарные строки в чеке.', 'warning');
    return;
  }

  const order: Order = {
    id: createOrderId(),
    title: orderTitleInput.value.trim() || buildDefaultOrderTitle(state.orders.length + 1),
    createdAt: new Date().toISOString(),
    items: parseResult.items,
    vkusbackSumRaw: computeOrderVkusbackSumRaw(parseResult.items),
    rawInput
  };

  state.orders = [order, ...state.orders];
  saveCurrentState();
  renderAll();
  orderTitleInput.value = '';
  orderInput.value = '';

  if (parseResult.warnings.length > 0) {
    setStatus(`Заказ добавлен. Предупреждений: ${parseResult.warnings.length}.`, 'warning');
    return;
  }

  setStatus('Заказ успешно добавлен.', 'success');
});

percentInput.addEventListener('input', () => {
  state.percentRaw = sanitizePercentInput(percentInput.value);
  saveCurrentState();
  renderMetrics();
});

percentInput.addEventListener('blur', () => {
  percentInput.value = formatPercentInput(state.percentRaw);
});

clearAllButton.addEventListener('click', () => {
  const isConfirmed = window.confirm('Очистить список заказов? Это действие нельзя отменить.');
  if (!isConfirmed) {
    return;
  }

  state.orders = [];
  saveCurrentState();
  renderAll();
  setStatus('Все заказы очищены.', 'info');
});

scrollTopButton.addEventListener('click', () => {
  scrollToTop();
});
window.addEventListener('scroll', updateScrollTopVisibility, { passive: true });
updateScrollTopVisibility();

renderAll();
setStatus('Готово к работе. Данные хранятся локально в браузере.', 'info');
