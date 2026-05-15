import { parseChangelog } from '../../domain/changelog/parser';
import type { AppElements } from '../dom/elements';

interface WhatsNewControllerDependencies {
  readonly elements: AppElements;
  readonly version: string;
  readonly changelogRaw: string;
}

function createSectionTitleClass(title: string): string | null {
  const normalized = title.toLowerCase();
  if (normalized.includes('нов')) {
    return 'whats-new-section-title-new';
  }

  if (normalized.includes('измен')) {
    return 'whats-new-section-title-changed';
  }

  if (normalized.includes('исправ')) {
    return 'whats-new-section-title-fixed';
  }

  return null;
}

/**
 * Initializes footer version button and "What's New" modal behaviour.
 */
export function createWhatsNewController(dependencies: WhatsNewControllerDependencies): void {
  const { elements, version, changelogRaw } = dependencies;
  const openButton = elements.siteVersionButton;
  const modal = elements.whatsNewModal;
  const closeButton = elements.whatsNewModalCloseButton;
  const contentHost = elements.whatsNewModalContent;

  let previousBodyOverflow = '';

  function renderContent(): void {
    const parsed = parseChangelog(changelogRaw);
    contentHost.textContent = '';

    if (parsed.entries.length === 0) {
      const emptyState = document.createElement('p');
      emptyState.className = 'whats-new-empty';
      emptyState.textContent = 'Список изменений пока пуст';
      contentHost.append(emptyState);
      return;
    }

    const fragment = document.createDocumentFragment();
    parsed.entries.forEach((entry) => {
      const entryNode = document.createElement('article');
      entryNode.className = 'whats-new-entry';

      const versionNode = document.createElement('h3');
      versionNode.className = 'whats-new-entry-version';
      versionNode.textContent = entry.version;
      entryNode.append(versionNode);

      if (entry.date !== null) {
        const dateNode = document.createElement('p');
        dateNode.className = 'whats-new-entry-date';
        dateNode.textContent = entry.date;
        entryNode.append(dateNode);
      }

      entry.sections.forEach((section) => {
        const sectionTitle = document.createElement('h4');
        sectionTitle.className = 'whats-new-section-title';
        const accentClass = createSectionTitleClass(section.title);
        if (accentClass !== null) {
          sectionTitle.classList.add(accentClass);
        }
        sectionTitle.textContent = section.title;
        entryNode.append(sectionTitle);

        const list = document.createElement('ul');
        list.className = 'whats-new-list';
        section.items.forEach((item) => {
          const itemNode = document.createElement('li');
          itemNode.textContent = item;
          list.append(itemNode);
        });
        entryNode.append(list);
      });

      fragment.append(entryNode);
    });

    contentHost.append(fragment);
  }

  function openModal(): void {
    if (!modal.hidden) {
      return;
    }

    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.hidden = false;
    closeButton.focus();
  }

  function closeModal(): void {
    if (modal.hidden) {
      return;
    }

    modal.hidden = true;
    document.body.style.overflow = previousBodyOverflow;
    openButton.focus();
  }

  openButton.textContent = `Версия ${version}`;
  renderContent();

  openButton.addEventListener('click', () => {
    openModal();
  });

  closeButton.addEventListener('click', () => {
    closeModal();
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  });
}
