import { createId } from "./id";
import { reorderListRows } from "./row-list";

export interface EquipmentItem {
  id: string;
  name: string;
  count: string;
}

export interface EquipmentList {
  id: string;
  title: string;
  items: EquipmentItem[];
}

export interface EquipmentSectionData {
  lists: [EquipmentList, EquipmentList];
}

export function defaultEquipmentData(): EquipmentSectionData {
  return {
    lists: [
      { id: createId("equipment-list"), title: "Band Provides", items: [] },
      { id: createId("equipment-list"), title: "Venue Provides", items: [] },
    ],
  };
}

function updateList(
  data: EquipmentSectionData,
  listIndex: 0 | 1,
  update: (list: EquipmentList) => EquipmentList,
): EquipmentSectionData {
  const lists = [...data.lists] as [EquipmentList, EquipmentList];
  lists[listIndex] = update(lists[listIndex]);
  return { ...data, lists };
}

export function setEquipmentListTitle(
  data: EquipmentSectionData,
  listIndex: 0 | 1,
  title: string,
): EquipmentSectionData {
  return updateList(data, listIndex, (list) => ({ ...list, title }));
}

export function addEquipmentItem(
  data: EquipmentSectionData,
  listIndex: 0 | 1,
): EquipmentSectionData {
  const item: EquipmentItem = {
    id: createId("equipment-item"),
    name: "",
    count: "",
  };
  return updateList(data, listIndex, (list) => ({
    ...list,
    items: [...list.items, item],
  }));
}

export function removeEquipmentItem(
  data: EquipmentSectionData,
  listIndex: 0 | 1,
  itemId: string,
): EquipmentSectionData {
  const list = data.lists[listIndex];
  if (!list.items.some((item) => item.id === itemId)) return data;
  return updateList(data, listIndex, (l) => ({
    ...l,
    items: l.items.filter((item) => item.id !== itemId),
  }));
}

export function reorderEquipmentItem(
  data: EquipmentSectionData,
  listIndex: 0 | 1,
  fromIndex: number,
  toIndex: number,
): EquipmentSectionData {
  return updateList(data, listIndex, (list) => {
    const items = reorderListRows(list.items, fromIndex, toIndex);
    return items === list.items ? list : { ...list, items };
  });
}

export function updateEquipmentItem(
  data: EquipmentSectionData,
  listIndex: 0 | 1,
  itemId: string,
  patch: Partial<Omit<EquipmentItem, "id">>,
): EquipmentSectionData {
  const list = data.lists[listIndex];
  if (!list.items.some((item) => item.id === itemId)) return data;
  return updateList(data, listIndex, (l) => ({
    ...l,
    items: l.items.map((item) =>
      item.id === itemId ? { ...item, ...patch } : item,
    ),
  }));
}
