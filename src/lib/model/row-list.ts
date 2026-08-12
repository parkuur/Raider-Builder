import { clamp } from "./util";

export interface ListRow {
  id: string;
}

export interface PairableRow extends ListRow {
  pairedWithId: string | undefined;
}

export interface NumberedRow {
  id: string;
  label: string;
}

export function addListRow<R extends ListRow>(
  rows: R[],
  makeRow: () => R,
  atIndex?: number,
): R[] {
  const index =
    atIndex === undefined ? rows.length : clamp(atIndex, 0, rows.length);
  return [...rows.slice(0, index), makeRow(), ...rows.slice(index)];
}

export function removeListRow<R extends PairableRow>(
  rows: R[],
  rowId: string,
): R[] {
  if (!rows.some((r) => r.id === rowId)) return rows;
  return rows
    .filter((r) => r.id !== rowId)
    .map((r) =>
      r.pairedWithId === rowId ? { ...r, pairedWithId: undefined } : r,
    );
}

export function reorderListRows<R extends ListRow>(
  rows: R[],
  fromIndex: number,
  toIndex: number,
): R[] {
  if (fromIndex < 0 || fromIndex >= rows.length) return rows;
  const target = clamp(toIndex, 0, rows.length - 1);
  if (fromIndex === target) return rows;
  const next = [...rows];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(target, 0, moved!);
  return next;
}

export function pairListRows<R extends PairableRow>(
  rows: R[],
  idA: string,
  idB: string,
): R[] {
  if (idA === idB) return rows;
  if (!rows.some((r) => r.id === idA) || !rows.some((r) => r.id === idB)) {
    return rows;
  }
  return rows.map((r) => {
    if (r.id === idA) return { ...r, pairedWithId: idB };
    if (r.id === idB) return { ...r, pairedWithId: idA };
    // Clear a stale reciprocal link left on either row's previous partner.
    if (r.pairedWithId === idA || r.pairedWithId === idB) {
      return { ...r, pairedWithId: undefined };
    }
    return r;
  });
}

export function unpairListRow<R extends PairableRow>(
  rows: R[],
  rowId: string,
): R[] {
  const row = rows.find((r) => r.id === rowId);
  if (!row || row.pairedWithId === undefined) return rows;
  const partnerId = row.pairedWithId;
  return rows.map((r) => {
    if (r.id === rowId) return { ...r, pairedWithId: undefined };
    if (r.id === partnerId && r.pairedWithId === rowId) {
      return { ...r, pairedWithId: undefined };
    }
    return r;
  });
}

/**
 * A pair only produces a combined "N–N+1" label when the relationship is
 * both mutual (the partner's own `pairedWithId` points back) and
 * adjacent-forward (the partner is the very next row). Any other case —
 * dangling id, one-sided, or mutual-but-not-adjacent — degrades to
 * independent numbering for every row involved, without corrupting the
 * counters for rows that follow.
 */
export function numberRows<R extends PairableRow>(
  rows: readonly R[],
): NumberedRow[] {
  const result: NumberedRow[] = [];
  let counter = 1;
  let i = 0;
  while (i < rows.length) {
    const row = rows[i]!;
    const partnerIndex = row.pairedWithId
      ? rows.findIndex((r) => r.id === row.pairedWithId)
      : -1;
    const partner = partnerIndex === -1 ? undefined : rows[partnerIndex];
    const isAdjacentMutualPair =
      partner !== undefined &&
      partner.pairedWithId === row.id &&
      partnerIndex === i + 1;
    if (isAdjacentMutualPair) {
      result.push({ id: row.id, label: `${counter}–${counter + 1}` });
      result.push({ id: partner.id, label: "" });
      counter += 2;
      i += 2;
      continue;
    }
    result.push({ id: row.id, label: String(counter) });
    counter += 1;
    i += 1;
  }
  return result;
}
