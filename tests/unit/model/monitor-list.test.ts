import { describe, expect, it } from "vitest";
import {
  addMonitorRow,
  defaultMonitorListData,
  pairMonitorRows,
  removeMonitorRow,
  unpairMonitorRow,
  updateMonitorRow,
} from "../../../src/lib/model/monitor-list";
import type { MonitorListSectionData } from "../../../src/lib/model/monitor-list";

function dataWith(
  ...rows: { id: string; player?: string; pairedWithId?: string }[]
): MonitorListSectionData {
  return {
    rows: rows.map((r) => ({
      id: r.id,
      player: r.player ?? "",
      type: "",
      notes: "",
      pairedWithId: r.pairedWithId,
    })),
  };
}

describe("defaultMonitorListData", () => {
  it("starts with no rows", () => {
    expect(defaultMonitorListData()).toEqual({ rows: [] });
  });
});

describe("addMonitorRow", () => {
  it("appends a row with the monitor fields defaulted", () => {
    const data = dataWith({ id: "m1" });
    const result = addMonitorRow(data);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[1]).toMatchObject({ player: "", type: "", notes: "" });
  });
});

describe("removeMonitorRow", () => {
  it("is a no-op for an unknown id (preserves data reference)", () => {
    const data = dataWith({ id: "m1" });
    expect(removeMonitorRow(data, "missing")).toBe(data);
  });
});

describe("updateMonitorRow", () => {
  it("patches only the targeted row's fields", () => {
    const data = dataWith({ id: "m1", player: "Drummer" }, { id: "m2" });
    const result = updateMonitorRow(data, "m1", { type: "IEM" });
    expect(result.rows[0]).toMatchObject({ player: "Drummer", type: "IEM" });
    expect(result.rows[1]!.type).toBe("");
  });

  it("is a no-op for an unknown id", () => {
    const data = dataWith({ id: "m1" });
    expect(updateMonitorRow(data, "missing", { type: "IEM" })).toBe(data);
  });
});

describe("pairMonitorRows / unpairMonitorRow", () => {
  it("pairs and unpairs two rows", () => {
    const data = dataWith({ id: "m1" }, { id: "m2" });
    const paired = pairMonitorRows(data, "m1", "m2");
    expect(paired.rows[0]!.pairedWithId).toBe("m2");
    expect(paired.rows[1]!.pairedWithId).toBe("m1");

    const unpaired = unpairMonitorRow(paired, "m1");
    expect(unpaired.rows[0]!.pairedWithId).toBeUndefined();
    expect(unpaired.rows[1]!.pairedWithId).toBeUndefined();
  });
});
