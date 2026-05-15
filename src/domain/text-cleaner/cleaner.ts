import type { TextCleanerResult, TextCleanerSettings } from '../types';
import { removeDotBeforeEmoji } from './remove-dot-before-emoji';

const MULTI_SPACES_PATTERN = / {2,}/g;

/**
 * Подсчитывает количество совпадений регулярного выражения в строке.
 *
 * @param value Исходная строка.
 * @param pattern Регулярное выражение с флагом `g`.
 * @returns Количество найденных совпадений.
 */
function countMatches(value: string, pattern: RegExp): number {
  const matches = value.match(pattern);
  return matches === null ? 0 : matches.length;
}

/**
 * Возвращает количество строк в тексте (`\n` считается разделителем).
 *
 * @param value Текст для подсчета.
 * @returns Количество строк. Для пустой строки возвращает `0`.
 */
function countLines(value: string): number {
  if (value.length === 0) {
    return 0;
  }

  return value.split('\n').length;
}

/**
 * Выполняет очистку текста по набору правил.
 * Орфография и пунктуация не изменяются.
 *
 * @param input Исходный текст.
 * @param settings Настройки очистки.
 * @returns Очищенный текст и статистика примененных преобразований.
 */
export function cleanText(input: string, settings: TextCleanerSettings): TextCleanerResult {
  let nextText = input;

  let normalizedLineBreaksCount = 0;
  let replacedTabsCount = 0;
  let replacedNbspCount = 0;
  let collapsedSpaceGroupsCount = 0;
  let trimmedLineStartCount = 0;
  let trimmedLineEndCount = 0;
  let removedEmptyLinesCount = 0;

  if (settings.normalizeLineBreaks) {
    const crlfCount = countMatches(nextText, /\r\n/g);
    if (crlfCount > 0) {
      nextText = nextText.replace(/\r\n/g, '\n');
    }

    const crOnlyCount = countMatches(nextText, /\r/g);
    if (crOnlyCount > 0) {
      nextText = nextText.replace(/\r/g, '\n');
    }

    normalizedLineBreaksCount = crlfCount + crOnlyCount;
  }

  if (settings.replaceTabsWithSpaces) {
    replacedTabsCount = countMatches(nextText, /\t/g);
    if (replacedTabsCount > 0) {
      nextText = nextText.replace(/\t/g, ' ');
    }
  }

  if (settings.replaceNbspWithSpace) {
    replacedNbspCount = countMatches(nextText, /\u00A0/g);
    if (replacedNbspCount > 0) {
      nextText = nextText.replace(/\u00A0/g, ' ');
    }
  }

  const processedLines = nextText.split('\n').map((line) => {
    let nextLine = line;

    if (settings.collapseInnerSpaces) {
      const groupsCount = countMatches(nextLine, MULTI_SPACES_PATTERN);
      if (groupsCount > 0) {
        collapsedSpaceGroupsCount += groupsCount;
        nextLine = nextLine.replace(MULTI_SPACES_PATTERN, ' ');
      }
    }

    if (settings.trimLineStart) {
      const trimmed = nextLine.replace(/^ +/g, '');
      if (trimmed !== nextLine) {
        trimmedLineStartCount += 1;
        nextLine = trimmed;
      }
    }

    if (settings.trimLineEnd) {
      const trimmed = nextLine.replace(/ +$/g, '');
      if (trimmed !== nextLine) {
        trimmedLineEndCount += 1;
        nextLine = trimmed;
      }
    }

    return nextLine;
  });

  let nextLines = processedLines;
  if (settings.removeEmptyLines) {
    const filteredLines = nextLines.filter((line) => line.trim().length > 0);
    removedEmptyLinesCount = nextLines.length - filteredLines.length;
    nextLines = filteredLines;
  }

  nextText = nextLines.join('\n');

  if (settings.trimWholeText) {
    nextText = nextText.trim();
  }

  if (settings.removeDotBeforeEmoji) {
    nextText = removeDotBeforeEmoji(nextText);
  }

  return {
    output: nextText,
    stats: {
      inputLength: input.length,
      outputLength: nextText.length,
      inputLines: countLines(input),
      outputLines: countLines(nextText),
      normalizedLineBreaksCount,
      replacedTabsCount,
      replacedNbspCount,
      collapsedSpaceGroupsCount,
      trimmedLineStartCount,
      trimmedLineEndCount,
      removedEmptyLinesCount
    }
  };
}
