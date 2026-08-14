/**
 * All header logos share one height. If they'd collectively exceed the
 * available width at `maxHeight`, every logo scales down together to a
 * single smaller shared height instead of any one logo shrinking alone —
 * this is the only way to keep them equal height while fitting a width
 * budget, since CSS flex/grid can't express "shrink several
 * independent-aspect-ratio images to one new shared height."
 */
export function computeLogoHeight(
  aspectRatios: number[],
  maxHeight: number,
  maxTotalWidth: number,
  minHeight = 12,
): number {
  if (aspectRatios.length === 0) return maxHeight;
  const sumAspectRatio = aspectRatios.reduce((sum, ar) => sum + ar, 0);
  const widthAtMaxHeight = sumAspectRatio * maxHeight;
  if (widthAtMaxHeight <= maxTotalWidth) return maxHeight;
  return Math.max(minHeight, maxTotalWidth / sumAspectRatio);
}
