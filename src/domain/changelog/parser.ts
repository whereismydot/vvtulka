export interface ChangelogSection {
  readonly title: string;
  readonly items: readonly string[];
}

export interface ChangelogEntry {
  readonly version: string;
  readonly date: string | null;
  readonly sections: readonly ChangelogSection[];
}

export interface ChangelogDocument {
  readonly entries: readonly ChangelogEntry[];
}

const VERSION_PATTERN = /^##\s+(.+)$/;
const SECTION_PATTERN = /^###\s+(.+)$/;
const ITEM_PATTERN = /^-\s+(.+)$/;

/**
 * Parses a markdown changelog with sections by version/category.
 * Unknown lines are treated as plain items so parsing is resilient to minor format drift.
 */
export function parseChangelog(raw: string): ChangelogDocument {
  const lines = raw.replace(/\r/g, '').split('\n');
  const entries: ChangelogEntry[] = [];

  let currentEntry: { version: string; date: string | null; sections: { title: string; items: string[] }[] } | null = null;
  let currentSection: { title: string; items: string[] } | null = null;

  function ensureSection(): { title: string; items: string[] } | null {
    if (currentEntry === null) {
      return null;
    }

    if (currentSection !== null) {
      return currentSection;
    }

    currentSection = { title: 'Изменения', items: [] };
    currentEntry.sections.push(currentSection);
    return currentSection;
  }

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (line.length === 0) {
      continue;
    }

    const versionMatch = line.match(VERSION_PATTERN);
    if (versionMatch !== null) {
      currentEntry = {
        version: versionMatch[1].trim(),
        date: null,
        sections: []
      };
      entries.push(currentEntry);
      currentSection = null;
      continue;
    }

    if (currentEntry === null) {
      continue;
    }

    const sectionMatch = line.match(SECTION_PATTERN);
    if (sectionMatch !== null) {
      currentSection = {
        title: sectionMatch[1].trim(),
        items: []
      };
      currentEntry.sections.push(currentSection);
      continue;
    }

    const itemMatch = line.match(ITEM_PATTERN);
    if (itemMatch !== null) {
      const section = ensureSection();
      if (section !== null) {
        section.items.push(itemMatch[1].trim());
      }
      continue;
    }

    if (currentEntry.date === null) {
      currentEntry.date = line;
      continue;
    }

    const section = ensureSection();
    if (section !== null) {
      section.items.push(line);
    }
  }

  return {
    entries
  };
}
