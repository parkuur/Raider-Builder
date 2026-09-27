import { describe, expect, it } from "vitest";
import { migrateLegacyEquipmentRows } from "../../../../src/lib/model/migrations/legacy-equipment";
import type { Row } from "../../../../src/lib/model/document-types";
import type { Section } from "../../../../src/lib/model/section-types";

function legacyEquipment(
  id: string,
  lists: unknown,
  { hidden = false, title = "Equipment" } = {},
): Section {
  // Deliberately the pre-epic-13 shape, which the current type no longer
  // describes — exactly what an old saved file contains.
  return {
    id,
    type: "equipment",
    title,
    hidden,
    data: { lists },
  } as unknown as Section;
}

const bandList = {
  id: "l1",
  title: "Band Provides",
  items: [{ id: "i1", name: "Guitar amp", count: "2" }],
};
const venueList = {
  id: "l2",
  title: "Venue Provides",
  items: [{ id: "i2", name: "PA", count: "1" }],
};

describe("migrateLegacyEquipmentRows", () => {
  it("turns a legacy two-list row into a split layout of two single-list sections", () => {
    const rows: Row[] = [
      {
        id: "r1",
        kind: "full",
        section: legacyEquipment("s1", [bandList, venueList]),
      },
    ];
    const { rows: result, migrated } = migrateLegacyEquipmentRows(rows);

    expect(migrated).toBe(true);
    expect(result).toHaveLength(1);
    const row = result[0]!;
    expect(row.kind).toBe("split");
    if (row.kind !== "split") return;
    expect(row.id).toBe("r1");
    const [[first], [second]] = row.columns;
    expect(first).toEqual({
      id: "s1",
      type: "equipment",
      title: "Band Provides",
      hidden: false,
      data: { items: bandList.items },
    });
    expect(second).toMatchObject({
      type: "equipment",
      title: "Venue Provides",
      hidden: false,
      data: { items: venueList.items },
    });
    expect(second!.id).not.toBe("s1");
    expect(row.columns[0]).toHaveLength(1);
    expect(row.columns[1]).toHaveLength(1);
  });

  it("carries a hidden section's flag onto both new sections", () => {
    const rows: Row[] = [
      {
        id: "r1",
        kind: "full",
        section: legacyEquipment("s1", [bandList, venueList], {
          hidden: true,
        }),
      },
    ];
    const row = migrateLegacyEquipmentRows(rows).rows[0]!;
    if (row.kind !== "split") throw new Error("expected a split row");
    expect(row.columns[0][0]!.hidden).toBe(true);
    expect(row.columns[1][0]!.hidden).toBe(true);
  });

  it("still converts when the second list is empty", () => {
    const rows: Row[] = [
      {
        id: "r1",
        kind: "full",
        section: legacyEquipment("s1", [
          bandList,
          { id: "l2", title: "Venue Provides", items: [] },
        ]),
      },
    ];
    const row = migrateLegacyEquipmentRows(rows).rows[0]!;
    if (row.kind !== "split") throw new Error("expected a split row");
    expect(row.columns[1][0]!.data).toEqual({ items: [] });
  });

  it("degrades malformed or missing lists to untitled empty lists", () => {
    const rows: Row[] = [
      {
        id: "r1",
        kind: "full",
        section: legacyEquipment("s1", [{ title: 5 }]),
      },
    ];
    const row = migrateLegacyEquipmentRows(rows).rows[0]!;
    if (row.kind !== "split") throw new Error("expected a split row");
    expect(row.columns[0][0]).toMatchObject({ title: "", data: { items: [] } });
    expect(row.columns[1][0]).toMatchObject({ title: "", data: { items: [] } });
  });

  it("merges a legacy section found inside a split column in place", () => {
    const rows: Row[] = [
      {
        id: "r1",
        kind: "split",
        columns: [
          [legacyEquipment("s1", [bandList, venueList], { title: "Gear" })],
          [
            {
              id: "s2",
              type: "text",
              title: "",
              hidden: false,
              data: { text: "" },
            } as Section,
          ],
        ],
      },
    ];
    const { rows: result, migrated } = migrateLegacyEquipmentRows(rows);
    expect(migrated).toBe(true);
    const row = result[0]!;
    if (row.kind !== "split") throw new Error("expected a split row");
    expect(row.columns[0]).toEqual([
      {
        id: "s1",
        type: "equipment",
        title: "Gear",
        hidden: false,
        data: { items: [...bandList.items, ...venueList.items] },
      },
    ]);
    // The non-Equipment section in the other column is left as-is.
    expect(row.columns[1]).toEqual([
      { id: "s2", type: "text", title: "", hidden: false, data: { text: "" } },
    ]);
  });

  it("leaves current-format documents untouched", () => {
    const rows: Row[] = [
      {
        id: "r1",
        kind: "full",
        section: {
          id: "s1",
          type: "equipment",
          title: "Equipment",
          hidden: false,
          data: { items: [] },
        },
      },
      {
        id: "r2",
        kind: "full",
        section: {
          id: "s2",
          type: "text",
          title: "",
          hidden: false,
          data: { text: "" },
        } as Section,
      },
    ];
    const result = migrateLegacyEquipmentRows(rows);
    expect(result.migrated).toBe(false);
    expect(result.rows).toBe(rows);
  });
});
