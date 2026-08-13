import { clamp } from "./util";

export interface ListRow {
  id: string;
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
