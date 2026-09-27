import { describe, expect, it } from "vitest";
import {
  addSetlistRow,
  defaultSetlistColumnLabels,
  defaultSetlistData,
  numberSetlistRows,
  removeSetlistRow,
  reorderSetlistRows,
  setSetlistColumnLabel,
  setlistColumnLabels,
  updateSetlistRow,
} from "../../../src/lib/model/setlist";
import type { SetlistSectionData } from "../../../src/lib/model/setlist";

function dataWith(...ids: string[]): SetlistSectionData {
  return {
    rows: ids.map((id) => ({ id, song: id, artist: "", notes: "" })),
  };
}

describe("defaultSetlistData", () => {
  it("starts empty", () => {
    expect(defaultSetlistData()).toEqual({ rows: [] });
  });
});

describe("addSetlistRow", () => {
  it("appends an empty song by default", () => {
    const result = addSetlistRow(dataWith("a"));
    expect(result.rows).toHaveLength(2);
    expect(result.rows[1]).toMatchObject({ song: "", artist: "", notes: "" });
  });

  it("inserts at a given index", () => {
    const result = addSetlistRow(dataWith("a", "b"), 0);
    expect(result.rows[1]!.id).toBe("a");
  });
});

describe("removeSetlistRow", () => {
  it("removes the targeted song", () => {
    expect(
      removeSetlistRow(dataWith("a", "b"), "a").rows.map((r) => r.id),
    ).toEqual(["b"]);
  });

  it("is a no-op for an unknown id", () => {
    const data = dataWith("a");
    expect(removeSetlistRow(data, "missing")).toBe(data);
  });
});

describe("updateSetlistRow", () => {
  it("patches the targeted song", () => {
    const result = updateSetlistRow(dataWith("a", "b"), "b", {
      artist: "Cover",
    });
    expect(result.rows[1]).toEqual({
      id: "b",
      song: "b",
      artist: "Cover",
      notes: "",
    });
  });

  it("is a no-op for an unknown id", () => {
    const data = dataWith("a");
    expect(updateSetlistRow(data, "missing", { song: "x" })).toBe(data);
  });
});

describe("reorderSetlistRows", () => {
  it("moves a song", () => {
    expect(
      reorderSetlistRows(dataWith("a", "b", "c"), 2, 0).rows.map((r) => r.id),
    ).toEqual(["c", "a", "b"]);
  });

  it("is a no-op for an out-of-range index", () => {
    const data = dataWith("a");
    expect(reorderSetlistRows(data, 3, 0)).toBe(data);
  });
});

describe("numberSetlistRows", () => {
  it("numbers songs 1..n in running order", () => {
    expect(numberSetlistRows(dataWith("a", "b", "c"))).toEqual([
      { id: "a", label: "1" },
      { id: "b", label: "2" },
      { id: "c", label: "3" },
    ]);
  });

  it("follows the new order after a reorder and a removal", () => {
    const reordered = reorderSetlistRows(dataWith("a", "b", "c"), 0, 2);
    const removed = removeSetlistRow(reordered, "b");
    expect(numberSetlistRows(removed)).toEqual([
      { id: "c", label: "1" },
      { id: "a", label: "2" },
    ]);
  });
});

describe("setlist column labels", () => {
  it("defaults to # / Song / Artist / Notes", () => {
    expect(setlistColumnLabels(defaultSetlistData())).toEqual(
      defaultSetlistColumnLabels(),
    );
    expect(defaultSetlistColumnLabels()).toEqual({
      num: "#",
      song: "Song",
      artist: "Artist",
      notes: "Notes",
    });
  });

  it("stores an edited label", () => {
    const result = setSetlistColumnLabel(defaultSetlistData(), "notes", "Key");
    expect(setlistColumnLabels(result).notes).toBe("Key");
    expect(setlistColumnLabels(result).song).toBe("Song");
  });
});
