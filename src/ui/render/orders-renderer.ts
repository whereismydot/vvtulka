import { formatDecimalForDisplay } from '../../domain/decimal/decimal';
import type { Order, OrderItem } from '../../domain/types';
import { formatDate } from '../formatters/date';

export interface OrderCardActions {
  onCopyTitle(title: string): void;
  onEditTitle(order: Order): void;
  onDeleteOrder(order: Order): void;
}

/**
 * Подсчитывает количество позиций заказа, подходящих под ВкусБэк.
 *
 * @param items Позиции заказа.
 * @returns Количество подходящих позиций.
 */
function countEligibleItems(items: readonly OrderItem[]): number {
  return items.filter((item) => item.isVkusbackEligible).length;
}

/**
 * Строит таблицу позиций для одного заказа.
 *
 * @param items Позиции заказа.
 * @returns Готовый DOM-элемент таблицы.
 */
function createOrderTable(items: readonly OrderItem[]): HTMLTableElement {
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

/**
 * Рендерит список заказов и привязывает обработчики действий карточки.
 *
 * @param ordersList Контейнер списка заказов.
 * @param orders Текущий список заказов.
 * @param actions Действия для карточек заказов.
 */
export function renderOrders(
  ordersList: HTMLDivElement,
  orders: readonly Order[],
  actions: OrderCardActions
): void {
  ordersList.innerHTML = '';

  if (orders.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'orders-empty';
    empty.textContent = 'Пока нет заказов. Добавьте первый чек выше.';
    ordersList.appendChild(empty);
    return;
  }

  for (const [index, order] of orders.entries()) {
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
    titleButton.addEventListener('click', () => {
      actions.onCopyTitle(order.title);
    });

    const editTitleButton = document.createElement('button');
    editTitleButton.type = 'button';
    editTitleButton.className = 'order-title-edit';
    editTitleButton.textContent = '✎';
    editTitleButton.title = 'Изменить название';
    editTitleButton.setAttribute('aria-label', 'Изменить название заказа');
    editTitleButton.addEventListener('click', () => {
      actions.onEditTitle(order);
    });

    const orderNumberBadge = document.createElement('span');
    orderNumberBadge.className = 'order-number';
    orderNumberBadge.textContent = `#${index + 1}`;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn btn-danger';
    deleteButton.textContent = 'Удалить';
    deleteButton.addEventListener('click', () => {
      actions.onDeleteOrder(order);
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
