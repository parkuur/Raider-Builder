import { createId } from "./id";
import { resolveColumnLabels, setColumnLabel } from "./column-labels";
import type { ColumnLabels } from "./column-labels";
import type { GroupedEntry } from "./grouped-list";

/**
 * One thing to bring to a gig. Grouping (e.g. everything under an "Audio
 * case" heading) and hiding live in the shared grouped-list model — this
 * module only owns the row shape, defaults and column labels.
 */
export interface PackingItem {
  id: string;
  hidden: boolean;
  item: string;
  count: string;
  /** Where it comes from — whose it is, or where it's picked up. */
  source: string;
  notes: string;
}

export type PackingListColumn = "item" | "count" | "source" | "notes";

export function defaultPackingListColumnLabels(): ColumnLabels<PackingListColumn> {
  return { item: "Item", count: "Qty", source: "From", notes: "Notes" };
}

export interface PackingListSectionData {
  entries: GroupedEntry<PackingItem>[];
  columnLabels?: Partial<ColumnLabels<PackingListColumn>>;
}

export function defaultPackingListData(): PackingListSectionData {
  return { entries: [] };
}

export function makePackingItem(): PackingItem {
  return {
    id: createId("packing-item"),
    hidden: false,
    item: "",
    count: "",
    source: "",
    notes: "",
  };
}

export function withPackingEntries(
  data: PackingListSectionData,
  entries: GroupedEntry<PackingItem>[],
): PackingListSectionData {
  return entries === data.entries ? data : { ...data, entries };
}

export function packingListColumnLabels(
  data: PackingListSectionData,
): ColumnLabels<PackingListColumn> {
  return resolveColumnLabels(defaultPackingListColumnLabels(), data);
}

export function setPackingListColumnLabel(
  data: PackingListSectionData,
  key: PackingListColumn,
  label: string,
): PackingListSectionData {
  return setColumnLabel(data, defaultPackingListColumnLabels(), key, label);
}
