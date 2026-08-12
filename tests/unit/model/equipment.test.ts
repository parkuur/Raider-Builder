import { describe, expect, it } from "vitest";
import {
  addEquipmentItem,
  defaultEquipmentData,
  removeEquipmentItem,
  setEquipmentListTitle,
  updateEquipmentItem,
} from "../../../src/lib/model/equipment";
import type { EquipmentSectionData } from "../../../src/lib/model/equipment";

function dataWith(
  bandItems: { id: string; name?: string; count?: string }[],
  venueItems: { id: string; name?: string; count?: string }[] = [],
): EquipmentSectionData {
  return {
    lists: [
      {
        id: "band",
        title: "Band Provides",
        items: bandItems.map((i) => ({
          id: i.id,
          name: i.name ?? "",
          count: i.count ?? "",
        })),
      },
      {
        id: "venue",
        title: "Venue Provides",
        items: venueItems.map((i) => ({
          id: i.id,
          name: i.name ?? "",
          count: i.count ?? "",
        })),
      },
    ],
  };
}

describe("defaultEquipmentData", () => {
  it("starts with the standard two empty lists", () => {
    const data = defaultEquipmentData();
    expect(data.lists).toHaveLength(2);
    expect(data.lists[0].title).toBe("Band Provides");
    expect(data.lists[1].title).toBe("Venue Provides");
    expect(data.lists[0].items).toEqual([]);
    expect(data.lists[1].items).toEqual([]);
  });
});

describe("setEquipmentListTitle", () => {
  it("renames only the targeted list", () => {
    const data = dataWith([]);
    const result = setEquipmentListTitle(data, 0, "Our Gear");
    expect(result.lists[0].title).toBe("Our Gear");
    expect(result.lists[1].title).toBe("Venue Provides");
  });
});

describe("addEquipmentItem", () => {
  it("appends an empty item to only the targeted list", () => {
    const data = dataWith([{ id: "i1" }]);
    const result = addEquipmentItem(data, 0);
    expect(result.lists[0].items).toHaveLength(2);
    expect(result.lists[1].items).toHaveLength(0);
    expect(result.lists[0].items[1]).toMatchObject({ name: "", count: "" });
  });
});

describe("removeEquipmentItem", () => {
  it("removes the targeted item from the targeted list", () => {
    const data = dataWith([{ id: "i1" }, { id: "i2" }]);
    const result = removeEquipmentItem(data, 0, "i1");
    expect(result.lists[0].items.map((i) => i.id)).toEqual(["i2"]);
  });

  it("is a no-op for an unknown item id", () => {
    const data = dataWith([{ id: "i1" }]);
    expect(removeEquipmentItem(data, 0, "missing")).toBe(data);
  });

  it("doesn't remove an item from the other list even if the id collides", () => {
    const data = dataWith([{ id: "shared" }], [{ id: "shared" }]);
    const result = removeEquipmentItem(data, 0, "shared");
    expect(result.lists[0].items).toHaveLength(0);
    expect(result.lists[1].items).toHaveLength(1);
  });
});

describe("updateEquipmentItem", () => {
  it("patches only the targeted item's fields", () => {
    const data = dataWith([
      { id: "i1", name: "a" },
      { id: "i2", name: "b" },
    ]);
    const result = updateEquipmentItem(data, 0, "i1", { name: "changed" });
    expect(result.lists[0].items[0]!.name).toBe("changed");
    expect(result.lists[0].items[1]!.name).toBe("b");
  });

  it("is a no-op for an unknown item id", () => {
    const data = dataWith([{ id: "i1" }]);
    expect(updateEquipmentItem(data, 0, "missing", { name: "x" })).toBe(data);
  });
});
