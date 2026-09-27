import { describe, expect, it } from "vitest";
import {
  GROUPED_LIST_END,
  addGroup,
  addGroupedRow,
  allRows,
  applyGroupedMove,
  entryId,
  findRowLocation,
  isRowEffectivelyHidden,
  moveGroup,
  moveGroupedRow,
  removeGroup,
  removeGroupedRow,
  resolveGroupedDrop,
  setGroupTitle,
  toggleGroupHidden,
  toggleGroupedRowHidden,
  ungroup,
  updateGroupedRow,
} from "../../../src/lib/model/grouped-list";
import type {
  GroupEntry,
  GroupedEntry,
  RowEntry,
} from "../../../src/lib/model/grouped-list";

interface Item {
  id: string;
  hidden: boolean;
  label: string;
}

function r(id: string, hidden = false): RowEntry<Item> {
  return { kind: "row", row: { id, hidden, label: id } };
}

function g(id: string, rowIds: string[], hidden = false): GroupEntry<Item> {
  return {
    kind: "group",
    id,
    title: id.toUpperCase(),
    hidden,
    rows: rowIds.map((rid) => ({ id: rid, hidden: false, label: rid })),
  };
}

/** Compact shape for asserting structure: "a", or ["G", ["x", "y"]]. */
function shape(entries: GroupedEntry<Item>[]): (string | [string, string[]])[] {
  return entries.map((e) =>
    e.kind === "row" ? e.row.id : [e.id, e.rows.map((row) => row.id)],
  );
}

let counter = 0;
const makeItem = (): Item => ({
  id: `new${++counter}`,
  hidden: false,
  label: "",
});

// a, [G1: x, y], b, [G2: z], c
const sample = (): GroupedEntry<Item>[] => [
  r("a"),
  g("G1", ["x", "y"]),
  r("b"),
  g("G2", ["z"]),
  r("c"),
];

describe("lookups", () => {
  it("entryId returns a row's or group's id", () => {
    expect(sample().map(entryId)).toEqual(["a", "G1", "b", "G2", "c"]);
  });

  it("findRowLocation finds top-level and grouped rows", () => {
    const entries = sample();
    expect(findRowLocation(entries, "b")).toEqual({ groupId: null, index: 2 });
    expect(findRowLocation(entries, "y")).toEqual({ groupId: "G1", index: 1 });
    expect(findRowLocation(entries, "G1")).toBeNull();
    expect(findRowLocation(entries, "missing")).toBeNull();
  });

  it("allRows lists every row in display order", () => {
    expect(allRows(sample()).map((row) => row.id)).toEqual([
      "a",
      "x",
      "y",
      "b",
      "z",
      "c",
    ]);
  });
});

describe("addGroupedRow", () => {
  it("appends to the top level by default", () => {
    const result = addGroupedRow(sample(), makeItem);
    expect(result).toHaveLength(6);
    expect(result[5]!.kind).toBe("row");
  });

  it("inserts at a top-level index", () => {
    const result = addGroupedRow([r("a"), r("b")], makeItem, {
      groupId: null,
      index: 1,
    });
    expect(shape(result)[0]).toBe("a");
    expect(shape(result)[2]).toBe("b");
  });

  it("appends into a group", () => {
    const result = addGroupedRow(sample(), makeItem, { groupId: "G1" });
    const group = result[1] as GroupEntry<Item>;
    expect(group.rows).toHaveLength(3);
    expect(group.rows[2]!.id).toMatch(/^new/);
  });

  it("inserts at a clamped index within a group", () => {
    const result = addGroupedRow(sample(), makeItem, {
      groupId: "G1",
      index: -5,
    });
    expect((result[1] as GroupEntry<Item>).rows[0]!.id).toMatch(/^new/);
  });

  it("is a no-op for an unknown group", () => {
    const entries = sample();
    expect(addGroupedRow(entries, makeItem, { groupId: "nope" })).toBe(entries);
  });
});

describe("addGroup", () => {
  it("appends an empty, untitled, visible group", () => {
    const result = addGroup(sample());
    const group = result[5] as GroupEntry<Item>;
    expect(group).toMatchObject({
      kind: "group",
      title: "",
      hidden: false,
      rows: [],
    });
    expect(group.id).toBeTruthy();
  });

  it("inserts at a clamped index", () => {
    expect(addGroup([r("a")], 0)[0]!.kind).toBe("group");
    expect(addGroup([r("a")], 99)[1]!.kind).toBe("group");
  });
});

describe("removeGroupedRow", () => {
  it("removes a top-level row", () => {
    expect(shape(removeGroupedRow(sample(), "b"))).toEqual([
      "a",
      ["G1", ["x", "y"]],
      ["G2", ["z"]],
      "c",
    ]);
  });

  it("removes a grouped row, leaving an emptied group in place", () => {
    expect(shape(removeGroupedRow(sample(), "z"))).toEqual([
      "a",
      ["G1", ["x", "y"]],
      "b",
      ["G2", []],
      "c",
    ]);
  });

  it("is a no-op for an unknown id (including a group id)", () => {
    const entries = sample();
    expect(removeGroupedRow(entries, "missing")).toBe(entries);
    expect(removeGroupedRow(entries, "G1")).toBe(entries);
  });
});

describe("removeGroup / ungroup", () => {
  it("removeGroup deletes the group with its rows", () => {
    expect(shape(removeGroup(sample(), "G1"))).toEqual([
      "a",
      "b",
      ["G2", ["z"]],
      "c",
    ]);
  });

  it("ungroup releases rows to the top level at the group's position, in order", () => {
    expect(shape(ungroup(sample(), "G1"))).toEqual([
      "a",
      "x",
      "y",
      "b",
      ["G2", ["z"]],
      "c",
    ]);
  });

  it("ungroup of an empty group just removes it", () => {
    expect(shape(ungroup([r("a"), g("E", [])], "E"))).toEqual(["a"]);
  });

  it("ungroup keeps each row's own hidden flag", () => {
    const entries: GroupedEntry<Item>[] = [
      {
        ...g("G", ["x", "y"], true),
        rows: [
          { id: "x", hidden: true, label: "x" },
          { id: "y", hidden: false, label: "y" },
        ],
      },
    ];
    const result = ungroup(entries, "G");
    expect(isRowEffectivelyHidden(result, "x")).toBe(true);
    expect(isRowEffectivelyHidden(result, "y")).toBe(false);
  });

  it("both are no-ops for an unknown group", () => {
    const entries = sample();
    expect(removeGroup(entries, "nope")).toBe(entries);
    expect(ungroup(entries, "nope")).toBe(entries);
  });
});

describe("group title and hiding", () => {
  it("setGroupTitle renames only that group", () => {
    const result = setGroupTitle(sample(), "G2", "Audio case");
    expect((result[3] as GroupEntry<Item>).title).toBe("Audio case");
    expect((result[1] as GroupEntry<Item>).title).toBe("G1");
  });

  it("toggleGroupHidden flips the flag", () => {
    const once = toggleGroupHidden(sample(), "G1");
    expect((once[1] as GroupEntry<Item>).hidden).toBe(true);
    expect((toggleGroupHidden(once, "G1")[1] as GroupEntry<Item>).hidden).toBe(
      false,
    );
  });

  it("both are no-ops for an unknown group", () => {
    const entries = sample();
    expect(setGroupTitle(entries, "nope", "x")).toBe(entries);
    expect(toggleGroupHidden(entries, "nope")).toBe(entries);
  });
});

describe("row updates and hiding", () => {
  it("updateGroupedRow patches a top-level or grouped row", () => {
    const result = updateGroupedRow(
      updateGroupedRow(sample(), "a", { label: "A!" }),
      "y",
      { label: "Y!" },
    );
    expect(allRows(result).find((row) => row.id === "a")!.label).toBe("A!");
    expect(allRows(result).find((row) => row.id === "y")!.label).toBe("Y!");
    expect(allRows(result).find((row) => row.id === "x")!.label).toBe("x");
  });

  it("toggleGroupedRowHidden flips a row's own flag", () => {
    const result = toggleGroupedRowHidden(sample(), "x");
    expect(allRows(result).find((row) => row.id === "x")!.hidden).toBe(true);
  });

  it("are no-ops for an unknown row", () => {
    const entries = sample();
    expect(updateGroupedRow(entries, "nope", { label: "x" })).toBe(entries);
    expect(toggleGroupedRowHidden(entries, "nope")).toBe(entries);
  });

  it("isRowEffectivelyHidden cascades from the group", () => {
    const hiddenGroup = toggleGroupHidden(sample(), "G1");
    expect(isRowEffectivelyHidden(hiddenGroup, "x")).toBe(true);
    expect(isRowEffectivelyHidden(hiddenGroup, "y")).toBe(true);
    expect(isRowEffectivelyHidden(hiddenGroup, "z")).toBe(false);
    expect(isRowEffectivelyHidden(hiddenGroup, "a")).toBe(false);

    const hiddenRow = toggleGroupedRowHidden(sample(), "a");
    expect(isRowEffectivelyHidden(hiddenRow, "a")).toBe(true);
    expect(isRowEffectivelyHidden(hiddenRow, "missing")).toBe(false);
  });
});

describe("moveGroupedRow", () => {
  it("reorders within the top level", () => {
    expect(
      shape(moveGroupedRow(sample(), "a", { groupId: null, index: 2 })),
    ).toEqual([["G1", ["x", "y"]], "b", "a", ["G2", ["z"]], "c"]);
  });

  it("reorders within a group", () => {
    expect(
      shape(moveGroupedRow(sample(), "y", { groupId: "G1", index: 0 }))[1],
    ).toEqual(["G1", ["y", "x"]]);
  });

  it("moves a top-level row into a group", () => {
    expect(
      shape(moveGroupedRow(sample(), "c", { groupId: "G1", index: 1 })),
    ).toEqual(["a", ["G1", ["x", "c", "y"]], "b", ["G2", ["z"]]]);
  });

  it("moves a grouped row out to the top level", () => {
    expect(
      shape(moveGroupedRow(sample(), "x", { groupId: null, index: 0 })),
    ).toEqual(["x", "a", ["G1", ["y"]], "b", ["G2", ["z"]], "c"]);
  });

  it("moves a row between groups", () => {
    expect(
      shape(moveGroupedRow(sample(), "x", { groupId: "G2", index: 1 })),
    ).toEqual(["a", ["G1", ["y"]], "b", ["G2", ["z", "x"]], "c"]);
  });

  it("moves a row into an empty group", () => {
    const entries = [r("a"), g("E", [])];
    expect(
      shape(moveGroupedRow(entries, "a", { groupId: "E", index: 0 })),
    ).toEqual([["E", ["a"]]]);
  });

  it("clamps out-of-range indices", () => {
    expect(
      shape(moveGroupedRow(sample(), "a", { groupId: null, index: 99 })).at(-1),
    ).toBe("a");
    expect(
      shape(moveGroupedRow(sample(), "c", { groupId: "G2", index: -3 }))[3],
    ).toEqual(["G2", ["c", "z"]]);
  });

  it("carries the row's data and hidden flag along", () => {
    const entries = toggleGroupedRowHidden(sample(), "x");
    const moved = moveGroupedRow(entries, "x", { groupId: "G2", index: 0 });
    expect((moved[3] as GroupEntry<Item>).rows[0]).toEqual({
      id: "x",
      hidden: true,
      label: "x",
    });
  });

  it("returns the same array for a move that changes nothing", () => {
    const entries = sample();
    expect(moveGroupedRow(entries, "b", { groupId: null, index: 2 })).toBe(
      entries,
    );
    expect(moveGroupedRow(entries, "y", { groupId: "G1", index: 1 })).toBe(
      entries,
    );
    expect(moveGroupedRow(entries, "y", { groupId: "G1", index: 9 })).toBe(
      entries,
    );
  });

  it("is a no-op for an unknown row or target group", () => {
    const entries = sample();
    expect(moveGroupedRow(entries, "nope", { groupId: null, index: 0 })).toBe(
      entries,
    );
    expect(moveGroupedRow(entries, "a", { groupId: "nope", index: 0 })).toBe(
      entries,
    );
    // A group id isn't a row.
    expect(moveGroupedRow(entries, "G1", { groupId: null, index: 0 })).toBe(
      entries,
    );
  });
});

describe("moveGroup", () => {
  it("moves a group to a new top-level position, contents intact", () => {
    expect(shape(moveGroup(sample(), "G2", 0))).toEqual([
      ["G2", ["z"]],
      "a",
      ["G1", ["x", "y"]],
      "b",
      "c",
    ]);
  });

  it("clamps the index", () => {
    expect(shape(moveGroup(sample(), "G1", 99)).at(-1)).toEqual([
      "G1",
      ["x", "y"],
    ]);
  });

  it("is a no-op for an unknown group, a row id, or no change", () => {
    const entries = sample();
    expect(moveGroup(entries, "nope", 0)).toBe(entries);
    expect(moveGroup(entries, "a", 3)).toBe(entries);
    expect(moveGroup(entries, "G1", 1)).toBe(entries);
  });
});

describe("resolveGroupedDrop", () => {
  const apply = (dragged: string, target: string) => {
    const entries = sample();
    const move = resolveGroupedDrop(entries, dragged, target);
    return move ? shape(applyGroupedMove(entries, move)) : null;
  };

  it("row onto a row in the same container takes its slot (down and up)", () => {
    expect(apply("a", "b")).toEqual([
      ["G1", ["x", "y"]],
      "b",
      "a",
      ["G2", ["z"]],
      "c",
    ]);
    expect(apply("c", "b")).toEqual([
      "a",
      ["G1", ["x", "y"]],
      "c",
      "b",
      ["G2", ["z"]],
    ]);
    expect(apply("x", "y")?.[1]).toEqual(["G1", ["y", "x"]]);
  });

  it("row onto a row in another container is inserted before it", () => {
    // Into a group.
    expect(apply("a", "y")).toEqual([
      ["G1", ["x", "a", "y"]],
      "b",
      ["G2", ["z"]],
      "c",
    ]);
    // Out of a group onto a top-level row.
    expect(apply("z", "b")).toEqual([
      "a",
      ["G1", ["x", "y"]],
      "z",
      "b",
      ["G2", []],
      "c",
    ]);
    // Between groups.
    expect(apply("x", "z")).toEqual([
      "a",
      ["G1", ["y"]],
      "b",
      ["G2", ["x", "z"]],
      "c",
    ]);
  });

  it("row onto a group header moves to the top of that group", () => {
    expect(apply("c", "G1")).toEqual([
      "a",
      ["G1", ["c", "x", "y"]],
      "b",
      ["G2", ["z"]],
    ]);
    expect(apply("z", "G1")?.[1]).toEqual(["G1", ["z", "x", "y"]]);
  });

  it("row onto the end marker moves to the end of the top level", () => {
    expect(apply("x", GROUPED_LIST_END)).toEqual([
      "a",
      ["G1", ["y"]],
      "b",
      ["G2", ["z"]],
      "c",
      "x",
    ]);
    expect(apply("a", GROUPED_LIST_END)?.at(-1)).toBe("a");
  });

  it("a row already last at the top level dropped on the end marker changes nothing", () => {
    const entries = sample();
    const move = resolveGroupedDrop(entries, "c", GROUPED_LIST_END)!;
    expect(applyGroupedMove(entries, move)).toBe(entries);
  });

  it("group onto a top-level row or group takes that top-level slot", () => {
    expect(apply("G2", "a")).toEqual([
      ["G2", ["z"]],
      "a",
      ["G1", ["x", "y"]],
      "b",
      "c",
    ]);
    expect(apply("G1", "G2")).toEqual([
      "a",
      "b",
      ["G2", ["z"]],
      ["G1", ["x", "y"]],
      "c",
    ]);
  });

  it("group onto a row inside another group moves beside that group, never nesting", () => {
    expect(apply("G2", "x")).toEqual([
      "a",
      ["G2", ["z"]],
      ["G1", ["x", "y"]],
      "b",
      "c",
    ]);
  });

  it("group onto the end marker moves to the end", () => {
    expect(apply("G1", GROUPED_LIST_END)?.at(-1)).toEqual(["G1", ["x", "y"]]);
  });

  it("returns null for self-drops, drops onto own contents, and unknown ids", () => {
    const entries = sample();
    expect(resolveGroupedDrop(entries, "a", "a")).toBeNull();
    expect(resolveGroupedDrop(entries, "G1", "G1")).toBeNull();
    expect(resolveGroupedDrop(entries, "G1", "x")).toBeNull();
    expect(resolveGroupedDrop(entries, "nope", "a")).toBeNull();
    expect(resolveGroupedDrop(entries, "a", "nope")).toBeNull();
  });
});
