import { describe, expect, it } from 'vitest';
import { parseChangelog } from './parser';

describe('parseChangelog', () => {
  it('parses one version with date, category and items', () => {
    const raw = `# Changelog

## 1.0.1

15 мая 2026

### Изменения

- Первый пункт
- Второй пункт`;

    const parsed = parseChangelog(raw);

    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0].version).toBe('1.0.1');
    expect(parsed.entries[0].date).toBe('15 мая 2026');
    expect(parsed.entries[0].sections).toHaveLength(1);
    expect(parsed.entries[0].sections[0].title).toBe('Изменения');
    expect(parsed.entries[0].sections[0].items).toEqual(['Первый пункт', 'Второй пункт']);
  });

  it('parses multiple versions and keeps top-down order', () => {
    const raw = `# Changelog

## 1.0.2
16 мая 2026
### Исправления
- B

## 1.0.1
15 мая 2026
### Изменения
- A`;

    const parsed = parseChangelog(raw);

    expect(parsed.entries).toHaveLength(2);
    expect(parsed.entries[0].version).toBe('1.0.2');
    expect(parsed.entries[1].version).toBe('1.0.1');
  });

  it('parses multiple categories for a single version', () => {
    const raw = `# Changelog

## 1.0.1
15 мая 2026
### Новое
- N1
### Исправления
- F1`;

    const parsed = parseChangelog(raw);

    expect(parsed.entries[0].sections.map((section) => section.title)).toEqual(['Новое', 'Исправления']);
  });

  it('returns empty entries for empty changelog', () => {
    const parsed = parseChangelog('');

    expect(parsed.entries).toEqual([]);
  });

  it('does not break on unknown lines and keeps them as plain items', () => {
    const raw = `# Changelog

## 1.0.1
15 мая 2026
Произвольная строка
### Изменения
- Пункт`;

    const parsed = parseChangelog(raw);

    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0].sections.length).toBeGreaterThanOrEqual(1);
    const items = parsed.entries[0].sections.flatMap((section) => section.items);
    expect(items).toContain('Произвольная строка');
    expect(items).toContain('Пункт');
  });
});
