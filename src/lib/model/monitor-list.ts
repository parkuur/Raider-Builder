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

/**
 * Mode isn't included here — its header (`.monitor-list__mode`) only ever
 * renders in print (`display: none` on screen), so there is no reachable UI
 * surface to edit a label for it; it stays the fixed "Mode" text it always
 * was.
 */
export interface MonitorListColumnLabels {
  mon: string;
  player: string;
  type: string;
  notes: string;
}

export function defaultMonitorListColumnLabels(): MonitorListColumnLabels {
  return {
    mon: "Mon",
    player: "Player",
    type: "Type",
    notes: "Mix Notes",
  };
}

export interface MonitorListSectionData {
  rows: MonitorRow[];
  columnLabels?: Partial<MonitorListColumnLabels>;
}

export function defaultMonitorListData(): MonitorListSectionData {
  return { rows: [] };
}

/**
 * Missing/partial `columnLabels` (documents saved before this field
 * existed) self-heals here rather than in persistence.ts — matching how
 * every other section's `data` shape is trusted once it passes the
 * generic "is this an object?" check on load, not deep-validated.
 */
export function monitorListColumnLabels(
  data: MonitorListSectionData,
): MonitorListColumnLabels {
  return { ...defaultMonitorListColumnLabels(), ...data.columnLabels };
}

export function setMonitorListColumnLabel(
  data: MonitorListSectionData,
  key: keyof MonitorListColumnLabels,
  label: string,
): MonitorListSectionData {
  return {
    ...data,
    columnLabels: { ...monitorListColumnLabels(data), [key]: label },
  };
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
