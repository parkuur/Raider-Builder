import { createId } from "./id";
import { resolveColumnLabels, setColumnLabel } from "./column-labels";
import type { ColumnLabels } from "./column-labels";
import {
  addListRow,
  removeListRow,
  reorderListRows,
  updateListRow,
} from "./row-list";

/**
 * One wireless unit or channel. Every field is free text: units and
 * notation vary too much between manufacturers and regions ("470–608 MHz",
 * "G50", "25 kHz", "606.125") to impose a parsed format.
 */
export interface RfAllocationRow {
  id: string;
  device: string;
  window: string;
  bandwidth: string;
  frequency: string;
  notes: string;
}

export type RfAllocationColumn =
  "device" | "window" | "bandwidth" | "frequency" | "notes";

export function defaultRfAllocationColumnLabels(): ColumnLabels<RfAllocationColumn> {
  return {
    device: "Device",
    window: "Window",
    bandwidth: "Bandwidth",
    frequency: "Frequency",
    notes: "Notes",
  };
}

export interface RfAllocationSectionData {
  rows: RfAllocationRow[];
  columnLabels?: Partial<ColumnLabels<RfAllocationColumn>>;
}

export function defaultRfAllocationData(): RfAllocationSectionData {
  return { rows: [] };
}

export function rfAllocationColumnLabels(
  data: RfAllocationSectionData,
): ColumnLabels<RfAllocationColumn> {
  return resolveColumnLabels(defaultRfAllocationColumnLabels(), data);
}

export function setRfAllocationColumnLabel(
  data: RfAllocationSectionData,
  key: RfAllocationColumn,
  label: string,
): RfAllocationSectionData {
  return setColumnLabel(data, defaultRfAllocationColumnLabels(), key, label);
}

function makeRfAllocationRow(): RfAllocationRow {
  return {
    id: createId("rf"),
    device: "",
    window: "",
    bandwidth: "",
    frequency: "",
    notes: "",
  };
}

function withRows(
  data: RfAllocationSectionData,
  rows: RfAllocationRow[],
): RfAllocationSectionData {
  return rows === data.rows ? data : { ...data, rows };
}

export function addRfAllocationRow(
  data: RfAllocationSectionData,
  atIndex?: number,
): RfAllocationSectionData {
  return withRows(data, addListRow(data.rows, makeRfAllocationRow, atIndex));
}

export function removeRfAllocationRow(
  data: RfAllocationSectionData,
  rowId: string,
): RfAllocationSectionData {
  return withRows(data, removeListRow(data.rows, rowId));
}

export function updateRfAllocationRow(
  data: RfAllocationSectionData,
  rowId: string,
  patch: Partial<Omit<RfAllocationRow, "id">>,
): RfAllocationSectionData {
  return withRows(data, updateListRow(data.rows, rowId, patch));
}

export function reorderRfAllocationRows(
  data: RfAllocationSectionData,
  fromIndex: number,
  toIndex: number,
): RfAllocationSectionData {
  return withRows(data, reorderListRows(data.rows, fromIndex, toIndex));
}
