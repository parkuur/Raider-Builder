import { describe, expect, it } from "vitest";
import {
  addScheduleItem,
  defaultScheduleColumnLabels,
  defaultScheduleData,
  findItemLocation,
  formatSlotTime,
  makeScheduleSlot,
  moveScheduleItem,
  removeScheduleItem,
  resolveScheduleItemDrop,
  scheduleColumnLabels,
  setScheduleColumnLabel,
  slotIdForTarget,
  updateScheduleItem,
  withScheduleEntries,
} from "../../../src/lib/model/schedule";
import type { ScheduleSlot } from "../../../src/lib/model/schedule";
import { allRows } from "../../../src/lib/model/grouped-list";
import type { GroupedEntry } from "../../../src/lib/model/grouped-list";

function slot(
  id: string,
  itemIds: string[],
  start = "",
  end = "",
): ScheduleSlot {
  return {
    id,
    hidden: false,
    start,
    end,
    items: itemIds.map((iid) => ({ id: iid, title: iid, who: "", notes: "" })),
  };
}

// S1 [a, b], # Packing up [S2 [c], S3 [d, e]]
const sample = (): GroupedEntry<ScheduleSlot>[] => [
  { kind: "row", row: slot("S1", ["a", "b"], "18:00", "18:30") },
  {
    kind: "group",
    id: "G",
    title: "Packing up",
    hidden: false,
    rows: [slot("S2", ["c"]), slot("S3", ["d", "e"])],
  },
];

/** Item ids per slot, e.g. { S1: ["a", "b"], ... }. */
function itemsBySlot(entries: GroupedEntry<ScheduleSlot>[]) {
  return Object.fromEntries(
    allRows(entries).map((s) => [s.id, s.items.map((i) => i.id)]),
  );
}

describe("defaults", () => {
  it("a section starts with no slots", () => {
    expect(defaultScheduleData()).toEqual({ entries: [] });
  });

  it("a new slot has blank times and exactly one empty item", () => {
    const s = makeScheduleSlot();
    expect(s).toMatchObject({ hidden: false, start: "", end: "" });
    expect(s.items).toHaveLength(1);
    expect(s.items[0]).toMatchObject({ title: "", who: "", notes: "" });
    expect(makeScheduleSlot().id).not.toBe(s.id);
  });

  it("column labels default to Time / Item / Who / Notes and are editable", () => {
    expect(scheduleColumnLabels(defaultScheduleData())).toEqual(
      defaultScheduleColumnLabels(),
    );
    expect(Object.values(defaultScheduleColumnLabels())).toEqual([
      "Time",
      "Item",
      "Who",
      "Notes",
    ]);
    const edited = setScheduleColumnLabel(defaultScheduleData(), "who", "Crew");
    expect(scheduleColumnLabels(edited).who).toBe("Crew");
  });

  it("withScheduleEntries keeps data identity when nothing changed", () => {
    const data = defaultScheduleData();
    expect(withScheduleEntries(data, data.entries)).toBe(data);
  });
});

describe("formatSlotTime", () => {
  it("formats a range, a single time, or nothing", () => {
    expect(formatSlotTime({ start: "18:00", end: "18:45" })).toBe(
      "18:00–18:45",
    );
    expect(formatSlotTime({ start: "18:00", end: "" })).toBe("18:00");
    expect(formatSlotTime({ start: "", end: "23:00" })).toBe("23:00");
    expect(formatSlotTime({ start: " ", end: "" })).toBe("");
    expect(formatSlotTime({ start: "TBA", end: " " })).toBe("TBA");
  });
});

describe("lookups", () => {
  it("findItemLocation finds items in grouped and ungrouped slots", () => {
    expect(findItemLocation(sample(), "b")).toEqual({ slotId: "S1", index: 1 });
    expect(findItemLocation(sample(), "e")).toEqual({ slotId: "S3", index: 1 });
    expect(findItemLocation(sample(), "S1")).toBeNull();
  });

  it("slotIdForTarget maps an item to its slot and passes other ids through", () => {
    expect(slotIdForTarget(sample(), "d")).toBe("S3");
    expect(slotIdForTarget(sample(), "S2")).toBe("S2");
    expect(slotIdForTarget(sample(), "G")).toBe("G");
  });
});

describe("addScheduleItem / removeScheduleItem / updateScheduleItem", () => {
  it("adds an item at the end of a slot, or at an index", () => {
    const appended = addScheduleItem(sample(), "S2");
    expect(itemsBySlot(appended).S2).toHaveLength(2);
    expect(itemsBySlot(appended).S2![0]).toBe("c");

    const inserted = addScheduleItem(sample(), "S3", 0);
    expect(itemsBySlot(inserted).S3![1]).toBe("d");
  });

  it("removes an item from a multi-item slot", () => {
    expect(itemsBySlot(removeScheduleItem(sample(), "a")).S1).toEqual(["b"]);
  });

  it("never removes a slot's only item", () => {
    const entries = sample();
    expect(removeScheduleItem(entries, "c")).toBe(entries);
  });

  it("updates an item's fields", () => {
    const result = updateScheduleItem(sample(), "d", {
      who: "Drummer",
      notes: "Cymbals first",
    });
    const s3 = allRows(result).find((s) => s.id === "S3")!;
    expect(s3.items[0]).toEqual({
      id: "d",
      title: "d",
      who: "Drummer",
      notes: "Cymbals first",
    });
    expect(s3.items[1]!.who).toBe("");
  });

  it("are no-ops for unknown ids", () => {
    const entries = sample();
    expect(addScheduleItem(entries, "nope")).toBe(entries);
    expect(removeScheduleItem(entries, "nope")).toBe(entries);
    expect(updateScheduleItem(entries, "nope", { title: "x" })).toBe(entries);
  });
});

describe("moveScheduleItem", () => {
  it("reorders within a slot", () => {
    expect(
      itemsBySlot(moveScheduleItem(sample(), "a", { slotId: "S1", index: 1 }))
        .S1,
    ).toEqual(["b", "a"]);
  });

  it("moves across slots in different groups", () => {
    const result = itemsBySlot(
      moveScheduleItem(sample(), "b", { slotId: "S3", index: 1 }),
    );
    expect(result.S1).toEqual(["a"]);
    expect(result.S3).toEqual(["d", "b", "e"]);
  });

  it("moves from a grouped slot to an ungrouped one", () => {
    const result = itemsBySlot(
      moveScheduleItem(sample(), "e", { slotId: "S1", index: 0 }),
    );
    expect(result.S1).toEqual(["e", "a", "b"]);
    expect(result.S3).toEqual(["d"]);
  });

  it("moving a slot's only item out leaves a fresh empty item behind", () => {
    const moved = moveScheduleItem(sample(), "c", { slotId: "S1", index: 2 });
    const s2 = allRows(moved).find((s) => s.id === "S2")!;
    expect(s2.items).toHaveLength(1);
    expect(s2.items[0]!.id).not.toBe("c");
    expect(s2.items[0]).toMatchObject({ title: "", who: "", notes: "" });
    expect(itemsBySlot(moved).S1).toEqual(["a", "b", "c"]);
  });

  it("keeps the slot's times when its only item moves away", () => {
    const entries: GroupedEntry<ScheduleSlot>[] = [
      { kind: "row", row: slot("X", ["x"], "20:00", "21:00") },
      { kind: "row", row: slot("Y", ["y"]) },
    ];
    const moved = moveScheduleItem(entries, "x", { slotId: "Y", index: 0 });
    expect(allRows(moved)[0]).toMatchObject({ start: "20:00", end: "21:00" });
  });

  it("clamps the target index", () => {
    expect(
      itemsBySlot(moveScheduleItem(sample(), "a", { slotId: "S3", index: 99 }))
        .S3,
    ).toEqual(["d", "e", "a"]);
    expect(
      itemsBySlot(moveScheduleItem(sample(), "a", { slotId: "S1", index: 99 }))
        .S1,
    ).toEqual(["b", "a"]);
  });

  it("carries the item's content along", () => {
    const entries = updateScheduleItem(sample(), "a", { who: "FOH" });
    const moved = moveScheduleItem(entries, "a", { slotId: "S2", index: 0 });
    expect(allRows(moved).find((s) => s.id === "S2")!.items[0]).toEqual({
      id: "a",
      title: "a",
      who: "FOH",
      notes: "",
    });
  });

  it("is a no-op for an unknown item or slot, or a move that changes nothing", () => {
    const entries = sample();
    expect(moveScheduleItem(entries, "nope", { slotId: "S1", index: 0 })).toBe(
      entries,
    );
    expect(moveScheduleItem(entries, "a", { slotId: "nope", index: 0 })).toBe(
      entries,
    );
    expect(moveScheduleItem(entries, "a", { slotId: "S1", index: 0 })).toBe(
      entries,
    );
  });
});

describe("resolveScheduleItemDrop", () => {
  it("onto another item: that item's slot and index", () => {
    expect(resolveScheduleItemDrop(sample(), "a", "e")).toEqual({
      slotId: "S3",
      index: 1,
    });
    expect(resolveScheduleItemDrop(sample(), "b", "a")).toEqual({
      slotId: "S1",
      index: 0,
    });
  });

  it("onto a slot: the end of that slot", () => {
    expect(resolveScheduleItemDrop(sample(), "a", "S3")).toEqual({
      slotId: "S3",
      index: 2,
    });
  });

  it("returns null for self-drops, group headers and unknown ids", () => {
    const entries = sample();
    expect(resolveScheduleItemDrop(entries, "a", "a")).toBeNull();
    expect(resolveScheduleItemDrop(entries, "a", "G")).toBeNull();
    expect(resolveScheduleItemDrop(entries, "a", "nope")).toBeNull();
    expect(resolveScheduleItemDrop(entries, "nope", "a")).toBeNull();
  });
});
