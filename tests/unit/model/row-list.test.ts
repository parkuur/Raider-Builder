import { describe, expect, it } from "vitest";
import { addListRow, reorderListRows } from "../../../src/lib/model/row-list";
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
