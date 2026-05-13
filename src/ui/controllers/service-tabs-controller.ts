import type { AppElements } from '../dom/elements';

type ServiceTabId = 'vkusback' | 'service-2' | 'service-3';

const ACTIVE_TAB_STORAGE_KEY = 'vv-local-tool.active-service-tab';

interface ServiceTabBinding {
  readonly id: ServiceTabId;
  readonly button: HTMLButtonElement;
  readonly pane: HTMLElement;
}

function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isServiceTabId(value: string): value is ServiceTabId {
  return value === 'vkusback' || value === 'service-2' || value === 'service-3';
}

function loadActiveTab(storage: Storage | null): ServiceTabId {
  if (storage === null) {
    return 'vkusback';
  }

  const raw = storage.getItem(ACTIVE_TAB_STORAGE_KEY);
  if (raw === null || !isServiceTabId(raw)) {
    return 'vkusback';
  }

  return raw;
}

function saveActiveTab(storage: Storage | null, tab: ServiceTabId): void {
  if (storage === null) {
    return;
  }

  storage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
}

function getBindings(elements: AppElements): readonly ServiceTabBinding[] {
  return [
    {
      id: 'vkusback',
      button: elements.serviceTabVkusbackButton,
      pane: elements.servicePaneVkusback
    },
    {
      id: 'service-2',
      button: elements.serviceTabTwoButton,
      pane: elements.servicePaneTwo
    },
    {
      id: 'service-3',
      button: elements.serviceTabThreeButton,
      pane: elements.servicePaneThree
    }
  ];
}

function applyActiveTab(elements: AppElements, tab: ServiceTabId): void {
  getBindings(elements).forEach((binding) => {
    const isActive = binding.id === tab;
    binding.button.classList.toggle('service-tab-active', isActive);
    binding.button.setAttribute('aria-selected', String(isActive));
    binding.pane.classList.toggle('service-pane-active', isActive);
    binding.pane.hidden = !isActive;
  });
}

export function createServiceTabsController(elements: AppElements): void {
  const storage = getStorage();
  const bindings = getBindings(elements);

  const switchTo = (nextTab: ServiceTabId): void => {
    applyActiveTab(elements, nextTab);
    saveActiveTab(storage, nextTab);
  };

  bindings.forEach((binding) => {
    binding.button.addEventListener('click', () => {
      switchTo(binding.id);
    });
  });

  switchTo(loadActiveTab(storage));
}
