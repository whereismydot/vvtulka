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

    expect(elements.orderInput.id).toBe('order-input');
    expect(elements.textCleanerSourceInput.id).toBe('text-cleaner-source');
    expect(elements.shelfLifeDateInput.id).toBe('shelf-life-date-input');
    expect(elements.metricCashback.id).toBe('metric-cashback');
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

