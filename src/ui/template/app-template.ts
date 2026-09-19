const icon = (paths: string): string =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;

const ICON_RECEIPT = icon('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6"/>');
const ICON_TEXT = icon('<path d="M4 6h16M4 12h10M4 18h7"/><path d="M15 15l5 5m0-5l-5 5"/>');
const ICON_CALENDAR = icon('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>');
const ICON_BOLT = icon('<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>');
const ICON_BOX = icon('<path d="M3 7l9-4 9 4v10l-9 4-9-4V7z"/><path d="M3 7l9 4 9-4M12 11v10"/>');
const ICON_PERCENT = icon('<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2"/><circle cx="17" cy="17" r="2"/>');
const ICON_WALLET = icon('<path d="M3 7a2 2 0 012-2h13v4"/><path d="M3 7v11a2 2 0 002 2h15V9H5a2 2 0 01-2-2z"/><path d="M16 14.5h2"/>');
const ICON_USERS = icon('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.2a6.5 6.5 0 013.5 5.8"/>');
const ICON_SWAP = icon('<path d="M7 7h12l-3-3M17 17H5l3 3"/>');
const ICON_CHECK = icon('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/>');

export const APP_TEMPLATE = `
  <div class="app-shell">
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" href="./" aria-label="ВВТулка">
          <img class="brand-mark" src="./favicon.svg" alt="" width="28" height="28" />
          <span class="brand-name">ВВТулка</span>
        </a>
        <nav class="services-nav" aria-label="Сервисы">
          <button
            id="service-tab-vkusback"
            class="service-tab service-tab-active"
            type="button"
            data-service-tab="vkusback"
            aria-selected="true"
          >
            <span class="service-tab-icon">${ICON_RECEIPT}</span>
            <span class="service-tab-title">ВкусБэк</span>
          </button>
          <button id="service-tab-2" class="service-tab" type="button" data-service-tab="service-2" aria-selected="false">
            <span class="service-tab-icon">${ICON_TEXT}</span>
            <span class="service-tab-title">Очистка текста</span>
          </button>
          <button id="service-tab-3" class="service-tab" type="button" data-service-tab="service-3" aria-selected="false">
            <span class="service-tab-icon">${ICON_CALENDAR}</span>
            <span class="service-tab-title">Срок годности</span>
          </button>
          <button id="service-tab-4" class="service-tab" type="button" data-service-tab="urgent" aria-selected="false">
            <span class="service-tab-icon">${ICON_BOLT}</span>
            <span class="service-tab-title">Срочные</span>
          </button>
        </nav>
        <button id="theme-toggle" type="button" class="btn-theme" aria-label="Переключить тему" title="Переключить тему"></button>
      </div>
    </header>
    <main class="layout">
      <section id="service-pane-vkusback" class="service-pane service-pane-active">
        <header class="page-head">
          <h1 class="page-title">Калькулятор ВкусБэка</h1>
          <p class="page-subtitle">Разбор чеков и расчёт кэшбэка</p>
        </header>
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
              <article class="metric-card kpi-card">
                <span class="kpi-icon">${ICON_BOX}</span>
                <h3>Заказов</h3>
                <p id="metric-orders">0</p>
              </article>
              <article class="metric-card kpi-card">
                <span class="kpi-icon">${ICON_PERCENT}</span>
                <h3>Сумма ВкусБэк</h3>
                <p id="metric-vkusback">0</p>
              </article>
              <article class="metric-card metric-card-cashback kpi-card">
                <span class="kpi-icon">${ICON_WALLET}</span>
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
        <header class="page-head">
          <h1 class="page-title">Очистка текста</h1>
          <p class="page-subtitle">Уборка лишних пробелов и пустых строк в реальном времени</p>
        </header>
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

      <section id="service-pane-3" class="service-pane service-pane-secondary" hidden>
        <header class="page-head">
          <h1 class="page-title">Калькулятор срока годности</h1>
          <p class="page-subtitle">Проверка срока по дате изготовления</p>
        </header>
        <section class="panel panel-shelf-life">
          <h2>Калькулятор срока годности</h2>

          <form id="shelf-life-form" class="shelf-life-form" novalidate>
            <div class="shelf-life-row">
              <label for="shelf-life-date-input">Дата изготовления</label>
              <input
                id="shelf-life-date-input"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                placeholder="ДД.ММ.ГГГГ"
                maxlength="10"
              />
            </div>

            <div class="shelf-life-row">
              <label for="shelf-life-term-input">Срок годности</label>
              <div class="shelf-life-term-controls">
                <input id="shelf-life-term-input" type="number" min="1" step="1" value="10" />
                <select id="shelf-life-unit-select">
                  <option value="days">Дней (суток)</option>
                  <option value="weeks">Недель</option>
                  <option value="months" selected>Месяцев</option>
                  <option value="years">Лет</option>
                </select>
              </div>
            </div>

            <label class="shelf-life-time-toggle">
              <input id="shelf-life-use-time-input" type="checkbox" />
              <span>Учитывать конкретное время</span>
            </label>

            <div id="shelf-life-time-row" class="shelf-life-row shelf-life-time-row" hidden>
              <label for="shelf-life-time-input">Время изготовления</label>
              <input id="shelf-life-time-input" type="time" />
            </div>

            <div class="shelf-life-actions">
              <button id="shelf-life-check-btn" class="btn btn-primary" type="submit">Проверить</button>
            </div>
          </form>

          <section id="shelf-life-result" class="shelf-life-result" aria-live="polite" hidden>
            <p id="shelf-life-result-text"></p>
          </section>
        </section>
      </section>

      <section id="service-pane-4" class="service-pane service-pane-secondary" hidden>
        <header class="page-head">
          <h1 class="page-title">Срочные: замены</h1>
          <p class="page-subtitle">Подбор замен по графику и числу срочных выходов</p>
        </header>
        <section class="panel panel-urgent">
          <h2>Срочные: подбор замен</h2>
          <div class="urgent-date-row">
            <label for="urgent-date-input">Распределение на дату</label>
            <input id="urgent-date-input" type="date" />
            <span class="urgent-hint">Срочные считаются с 1-го числа месяца до этой даты (сам день не входит).</span>
          </div>
          <textarea id="urgent-text-input" rows="9" placeholder="Вставьте текст распределения от бота."></textarea>
          <div class="input-actions">
            <button id="urgent-run-btn" class="btn btn-primary" type="button">Подобрать замены</button>
          </div>
          <div id="urgent-steps" class="urgent-steps" hidden></div>
          <details id="urgent-log-details" class="urgent-log-details" hidden>
            <summary>Лог работы</summary>
            <pre id="urgent-log" class="urgent-log"></pre>
          </details>
          <div id="urgent-error" class="urgent-error" role="alert" hidden></div>
        </section>

        <section id="urgent-result" class="urgent-results" hidden>
          <div class="kpi-grid">
            <article class="kpi-card">
              <span class="kpi-icon">${ICON_USERS}</span>
              <h3>Всего дежурных</h3>
              <p id="urgent-kpi-total">0</p>
            </article>
            <article class="kpi-card">
              <span class="kpi-icon">${ICON_SWAP}</span>
              <h3>Замен</h3>
              <p id="urgent-kpi-swaps">0</p>
            </article>
            <article class="kpi-card">
              <span class="kpi-icon kpi-icon-info">${ICON_CHECK}</span>
              <h3>Без замены</h3>
              <p id="urgent-kpi-unchanged">0</p>
            </article>
          </div>
          <div class="panel panel-urgent-result">
          <div class="urgent-result-head">
            <h2>Кого на кого меняем</h2>
            <span id="urgent-stat" class="urgent-hint"></span>
          </div>
          <div id="urgent-warnings" class="urgent-warnings"></div>
          <div class="urgent-tools">
            <input id="urgent-search-input" type="text" placeholder="Поиск по ФИО или @тегу" autocomplete="off" />
            <label class="urgent-only-swaps">
              <input id="urgent-only-swaps-input" type="checkbox" checked />
              <span>Только замены</span>
            </label>
            <label class="urgent-sort">
              <span>Сортировка</span>
              <select id="urgent-sort-select">
                <option value="text">Как в тексте бота</option>
                <option value="name-current:asc">ФИО (было): А → Я</option>
                <option value="name-current:desc">ФИО (было): Я → А</option>
                <option value="name-replacement:asc">ФИО (станет): А → Я</option>
                <option value="name-replacement:desc">ФИО (станет): Я → А</option>
                <option value="count-current:desc">Срочных (было): больше → меньше</option>
                <option value="count-current:asc">Срочных (было): меньше → больше</option>
                <option value="count-replacement:desc">Срочных (станет): больше → меньше</option>
                <option value="count-replacement:asc">Срочных (станет): меньше → больше</option>
                <option value="team-current:asc">Команда (было): 1 → 4</option>
                <option value="team-current:desc">Команда (было): 4 → 1</option>
                <option value="team-replacement:asc">Команда (станет): 1 → 4</option>
                <option value="team-replacement:desc">Команда (станет): 4 → 1</option>
                <option value="shift:asc">График: раньше → позже</option>
                <option value="shift:desc">График: позже → раньше</option>
              </select>
            </label>
            <span class="urgent-hint">Клик по ФИО или тегу копирует его. Порядок итогового текста не меняется.</span>
          </div>
          <div id="urgent-table" class="urgent-table-wrap"></div>
          </div>
        </section>

        <section id="urgent-output-panel" class="panel panel-urgent-output" hidden>
          <div class="urgent-result-head">
            <h2>Готовый текст</h2>
            <button id="urgent-copy-btn" class="btn btn-primary" type="button">Скопировать текст</button>
          </div>
          <div id="urgent-output" class="urgent-output"></div>
        </section>
      </section>

      <section id="status-box" class="status status-floating status-info" aria-live="polite"></section>
      <button id="scroll-top-btn" class="btn scroll-top-btn" type="button" aria-label="Вернуться наверх" title="Наверх">
        ↑
      </button>
    </main>
    <footer class="site-footer" role="contentinfo">
      <p class="site-footer-text">
        © 2026 Gleb Perveev. Licensed under
        <a class="site-footer-link" href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer">Apache License 2.0</a>.
      </p>
      <p class="site-footer-text">
        <span class="site-footer-label">По вопросам:</span>
        <a class="site-footer-link" href="https://t.me/gleb_perveev" target="_blank" rel="noopener noreferrer">@gleb_perveev</a>
        <span class="site-footer-separator" aria-hidden="true">·</span>
        <a class="site-footer-link" href="mailto:sanlovty@yandex.ru">sanlovty@yandex.ru</a>
      </p>
    </footer>
  </div>
`;

