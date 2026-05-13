export const APP_TEMPLATE = `
  <div class="app-shell">
    <div class="topbar">
      <button id="theme-toggle" type="button" class="btn btn-theme" aria-label="Переключить тему" title="Переключить тему"></button>
    </div>
    <span class="bg-shape bg-shape-left" aria-hidden="true"></span>
    <span class="bg-shape bg-shape-right" aria-hidden="true"></span>
    <span class="bg-grid" aria-hidden="true"></span>
    <main class="layout">
      <header class="services-toolbar">
        <div class="services-toolbar-head">
          <p class="services-toolbar-label">Сервисы</p>
        </div>
        <nav class="services-nav" aria-label="Сервисы">
          <button
            id="service-tab-vkusback"
            class="service-tab service-tab-active"
            type="button"
            data-service-tab="vkusback"
            aria-selected="true"
          >
            <span class="service-tab-title">Калькулятор ВкусБэка</span>
            <span class="service-tab-subtitle">Разбор чеков и расчёт</span>
          </button>
          <button id="service-tab-2" class="service-tab" type="button" data-service-tab="service-2" aria-selected="false">
            <span class="service-tab-title">Очистка текста</span>
            <span class="service-tab-subtitle">Уборка лишних пробелов и пустых строк</span>
          </button>
        </nav>
      </header>

      <section id="service-pane-vkusback" class="service-pane service-pane-active">
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
            <section class="panel panel-controls panel-percent">
              <div class="control-row">
                <span class="control-row-label">Процент ВкусБэк</span>
                <div class="percent-preset-group" role="radiogroup" aria-label="Процент ВкусБэк">
                  <button id="percent-btn-3" class="percent-preset-button" type="button" data-percent-value="3" role="radio">
                    3%
                  </button>
                  <button id="percent-btn-5" class="percent-preset-button" type="button" data-percent-value="5" role="radio">
                    5%
                  </button>
                  <button id="percent-btn-8" class="percent-preset-button" type="button" data-percent-value="8" role="radio">
                    8%
                  </button>
                  <button id="percent-btn-10" class="percent-preset-button" type="button" data-percent-value="10" role="radio">
                    10%
                  </button>
                </div>
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
      </section>

      <section id="service-pane-2" class="service-pane service-pane-secondary" hidden>
        <section class="panel panel-cleaner">
          <h2>Очистка текста в реальном времени</h2>

          <div class="cleaner-columns">
            <div class="cleaner-field">
              <label for="text-cleaner-source">Исходный текст</label>
              <textarea
                id="text-cleaner-source"
                rows="12"
                placeholder="Вставьте текст. Очистка выполняется автоматически."
              ></textarea>
            </div>

            <div class="cleaner-field">
              <label for="text-cleaner-output">Очищенный текст</label>
              <textarea id="text-cleaner-output" rows="12" readonly placeholder="Здесь появится результат."></textarea>
              <div class="cleaner-actions">
                <button
                  id="text-cleaner-settings-toggle"
                  class="btn"
                  type="button"
                  aria-expanded="false"
                  aria-controls="text-cleaner-settings-panel"
                >
                  Настройки
                </button>
                <button id="text-cleaner-copy-btn" class="btn btn-primary" type="button">Скопировать</button>
                <button id="text-cleaner-clear-btn" class="btn btn-danger" type="button">Очистить</button>
              </div>
            </div>
          </div>

          <div id="text-cleaner-settings-panel" class="cleaner-settings" hidden>
            <p class="cleaner-settings-title">Правила очистки</p>
            <div class="cleaner-settings-grid">
              <label class="cleaner-setting-row">
                <input id="text-cleaner-setting-normalize-line-breaks" type="checkbox" />
                <span>Нормализовать переносы строк (LF / \\n)</span>
              </label>
              <label class="cleaner-setting-row">
                <input id="text-cleaner-setting-replace-tabs" type="checkbox" />
                <span>Заменять табуляцию на пробел</span>
              </label>
              <label class="cleaner-setting-row">
                <input id="text-cleaner-setting-replace-nbsp" type="checkbox" />
                <span>Заменять неразрывный пробел на обычный</span>
              </label>
              <label class="cleaner-setting-row">
                <input id="text-cleaner-setting-collapse-inner-spaces" type="checkbox" />
                <span>Схлопывать повторные пробелы в строке</span>
              </label>
              <label class="cleaner-setting-row">
                <input id="text-cleaner-setting-trim-line-start" type="checkbox" />
                <span>Удалять пробелы в начале каждой строки</span>
              </label>
              <label class="cleaner-setting-row">
                <input id="text-cleaner-setting-trim-line-end" type="checkbox" />
                <span>Удалять пробелы в конце каждой строки</span>
              </label>
              <label class="cleaner-setting-row">
                <input id="text-cleaner-setting-remove-empty-lines" type="checkbox" />
                <span>Удалять пустые строки</span>
              </label>
              <label class="cleaner-setting-row">
                <input id="text-cleaner-setting-trim-whole-text" type="checkbox" />
                <span>Обрезать пустоты по краям всего текста</span>
              </label>
            </div>
          </div>
        </section>
      </section>

      <section id="status-box" class="status status-floating status-info" aria-live="polite"></section>
      <button id="scroll-top-btn" class="btn scroll-top-btn" type="button" aria-label="Вернуться наверх" title="Наверх">
        ↑
      </button>
    </main>
  </div>
`;

