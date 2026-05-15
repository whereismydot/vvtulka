export type DecimalRaw = string;

export interface OrderItem {
  readonly name: string;
  readonly quantityRaw: DecimalRaw;
  readonly sumRaw: DecimalRaw;
  readonly isVkusbackEligible: boolean;
  readonly sourceRow: number;
}

export interface Order {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
  readonly items: readonly OrderItem[];
  readonly vkusbackSumRaw: DecimalRaw;
  readonly rawInput: string;
}

export interface Metrics {
  readonly ordersCount: number;
  readonly vkusbackTotalRaw: DecimalRaw;
  readonly percentRaw: DecimalRaw;
  readonly cashbackRaw: DecimalRaw;
}

export interface ParseResult {
  readonly items: readonly OrderItem[];
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

export interface StorageState {
  readonly version: number;
  readonly orders: readonly Order[];
  readonly percentRaw: DecimalRaw;
  readonly updatedAt: string;
}

export interface TextCleanerSettings {
  readonly version: number;
  readonly normalizeLineBreaks: boolean;
  readonly replaceTabsWithSpaces: boolean;
  readonly replaceNbspWithSpace: boolean;
  readonly collapseInnerSpaces: boolean;
  readonly trimLineStart: boolean;
  readonly trimLineEnd: boolean;
  readonly removeEmptyLines: boolean;
  readonly trimWholeText: boolean;
  readonly removeDotBeforeEmoji: boolean;
  readonly excludeSpacesFromCharacterCount: boolean;
}

export interface TextCleanerStats {
  readonly inputLength: number;
  readonly outputLength: number;
  readonly inputLines: number;
  readonly outputLines: number;
  readonly normalizedLineBreaksCount: number;
  readonly replacedTabsCount: number;
  readonly replacedNbspCount: number;
  readonly collapsedSpaceGroupsCount: number;
  readonly trimmedLineStartCount: number;
  readonly trimmedLineEndCount: number;
  readonly removedEmptyLinesCount: number;
}

export interface TextCleanerResult {
  readonly output: string;
  readonly stats: TextCleanerStats;
}

export type ShelfLifeUnit = 'days' | 'weeks' | 'months' | 'years';
