/**
 * Splits `n` items into as-even-as-possible rows of at most `maxPerRow`.
 * `rowCount = ceil(n / maxPerRow)` is the minimum number of rows that can
 * hold `n` items without exceeding `maxPerRow` per row (minimizes row count
 * first); distributing the remainder one-per-row across the first rows
 * produces at most two distinct row sizes differing by exactly one (or
 * zero), which is simultaneously the minimum possible widest row for that
 * row count.
 */
export function balancedRows(n: number, maxPerRow = 4): number[] {
  if (n <= 0) return [];
  const rowCount = Math.ceil(n / maxPerRow);
  const base = Math.floor(n / rowCount);
  const remainder = n % rowCount;
  return Array.from({ length: rowCount }, (_, i) =>
    i < remainder ? base + 1 : base,
  );
}

export function groupIntoRows<T>(
  items: readonly T[],
  counts: readonly number[],
): T[][] {
  const rows: T[][] = [];
  let offset = 0;
  for (const count of counts) {
    rows.push(items.slice(offset, offset + count));
    offset += count;
  }
  return rows;
}
