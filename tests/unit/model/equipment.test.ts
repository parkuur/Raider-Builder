import { describe, expect, it } from "vitest";
import {
  addEquipmentItem,
  defaultEquipmentData,
  removeEquipmentItem,
  reorderEquipmentItem,
  updateEquipmentItem,
} from "../../../src/lib/model/equipment";
import type { EquipmentSectionData } from "../../../src/lib/model/equipment";

function dataWith(
  ...items: { id: string; name?: string; count?: string }[]
): EquipmentSectionData {
  return {
    items: items.map((i) => ({
      id: i.id,
      name: i.name ?? "",
      count: i.count ?? "",
    })),
  };
}

describe("defaultEquipmentData", () => {
  it("starts with one empty list", () => {
    expect(defaultEquipmentData()).toEqual({ items: [] });
  });
});

describe("addEquipmentItem", () => {
  it("appends an empty item", () => {
    const result = addEquipmentItem(dataWith({ id: "i1" }));
    expect(result.items).toHaveLength(2);
    expect(result.items[0]!.id).toBe("i1");
    expect(result.items[1]).toMatchObject({ name: "", count: "" });
  });

  it("inserts at a given index", () => {
    const result = addEquipmentItem(dataWith({ id: "i1" }, { id: "i2" }), 1);
    expect(result.items[0]!.id).toBe("i1");
    expect(result.items[2]!.id).toBe("i2");
  });

  it("gives each new item a unique id", () => {
    const result = addEquipmentItem(addEquipmentItem(dataWith()));
    expect(result.items[0]!.id).not.toBe(result.items[1]!.id);
  });
});

describe("removeEquipmentItem", () => {
  it("removes the targeted item", () => {
    const result = removeEquipmentItem(
      dataWith({ id: "i1" }, { id: "i2" }),
      "i1",
    );
    expect(result.items.map((i) => i.id)).toEqual(["i2"]);
  });

  it("is a no-op for an unknown item id", () => {
    const data = dataWith({ id: "i1" });
    expect(removeEquipmentItem(data, "missing")).toBe(data);
  });
});

describe("reorderEquipmentItem", () => {
  it("moves an item within the list", () => {
    const data = dataWith({ id: "i1" }, { id: "i2" }, { id: "i3" });
    const result = reorderEquipmentItem(data, 0, 2);
    expect(result.items.map((i) => i.id)).toEqual(["i2", "i3", "i1"]);
  });

  it("is a no-op for an out-of-range fromIndex", () => {
    const data = dataWith({ id: "i1" });
    expect(reorderEquipmentItem(data, 5, 0)).toBe(data);
  });

  it("is a no-op when moving onto itself", () => {
    const data = dataWith({ id: "i1" }, { id: "i2" });
    expect(reorderEquipmentItem(data, 1, 1)).toBe(data);
  });
});

describe("updateEquipmentItem", () => {
  it("patches only the targeted item's fields", () => {
    const data = dataWith({ id: "i1", name: "a" }, { id: "i2", name: "b" });
    const result = updateEquipmentItem(data, "i1", { name: "changed" });
    expect(result.items[0]).toEqual({ id: "i1", name: "changed", count: "" });
    expect(result.items[1]!.name).toBe("b");
  });

  it("is a no-op for an unknown item id", () => {
    const data = dataWith({ id: "i1" });
    expect(updateEquipmentItem(data, "missing", { name: "x" })).toBe(data);
  });
});
