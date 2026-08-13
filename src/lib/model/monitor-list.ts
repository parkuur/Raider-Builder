import { createId } from "./id";
import { addListRow, reorderListRows } from "./row-list";
import type { NumberedRow } from "./row-list";

export interface MonitorRow {
  id: string;
  player: string;
  type: string;
  notes: string;
  stereo: boolean;
}

export interface MonitorListSectionData {
  rows: MonitorRow[];
}

export function defaultMonitorListData(): MonitorListSectionData {
  return { rows: [] };
}

function makeMonitorRow(): MonitorRow {
  return {
    id: createId("monitor"),
    player: "",
    type: "",
    notes: "",
    stereo: false,
  };
}

function withRows(
  data: MonitorListSectionData,
  rows: MonitorRow[],
): MonitorListSectionData {
  return rows === data.rows ? data : { ...data, rows };
}

export function addMonitorRow(
  data: MonitorListSectionData,
  atIndex?: number,
): MonitorListSectionData {
  return withRows(data, addListRow(data.rows, makeMonitorRow, atIndex));
}

export function removeMonitorRow(
  data: MonitorListSectionData,
  rowId: string,
): MonitorListSectionData {
  if (!data.rows.some((r) => r.id === rowId)) return data;
  return withRows(
    data,
    data.rows.filter((r) => r.id !== rowId),
  );
}

export function updateMonitorRow(
  data: MonitorListSectionData,
  rowId: string,
  patch: Partial<Omit<MonitorRow, "id">>,
): MonitorListSectionData {
  if (!data.rows.some((r) => r.id === rowId)) return data;
  return {
    ...data,
    rows: data.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
  };
}

export function reorderMonitorRows(
  data: MonitorListSectionData,
  fromIndex: number,
  toIndex: number,
): MonitorListSectionData {
  return withRows(data, reorderListRows(data.rows, fromIndex, toIndex));
}

/**
 * Always one sequential number per row, regardless of mono/stereo — unlike
 * Channel List, a stereo monitor mix does not claim a combined "N–N+1"
 * label.
 */
export function numberMonitorRows(data: MonitorListSectionData): NumberedRow[] {
  return data.rows.map((row, index) => ({
    id: row.id,
    label: String(index + 1),
  }));
}
