import { describe, expect, it } from "vitest";
import {
  balancedRows,
  groupIntoRows,
} from "../../../src/lib/model/balanced-rows";

describe("balancedRows", () => {
  it("returns an empty array for n=0", () => {
    expect(balancedRows(0)).toEqual([]);
  });

  const examples: [number, number[]][] = [
    [1, [1]],
    [2, [2]],
    [3, [3]],
    [4, [4]],
    [5, [3, 2]],
    [6, [3, 3]],
    [7, [4, 3]],
    [8, [4, 4]],
    [9, [3, 3, 3]],
  ];

  for (const [n, expected] of examples) {
    it(`n=${n} -> [${expected.join(",")}]`, () => {
      expect(balancedRows(n)).toEqual(expected);
    });
  }

  it("satisfies the row-count/width/balance contract for n=0..20", () => {
    for (let n = 0; n <= 20; n++) {
      const rows = balancedRows(n);
      const maxPerRow = 4;
      expect(rows).toHaveLength(Math.ceil(n / maxPerRow));
      expect(rows.reduce((sum, count) => sum + count, 0)).toBe(n);
      for (const count of rows) {
        expect(count).toBeLessThanOrEqual(maxPerRow);
      }
      if (rows.length > 0) {
        expect(Math.max(...rows) - Math.min(...rows)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("respects a custom maxPerRow", () => {
    expect(balancedRows(7, 3)).toEqual([3, 2, 2]);
  });
});

describe("groupIntoRows", () => {
  it("splits items into rows matching the given counts, preserving order", () => {
    const items = ["a", "b", "c", "d", "e", "f", "g"];
    const rows = groupIntoRows(items, balancedRows(items.length));
    expect(rows).toEqual([
      ["a", "b", "c", "d"],
      ["e", "f", "g"],
    ]);
    expect(rows.flat()).toEqual(items);
  });

  it("returns an empty array of rows for an empty item list", () => {
    expect(groupIntoRows([], balancedRows(0))).toEqual([]);
  });
});
