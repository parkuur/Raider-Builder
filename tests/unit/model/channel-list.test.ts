import { describe, expect, it } from "vitest";
import {
  addChannelRow,
  defaultChannelListData,
  pairChannelRows,
  removeChannelRow,
  unpairChannelRow,
  updateChannelRow,
} from "../../../src/lib/model/channel-list";
import type { ChannelListSectionData } from "../../../src/lib/model/channel-list";

function dataWith(
  ...rows: { id: string; name?: string; pairedWithId?: string }[]
): ChannelListSectionData {
  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name ?? "",
      source: "",
      phantom: false,
      notes: "",
      pairedWithId: r.pairedWithId,
    })),
  };
}

describe("defaultChannelListData", () => {
  it("starts with no rows", () => {
    expect(defaultChannelListData()).toEqual({ rows: [] });
  });
});

describe("addChannelRow", () => {
  it("appends a row with the channel fields defaulted", () => {
    const data = dataWith({ id: "c1" });
    const result = addChannelRow(data);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[1]).toMatchObject({
      name: "",
      source: "",
      phantom: false,
      notes: "",
    });
  });
});

describe("removeChannelRow", () => {
  it("is a no-op for an unknown id (preserves data reference)", () => {
    const data = dataWith({ id: "c1" });
    expect(removeChannelRow(data, "missing")).toBe(data);
  });
});

describe("updateChannelRow", () => {
  it("patches only the targeted row's fields", () => {
    const data = dataWith({ id: "c1", name: "Kick" }, { id: "c2" });
    const result = updateChannelRow(data, "c1", {
      phantom: true,
      source: "SM91",
    });
    expect(result.rows[0]).toMatchObject({
      name: "Kick",
      phantom: true,
      source: "SM91",
    });
    expect(result.rows[1]!.phantom).toBe(false);
  });

  it("is a no-op for an unknown id", () => {
    const data = dataWith({ id: "c1" });
    expect(updateChannelRow(data, "missing", { phantom: true })).toBe(data);
  });
});

describe("pairChannelRows / unpairChannelRow", () => {
  it("pairs and unpairs two rows", () => {
    const data = dataWith({ id: "c1" }, { id: "c2" });
    const paired = pairChannelRows(data, "c1", "c2");
    expect(paired.rows[0]!.pairedWithId).toBe("c2");
    expect(paired.rows[1]!.pairedWithId).toBe("c1");

    const unpaired = unpairChannelRow(paired, "c1");
    expect(unpaired.rows[0]!.pairedWithId).toBeUndefined();
    expect(unpaired.rows[1]!.pairedWithId).toBeUndefined();
  });
});
