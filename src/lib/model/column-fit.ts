export const MIN_FIT_COLUMN_CHARS = 4;
/**
 * These columns size themselves via a `width: Nch` inline style, but every
 * consumer's input also has `box-sizing: border-box` (the app-wide reset in
 * app.css) plus its own CSS padding/border — both of which eat into that
 * `Nch` budget rather than sitting outside it. At this app's field padding
 * (`--space-2` each side) and border, that overhead is close to 2.5ch on
 * its own, so a padding of 2 left ~0 real breathing room and the longest
 * value would clip by a pixel or two. 4 restores an actual visible buffer
 * on top of that overhead.
 */
export const FIT_COLUMN_CHAR_PADDING = 4;

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
