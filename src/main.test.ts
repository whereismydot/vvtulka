/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const appServiceInstance = {};
const AppServiceCtor = vi.fn().mockImplementation(() => appServiceInstance);
const parseOrderText = vi.fn();
const nowIso = vi.fn().mockReturnValue('2026-01-01T00:00:00.000Z');
const nextId = vi.fn().mockReturnValue('id-1');
const createClock = vi.fn().mockReturnValue({ nowIso });
const createIdGenerator = vi.fn().mockReturnValue({ nextId });
const themePreference = { stub: true };
const createThemePreference = vi.fn().mockReturnValue(themePreference);
const saveState = vi.fn();
const buildStorageState = vi.fn().mockReturnValue({ serialized: true });
const loadState = vi.fn().mockReturnValue({ orders: [{ id: 'a' }], percentRaw: '8' });
const createAppController = vi.fn();
const getAppElements = vi.fn().mockReturnValue({ marker: 'elements' });
const getAppRoot = vi.fn();
const APP_TEMPLATE = '<section class="stub-template">Template</section>';

vi.mock('./application/app-service', () => ({
  AppService: AppServiceCtor
}));
vi.mock('./domain/receipt/parser', () => ({
  parseOrderText
}));
vi.mock('./infrastructure/browser/clock', () => ({
  createClock
}));
vi.mock('./infrastructure/browser/id-generator', () => ({
  createIdGenerator
}));
vi.mock('./infrastructure/browser/theme-preference', () => ({
  createThemePreference
}));
vi.mock('./infrastructure/storage/local-storage-state', () => ({
  buildStorageState,
  loadState,
  saveState
}));
vi.mock('./ui/controllers/app-controller', () => ({
  createAppController
}));
vi.mock('./ui/dom/elements', () => ({
  getAppElements,
  getAppRoot
}));
vi.mock('./ui/template/app-template', () => ({
  APP_TEMPLATE
}));

describe('main entrypoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    getAppRoot.mockImplementation(() => document.querySelector('#app') as HTMLDivElement);
  });

  it('renders template and wires service/controller', async () => {
    await import('./main');

    const root = document.querySelector('#app') as HTMLDivElement;
    expect(root.innerHTML).toContain('stub-template');
    expect(loadState).toHaveBeenCalledTimes(1);
    expect(createClock).toHaveBeenCalledTimes(1);
    expect(createIdGenerator).toHaveBeenCalledTimes(1);
    expect(createThemePreference).toHaveBeenCalledTimes(1);
    expect(AppServiceCtor).toHaveBeenCalledTimes(1);
    expect(createAppController).toHaveBeenCalledWith({
      service: appServiceInstance,
      elements: { marker: 'elements' },
      themePreference
    });
  });

  it('passes persistence callback that serializes and saves state', async () => {
    await import('./main');

    const deps = AppServiceCtor.mock.calls[0]?.[1] as {
      persistState: (state: { orders: unknown[]; percentRaw: string }) => void;
    };

    deps.persistState({ orders: [{ id: 'x' }], percentRaw: '3' });

    expect(buildStorageState).toHaveBeenCalledWith([{ id: 'x' }], '3');
    expect(saveState).toHaveBeenCalledWith({ serialized: true });
  });
});

