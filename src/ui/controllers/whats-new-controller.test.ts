/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it } from 'vitest';
import type { AppElements } from '../dom/elements';
import { createWhatsNewController } from './whats-new-controller';

interface TestDom {
  readonly elements: AppElements;
  readonly modalDialog: HTMLDivElement;
}

function createTestDom(): TestDom {
  const host = document.createElement('div');

  const siteVersionButton = document.createElement('button');
  siteVersionButton.id = 'site-version-button';
  siteVersionButton.type = 'button';

  const whatsNewModal = document.createElement('div');
  whatsNewModal.id = 'whats-new-modal';
  whatsNewModal.hidden = true;

  const modalDialog = document.createElement('div');
  modalDialog.className = 'whats-new-modal-dialog';

  const whatsNewModalCloseButton = document.createElement('button');
  whatsNewModalCloseButton.id = 'whats-new-modal-close';
  whatsNewModalCloseButton.type = 'button';

  const whatsNewModalContent = document.createElement('div');
  whatsNewModalContent.id = 'whats-new-modal-content';

  modalDialog.append(whatsNewModalCloseButton, whatsNewModalContent);
  whatsNewModal.append(modalDialog);
  host.append(siteVersionButton, whatsNewModal);
  document.body.append(host);

  return {
    modalDialog,
    elements: {
      siteVersionButton,
      whatsNewModal,
      whatsNewModalCloseButton,
      whatsNewModalContent
    } as unknown as AppElements
  };
}

describe('whats new controller', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  it('shows version text and renders parsed changelog', () => {
    const { elements } = createTestDom();
    createWhatsNewController({
      elements,
      version: '1.0.1',
      changelogRaw: `# Changelog

## 1.0.1
15 мая 2026
### Изменения
- Первый пункт`
    });

    expect(elements.siteVersionButton.textContent).toBe('Версия 1.0.1');
    expect(elements.whatsNewModalContent.textContent).toContain('1.0.1');
    expect(elements.whatsNewModalContent.textContent).toContain('15 мая 2026');
    expect(elements.whatsNewModalContent.textContent).toContain('Первый пункт');
    expect(elements.whatsNewModalContent.querySelector('.whats-new-section-title-changed')).not.toBeNull();
  });

  it('opens modal on version click and closes by close button', () => {
    const { elements } = createTestDom();
    createWhatsNewController({
      elements,
      version: '1.0.1',
      changelogRaw: ''
    });

    document.body.style.overflow = 'auto';
    elements.siteVersionButton.click();

    expect(elements.whatsNewModal.hidden).toBe(false);
    expect(document.body.style.overflow).toBe('hidden');

    elements.whatsNewModalCloseButton.click();
    expect(elements.whatsNewModal.hidden).toBe(true);
    expect(document.body.style.overflow).toBe('auto');
    expect(document.activeElement).toBe(elements.siteVersionButton);
  });

  it('closes modal by Escape', () => {
    const { elements } = createTestDom();
    createWhatsNewController({
      elements,
      version: '1.0.1',
      changelogRaw: ''
    });

    elements.siteVersionButton.click();
    expect(elements.whatsNewModal.hidden).toBe(false);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(elements.whatsNewModal.hidden).toBe(true);
  });

  it('closes modal by backdrop click and does not close by dialog click', () => {
    const { elements, modalDialog } = createTestDom();
    createWhatsNewController({
      elements,
      version: '1.0.1',
      changelogRaw: ''
    });

    elements.siteVersionButton.click();
    expect(elements.whatsNewModal.hidden).toBe(false);

    modalDialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(elements.whatsNewModal.hidden).toBe(false);

    elements.whatsNewModal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(elements.whatsNewModal.hidden).toBe(true);
  });

  it('shows fallback text for empty changelog', () => {
    const { elements } = createTestDom();
    createWhatsNewController({
      elements,
      version: '1.0.1',
      changelogRaw: '   \n\n'
    });

    expect(elements.whatsNewModalContent.textContent).toContain('Список изменений пока пуст');
  });
});
