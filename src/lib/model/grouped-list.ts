import { createId } from "./id";
import { clamp } from "./util";

/**
 * A list whose top level is an ordered mix of plain rows and groups — a
 * heading plus its own ordered rows. Groups don't nest. Shared by Packing
 * List and Schedule so the grouping, hiding and cross-group moving logic
 * lives in one place.
 */
export interface GroupableRow {
  id: string;
  hidden: boolean;
}

export interface RowEntry<R extends GroupableRow> {
  kind: "row";
  row: R;
}

export interface GroupEntry<R extends GroupableRow> {
  kind: "group";
  id: string;
  title: string;
  hidden: boolean;
  rows: R[];
}

export type GroupedEntry<R extends GroupableRow> = RowEntry<R> | GroupEntry<R>;

/** Where a row lives: `groupId: null` is the top level. */
export interface RowLocation {
  groupId: string | null;
  index: number;
}

/**
 * Drop target id for "the end of the top level" — lets a row be dragged
 * out of a group even when nothing ungrouped follows it.
 */
export const GROUPED_LIST_END = "__grouped-list-end__";

export function entryId<R extends GroupableRow>(
  entry: GroupedEntry<R>,
): string {
  return entry.kind === "row" ? entry.row.id : entry.id;
}

function findGroupIndex<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
  groupId: string,
): number {
  return entries.findIndex((e) => e.kind === "group" && e.id === groupId);
}

export function findRowLocation<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
  rowId: string,
): RowLocation | null {
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    if (entry.kind === "row") {
      if (entry.row.id === rowId) return { groupId: null, index: i };
    } else {
      const index = entry.rows.findIndex((r) => r.id === rowId);
      if (index !== -1) return { groupId: entry.id, index };
    }
  }
  return null;
}

export function findRow<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
  rowId: string,
): R | null {
  for (const entry of entries) {
    if (entry.kind === "row") {
      if (entry.row.id === rowId) return entry.row;
    } else {
      const row = entry.rows.find((r) => r.id === rowId);
      if (row) return row;
    }
  }
  return null;
}

/** Every row in display order, grouped or not. */
export function allRows<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
): R[] {
  return entries.flatMap((e) => (e.kind === "row" ? [e.row] : e.rows));
}

function mapGroup<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
  groupId: string,
  update: (group: GroupEntry<R>) => GroupEntry<R>,
): GroupedEntry<R>[] {
  const index = findGroupIndex(entries, groupId);
  if (index === -1) return entries;
  const next = [...entries];
  next[index] = update(entries[index] as GroupEntry<R>);
  return next;
}

function mapRow<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
  rowId: string,
  update: (row: R) => R,
): GroupedEntry<R>[] {
  const location = findRowLocation(entries, rowId);
  if (!location) return entries;
  if (location.groupId === null) {
    const next = [...entries];
    const entry = entries[location.index] as RowEntry<R>;
    next[location.index] = { kind: "row", row: update(entry.row) };
    return next;
  }
  return mapGroup(entries, location.groupId, (group) => ({
    ...group,
    rows: group.rows.map((r, i) => (i === location.index ? update(r) : r)),
  }));
}

/**
 * Adds a new row at the end of the top level by default, or into `target`
 * (end of that container when `index` is omitted). No-op for an unknown
 * group.
 */
export function addGroupedRow<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
  makeRow: () => R,
  target: { groupId: string | null; index?: number } = { groupId: null },
): GroupedEntry<R>[] {
  if (target.groupId === null) {
    const index = clamp(target.index ?? entries.length, 0, entries.length);
    return [
      ...entries.slice(0, index),
      { kind: "row", row: makeRow() },
      ...entries.slice(index),
    ];
  }
  if (findGroupIndex(entries, target.groupId) === -1) return entries;
  return mapGroup(entries, target.groupId, (group) => {
    const index = clamp(
      target.index ?? group.rows.length,
      0,
      group.rows.length,
    );
    return {
      ...group,
      rows: [
        ...group.rows.slice(0, index),
        makeRow(),
        ...group.rows.slice(index),
      ],
    };
  });
}

/** Adds an empty, untitled group at the end of the top level by default. */
export function addGroup<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
  atIndex: number = entries.length,
): GroupedEntry<R>[] {
  const index = clamp(atIndex, 0, entries.length);
  const group: GroupEntry<R> = {
    kind: "group",
    id: createId("group"),
    title: "",
    hidden: false,
    rows: [],
  };
  return [...entries.slice(0, index), group, ...entries.slice(index)];
}

export function removeGroupedRow<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
  rowId: string,
): GroupedEntry<R>[] {
  const location = findRowLocation(entries, rowId);
  if (!location) return entries;
  if (location.groupId === null) {
    return entries.filter((_, i) => i !== location.index);
  }
  return mapGroup(entries, location.groupId, (group) => ({
    ...group,
    rows: group.rows.filter((_, i) => i !== location.index),
  }));
}

/** Removes a group together with every row in it. */
export function removeGroup<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
  groupId: string,
): GroupedEntry<R>[] {
  const index = findGroupIndex(entries, groupId);
  if (index === -1) return entries;
  return entries.filter((_, i) => i !== index);
}

/**
 * Dissolves a group, releasing its rows to the top level at the group's
 * position, in order. The rows keep their own `hidden` flags; the group's
 * `hidden` is dropped with the group, so rows only hidden by it reappear.
 */
export function ungroup<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
  groupId: string,
): GroupedEntry<R>[] {
  const index = findGroupIndex(entries, groupId);
  if (index === -1) return entries;
  const group = entries[index] as GroupEntry<R>;
  return [
    ...entries.slice(0, index),
    ...group.rows.map((row): RowEntry<R> => ({ kind: "row", row })),
    ...entries.slice(index + 1),
  ];
}

export function setGroupTitle<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
  groupId: string,
  title: string,
): GroupedEntry<R>[] {
  return mapGroup(entries, groupId, (group) => ({ ...group, title }));
}

export function toggleGroupHidden<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
  groupId: string,
): GroupedEntry<R>[] {
  return mapGroup(entries, groupId, (group) => ({
    ...group,
    hidden: !group.hidden,
  }));
}

export function updateGroupedRow<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
  rowId: string,
  patch: Partial<Omit<R, "id">>,
): GroupedEntry<R>[] {
  return mapRow(entries, rowId, (row) => ({ ...row, ...patch }));
}

export function toggleGroupedRowHidden<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
  rowId: string,
): GroupedEntry<R>[] {
  return mapRow(entries, rowId, (row) => ({ ...row, hidden: !row.hidden }));
}

/** A row is hidden if it, or the group it's in, is hidden. */
export function isRowEffectivelyHidden<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
  rowId: string,
): boolean {
  const location = findRowLocation(entries, rowId);
  if (!location) return false;
  if (location.groupId === null) {
    return (entries[location.index] as RowEntry<R>).row.hidden;
  }
  const group = entries[
    findGroupIndex(entries, location.groupId)
  ] as GroupEntry<R>;
  return group.hidden || group.rows[location.index]!.hidden;
}

/**
 * Moves a row within its container, into or out of a group, or between
 * groups. `target.index` is the row's final index in the target container,
 * clamped to the valid range. No-op (same array back) for an unknown row or
 * group, or a move that changes nothing.
 */
export function moveGroupedRow<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
  rowId: string,
  target: RowLocation,
): GroupedEntry<R>[] {
  const from = findRowLocation(entries, rowId);
  if (!from) return entries;
  if (target.groupId !== null && findGroupIndex(entries, target.groupId) === -1)
    return entries;
  const row = findRow(entries, rowId)!;
  const removed = removeGroupedRow(entries, rowId);

  if (target.groupId === null) {
    const index = clamp(target.index, 0, removed.length);
    if (from.groupId === null && index === from.index) return entries;
    return [
      ...removed.slice(0, index),
      { kind: "row", row },
      ...removed.slice(index),
    ];
  }
  const group = removed[
    findGroupIndex(removed, target.groupId)
  ] as GroupEntry<R>;
  const index = clamp(target.index, 0, group.rows.length);
  if (from.groupId === target.groupId && index === from.index) return entries;
  return mapGroup(removed, target.groupId, (g) => ({
    ...g,
    rows: [...g.rows.slice(0, index), row, ...g.rows.slice(index)],
  }));
}

/**
 * Moves a group to `index` (its final top-level position, clamped). No-op
 * for an unknown group or a move that changes nothing.
 */
export function moveGroup<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
  groupId: string,
  index: number,
): GroupedEntry<R>[] {
  const from = findGroupIndex(entries, groupId);
  if (from === -1) return entries;
  const to = clamp(index, 0, entries.length - 1);
  if (from === to) return entries;
  const next = [...entries];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}

export type GroupedMove =
  | { kind: "row"; rowId: string; target: RowLocation }
  | { kind: "group"; groupId: string; index: number };

/**
 * Turns "dragged `draggedId` and dropped it on `targetId`" into a move, or
 * null when the drop means nothing. Targets are a row, a group header, or
 * `GROUPED_LIST_END`.
 *
 * - A row dropped on a row takes that row's place in the target's
 *   container (the same "take its slot" rule as `reorderListRows` within
 *   one container; inserted before the target across containers).
 * - A row dropped on a group header moves to the top of that group.
 * - Anything dropped on `GROUPED_LIST_END` moves to the end of the top
 *   level.
 * - A group only ever moves at the top level: dropping it on a row inside
 *   another group resolves to that group's position, so groups never nest.
 */
export function resolveGroupedDrop<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
  draggedId: string,
  targetId: string,
): GroupedMove | null {
  if (draggedId === targetId) return null;
  const draggedRow = findRowLocation(entries, draggedId);
  const draggedGroup = findGroupIndex(entries, draggedId);
  if (!draggedRow && draggedGroup === -1) return null;

  const targetRow = findRowLocation(entries, targetId);
  const targetGroup = findGroupIndex(entries, targetId);
  const isEnd = targetId === GROUPED_LIST_END;
  if (!targetRow && targetGroup === -1 && !isEnd) return null;

  if (draggedRow) {
    if (isEnd) {
      // Removing a top-level row shortens the top level by one first.
      const end =
        draggedRow.groupId === null ? entries.length - 1 : entries.length;
      return {
        kind: "row",
        rowId: draggedId,
        target: { groupId: null, index: end },
      };
    }
    if (targetGroup !== -1) {
      return {
        kind: "row",
        rowId: draggedId,
        target: { groupId: targetId, index: 0 },
      };
    }
    // Within one container the target's original index is exactly "take
    // its slot"; across containers removing the dragged row never shifts
    // the target's index, so it means "insert before the target".
    return { kind: "row", rowId: draggedId, target: targetRow! };
  }

  // Dragging a group.
  if (isEnd) {
    return { kind: "group", groupId: draggedId, index: entries.length - 1 };
  }
  const targetTopIndex =
    targetGroup !== -1
      ? targetGroup
      : targetRow!.groupId === null
        ? targetRow!.index
        : findGroupIndex(entries, targetRow!.groupId);
  if (targetTopIndex === draggedGroup) return null;
  return { kind: "group", groupId: draggedId, index: targetTopIndex };
}

export function applyGroupedMove<R extends GroupableRow>(
  entries: GroupedEntry<R>[],
  move: GroupedMove,
): GroupedEntry<R>[] {
  return move.kind === "row"
    ? moveGroupedRow(entries, move.rowId, move.target)
    : moveGroup(entries, move.groupId, move.index);
}
