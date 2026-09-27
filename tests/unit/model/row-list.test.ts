import { describe, expect, it } from "vitest";
import {
  addListRow,
  numberListRows,
  removeListRow,
  reorderListRows,
  updateListRow,
} from "../../../src/lib/model/row-list";
import type { ListRow } from "../../../src/lib/model/row-list";

interface Row extends ListRow {
  label: string;
}

function row(id: string): Row {
  return { id, label: id };
}

describe("addListRow", () => {
  it("appends by default", () => {
    const rows = [row("a")];
    const result = addListRow(rows, () => row("b"));
    expect(result.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("inserts at a given index", () => {
    const rows = [row("a"), row("c")];
    const result = addListRow(rows, () => row("b"), 1);
    expect(result.map((r) => r.id)).toEqual(["a", "b", "c"]);
  });
});

describe("reorderListRows", () => {
  const rows = [row("a"), row("b"), row("c")];

  it("moves the first row to last", () => {
    expect(reorderListRows(rows, 0, 2).map((r) => r.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("is a no-op moving to its own index", () => {
    expect(reorderListRows(rows, 1, 1)).toBe(rows);
  });

  it("is a no-op for an out-of-range fromIndex", () => {
    expect(reorderListRows(rows, 5, 0)).toBe(rows);
  });

  it("clamps an out-of-range toIndex", () => {
    expect(reorderListRows(rows, 0, 99).map((r) => r.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });
});

describe("removeListRow", () => {
  it("removes the row with the given id", () => {
    const result = removeListRow([row("a"), row("b"), row("c")], "b");
    expect(result.map((r) => r.id)).toEqual(["a", "c"]);
  });

  it("returns the same array for an unknown id", () => {
    const rows = [row("a")];
    expect(removeListRow(rows, "missing")).toBe(rows);
  });
});

describe("updateListRow", () => {
  it("patches only the targeted row", () => {
    const result = updateListRow([row("a"), row("b")], "b", { label: "B!" });
    expect(result).toEqual([
      { id: "a", label: "a" },
      { id: "b", label: "B!" },
    ]);
  });

  it("returns the same array for an unknown id", () => {
    const rows = [row("a")];
    expect(updateListRow(rows, "missing", { label: "x" })).toBe(rows);
  });
});

describe("numberListRows", () => {
  it("numbers rows 1..n in order", () => {
    expect(numberListRows([row("x"), row("y"), row("z")])).toEqual([
      { id: "x", label: "1" },
      { id: "y", label: "2" },
      { id: "z", label: "3" },
    ]);
  });

  it("returns an empty list for no rows", () => {
    expect(numberListRows([])).toEqual([]);
  });
});
