import type { Row } from "../document-types";
import type { EquipmentItem } from "../equipment";
import type { Section } from "../section-types";
import { createId } from "../id";

// TEMPORARY MIGRATION: remove after 2027-09-27 (see docs/backlog/migration-removals.md)

export const LEGACY_EQUIPMENT_MIGRATION = "legacy-equipment-two-lists";

interface LegacyEquipmentList {
  title: string;
  items: EquipmentItem[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reads the pre-epic-13 `{ lists: [bandList, venueList] }` Equipment shape,
 * or returns null if `section` isn't a legacy Equipment section. Malformed
 * lists degrade to an untitled, empty list rather than failing the load.
 */
function legacyEquipmentLists(
  section: Section,
): [LegacyEquipmentList, LegacyEquipmentList] | null {
  if (section.type !== "equipment") return null;
  const data: unknown = section.data;
  if (!isPlainObject(data) || !Array.isArray(data.lists)) return null;
  const read = (value: unknown): LegacyEquipmentList =>
    isPlainObject(value)
      ? {
          title: typeof value.title === "string" ? value.title : "",
          items: Array.isArray(value.items)
            ? (value.items as EquipmentItem[])
            : [],
        }
      : { title: "", items: [] };
  return [read(data.lists[0]), read(data.lists[1])];
}

function singleListSection(
  section: Section,
  id: string,
  list: LegacyEquipmentList,
): Section {
  return {
    id,
    type: "equipment",
    title: list.title,
    hidden: section.hidden,
    data: { items: list.items },
  };
}

/**
 * Converts every legacy two-list Equipment section into the current
 * single-list shape. A legacy section in a full row (the only place the old
 * full-width Equipment type could live) becomes a split layout of two
 * Equipment sections — keeping the old side-by-side look — with the first
 * reusing the original section id. `migrated` reports whether anything
 * changed, so the UI can ask the user to re-save.
 */
export function migrateLegacyEquipmentRows(rows: Row[]): {
  rows: Row[];
  migrated: boolean;
} {
  let migrated = false;
  const result = rows.map((row): Row => {
    if (row.kind === "full") {
      const lists = legacyEquipmentLists(row.section);
      if (!lists) return row;
      migrated = true;
      return {
        id: row.id,
        kind: "split",
        columns: [
          [singleListSection(row.section, row.section.id, lists[0])],
          [singleListSection(row.section, createId("section"), lists[1])],
        ],
      };
    }
    // Not reachable from the old UI (Equipment wasn't split-eligible), but
    // a hand-edited file could still put one in a column: merge its lists
    // in place rather than leave a shape the component can't render.
    const columns = row.columns.map((column) =>
      column.map((section) => {
        const lists = legacyEquipmentLists(section);
        if (!lists) return section;
        migrated = true;
        return singleListSection(section, section.id, {
          title: section.title,
          items: [...lists[0].items, ...lists[1].items],
        });
      }),
    ) as [Section[], Section[]];
    return { ...row, columns };
  });
  return { rows: migrated ? result : rows, migrated };
}
