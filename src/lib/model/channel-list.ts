import { createId } from "./id";
import {
  addListRow,
  numberRows,
  pairListRows,
  reorderListRows,
  removeListRow,
  unpairListRow,
} from "./row-list";
import type { NumberedRow } from "./row-list";

export interface ChannelRow {
  id: string;
  name: string;
  source: string;
  phantom: boolean;
  notes: string;
  pairedWithId: string | undefined;
}

export interface ChannelListSectionData {
  rows: ChannelRow[];
}

export function defaultChannelListData(): ChannelListSectionData {
  return { rows: [] };
}

function makeChannelRow(): ChannelRow {
  return {
    id: createId("channel"),
    name: "",
    source: "",
    phantom: false,
    notes: "",
    pairedWithId: undefined,
  };
}

function withRows(
  data: ChannelListSectionData,
  rows: ChannelRow[],
): ChannelListSectionData {
  return rows === data.rows ? data : { ...data, rows };
}

export function addChannelRow(
  data: ChannelListSectionData,
  atIndex?: number,
): ChannelListSectionData {
  return withRows(data, addListRow(data.rows, makeChannelRow, atIndex));
}

export function removeChannelRow(
  data: ChannelListSectionData,
  rowId: string,
): ChannelListSectionData {
  return withRows(data, removeListRow(data.rows, rowId));
}

export function updateChannelRow(
  data: ChannelListSectionData,
  rowId: string,
  patch: Partial<Omit<ChannelRow, "id" | "pairedWithId">>,
): ChannelListSectionData {
  if (!data.rows.some((r) => r.id === rowId)) return data;
  return {
    ...data,
    rows: data.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
  };
}

export function reorderChannelRows(
  data: ChannelListSectionData,
  fromIndex: number,
  toIndex: number,
): ChannelListSectionData {
  return withRows(data, reorderListRows(data.rows, fromIndex, toIndex));
}

export function pairChannelRows(
  data: ChannelListSectionData,
  idA: string,
  idB: string,
): ChannelListSectionData {
  return withRows(data, pairListRows(data.rows, idA, idB));
}

export function unpairChannelRow(
  data: ChannelListSectionData,
  rowId: string,
): ChannelListSectionData {
  return withRows(data, unpairListRow(data.rows, rowId));
}

export function numberChannelRows(data: ChannelListSectionData): NumberedRow[] {
  return numberRows(data.rows);
}
