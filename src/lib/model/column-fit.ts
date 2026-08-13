export const MIN_FIT_COLUMN_CHARS = 4;
export const FIT_COLUMN_CHAR_PADDING = 2;

/**
 * Width (in `ch` units — the width of one "0" glyph in the current font) a
 * fit-to-content column needs to show its longest current value without
 * clipping. `ch` is a deliberately simple, testable approximation (character
 * count, not real glyph metrics) — precise pixel measurement would need a
 * canvas/DOM text-measuring pass in the browser, not worth the complexity
 * for the short, mostly-alphanumeric fields these columns hold.
 */
export function fitColumnChars(
  values: readonly string[],
  placeholder = "",
  min = MIN_FIT_COLUMN_CHARS,
  padding = FIT_COLUMN_CHAR_PADDING,
): number {
  const longest = values.reduce(
    (max, value) => Math.max(max, value.length),
    placeholder.length,
  );
  return Math.max(min, longest + padding);
}
