import { describe, expect, it } from "vitest";
import {
  addChannelRow,
  channelListColumnLabels,
  defaultChannelListColumnLabels,
  defaultChannelListData,
  numberChannelRows,
  removeChannelRow,
  setChannelListColumnLabel,
  updateChannelRow,
} from "../../../src/lib/model/channel-list";
import type { ChannelListSectionData } from "../../../src/lib/model/channel-list";

function dataWith(
  ...rows: { id: string; name?: string; stereo?: boolean }[]
): ChannelListSectionData {
  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name ?? "",
      source: "",
      phantom: false,
      stereo: r.stereo ?? false,
      notes: "",
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
      stereo: false,
      notes: "",
    });
  });
});

describe("removeChannelRow", () => {
  it("removes the targeted row", () => {
    const data = dataWith({ id: "c1" }, { id: "c2" });
    const result = removeChannelRow(data, "c1");
    expect(result.rows.map((r) => r.id)).toEqual(["c2"]);
  });

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

  it("can toggle stereo", () => {
    const data = dataWith({ id: "c1" });
    const result = updateChannelRow(data, "c1", { stereo: true });
    expect(result.rows[0]!.stereo).toBe(true);
  });

  it("is a no-op for an unknown id", () => {
    const data = dataWith({ id: "c1" });
    expect(updateChannelRow(data, "missing", { phantom: true })).toBe(data);
  });
});

describe("numberChannelRows", () => {
  it("numbers an all-mono list sequentially", () => {
    const data = dataWith({ id: "a" }, { id: "b" }, { id: "c" });
    expect(numberChannelRows(data)).toEqual([
      { id: "a", label: "1" },
      { id: "b", label: "2" },
      { id: "c", label: "3" },
    ]);
  });

  it("gives a stereo row two consecutive numbers and shifts what follows", () => {
    const data = dataWith({ id: "a" }, { id: "b", stereo: true }, { id: "c" });
    expect(numberChannelRows(data)).toEqual([
      { id: "a", label: "1" },
      { id: "b", label: "2–3" },
      { id: "c", label: "4" },
    ]);
  });

  it("handles a stereo row at the very start of the list", () => {
    const data = dataWith({ id: "a", stereo: true }, { id: "b" });
    expect(numberChannelRows(data)).toEqual([
      { id: "a", label: "1–2" },
      { id: "b", label: "3" },
    ]);
  });

  it("handles a stereo row at the very end of the list", () => {
    const data = dataWith({ id: "a" }, { id: "b", stereo: true });
    expect(numberChannelRows(data)).toEqual([
      { id: "a", label: "1" },
      { id: "b", label: "2–3" },
    ]);
  });

  it("handles consecutive stereo rows without corrupting later numbers", () => {
    const data = dataWith(
      { id: "a", stereo: true },
      { id: "b", stereo: true },
      { id: "c" },
    );
    expect(numberChannelRows(data)).toEqual([
      { id: "a", label: "1–2" },
      { id: "b", label: "3–4" },
      { id: "c", label: "5" },
    ]);
  });

  it("handles an empty list", () => {
    expect(numberChannelRows(defaultChannelListData())).toEqual([]);
  });
});

describe("channelListColumnLabels", () => {
  it("returns the defaults when columnLabels is absent", () => {
    expect(channelListColumnLabels(defaultChannelListData())).toEqual(
      defaultChannelListColumnLabels(),
    );
  });

  it("fills in missing keys from a partial columnLabels", () => {
    const data: ChannelListSectionData = {
      rows: [],
      columnLabels: { ch: "Input" },
    };
    expect(channelListColumnLabels(data)).toEqual({
      ...defaultChannelListColumnLabels(),
      ch: "Input",
    });
  });
});

describe("setChannelListColumnLabel", () => {
  it("sets a single key without touching the others", () => {
    const data = defaultChannelListData();
    const result = setChannelListColumnLabel(data, "notes", "Comments");
    expect(channelListColumnLabels(result)).toEqual({
      ...defaultChannelListColumnLabels(),
      notes: "Comments",
    });
  });

  it("does not mutate the original data", () => {
    const data = defaultChannelListData();
    setChannelListColumnLabel(data, "notes", "Comments");
    expect(data.columnLabels).toBeUndefined();
  });
});
