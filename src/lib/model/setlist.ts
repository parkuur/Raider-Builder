import { createId } from "./id";
import { resolveColumnLabels, setColumnLabel } from "./column-labels";
import type { ColumnLabels } from "./column-labels";
import {
  addListRow,
  numberListRows,
  removeListRow,
  reorderListRows,
  updateListRow,
} from "./row-list";
import type { NumberedRow } from "./row-list";

export interface SetlistRow {
  id: string;
  song: string;
  artist: string;
  notes: string;
}

export type SetlistColumn = "num" | "song" | "artist" | "notes";

export function defaultSetlistColumnLabels(): ColumnLabels<SetlistColumn> {
  return { num: "#", song: "Song", artist: "Artist", notes: "Notes" };
}

export interface SetlistSectionData {
  rows: SetlistRow[];
  columnLabels?: Partial<ColumnLabels<SetlistColumn>>;
}

export function defaultSetlistData(): SetlistSectionData {
  return { rows: [] };
}

export function setlistColumnLabels(
  data: SetlistSectionData,
): ColumnLabels<SetlistColumn> {
  return resolveColumnLabels(defaultSetlistColumnLabels(), data);
}

export function setSetlistColumnLabel(
  data: SetlistSectionData,
  key: SetlistColumn,
  label: string,
): SetlistSectionData {
  return setColumnLabel(data, defaultSetlistColumnLabels(), key, label);
}

function makeSetlistRow(): SetlistRow {
  return { id: createId("song"), song: "", artist: "", notes: "" };
}

function withRows(
  data: SetlistSectionData,
  rows: SetlistRow[],
): SetlistSectionData {
  return rows === data.rows ? data : { ...data, rows };
}

export function addSetlistRow(
  data: SetlistSectionData,
  atIndex?: number,
): SetlistSectionData {
  return withRows(data, addListRow(data.rows, makeSetlistRow, atIndex));
}

export function removeSetlistRow(
  data: SetlistSectionData,
  rowId: string,
): SetlistSectionData {
  return withRows(data, removeListRow(data.rows, rowId));
}

export function updateSetlistRow(
  data: SetlistSectionData,
  rowId: string,
  patch: Partial<Omit<SetlistRow, "id">>,
): SetlistSectionData {
  return withRows(data, updateListRow(data.rows, rowId, patch));
}

export function reorderSetlistRows(
  data: SetlistSectionData,
  fromIndex: number,
  toIndex: number,
): SetlistSectionData {
  return withRows(data, reorderListRows(data.rows, fromIndex, toIndex));
}

/** Songs are numbered 1..n in running order. */
export function numberSetlistRows(data: SetlistSectionData): NumberedRow[] {
  return numberListRows(data.rows);
}
