import { createId } from "./id";
import { addListRow, reorderListRows } from "./row-list";
import type { NumberedRow } from "./row-list";

export interface ChannelRow {
  id: string;
  name: string;
  source: string;
  phantom: boolean;
  stereo: boolean;
  notes: string;
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
    stereo: false,
    notes: "",
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
  if (!data.rows.some((r) => r.id === rowId)) return data;
  return withRows(
    data,
    data.rows.filter((r) => r.id !== rowId),
  );
}

export function updateChannelRow(
  data: ChannelListSectionData,
  rowId: string,
  patch: Partial<Omit<ChannelRow, "id">>,
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

/**
 * A stereo channel is a single row that claims two consecutive numbers
 * (e.g. "3–4") rather than being linked to a second row — there is no
 * partner row whose numbering can drift out of sync on reorder or deletion.
 */
export function numberChannelRows(data: ChannelListSectionData): NumberedRow[] {
  const result: NumberedRow[] = [];
  let counter = 1;
  for (const row of data.rows) {
    if (row.stereo) {
      result.push({ id: row.id, label: `${counter}–${counter + 1}` });
      counter += 2;
    } else {
      result.push({ id: row.id, label: String(counter) });
      counter += 1;
    }
  }
  return result;
}
