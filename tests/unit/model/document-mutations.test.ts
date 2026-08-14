import { describe, expect, it } from "vitest";
import {
  addRow,
  duplicateSectionToNewRow,
  moveSectionToNewRow,
  removeSection,
  reorderRows,
  setHeaderField,
  setSectionData,
  setSectionTitle,
  toggleSectionHidden,
} from "../../../src/lib/model/document-mutations";
import { createEmptyDocument } from "../../../src/lib/model/document-types";
import type {
  FullRow,
  RiderDocument,
  Row,
  SplitRow,
} from "../../../src/lib/model/document-types";
import type { Section } from "../../../src/lib/model/section-types";

function makeSection(id: string, note = ""): Section {
  return { id, type: "placeholder", title: id, hidden: false, data: { note } };
}

function makeFullRow(id: string, section: Section): FullRow {
  return { id, kind: "full", section };
}

function makeSplitRow(
  id: string,
  columnA: Section[],
  columnB: Section[],
): SplitRow {
  return { id, kind: "split", columns: [columnA, columnB] };
}

function docWithRows(...rows: Row[]): RiderDocument {
  return { ...createEmptyDocument(), rows };
}

describe("addRow", () => {
  it("inserts a row at index 0 into an empty document", () => {
    const doc = createEmptyDocument();
    const section = makeSection("s1");
    const result = addRow(doc, 0, section);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]!.kind).toBe("full");
    expect((result.rows[0] as FullRow).section).toEqual(section);
  });

  it("appends when the index equals rows.length", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1")));
    const result = addRow(doc, 1, makeSection("s2"));
    expect(result.rows.map((r) => r.id)).toEqual(["r1", result.rows[1]!.id]);
    expect((result.rows[1] as FullRow).section.id).toBe("s2");
  });

  it("inserts in the middle", () => {
    const doc = docWithRows(
      makeFullRow("r1", makeSection("s1")),
      makeFullRow("r3", makeSection("s3")),
    );
    const result = addRow(doc, 1, makeSection("s2"));
    expect(result.rows.map((r) => r.id)[1]).not.toBe("r1");
    expect((result.rows[1] as FullRow).section.id).toBe("s2");
    expect(result.rows.map((r) => (r as FullRow).section.id)).toEqual([
      "s1",
      "s2",
      "s3",
    ]);
  });
});

describe("removeSection", () => {
  it("removes a FullRow entirely", () => {
    const doc = docWithRows(
      makeFullRow("r1", makeSection("s1")),
      makeFullRow("r2", makeSection("s2")),
    );
    const result = removeSection(doc, "r1", "s1");
    expect(result.rows.map((r) => r.id)).toEqual(["r2"]);
  });

  it("removing one item from a two-item column leaves the row and column alive", () => {
    const doc = docWithRows(
      makeSplitRow(
        "r1",
        [makeSection("s1"), makeSection("s2")],
        [makeSection("s3")],
      ),
    );
    const result = removeSection(doc, "r1", "s1");
    expect(result.rows).toHaveLength(1);
    const row = result.rows[0] as SplitRow;
    expect(row.columns[0].map((s) => s.id)).toEqual(["s2"]);
    expect(row.columns[1].map((s) => s.id)).toEqual(["s3"]);
  });

  it("emptying a column collapses the split row into solo rows from the surviving column, in order", () => {
    const doc = docWithRows(
      makeFullRow("before", makeSection("before")),
      makeSplitRow(
        "r1",
        [makeSection("s1")],
        [makeSection("s2"), makeSection("s3")],
      ),
      makeFullRow("after", makeSection("after")),
    );
    const result = removeSection(doc, "r1", "s1");
    expect(result.rows.map((r) => r.id)).toEqual([
      "before",
      result.rows[1]!.id,
      result.rows[2]!.id,
      "after",
    ]);
    expect(result.rows[1]!.kind).toBe("full");
    expect(result.rows[2]!.kind).toBe("full");
    expect((result.rows[1] as FullRow).section.id).toBe("s2");
    expect((result.rows[2] as FullRow).section.id).toBe("s3");
  });

  it("collapsing to a single survivor produces exactly one solo row", () => {
    const doc = docWithRows(
      makeSplitRow("r1", [makeSection("s1")], [makeSection("s2")]),
    );
    const result = removeSection(doc, "r1", "s1");
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]!.kind).toBe("full");
    expect((result.rows[0] as FullRow).section.id).toBe("s2");
  });

  it("is a no-op for an unknown row id", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1")));
    expect(removeSection(doc, "missing", "s1")).toBe(doc);
  });

  it("is a no-op for an unknown section id", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1")));
    expect(removeSection(doc, "r1", "missing")).toBe(doc);
  });
});

describe("duplicateSectionToNewRow", () => {
  it("inserts a deep-equal, different-id copy at the given index, leaving a solo source row untouched", () => {
    const doc = docWithRows(
      makeFullRow("r1", makeSection("s1", "a")),
      makeFullRow("r3", makeSection("s3")),
    );
    const result = duplicateSectionToNewRow(doc, "r1", "s1", 1);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]).toBe(doc.rows[0]);
    const copy = (result.rows[1] as FullRow).section;
    expect(copy.id).not.toBe("s1");
    expect(copy.data).toEqual({ note: "a" });
    expect(result.rows[1]!.kind).toBe("full");
  });

  it("duplicates an embedded column item into a new solo row, leaving the split row untouched", () => {
    const doc = docWithRows(
      makeSplitRow(
        "r1",
        [makeSection("s1", "a"), makeSection("s2", "b")],
        [makeSection("s3")],
      ),
    );
    const result = duplicateSectionToNewRow(doc, "r1", "s2", 1);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toBe(doc.rows[0]);
    const copy = (result.rows[1] as FullRow).section;
    expect(copy.id).not.toBe("s2");
    expect(copy.data).toEqual({ note: "b" });
  });

  it("clamps an out-of-range index instead of erroring", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1")));
    const result = duplicateSectionToNewRow(doc, "r1", "s1", 99);
    expect(result.rows).toHaveLength(2);
  });

  it("is a no-op for unknown ids", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1")));
    expect(duplicateSectionToNewRow(doc, "missing", "s1", 0)).toBe(doc);
    expect(duplicateSectionToNewRow(doc, "r1", "missing", 0)).toBe(doc);
  });
});

describe("moveSectionToNewRow", () => {
  it("moves a solo FullRow's section into a new row at the given index", () => {
    const doc = docWithRows(
      makeFullRow("r1", makeSection("s1")),
      makeFullRow("r3", makeSection("s3")),
    );
    const result = moveSectionToNewRow(doc, "r1", "s1", 2);
    expect(result.rows.map((r) => (r as FullRow).section.id)).toEqual([
      "s3",
      "s1",
    ]);
  });

  it("removes one item from a multi-item column without collapsing, and inserts a new row for it", () => {
    const doc = docWithRows(
      makeSplitRow(
        "r1",
        [makeSection("s1"), makeSection("s2")],
        [makeSection("s3")],
      ),
    );
    const result = moveSectionToNewRow(doc, "r1", "s1", 1);
    expect(result.rows).toHaveLength(2);
    const splitRow = result.rows[0] as SplitRow;
    expect(splitRow.columns[0].map((s) => s.id)).toEqual(["s2"]);
    expect(splitRow.columns[1].map((s) => s.id)).toEqual(["s3"]);
    expect((result.rows[1] as FullRow).section.id).toBe("s1");
  });

  it("collapses the split row when moving its last item out of a column, shifting the insertion point past the collapsed survivors", () => {
    const doc = docWithRows(
      makeSplitRow(
        "r1",
        [makeSection("s1")],
        [makeSection("s2"), makeSection("s3")],
      ),
      makeFullRow("after", makeSection("after")),
    );
    // Insert at index 1 (originally "the gap after r1, before 'after'").
    const result = moveSectionToNewRow(doc, "r1", "s1", 1);
    expect(result.rows.map((r) => (r as FullRow).section.id)).toEqual([
      "s2",
      "s3",
      "s1",
      "after",
    ]);
  });

  it("clamps an out-of-range index instead of erroring", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1")));
    const result = moveSectionToNewRow(doc, "r1", "s1", 99);
    expect(result.rows).toHaveLength(1);
    expect((result.rows[0] as FullRow).section.id).toBe("s1");
  });

  it("is a no-op for unknown ids", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1")));
    expect(moveSectionToNewRow(doc, "missing", "s1", 0)).toBe(doc);
    expect(moveSectionToNewRow(doc, "r1", "missing", 0)).toBe(doc);
  });
});

describe("reorderRows", () => {
  const doc = docWithRows(
    makeFullRow("r1", makeSection("s1")),
    makeFullRow("r2", makeSection("s2")),
    makeFullRow("r3", makeSection("s3")),
  );

  it("moves the first row to last", () => {
    const result = reorderRows(doc, 0, 2);
    expect(result.rows.map((r) => r.id)).toEqual(["r2", "r3", "r1"]);
  });

  it("moves the last row to first", () => {
    const result = reorderRows(doc, 2, 0);
    expect(result.rows.map((r) => r.id)).toEqual(["r3", "r1", "r2"]);
  });

  it("moves a middle row to another middle slot", () => {
    const four = docWithRows(
      makeFullRow("r1", makeSection("s1")),
      makeFullRow("r2", makeSection("s2")),
      makeFullRow("r3", makeSection("s3")),
      makeFullRow("r4", makeSection("s4")),
    );
    const result = reorderRows(four, 1, 2);
    expect(result.rows.map((r) => r.id)).toEqual(["r1", "r3", "r2", "r4"]);
  });

  it("works regardless of the mix of FullRow/SplitRow entries", () => {
    const mixed = docWithRows(
      makeFullRow("r1", makeSection("s1")),
      makeSplitRow("r2", [makeSection("s2")], [makeSection("s3")]),
      makeFullRow("r3", makeSection("s4")),
    );
    const result = reorderRows(mixed, 0, 2);
    expect(result.rows.map((r) => r.id)).toEqual(["r2", "r3", "r1"]);
  });

  it("is a no-op when moving to its own current index", () => {
    expect(reorderRows(doc, 1, 1)).toBe(doc);
  });

  it("is a no-op for an out-of-range fromIndex", () => {
    expect(reorderRows(doc, 5, 0)).toBe(doc);
    expect(reorderRows(doc, -1, 0)).toBe(doc);
  });

  it("clamps an out-of-range toIndex instead of erroring", () => {
    const result = reorderRows(doc, 0, 99);
    expect(result.rows.map((r) => r.id)).toEqual(["r2", "r3", "r1"]);
  });
});

describe("toggleSectionHidden", () => {
  it("flips hidden on only the targeted section in a FullRow", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1")));
    const result = toggleSectionHidden(doc, "r1", "s1");
    expect((result.rows[0] as FullRow).section.hidden).toBe(true);
  });

  it("flips hidden on only the targeted embedded column item", () => {
    const doc = docWithRows(
      makeSplitRow("r1", [makeSection("s1")], [makeSection("s2")]),
    );
    const result = toggleSectionHidden(doc, "r1", "s2");
    const row = result.rows[0] as SplitRow;
    expect(row.columns[0][0]!.hidden).toBe(false);
    expect(row.columns[1][0]!.hidden).toBe(true);
  });

  it("toggling twice returns to the original value", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1")));
    const once = toggleSectionHidden(doc, "r1", "s1");
    const twice = toggleSectionHidden(once, "r1", "s1");
    expect((twice.rows[0] as FullRow).section.hidden).toBe(false);
  });

  it("is a no-op for unknown ids", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1")));
    expect(toggleSectionHidden(doc, "missing", "s1")).toBe(doc);
    expect(toggleSectionHidden(doc, "r1", "missing")).toBe(doc);
  });
});

describe("setSectionTitle", () => {
  it("updates the title of only the targeted section", () => {
    const doc = docWithRows(
      makeSplitRow("r1", [makeSection("s1")], [makeSection("s2")]),
    );
    const result = setSectionTitle(doc, "r1", "s1", "Channel List");
    const row = result.rows[0] as SplitRow;
    expect(row.columns[0][0]!.title).toBe("Channel List");
    expect(row.columns[1][0]!.title).toBe("s2");
  });

  it("is a no-op for unknown ids", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1")));
    expect(setSectionTitle(doc, "missing", "s1", "x")).toBe(doc);
    expect(setSectionTitle(doc, "r1", "missing", "x")).toBe(doc);
  });
});

describe("setSectionData", () => {
  it("replaces the data of the targeted section", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1", "old")));
    const result = setSectionData(doc, "r1", "s1", "placeholder", {
      note: "new",
    });
    expect((result.rows[0] as FullRow).section.data).toEqual({ note: "new" });
  });

  it("leaves other sections in the same column untouched", () => {
    const doc = docWithRows(
      makeSplitRow(
        "r1",
        [makeSection("s1", "a")],
        [makeSection("s2", "b")],
      ),
    );
    const result = setSectionData(doc, "r1", "s1", "placeholder", {
      note: "changed",
    });
    const row = result.rows[0] as SplitRow;
    expect(row.columns[1][0]!.data).toEqual({ note: "b" });
  });

  it("is a no-op for an unknown row id", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1")));
    expect(
      setSectionData(doc, "missing", "s1", "placeholder", { note: "x" }),
    ).toBe(doc);
  });

  it("is a no-op for an unknown section id", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1")));
    expect(
      setSectionData(doc, "r1", "missing", "placeholder", { note: "x" }),
    ).toBe(doc);
  });

  it("is a no-op when the given type doesn't match the section's actual type", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1")));
    expect(
      setSectionData(doc, "r1", "s1", "requirements", { groups: [] }),
    ).toBe(doc);
  });
});

describe("setHeaderField", () => {
  it("updates only the targeted field", () => {
    const doc = createEmptyDocument();
    const result = setHeaderField(doc, "band", "The Test Band");
    expect(result.header.band).toBe("The Test Band");
    expect(result.header.title).toBe(doc.header.title);
    expect(result.header.metaFields).toBe(doc.header.metaFields);
  });
});
