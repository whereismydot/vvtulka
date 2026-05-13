/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it } from 'vitest';
import type { AppElements } from '../dom/elements';
import { createServiceTabsController } from './service-tabs-controller';

function createElements(): AppElements {
  const serviceTabVkusbackButton = document.createElement('button');
  const serviceTabTwoButton = document.createElement('button');
  const servicePaneVkusback = document.createElement('section');
  const servicePaneTwo = document.createElement('section');

  return {
    serviceTabVkusbackButton,
    serviceTabTwoButton,
    servicePaneVkusback,
    servicePaneTwo
  } as unknown as AppElements;
}

describe('service tabs controller', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads active tab from storage', () => {
    localStorage.setItem('vv-local-tool.active-service-tab', 'service-2');
    const elements = createElements();

    createServiceTabsController(elements);

    expect(elements.servicePaneTwo.hidden).toBe(false);
    expect(elements.servicePaneVkusback.hidden).toBe(true);
    expect(elements.serviceTabTwoButton.classList.contains('service-tab-active')).toBe(true);
  });

  it('falls back to default tab for invalid storage value', () => {
    localStorage.setItem('vv-local-tool.active-service-tab', 'unknown');
    const elements = createElements();

    createServiceTabsController(elements);

    expect(elements.servicePaneVkusback.hidden).toBe(false);
    expect(elements.servicePaneTwo.hidden).toBe(true);
  });

  it('switches tabs and saves selected tab', () => {
    const elements = createElements();
    createServiceTabsController(elements);

    elements.serviceTabTwoButton.click();
    expect(localStorage.getItem('vv-local-tool.active-service-tab')).toBe('service-2');
    expect(elements.servicePaneTwo.hidden).toBe(false);

    elements.serviceTabVkusbackButton.click();
    expect(localStorage.getItem('vv-local-tool.active-service-tab')).toBe('vkusback');
    expect(elements.servicePaneVkusback.hidden).toBe(false);
  });
});

