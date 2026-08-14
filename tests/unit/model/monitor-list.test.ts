import { describe, expect, it } from "vitest";
import {
  addMonitorRow,
  defaultMonitorListColumnLabels,
  defaultMonitorListData,
  monitorListColumnLabels,
  numberMonitorRows,
  removeMonitorRow,
  setMonitorListColumnLabel,
  updateMonitorRow,
} from "../../../src/lib/model/monitor-list";
import type { MonitorListSectionData } from "../../../src/lib/model/monitor-list";

function dataWith(
  ...rows: { id: string; player?: string; stereo?: boolean }[]
): MonitorListSectionData {
  return {
    rows: rows.map((r) => ({
      id: r.id,
      player: r.player ?? "",
      type: "",
      notes: "",
      stereo: r.stereo ?? false,
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
    expect(result.rows[1]).toMatchObject({
      player: "",
      type: "",
      notes: "",
      stereo: false,
    });
  });
});

describe("removeMonitorRow", () => {
  it("removes the targeted row", () => {
    const data = dataWith({ id: "m1" }, { id: "m2" });
    expect(removeMonitorRow(data, "m1").rows.map((r) => r.id)).toEqual(["m2"]);
  });

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

  it("toggles stereo on the targeted row", () => {
    const data = dataWith({ id: "m1" });
    const result = updateMonitorRow(data, "m1", { stereo: true });
    expect(result.rows[0]!.stereo).toBe(true);
  });

  it("is a no-op for an unknown id", () => {
    const data = dataWith({ id: "m1" });
    expect(updateMonitorRow(data, "missing", { type: "IEM" })).toBe(data);
  });
});

describe("numberMonitorRows", () => {
  it("numbers rows sequentially regardless of stereo/mono", () => {
    const data = dataWith(
      { id: "m1" },
      { id: "m2", stereo: true },
      { id: "m3" },
    );
    expect(numberMonitorRows(data)).toEqual([
      { id: "m1", label: "1" },
      { id: "m2", label: "2" },
      { id: "m3", label: "3" },
    ]);
  });

  it("never combines a stereo row's number with its neighbor's", () => {
    const data = dataWith({ id: "m1", stereo: true }, { id: "m2" });
    expect(numberMonitorRows(data)).toEqual([
      { id: "m1", label: "1" },
      { id: "m2", label: "2" },
    ]);
  });
});

describe("monitorListColumnLabels", () => {
  it("returns the defaults when columnLabels is absent", () => {
    expect(monitorListColumnLabels(defaultMonitorListData())).toEqual(
      defaultMonitorListColumnLabels(),
    );
  });

  it("fills in missing keys from a partial columnLabels", () => {
    const data: MonitorListSectionData = {
      rows: [],
      columnLabels: { mon: "Wedge" },
    };
    expect(monitorListColumnLabels(data)).toEqual({
      ...defaultMonitorListColumnLabels(),
      mon: "Wedge",
    });
  });
});

describe("setMonitorListColumnLabel", () => {
  it("sets a single key without touching the others", () => {
    const data = defaultMonitorListData();
    const result = setMonitorListColumnLabel(data, "notes", "Comments");
    expect(monitorListColumnLabels(result)).toEqual({
      ...defaultMonitorListColumnLabels(),
      notes: "Comments",
    });
  });

  it("does not mutate the original data", () => {
    const data = defaultMonitorListData();
    setMonitorListColumnLabel(data, "notes", "Comments");
    expect(data.columnLabels).toBeUndefined();
  });
});
