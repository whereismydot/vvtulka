/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it } from 'vitest';
import { getAppElements, getAppRoot } from './elements';
import { APP_TEMPLATE } from '../template/app-template';

describe('app elements resolver', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it('returns app root and resolves required elements', () => {
    const root = getAppRoot();
    root.innerHTML = APP_TEMPLATE;

    const elements = getAppElements();
    const footer = root.querySelector('footer.site-footer');
    const licenseLink = root.querySelector<HTMLAnchorElement>(
      'a.site-footer-link[href="https://www.apache.org/licenses/LICENSE-2.0"]'
    );
    const telegramLink = root.querySelector<HTMLAnchorElement>('a.site-footer-link[href="https://t.me/gleb_perveev"]');
    const emailLink = root.querySelector<HTMLAnchorElement>('a.site-footer-link[href="mailto:sanlovty@yandex.ru"]');

    expect(elements.orderInput.id).toBe('order-input');
    expect(elements.textCleanerSourceInput.id).toBe('text-cleaner-source');
    expect(elements.textCleanerOutputCharacterCount.id).toBe('text-cleaner-output-character-count');
    expect(elements.textCleanerRemoveDotBeforeEmojiInput.id).toBe('text-cleaner-setting-remove-dot-before-emoji');
    expect(elements.textCleanerExcludeSpacesFromCharacterCountInput.id).toBe(
      'text-cleaner-setting-exclude-spaces-from-character-count'
    );
    expect(elements.siteVersionButton.id).toBe('site-version-button');
    expect(elements.whatsNewModal.id).toBe('whats-new-modal');
    expect(elements.whatsNewModalCloseButton.id).toBe('whats-new-modal-close');
    expect(elements.whatsNewModalContent.id).toBe('whats-new-modal-content');
    expect(elements.shelfLifeDateInput.id).toBe('shelf-life-date-input');
    expect(elements.metricCashback.id).toBe('metric-cashback');
    expect(footer).not.toBeNull();
    expect(licenseLink).not.toBeNull();
    expect(telegramLink).not.toBeNull();
    expect(emailLink).not.toBeNull();
  });

  it('throws when app root is missing', () => {
    document.body.innerHTML = '';
    expect(() => getAppRoot()).toThrowError('#app element not found.');
  });

  it('throws when a required element is missing', () => {
    const root = getAppRoot();
    root.innerHTML = APP_TEMPLATE;
    document.querySelector('#order-input')?.remove();

    expect(() => getAppElements()).toThrowError('#order-input not found');
  });
});

