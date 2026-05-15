interface CharacterCountOptions {
  readonly excludeWhitespace: boolean;
}

interface SegmenterLike {
  segment(value: string): Iterable<unknown>;
}

type SegmenterConstructor = new (
  locales?: string | string[],
  options?: { granularity: 'grapheme' | 'word' | 'sentence' }
) => SegmenterLike;

function countGraphemes(value: string): number {
  if (value.length === 0) {
    return 0;
  }

  const segmenterCtor = (Intl as unknown as { Segmenter?: SegmenterConstructor }).Segmenter;
  if (typeof segmenterCtor === 'function') {
    const segmenter = new segmenterCtor(undefined, { granularity: 'grapheme' });
    let count = 0;
    for (const _ of segmenter.segment(value)) {
      count += 1;
    }
    return count;
  }

  return Array.from(value).length;
}

/**
 * Counts user-visible symbols in text.
 * When excludeWhitespace is true, all whitespace code points are ignored.
 */
export function countCharacters(input: string, options: CharacterCountOptions): number {
  const value = options.excludeWhitespace ? input.replace(/\s+/gu, '') : input;
  return countGraphemes(value);
}
