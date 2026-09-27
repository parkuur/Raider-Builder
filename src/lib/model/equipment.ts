import { createId } from "./id";
import { addListRow, reorderListRows } from "./row-list";

export interface EquipmentItem {
  id: string;
  name: string;
  count: string;
}

/**
 * One list of items. The old side-by-side "Band Provides / Venue Provides"
 * layout is two Equipment sections in a split layout, each titled via its
 * own section title.
 */
export interface EquipmentSectionData {
  items: EquipmentItem[];
}

export function defaultEquipmentData(): EquipmentSectionData {
  return { items: [] };
}

function makeEquipmentItem(): EquipmentItem {
  return { id: createId("equipment-item"), name: "", count: "" };
}

function withItems(
  data: EquipmentSectionData,
  items: EquipmentItem[],
): EquipmentSectionData {
  return items === data.items ? data : { ...data, items };
}

export function addEquipmentItem(
  data: EquipmentSectionData,
  atIndex?: number,
): EquipmentSectionData {
  return withItems(data, addListRow(data.items, makeEquipmentItem, atIndex));
}

export function removeEquipmentItem(
  data: EquipmentSectionData,
  itemId: string,
): EquipmentSectionData {
  if (!data.items.some((item) => item.id === itemId)) return data;
  return withItems(
    data,
    data.items.filter((item) => item.id !== itemId),
  );
}

export function reorderEquipmentItem(
  data: EquipmentSectionData,
  fromIndex: number,
  toIndex: number,
): EquipmentSectionData {
  return withItems(data, reorderListRows(data.items, fromIndex, toIndex));
}

export function updateEquipmentItem(
  data: EquipmentSectionData,
  itemId: string,
  patch: Partial<Omit<EquipmentItem, "id">>,
): EquipmentSectionData {
  if (!data.items.some((item) => item.id === itemId)) return data;
  return withItems(
    data,
    data.items.map((item) =>
      item.id === itemId ? { ...item, ...patch } : item,
    ),
  );
}
