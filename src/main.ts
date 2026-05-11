import './style.css';
import { calculateMetrics, computeOrderVkusbackSumRaw } from './lib/calculations';
import { formatDecimalForDisplay, normalizeDecimalInput } from './lib/decimal';
import { parseOrderText } from './lib/parser';
import { buildStorageState, hydrateState, loadState, saveState } from './lib/storage';
import type { Order, OrderItem } from './types';

interface AppState {
  orders: Order[];
  percentRaw: string;
}

type StatusTone = 'info' | 'success' | 'warning' | 'error';

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
  <div class="orb orb-left"></div>
  <div class="orb orb-right"></div>
  <main class="layout">
    <header class="hero">
      <p class="hero-kicker">VV Local Tool</p>
      <h1>Расчет ВкусБэк по локальным чекам</h1>
      <p class="hero-subtitle">Вставляйте заказы, считайте точные суммы и кэшбэк без сервера.</p>
    </header>

    <section class="panel panel-input">
      <h2>Новый заказ</h2>
      <textarea id="order-input" rows="10" placeholder="Вставьте сюда текст чека с табами..."></textarea>
      <div class="input-actions">
        <button id="add-order" class="btn btn-primary">Добавить заказ</button>
      </div>
    </section>

    <section class="panel panel-controls">
      <div class="control-row">
        <label for="percent-input">Процент ВкусБэк</label>
        <input id="percent-input" type="text" inputmode="decimal" placeholder="5" />
      </div>
      <div class="control-actions">
        <button id="export-btn" class="btn">Экспорт JSON</button>
        <button id="import-btn" class="btn">Импорт JSON</button>
        <button id="clear-all-btn" class="btn btn-danger">Очистить все</button>
        <input id="import-file" type="file" accept="application/json" hidden />
      </div>
    </section>

    <section class="metrics" aria-live="polite">
      <article class="metric-card">
        <h3>Заказов</h3>
        <p id="metric-orders">0</p>
      </article>
      <article class="metric-card">
        <h3>Сумма ВкусБэк</h3>
        <p id="metric-vkusback">0</p>
      </article>
      <article class="metric-card">
        <h3>Итоговый кэшбэк</h3>
        <p id="metric-cashback">0</p>
      </article>
    </section>

    <section id="status-box" class="status status-info" aria-live="polite"></section>

    <section class="panel panel-orders">
      <h2>Добавленные заказы</h2>
      <div id="orders-list" class="orders-list"></div>
    </section>
  </main>
`;

const orderInput = must(document.querySelector<HTMLTextAreaElement>('#order-input'), 'Не найден #order-input');
const addOrderButton = must(document.querySelector<HTMLButtonElement>('#add-order'), 'Не найден #add-order');
const percentInput = must(document.querySelector<HTMLInputElement>('#percent-input'), 'Не найден #percent-input');
const exportButton = must(document.querySelector<HTMLButtonElement>('#export-btn'), 'Не найден #export-btn');
const importButton = must(document.querySelector<HTMLButtonElement>('#import-btn'), 'Не найден #import-btn');
const clearAllButton = must(document.querySelector<HTMLButtonElement>('#clear-all-btn'), 'Не найден #clear-all-btn');
const importFileInput = must(document.querySelector<HTMLInputElement>('#import-file'), 'Не найден #import-file');
const ordersList = must(document.querySelector<HTMLDivElement>('#orders-list'), 'Не найден #orders-list');
const metricOrders = must(document.querySelector<HTMLParagraphElement>('#metric-orders'), 'Не найден #metric-orders');
const metricVkusback = must(
  document.querySelector<HTMLParagraphElement>('#metric-vkusback'),
  'Не найден #metric-vkusback'
);
const metricCashback = must(
  document.querySelector<HTMLParagraphElement>('#metric-cashback'),
  'Не найден #metric-cashback'
);
const statusBox = must(document.querySelector<HTMLElement>('#status-box'), 'Не найден #status-box');

const loadedState = loadState();
const state: AppState = {
  orders: loadedState.orders,
  percentRaw: loadedState.percentRaw
};

percentInput.value = formatPercentInput(state.percentRaw);

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
  statusBox.textContent = message;
  statusBox.className = `status status-${tone}`;
}

function countEligibleItems(items: OrderItem[]): number {
  return items.filter((item) => item.isVkusbackEligible).length;
}

function renderMetrics(): void {
  const metrics = calculateMetrics(state.orders, state.percentRaw);
  metricOrders.textContent = String(metrics.ordersCount);
  metricVkusback.textContent = formatDecimalForDisplay(metrics.vkusbackTotalRaw);
  metricCashback.textContent = formatDecimalForDisplay(metrics.cashbackRaw);
}

function createOrderTable(items: OrderItem[]): HTMLTableElement {
  const table = document.createElement('table');
  table.className = 'items-table';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const headers = ['Товар', 'Кол-во', 'Сумма', 'ВкусБэк', 'Строка'];

  for (const header of headers) {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  }

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  for (const item of items) {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.textContent = item.name;

    const qtyCell = document.createElement('td');
    qtyCell.textContent = formatDecimalForDisplay(item.quantityRaw);

    const sumCell = document.createElement('td');
    sumCell.textContent = formatDecimalForDisplay(item.sumRaw);

    const eligibleCell = document.createElement('td');
    eligibleCell.textContent = item.isVkusbackEligible ? 'Да' : 'Нет';

    const lineCell = document.createElement('td');
    lineCell.textContent = String(item.sourceRow);

    row.appendChild(nameCell);
    row.appendChild(qtyCell);
    row.appendChild(sumCell);
    row.appendChild(eligibleCell);
    row.appendChild(lineCell);

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

  for (const order of state.orders) {
    const card = document.createElement('article');
    card.className = 'order-card';

    const header = document.createElement('div');
    header.className = 'order-header';

    const title = document.createElement('h3');
    title.textContent = `Заказ ${formatDate(order.createdAt)}`;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn btn-danger';
    deleteButton.textContent = 'Удалить';
    deleteButton.addEventListener('click', () => {
      state.orders = state.orders.filter((current) => current.id !== order.id);
      saveCurrentState();
      renderAll();
      setStatus('Заказ удален.', 'info');
    });

    header.appendChild(title);
    header.appendChild(deleteButton);

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
    createdAt: new Date().toISOString(),
    items: parseResult.items,
    vkusbackSumRaw: computeOrderVkusbackSumRaw(parseResult.items),
    rawInput
  };

  state.orders = [order, ...state.orders];
  saveCurrentState();
  renderAll();
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
  const isConfirmed = window.confirm('Удалить все заказы из локального хранилища?');
  if (!isConfirmed) {
    return;
  }

  state.orders = [];
  saveCurrentState();
  renderAll();
  setStatus('Все заказы очищены.', 'info');
});

exportButton.addEventListener('click', () => {
  const payload = buildStorageState(state.orders, state.percentRaw);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `vv-local-tool-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  setStatus('Экспорт завершен.', 'success');
});

importButton.addEventListener('click', () => {
  importFileInput.click();
});

importFileInput.addEventListener('change', async () => {
  const file = importFileInput.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;
    const imported = hydrateState(parsed);

    state.orders = imported.orders;
    state.percentRaw = imported.percentRaw;

    percentInput.value = formatPercentInput(state.percentRaw);
    saveCurrentState();
    renderAll();
    setStatus('Импорт завершен.', 'success');
  } catch {
    setStatus('Не удалось импортировать файл. Проверьте формат JSON.', 'error');
  } finally {
    importFileInput.value = '';
  }
});

renderAll();
setStatus('Готово к работе. Данные хранятся локально в браузере.', 'info');
