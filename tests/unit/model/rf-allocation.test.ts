import { describe, expect, it } from "vitest";
import {
  addRfAllocationRow,
  defaultRfAllocationColumnLabels,
  defaultRfAllocationData,
  removeRfAllocationRow,
  reorderRfAllocationRows,
  rfAllocationColumnLabels,
  setRfAllocationColumnLabel,
  updateRfAllocationRow,
} from "../../../src/lib/model/rf-allocation";
import type { RfAllocationSectionData } from "../../../src/lib/model/rf-allocation";

function dataWith(...ids: string[]): RfAllocationSectionData {
  return {
    rows: ids.map((id) => ({
      id,
      device: id,
      window: "",
      bandwidth: "",
      frequency: "",
      notes: "",
    })),
  };
}

describe("defaultRfAllocationData", () => {
  it("starts empty", () => {
    expect(defaultRfAllocationData()).toEqual({ rows: [] });
  });
});

describe("addRfAllocationRow", () => {
  it("appends a blank unit", () => {
    const result = addRfAllocationRow(dataWith("a"));
    expect(result.rows).toHaveLength(2);
    expect(result.rows[1]).toMatchObject({
      device: "",
      window: "",
      bandwidth: "",
      frequency: "",
      notes: "",
    });
  });

  it("inserts at a given index", () => {
    const result = addRfAllocationRow(dataWith("a", "b"), 1);
    expect(result.rows.map((r) => r.id)[0]).toBe("a");
    expect(result.rows.map((r) => r.id)[2]).toBe("b");
  });
});

describe("removeRfAllocationRow", () => {
  it("removes the targeted unit", () => {
    expect(
      removeRfAllocationRow(dataWith("a", "b"), "b").rows.map((r) => r.id),
    ).toEqual(["a"]);
  });

  it("is a no-op for an unknown id", () => {
    const data = dataWith("a");
    expect(removeRfAllocationRow(data, "missing")).toBe(data);
  });
});

describe("updateRfAllocationRow", () => {
  it("patches the targeted unit's fields", () => {
    const result = updateRfAllocationRow(dataWith("a", "b"), "a", {
      window: "470–608 MHz",
      frequency: "606.125",
    });
    expect(result.rows[0]).toMatchObject({
      device: "a",
      window: "470–608 MHz",
      frequency: "606.125",
    });
    expect(result.rows[1]!.frequency).toBe("");
  });

  it("is a no-op for an unknown id", () => {
    const data = dataWith("a");
    expect(updateRfAllocationRow(data, "missing", { device: "x" })).toBe(data);
  });
});

describe("reorderRfAllocationRows", () => {
  it("moves a unit", () => {
    expect(
      reorderRfAllocationRows(dataWith("a", "b", "c"), 0, 2).rows.map(
        (r) => r.id,
      ),
    ).toEqual(["b", "c", "a"]);
  });

  it("is a no-op for an out-of-range index", () => {
    const data = dataWith("a", "b");
    expect(reorderRfAllocationRows(data, -1, 0)).toBe(data);
  });
});

describe("RF allocation column labels", () => {
  it("defaults to Device / Window / Bandwidth / Frequency / Notes", () => {
    expect(rfAllocationColumnLabels(defaultRfAllocationData())).toEqual(
      defaultRfAllocationColumnLabels(),
    );
    expect(Object.values(defaultRfAllocationColumnLabels())).toEqual([
      "Device",
      "Window",
      "Bandwidth",
      "Frequency",
      "Notes",
    ]);
  });

  it("stores an edited label", () => {
    const result = setRfAllocationColumnLabel(
      defaultRfAllocationData(),
      "frequency",
      "MHz",
    );
    expect(rfAllocationColumnLabels(result).frequency).toBe("MHz");
  });
});
