const EMOJI_CORE = String.raw`\p{Extended_Pictographic}`;
const EMOJI_VARIATION_SELECTOR = String.raw`\uFE0F?`;
const EMOJI_SKIN_TONE = String.raw`\p{Emoji_Modifier}?`;
const EMOJI_ZWJ_CHAIN = String.raw`(?:\u200D${EMOJI_CORE}${EMOJI_VARIATION_SELECTOR}${EMOJI_SKIN_TONE})*`;
const EMOJI_CLUSTER = String.raw`${EMOJI_CORE}${EMOJI_VARIATION_SELECTOR}${EMOJI_SKIN_TONE}${EMOJI_ZWJ_CHAIN}`;

const DOT_BEFORE_EMOJI_PATTERN = new RegExp(String.raw`(?<!\.)\.( *)(?=(?:${EMOJI_CLUSTER})+)`, 'gu');

/**
 * Removes a single dot before emoji, keeping intermediate regular spaces untouched.
 * Applies globally across the whole text.
 */
export function removeDotBeforeEmoji(input: string): string {
  return input.replace(DOT_BEFORE_EMOJI_PATTERN, '$1');
}
