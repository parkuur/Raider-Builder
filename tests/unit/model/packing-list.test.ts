import { describe, expect, it } from "vitest";
import {
  defaultPackingListColumnLabels,
  defaultPackingListData,
  makePackingItem,
  packingListColumnLabels,
  setPackingListColumnLabel,
  withPackingEntries,
} from "../../../src/lib/model/packing-list";
import { addGroup, addGroupedRow } from "../../../src/lib/model/grouped-list";

describe("defaultPackingListData", () => {
  it("starts with no entries", () => {
    expect(defaultPackingListData()).toEqual({ entries: [] });
  });
});

describe("makePackingItem", () => {
  it("makes a visible, blank item with a unique id", () => {
    const a = makePackingItem();
    const b = makePackingItem();
    expect(a).toMatchObject({
      hidden: false,
      item: "",
      count: "",
      source: "",
      notes: "",
    });
    expect(a.id).not.toBe(b.id);
  });
});

describe("withPackingEntries", () => {
  it("returns the same data when the entries didn't change", () => {
    const data = defaultPackingListData();
    expect(withPackingEntries(data, data.entries)).toBe(data);
  });

  it("swaps in new entries and keeps column labels", () => {
    const data = setPackingListColumnLabel(
      defaultPackingListData(),
      "source",
      "Owner",
    );
    const entries = addGroupedRow(addGroup(data.entries), makePackingItem);
    const result = withPackingEntries(data, entries);
    expect(result.entries).toBe(entries);
    expect(packingListColumnLabels(result).source).toBe("Owner");
  });
});

describe("packing list column labels", () => {
  it("defaults to Item / Qty / From / Notes", () => {
    expect(packingListColumnLabels(defaultPackingListData())).toEqual(
      defaultPackingListColumnLabels(),
    );
    expect(defaultPackingListColumnLabels()).toEqual({
      item: "Item",
      count: "Qty",
      source: "From",
      notes: "Notes",
    });
  });

  it("stores an edited label", () => {
    const result = setPackingListColumnLabel(
      defaultPackingListData(),
      "count",
      "#",
    );
    expect(packingListColumnLabels(result).count).toBe("#");
  });
});
