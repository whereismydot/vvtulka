import { must } from './must';

export interface AppElements {
  readonly serviceTabVkusbackButton: HTMLButtonElement;
  readonly serviceTabTwoButton: HTMLButtonElement;
  readonly serviceTabThreeButton: HTMLButtonElement;
  readonly serviceTabUrgentButton: HTMLButtonElement;
  readonly servicePaneVkusback: HTMLElement;
  readonly servicePaneTwo: HTMLElement;
  readonly servicePaneThree: HTMLElement;
  readonly servicePaneUrgent: HTMLElement;
  readonly urgentDateInput: HTMLInputElement;
  readonly urgentTextInput: HTMLTextAreaElement;
  readonly urgentRunButton: HTMLButtonElement;
  readonly urgentSteps: HTMLDivElement;
  readonly urgentLogDetails: HTMLDetailsElement;
  readonly urgentLog: HTMLPreElement;
  readonly urgentError: HTMLDivElement;
  readonly urgentResult: HTMLElement;
  readonly urgentStat: HTMLElement;
  readonly urgentKpiTotal: HTMLElement;
  readonly urgentKpiSwaps: HTMLElement;
  readonly urgentKpiUnchanged: HTMLElement;
  readonly urgentWarnings: HTMLDivElement;
  readonly urgentSearchInput: HTMLInputElement;
  readonly urgentOnlySwapsInput: HTMLInputElement;
  readonly urgentSortSelect: HTMLSelectElement;
  readonly urgentTable: HTMLDivElement;
  readonly urgentOutputPanel: HTMLElement;
  readonly urgentOutput: HTMLDivElement;
  readonly urgentCopyButton: HTMLButtonElement;
  readonly orderInput: HTMLTextAreaElement;
  readonly orderTitleInput: HTMLInputElement;
  readonly addOrderButton: HTMLButtonElement;
  readonly percentButtons: ReadonlyArray<HTMLButtonElement>;
  readonly clearAllButton: HTMLButtonElement;
  readonly textCleanerSourceInput: HTMLTextAreaElement;
  readonly textCleanerOutputInput: HTMLTextAreaElement;
  readonly textCleanerSettingsToggleButton: HTMLButtonElement;
  readonly textCleanerCopyButton: HTMLButtonElement;
  readonly textCleanerClearButton: HTMLButtonElement;
  readonly textCleanerSettingsPanel: HTMLDivElement;
  readonly textCleanerNormalizeLineBreaksInput: HTMLInputElement;
  readonly textCleanerReplaceTabsInput: HTMLInputElement;
  readonly textCleanerReplaceNbspInput: HTMLInputElement;
  readonly textCleanerCollapseInnerSpacesInput: HTMLInputElement;
  readonly textCleanerTrimLineStartInput: HTMLInputElement;
  readonly textCleanerTrimLineEndInput: HTMLInputElement;
  readonly textCleanerRemoveEmptyLinesInput: HTMLInputElement;
  readonly textCleanerTrimWholeTextInput: HTMLInputElement;
  readonly shelfLifeForm: HTMLFormElement;
  readonly shelfLifeDateInput: HTMLInputElement;
  readonly shelfLifeDateError: HTMLElement;
  readonly shelfLifeYesterdayButton: HTMLButtonElement;
  readonly shelfLifeCalendarButton: HTMLButtonElement;
  readonly shelfLifeDatePicker: HTMLInputElement;
  readonly shelfLifeTermInput: HTMLInputElement;
  readonly shelfLifeUnitSelect: HTMLSelectElement;
  readonly shelfLifeUseTimeInput: HTMLInputElement;
  readonly shelfLifeTimeRow: HTMLDivElement;
  readonly shelfLifeTimeInput: HTMLInputElement;
  readonly shelfLifeCheckButton: HTMLButtonElement;
  readonly shelfLifeResult: HTMLElement;
  readonly shelfLifeResultText: HTMLParagraphElement;
  readonly themeToggleButton: HTMLButtonElement;
  readonly ordersList: HTMLDivElement;
  readonly metricOrders: HTMLParagraphElement;
  readonly metricVkusback: HTMLParagraphElement;
  readonly metricCashback: HTMLButtonElement;
  readonly statusBox: HTMLElement;
  readonly scrollTopButton: HTMLButtonElement;
}

/**
 * Returns root app container.
 */
export function getAppRoot(): HTMLDivElement {
  return must(document.querySelector<HTMLDivElement>('#app'), '#app element not found.');
}

/**
 * Resolves and validates all required DOM elements.
 */
export function getAppElements(): AppElements {
  return {
    serviceTabVkusbackButton: must(
      document.querySelector<HTMLButtonElement>('#service-tab-vkusback'),
      '#service-tab-vkusback not found'
    ),
    serviceTabTwoButton: must(document.querySelector<HTMLButtonElement>('#service-tab-2'), '#service-tab-2 not found'),
    serviceTabThreeButton: must(document.querySelector<HTMLButtonElement>('#service-tab-3'), '#service-tab-3 not found'),
    serviceTabUrgentButton: must(document.querySelector<HTMLButtonElement>('#service-tab-4'), '#service-tab-4 not found'),
    servicePaneVkusback: must(document.querySelector<HTMLElement>('#service-pane-vkusback'), '#service-pane-vkusback not found'),
    servicePaneTwo: must(document.querySelector<HTMLElement>('#service-pane-2'), '#service-pane-2 not found'),
    servicePaneThree: must(document.querySelector<HTMLElement>('#service-pane-3'), '#service-pane-3 not found'),
    servicePaneUrgent: must(document.querySelector<HTMLElement>('#service-pane-4'), '#service-pane-4 not found'),
    urgentDateInput: must(document.querySelector<HTMLInputElement>('#urgent-date-input'), '#urgent-date-input not found'),
    urgentTextInput: must(document.querySelector<HTMLTextAreaElement>('#urgent-text-input'), '#urgent-text-input not found'),
    urgentRunButton: must(document.querySelector<HTMLButtonElement>('#urgent-run-btn'), '#urgent-run-btn not found'),
    urgentSteps: must(document.querySelector<HTMLDivElement>('#urgent-steps'), '#urgent-steps not found'),
    urgentLogDetails: must(document.querySelector<HTMLDetailsElement>('#urgent-log-details'), '#urgent-log-details not found'),
    urgentLog: must(document.querySelector<HTMLPreElement>('#urgent-log'), '#urgent-log not found'),
    urgentError: must(document.querySelector<HTMLDivElement>('#urgent-error'), '#urgent-error not found'),
    urgentResult: must(document.querySelector<HTMLElement>('#urgent-result'), '#urgent-result not found'),
    urgentStat: must(document.querySelector<HTMLElement>('#urgent-stat'), '#urgent-stat not found'),
    urgentKpiTotal: must(document.querySelector<HTMLElement>('#urgent-kpi-total'), '#urgent-kpi-total not found'),
    urgentKpiSwaps: must(document.querySelector<HTMLElement>('#urgent-kpi-swaps'), '#urgent-kpi-swaps not found'),
    urgentKpiUnchanged: must(document.querySelector<HTMLElement>('#urgent-kpi-unchanged'), '#urgent-kpi-unchanged not found'),
    urgentWarnings: must(document.querySelector<HTMLDivElement>('#urgent-warnings'), '#urgent-warnings not found'),
    urgentSearchInput: must(document.querySelector<HTMLInputElement>('#urgent-search-input'), '#urgent-search-input not found'),
    urgentOnlySwapsInput: must(document.querySelector<HTMLInputElement>('#urgent-only-swaps-input'), '#urgent-only-swaps-input not found'),
    urgentSortSelect: must(document.querySelector<HTMLSelectElement>('#urgent-sort-select'), '#urgent-sort-select not found'),
    urgentTable: must(document.querySelector<HTMLDivElement>('#urgent-table'), '#urgent-table not found'),
    urgentOutputPanel: must(document.querySelector<HTMLElement>('#urgent-output-panel'), '#urgent-output-panel not found'),
    urgentOutput: must(document.querySelector<HTMLDivElement>('#urgent-output'), '#urgent-output not found'),
    urgentCopyButton: must(document.querySelector<HTMLButtonElement>('#urgent-copy-btn'), '#urgent-copy-btn not found'),
    orderInput: must(document.querySelector<HTMLTextAreaElement>('#order-input'), '#order-input not found'),
    orderTitleInput: must(document.querySelector<HTMLInputElement>('#order-title-input'), '#order-title-input not found'),
    addOrderButton: must(document.querySelector<HTMLButtonElement>('#add-order'), '#add-order not found'),
    percentButtons: [
      must(document.querySelector<HTMLButtonElement>('#percent-btn-3'), '#percent-btn-3 not found'),
      must(document.querySelector<HTMLButtonElement>('#percent-btn-5'), '#percent-btn-5 not found'),
      must(document.querySelector<HTMLButtonElement>('#percent-btn-8'), '#percent-btn-8 not found'),
      must(document.querySelector<HTMLButtonElement>('#percent-btn-10'), '#percent-btn-10 not found')
    ],
    clearAllButton: must(document.querySelector<HTMLButtonElement>('#clear-all-btn'), '#clear-all-btn not found'),
    textCleanerSourceInput: must(document.querySelector<HTMLTextAreaElement>('#text-cleaner-source'), '#text-cleaner-source not found'),
    textCleanerOutputInput: must(document.querySelector<HTMLTextAreaElement>('#text-cleaner-output'), '#text-cleaner-output not found'),
    textCleanerSettingsToggleButton: must(
      document.querySelector<HTMLButtonElement>('#text-cleaner-settings-toggle'),
      '#text-cleaner-settings-toggle not found'
    ),
    textCleanerCopyButton: must(document.querySelector<HTMLButtonElement>('#text-cleaner-copy-btn'), '#text-cleaner-copy-btn not found'),
    textCleanerClearButton: must(document.querySelector<HTMLButtonElement>('#text-cleaner-clear-btn'), '#text-cleaner-clear-btn not found'),
    textCleanerSettingsPanel: must(document.querySelector<HTMLDivElement>('#text-cleaner-settings-panel'), '#text-cleaner-settings-panel not found'),
    textCleanerNormalizeLineBreaksInput: must(
      document.querySelector<HTMLInputElement>('#text-cleaner-setting-normalize-line-breaks'),
      '#text-cleaner-setting-normalize-line-breaks not found'
    ),
    textCleanerReplaceTabsInput: must(
      document.querySelector<HTMLInputElement>('#text-cleaner-setting-replace-tabs'),
      '#text-cleaner-setting-replace-tabs not found'
    ),
    textCleanerReplaceNbspInput: must(
      document.querySelector<HTMLInputElement>('#text-cleaner-setting-replace-nbsp'),
      '#text-cleaner-setting-replace-nbsp not found'
    ),
    textCleanerCollapseInnerSpacesInput: must(
      document.querySelector<HTMLInputElement>('#text-cleaner-setting-collapse-inner-spaces'),
      '#text-cleaner-setting-collapse-inner-spaces not found'
    ),
    textCleanerTrimLineStartInput: must(
      document.querySelector<HTMLInputElement>('#text-cleaner-setting-trim-line-start'),
      '#text-cleaner-setting-trim-line-start not found'
    ),
    textCleanerTrimLineEndInput: must(
      document.querySelector<HTMLInputElement>('#text-cleaner-setting-trim-line-end'),
      '#text-cleaner-setting-trim-line-end not found'
    ),
    textCleanerRemoveEmptyLinesInput: must(
      document.querySelector<HTMLInputElement>('#text-cleaner-setting-remove-empty-lines'),
      '#text-cleaner-setting-remove-empty-lines not found'
    ),
    textCleanerTrimWholeTextInput: must(
      document.querySelector<HTMLInputElement>('#text-cleaner-setting-trim-whole-text'),
      '#text-cleaner-setting-trim-whole-text not found'
    ),
    shelfLifeForm: must(document.querySelector<HTMLFormElement>('#shelf-life-form'), '#shelf-life-form not found'),
    shelfLifeDateInput: must(document.querySelector<HTMLInputElement>('#shelf-life-date-input'), '#shelf-life-date-input not found'),
    shelfLifeDateError: must(document.querySelector<HTMLElement>('#shelf-life-date-error'), '#shelf-life-date-error not found'),
    shelfLifeYesterdayButton: must(
      document.querySelector<HTMLButtonElement>('#shelf-life-yesterday-btn'),
      '#shelf-life-yesterday-btn not found'
    ),
    shelfLifeCalendarButton: must(
      document.querySelector<HTMLButtonElement>('#shelf-life-calendar-btn'),
      '#shelf-life-calendar-btn not found'
    ),
    shelfLifeDatePicker: must(document.querySelector<HTMLInputElement>('#shelf-life-date-picker'), '#shelf-life-date-picker not found'),
    shelfLifeTermInput: must(document.querySelector<HTMLInputElement>('#shelf-life-term-input'), '#shelf-life-term-input not found'),
    shelfLifeUnitSelect: must(document.querySelector<HTMLSelectElement>('#shelf-life-unit-select'), '#shelf-life-unit-select not found'),
    shelfLifeUseTimeInput: must(
      document.querySelector<HTMLInputElement>('#shelf-life-use-time-input'),
      '#shelf-life-use-time-input not found'
    ),
    shelfLifeTimeRow: must(document.querySelector<HTMLDivElement>('#shelf-life-time-row'), '#shelf-life-time-row not found'),
    shelfLifeTimeInput: must(document.querySelector<HTMLInputElement>('#shelf-life-time-input'), '#shelf-life-time-input not found'),
    shelfLifeCheckButton: must(document.querySelector<HTMLButtonElement>('#shelf-life-check-btn'), '#shelf-life-check-btn not found'),
    shelfLifeResult: must(document.querySelector<HTMLElement>('#shelf-life-result'), '#shelf-life-result not found'),
    shelfLifeResultText: must(
      document.querySelector<HTMLParagraphElement>('#shelf-life-result-text'),
      '#shelf-life-result-text not found'
    ),
    themeToggleButton: must(document.querySelector<HTMLButtonElement>('#theme-toggle'), '#theme-toggle not found'),
    ordersList: must(document.querySelector<HTMLDivElement>('#orders-list'), '#orders-list not found'),
    metricOrders: must(document.querySelector<HTMLParagraphElement>('#metric-orders'), '#metric-orders not found'),
    metricVkusback: must(document.querySelector<HTMLParagraphElement>('#metric-vkusback'), '#metric-vkusback not found'),
    metricCashback: must(document.querySelector<HTMLButtonElement>('#metric-cashback'), '#metric-cashback not found'),
    statusBox: must(document.querySelector<HTMLElement>('#status-box'), '#status-box not found'),
    scrollTopButton: must(document.querySelector<HTMLButtonElement>('#scroll-top-btn'), '#scroll-top-btn not found')
  };
}
