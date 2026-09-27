import { createId } from "./id";
import { resolveColumnLabels, setColumnLabel } from "./column-labels";
import type { ColumnLabels } from "./column-labels";
import { clamp } from "./util";
import { allRows, findRow, updateGroupedRow } from "./grouped-list";
import type { GroupedEntry } from "./grouped-list";

/** One thing happening in a time slot — who it concerns and any notes. */
export interface ScheduleItem {
  id: string;
  title: string;
  who: string;
  notes: string;
}

/**
 * A point or range in time with one or more items. Times are free text
 * ("18:30", "TBA", "after doors") and slots are ordered by hand, never
 * sorted. A slot always has at least one item. Slots are the rows of a
 * shared grouped list, so a heading like "Packing up" can hold several.
 */
export interface ScheduleSlot {
  id: string;
  hidden: boolean;
  start: string;
  end: string;
  items: ScheduleItem[];
}

export type ScheduleColumn = "time" | "title" | "who" | "notes";

export function defaultScheduleColumnLabels(): ColumnLabels<ScheduleColumn> {
  return { time: "Time", title: "Item", who: "Who", notes: "Notes" };
}

export interface ScheduleSectionData {
  entries: GroupedEntry<ScheduleSlot>[];
  columnLabels?: Partial<ColumnLabels<ScheduleColumn>>;
}

export function defaultScheduleData(): ScheduleSectionData {
  return { entries: [] };
}

export function scheduleColumnLabels(
  data: ScheduleSectionData,
): ColumnLabels<ScheduleColumn> {
  return resolveColumnLabels(defaultScheduleColumnLabels(), data);
}

export function setScheduleColumnLabel(
  data: ScheduleSectionData,
  key: ScheduleColumn,
  label: string,
): ScheduleSectionData {
  return setColumnLabel(data, defaultScheduleColumnLabels(), key, label);
}

export function withScheduleEntries(
  data: ScheduleSectionData,
  entries: GroupedEntry<ScheduleSlot>[],
): ScheduleSectionData {
  return entries === data.entries ? data : { ...data, entries };
}

function makeScheduleItem(): ScheduleItem {
  return { id: createId("schedule-item"), title: "", who: "", notes: "" };
}

/** A new slot starts with one empty item. */
export function makeScheduleSlot(): ScheduleSlot {
  return {
    id: createId("schedule-slot"),
    hidden: false,
    start: "",
    end: "",
    items: [makeScheduleItem()],
  };
}

/** "18:00–18:45", or just "18:00" when there's no end. */
export function formatSlotTime(
  slot: Pick<ScheduleSlot, "start" | "end">,
): string {
  const start = slot.start.trim();
  const end = slot.end.trim();
  if (start && end) return `${start}–${end}`;
  return start || end;
}

export interface ItemLocation {
  slotId: string;
  index: number;
}

export function findItemLocation(
  entries: GroupedEntry<ScheduleSlot>[],
  itemId: string,
): ItemLocation | null {
  for (const slot of allRows(entries)) {
    const index = slot.items.findIndex((i) => i.id === itemId);
    if (index !== -1) return { slotId: slot.id, index };
  }
  return null;
}

/**
 * The slot an id belongs to — an item id maps to its slot, anything else is
 * returned as-is. Lets slot dragging treat a drop on any of a slot's item
 * rows as a drop on the slot.
 */
export function slotIdForTarget(
  entries: GroupedEntry<ScheduleSlot>[],
  id: string,
): string {
  return findItemLocation(entries, id)?.slotId ?? id;
}

function updateSlotItems(
  entries: GroupedEntry<ScheduleSlot>[],
  slotId: string,
  update: (items: ScheduleItem[]) => ScheduleItem[],
): GroupedEntry<ScheduleSlot>[] {
  const slot = findRow(entries, slotId);
  if (!slot) return entries;
  const items = update(slot.items);
  return items === slot.items
    ? entries
    : updateGroupedRow(entries, slotId, { items });
}

export function addScheduleItem(
  entries: GroupedEntry<ScheduleSlot>[],
  slotId: string,
  atIndex?: number,
): GroupedEntry<ScheduleSlot>[] {
  return updateSlotItems(entries, slotId, (items) => {
    const index = clamp(atIndex ?? items.length, 0, items.length);
    return [
      ...items.slice(0, index),
      makeScheduleItem(),
      ...items.slice(index),
    ];
  });
}

/** No-op for a slot's only item — delete the slot itself instead. */
export function removeScheduleItem(
  entries: GroupedEntry<ScheduleSlot>[],
  itemId: string,
): GroupedEntry<ScheduleSlot>[] {
  const location = findItemLocation(entries, itemId);
  if (!location) return entries;
  return updateSlotItems(entries, location.slotId, (items) =>
    items.length <= 1 ? items : items.filter((i) => i.id !== itemId),
  );
}

export function updateScheduleItem(
  entries: GroupedEntry<ScheduleSlot>[],
  itemId: string,
  patch: Partial<Omit<ScheduleItem, "id">>,
): GroupedEntry<ScheduleSlot>[] {
  const location = findItemLocation(entries, itemId);
  if (!location) return entries;
  return updateSlotItems(entries, location.slotId, (items) =>
    items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
  );
}

/**
 * Moves an item within its slot or into another slot (in any group).
 * `target.index` is its final index in the target slot, clamped. Moving a
 * slot's only item out leaves a fresh empty item behind, so the source slot
 * — and its times — are never silently deleted. No-op for an unknown item
 * or slot, or a move that changes nothing.
 */
export function moveScheduleItem(
  entries: GroupedEntry<ScheduleSlot>[],
  itemId: string,
  target: ItemLocation,
): GroupedEntry<ScheduleSlot>[] {
  const from = findItemLocation(entries, itemId);
  const targetSlot = findRow(entries, target.slotId);
  if (!from || !targetSlot) return entries;
  const item = findRow(entries, from.slotId)!.items[from.index]!;

  if (from.slotId === target.slotId) {
    const index = clamp(target.index, 0, targetSlot.items.length - 1);
    if (index === from.index) return entries;
    return updateSlotItems(entries, target.slotId, (items) => {
      const next = items.filter((i) => i.id !== itemId);
      next.splice(index, 0, item);
      return next;
    });
  }

  const withoutItem = updateSlotItems(entries, from.slotId, (items) => {
    const rest = items.filter((i) => i.id !== itemId);
    return rest.length > 0 ? rest : [makeScheduleItem()];
  });
  return updateSlotItems(withoutItem, target.slotId, (items) => {
    const index = clamp(target.index, 0, items.length);
    return [...items.slice(0, index), item, ...items.slice(index)];
  });
}

/**
 * Turns "dragged item `draggedItemId`, dropped on `targetId`" into a
 * target location, or null. Dropped on another item it takes that item's
 * place (the "take its slot" rule within one slot, inserted before it in
 * another slot); dropped on a slot itself it goes to the end of that slot.
 * Anything else (group headers, the list's end zone, other sections' rows)
 * means nothing.
 */
export function resolveScheduleItemDrop(
  entries: GroupedEntry<ScheduleSlot>[],
  draggedItemId: string,
  targetId: string,
): ItemLocation | null {
  if (draggedItemId === targetId) return null;
  if (!findItemLocation(entries, draggedItemId)) return null;
  const onItem = findItemLocation(entries, targetId);
  if (onItem) return onItem;
  const slot = findRow(entries, targetId);
  if (slot) return { slotId: slot.id, index: slot.items.length };
  return null;
}
