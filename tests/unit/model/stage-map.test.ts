import { describe, expect, it } from "vitest";
import {
  addStageItem,
  bringToFront,
  defaultStageMapData,
  moveStageItem,
  removeStageItem,
  resizeStageItem,
  setCanvasHeight,
  updateStageItemName,
} from "../../../src/lib/model/stage-map";
import type { StageItem } from "../../../src/lib/model/stage-map";

function item(
  id: string,
  order: number,
  category: StageItem["category"] = "mic",
): StageItem {
  return {
    id,
    category,
    label: id,
    nameText: "",
    x: 50,
    y: 50,
    w: undefined,
    h: undefined,
    order,
  };
}

describe("addStageItem", () => {
  it("assigns each new item an order higher than any existing item", () => {
    const data = defaultStageMapData();
    const withA = addStageItem(data, "mic");
    const withB = addStageItem(withA, "di");
    expect(withB.items[1]!.order).toBeGreaterThan(withB.items[0]!.order);
  });

  it("gives risers a default size and other categories none", () => {
    const data = addStageItem(defaultStageMapData(), "riser");
    expect(data.items[0]).toMatchObject({ w: 70, h: 50 });
    const micData = addStageItem(defaultStageMapData(), "mic");
    expect(micData.items[0]!.w).toBeUndefined();
  });
});

describe("removeStageItem", () => {
  it("is a no-op for an unknown id", () => {
    const data = defaultStageMapData();
    expect(removeStageItem(data, "missing")).toBe(data);
  });
});

describe("moveStageItem", () => {
  it("clamps x and y within the canvas margins", () => {
    const data = { items: [item("a", 1)], canvasHeight: 260 };
    const result = moveStageItem(data, "a", 200, -50);
    expect(result.items[0]).toMatchObject({ x: 97, y: 8 });
  });

  it("is a no-op for an unknown id", () => {
    const data = defaultStageMapData();
    expect(moveStageItem(data, "missing", 10, 10)).toBe(data);
  });
});

describe("updateStageItemName", () => {
  it("updates the name item's center text", () => {
    const data = { items: [item("a", 1, "name")], canvasHeight: 260 };
    const result = updateStageItemName(data, "a", "J. Smith");
    expect(result.items[0]).toMatchObject({ nameText: "J. Smith" });
  });

  it("is a no-op for an unknown id", () => {
    const data = defaultStageMapData();
    expect(updateStageItemName(data, "missing", "J. Smith")).toBe(data);
  });
});

describe("resizeStageItem", () => {
  it("clamps width and height to the minimum riser size", () => {
    const data = { items: [item("a", 1, "riser")], canvasHeight: 260 };
    const result = resizeStageItem(data, "a", 5, 5);
    expect(result.items[0]).toMatchObject({ w: 34, h: 26 });
  });
});

describe("setCanvasHeight", () => {
  it("clamps to the minimum canvas height", () => {
    const data = defaultStageMapData();
    expect(setCanvasHeight(data, 50).canvasHeight).toBe(160);
  });

  it("allows a taller canvas", () => {
    const data = defaultStageMapData();
    expect(setCanvasHeight(data, 400).canvasHeight).toBe(400);
  });
});

describe("bringToFront", () => {
  it("brings an earlier-created item above a later-created one when clicked", () => {
    const items = [item("a", 1), item("b", 2)];
    const result = bringToFront(items, "a");
    const a = result.find((i) => i.id === "a")!;
    const b = result.find((i) => i.id === "b")!;
    expect(a.order).toBeGreaterThan(b.order);
  });

  it("is a no-op when the item is already uniquely on top", () => {
    const items = [item("a", 1), item("b", 2)];
    expect(bringToFront(items, "b")).toBe(items);
  });

  it("is a no-op for an unknown id", () => {
    const items = [item("a", 1)];
    expect(bringToFront(items, "missing")).toBe(items);
  });

  it("breaks a tie by still bumping the target above the shared max", () => {
    const items = [item("a", 5), item("b", 5)];
    const result = bringToFront(items, "a");
    const a = result.find((i) => i.id === "a")!;
    const b = result.find((i) => i.id === "b")!;
    expect(a.order).toBeGreaterThan(b.order);
  });
});
