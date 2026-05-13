import { must } from './must';

export interface AppElements {
  readonly serviceTabVkusbackButton: HTMLButtonElement;
  readonly serviceTabTwoButton: HTMLButtonElement;
  readonly serviceTabThreeButton: HTMLButtonElement;
  readonly servicePaneVkusback: HTMLElement;
  readonly servicePaneTwo: HTMLElement;
  readonly servicePaneThree: HTMLElement;
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
    servicePaneVkusback: must(document.querySelector<HTMLElement>('#service-pane-vkusback'), '#service-pane-vkusback not found'),
    servicePaneTwo: must(document.querySelector<HTMLElement>('#service-pane-2'), '#service-pane-2 not found'),
    servicePaneThree: must(document.querySelector<HTMLElement>('#service-pane-3'), '#service-pane-3 not found'),
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
