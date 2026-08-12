import { describe, expect, it } from "vitest";
import {
  addListRow,
  numberRows,
  pairListRows,
  reorderListRows,
  removeListRow,
  unpairListRow,
} from "../../../src/lib/model/row-list";
import type { PairableRow } from "../../../src/lib/model/row-list";

interface Row extends PairableRow {
  label: string;
}

function row(id: string, pairedWithId?: string): Row {
  return { id, label: id, pairedWithId };
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

describe("removeListRow", () => {
  it("removes the targeted row", () => {
    const rows = [row("a"), row("b")];
    expect(removeListRow(rows, "a").map((r) => r.id)).toEqual(["b"]);
  });

  it("is a no-op for an unknown id", () => {
    const rows = [row("a")];
    expect(removeListRow(rows, "missing")).toBe(rows);
  });

  it("clears a dangling pairedWithId left on the surviving side of a deleted pair", () => {
    const rows = [row("a", "b"), row("b", "a")];
    const result = removeListRow(rows, "b");
    expect(result).toEqual([row("a", undefined)]);
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

describe("pairListRows", () => {
  it("sets mutual pairedWithId on both rows", () => {
    const rows = [row("a"), row("b")];
    const result = pairListRows(rows, "a", "b");
    expect(result[0]!.pairedWithId).toBe("b");
    expect(result[1]!.pairedWithId).toBe("a");
  });

  it("is a no-op pairing a row with itself", () => {
    const rows = [row("a")];
    expect(pairListRows(rows, "a", "a")).toBe(rows);
  });

  it("is a no-op for an unknown id", () => {
    const rows = [row("a")];
    expect(pairListRows(rows, "a", "missing")).toBe(rows);
  });

  it("clears a stale reciprocal link when re-pairing an already-paired row", () => {
    const rows = [row("a", "b"), row("b", "a"), row("c")];
    const result = pairListRows(rows, "a", "c");
    expect(result.find((r) => r.id === "a")!.pairedWithId).toBe("c");
    expect(result.find((r) => r.id === "c")!.pairedWithId).toBe("a");
    expect(result.find((r) => r.id === "b")!.pairedWithId).toBeUndefined();
  });
});

describe("unpairListRow", () => {
  it("clears pairedWithId on both sides of a mutual pair", () => {
    const rows = [row("a", "b"), row("b", "a")];
    const result = unpairListRow(rows, "a");
    expect(result[0]!.pairedWithId).toBeUndefined();
    expect(result[1]!.pairedWithId).toBeUndefined();
  });

  it("is a no-op on a row that isn't paired", () => {
    const rows = [row("a")];
    expect(unpairListRow(rows, "a")).toBe(rows);
  });

  it("only clears this row's own link when the partner doesn't reciprocate", () => {
    const rows = [row("a", "b"), row("b", "c")];
    const result = unpairListRow(rows, "a");
    expect(result[0]!.pairedWithId).toBeUndefined();
    expect(result[1]!.pairedWithId).toBe("c");
  });
});

describe("numberRows", () => {
  it("numbers a normal unpaired list sequentially", () => {
    const rows = [row("a"), row("b"), row("c")];
    expect(numberRows(rows)).toEqual([
      { id: "a", label: "1" },
      { id: "b", label: "2" },
      { id: "c", label: "3" },
    ]);
  });

  it("combines a pair in the middle of the list", () => {
    const rows = [row("a"), row("b", "c"), row("c", "b"), row("d")];
    expect(numberRows(rows)).toEqual([
      { id: "a", label: "1" },
      { id: "b", label: "2–3" },
      { id: "c", label: "" },
      { id: "d", label: "4" },
    ]);
  });

  it("combines a pair at the very end", () => {
    const rows = [row("a"), row("b", "c"), row("c", "b")];
    expect(numberRows(rows)).toEqual([
      { id: "a", label: "1" },
      { id: "b", label: "2–3" },
      { id: "c", label: "" },
    ]);
  });

  it("numbers a dangling/unmatched pairedWithId normally, without corrupting later numbers", () => {
    const rows = [row("a", "missing"), row("b"), row("c")];
    expect(numberRows(rows)).toEqual([
      { id: "a", label: "1" },
      { id: "b", label: "2" },
      { id: "c", label: "3" },
    ]);
  });

  it("handles two independent adjacent pairs back-to-back", () => {
    const rows = [row("a", "b"), row("b", "a"), row("c", "d"), row("d", "c")];
    expect(numberRows(rows)).toEqual([
      { id: "a", label: "1–2" },
      { id: "b", label: "" },
      { id: "c", label: "3–4" },
      { id: "d", label: "" },
    ]);
  });

  it("keeps a pair's combined label after a reorder that moves the pair as a block", () => {
    const rows = [row("x"), row("a", "b"), row("b", "a"), row("y")];
    // Simulate the pair-as-a-block moving to the front, ahead of "x".
    const reordered = [rows[1]!, rows[2]!, rows[0]!, rows[3]!];
    expect(numberRows(reordered)).toEqual([
      { id: "a", label: "1–2" },
      { id: "b", label: "" },
      { id: "x", label: "3" },
      { id: "y", label: "4" },
    ]);
  });

  it("degrades to independent numbering when a mutual pairing is not adjacent", () => {
    const rows = [row("a", "c"), row("b"), row("c", "a")];
    expect(numberRows(rows)).toEqual([
      { id: "a", label: "1" },
      { id: "b", label: "2" },
      { id: "c", label: "3" },
    ]);
  });

  it("degrades to independent numbering when a pairing is one-sided/not reciprocated", () => {
    const rows = [row("a", "b"), row("b")];
    expect(numberRows(rows)).toEqual([
      { id: "a", label: "1" },
      { id: "b", label: "2" },
    ]);
  });
});
