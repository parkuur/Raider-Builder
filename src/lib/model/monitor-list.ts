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

export interface MonitorRow {
  id: string;
  player: string;
  type: string;
  notes: string;
  pairedWithId: string | undefined;
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
    pairedWithId: undefined,
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
  return withRows(data, removeListRow(data.rows, rowId));
}

export function updateMonitorRow(
  data: MonitorListSectionData,
  rowId: string,
  patch: Partial<Omit<MonitorRow, "id" | "pairedWithId">>,
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

export function pairMonitorRows(
  data: MonitorListSectionData,
  idA: string,
  idB: string,
): MonitorListSectionData {
  return withRows(data, pairListRows(data.rows, idA, idB));
}

export function unpairMonitorRow(
  data: MonitorListSectionData,
  rowId: string,
): MonitorListSectionData {
  return withRows(data, unpairListRow(data.rows, rowId));
}

export function numberMonitorRows(data: MonitorListSectionData): NumberedRow[] {
  return numberRows(data.rows);
}
