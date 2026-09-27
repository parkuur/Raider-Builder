import { describe, expect, it } from "vitest";
import {
  resolveColumnLabels,
  setColumnLabel,
} from "../../../src/lib/model/column-labels";

const defaults = { song: "Song", artist: "Artist", notes: "Notes" };

describe("resolveColumnLabels", () => {
  it("returns the defaults when nothing is saved", () => {
    expect(resolveColumnLabels(defaults, {})).toEqual(defaults);
  });

  it("fills in columns missing from a partial saved set", () => {
    expect(
      resolveColumnLabels(defaults, { columnLabels: { song: "Title" } }),
    ).toEqual({ song: "Title", artist: "Artist", notes: "Notes" });
  });

  it("keeps a saved empty label rather than falling back to the default", () => {
    expect(
      resolveColumnLabels(defaults, { columnLabels: { notes: "" } }).notes,
    ).toBe("");
  });
});

describe("setColumnLabel", () => {
  it("stores the full resolved set with the one label changed", () => {
    const data = { rows: [1, 2] };
    const result = setColumnLabel(data, defaults, "artist", "Composer");
    expect(result).toEqual({
      rows: [1, 2],
      columnLabels: { song: "Song", artist: "Composer", notes: "Notes" },
    });
  });

  it("preserves previously saved labels", () => {
    const data = { columnLabels: { song: "Title" } };
    const result = setColumnLabel(data, defaults, "notes", "Key");
    expect(result.columnLabels).toEqual({
      song: "Title",
      artist: "Artist",
      notes: "Key",
    });
  });

  it("doesn't mutate the input", () => {
    const data = { columnLabels: { song: "Title" } };
    setColumnLabel(data, defaults, "song", "Changed");
    expect(data.columnLabels).toEqual({ song: "Title" });
  });
});
