/**
 * A row/section's category for swap-target eligibility purposes:
 * "full" is a genuinely full-width row, "solo" is a split-eligible section
 * not currently part of a split layout, "embedded" is a split section
 * living in an established split layout's column. The only disallowed
 * swap pairing is a full-width row with an embedded split section — a
 * solo section is compatible with everything, since structurally it's
 * just a row like any other.
 */
export type SwapCategory = "full" | "solo" | "embedded";

export type SwapContext =
  | { active: false }
  | { active: true; category: SwapCategory; excludeSectionId: string };

export function canSwapCategories(a: SwapCategory, b: SwapCategory): boolean {
  const isFull = (c: SwapCategory) => c === "full";
  const isEmbedded = (c: SwapCategory) => c === "embedded";
  return !((isFull(a) && isEmbedded(b)) || (isEmbedded(a) && isFull(b)));
}

export function isSwapTarget(
  context: SwapContext,
  candidateCategory: SwapCategory,
  candidateSectionId: string,
): boolean {
  return (
    context.active &&
    candidateSectionId !== context.excludeSectionId &&
    canSwapCategories(context.category, candidateCategory)
  );
}
