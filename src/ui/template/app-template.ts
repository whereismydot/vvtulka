export const APP_TEMPLATE = `
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
