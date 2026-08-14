import { describe, expect, it } from "vitest";
import {
  addRow,
  createSplitRow,
  duplicateSectionIntoColumn,
  duplicateSectionToNewRow,
  duplicateSectionToSplitRow,
  insertSectionIntoColumn,
  moveSectionIntoColumn,
  moveSectionToNewRow,
  moveSectionToSplitRow,
  removeSection,
  reorderRows,
  reorderSectionWithinColumn,
  setHeaderField,
  setSectionData,
  setSectionTitle,
  swapSections,
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

describe("createSplitRow", () => {
  it("promotes a FullRow into a SplitRow, existing section first", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1")));
    const result = createSplitRow(doc, "r1", makeSection("s2"));
    expect(result.rows).toHaveLength(1);
    const row = result.rows[0] as SplitRow;
    expect(row.kind).toBe("split");
    expect(row.columns[0].map((s) => s.id)).toEqual(["s1"]);
    expect(row.columns[1].map((s) => s.id)).toEqual(["s2"]);
  });

  it("is a no-op for an unknown row id", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1")));
    expect(createSplitRow(doc, "missing", makeSection("s2"))).toBe(doc);
  });

  it("is a no-op when the row is already a split layout", () => {
    const doc = docWithRows(
      makeSplitRow("r1", [makeSection("s1")], [makeSection("s2")]),
    );
    expect(createSplitRow(doc, "r1", makeSection("s3"))).toBe(doc);
  });
});

describe("moveSectionToSplitRow", () => {
  it("moves a solo section onto another FullRow, promoting it to split", () => {
    const doc = docWithRows(
      makeFullRow("r1", makeSection("s1")),
      makeFullRow("r2", makeSection("s2")),
    );
    const result = moveSectionToSplitRow(doc, "r1", "s1", "r2");
    expect(result.rows).toHaveLength(1);
    const row = result.rows[0] as SplitRow;
    expect(row.id).toBe("r2");
    expect(row.columns[0].map((s) => s.id)).toEqual(["s2"]);
    expect(row.columns[1].map((s) => s.id)).toEqual(["s1"]);
  });

  it("moves an embedded column item onto a FullRow without collapsing when the column survives", () => {
    const doc = docWithRows(
      makeSplitRow(
        "r1",
        [makeSection("s1"), makeSection("s2")],
        [makeSection("s3")],
      ),
      makeFullRow("r2", makeSection("s4")),
    );
    const result = moveSectionToSplitRow(doc, "r1", "s1", "r2");
    expect(result.rows).toHaveLength(2);
    const splitSource = result.rows[0] as SplitRow;
    expect(splitSource.columns[0].map((s) => s.id)).toEqual(["s2"]);
    const promoted = result.rows[1] as SplitRow;
    expect(promoted.columns[0].map((s) => s.id)).toEqual(["s4"]);
    expect(promoted.columns[1].map((s) => s.id)).toEqual(["s1"]);
  });

  it("collapses the source split row when moving its column's last item away", () => {
    const doc = docWithRows(
      makeSplitRow("r1", [makeSection("s1")], [makeSection("s2")]),
      makeFullRow("r2", makeSection("s3")),
    );
    const result = moveSectionToSplitRow(doc, "r1", "s1", "r2");
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]!.kind).toBe("full");
    expect((result.rows[0] as FullRow).section.id).toBe("s2");
    const promoted = result.rows[1] as SplitRow;
    expect(promoted.columns[1].map((s) => s.id)).toEqual(["s1"]);
  });

  it("is a no-op when the source and target row are the same", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1")));
    expect(moveSectionToSplitRow(doc, "r1", "s1", "r1")).toBe(doc);
  });

  it("is a no-op when the target row is already a split layout", () => {
    const doc = docWithRows(
      makeFullRow("r1", makeSection("s1")),
      makeSplitRow("r2", [makeSection("s2")], [makeSection("s3")]),
    );
    expect(moveSectionToSplitRow(doc, "r1", "s1", "r2")).toBe(doc);
  });

  it("is a no-op for unknown ids", () => {
    const doc = docWithRows(
      makeFullRow("r1", makeSection("s1")),
      makeFullRow("r2", makeSection("s2")),
    );
    expect(moveSectionToSplitRow(doc, "missing", "s1", "r2")).toBe(doc);
    expect(moveSectionToSplitRow(doc, "r1", "missing", "r2")).toBe(doc);
    expect(moveSectionToSplitRow(doc, "r1", "s1", "missing")).toBe(doc);
  });
});

describe("duplicateSectionToSplitRow", () => {
  it("clones the source into the target's second column, leaving the source untouched", () => {
    const doc = docWithRows(
      makeFullRow("r1", makeSection("s1", "a")),
      makeFullRow("r2", makeSection("s2", "b")),
    );
    const result = duplicateSectionToSplitRow(doc, "r1", "s1", "r2");
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toBe(doc.rows[0]);
    const row = result.rows[1] as SplitRow;
    expect(row.columns[0].map((s) => s.id)).toEqual(["s2"]);
    const copy = row.columns[1][0]!;
    expect(copy.id).not.toBe("s1");
    expect(copy.data).toEqual({ note: "a" });
  });

  it("promotes a solo section by splitting it with a copy of itself", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1", "a")));
    const result = duplicateSectionToSplitRow(doc, "r1", "s1", "r1");
    expect(result.rows).toHaveLength(1);
    const row = result.rows[0] as SplitRow;
    expect(row.columns[0].map((s) => s.id)).toEqual(["s1"]);
    const copy = row.columns[1][0]!;
    expect(copy.id).not.toBe("s1");
    expect(copy.data).toEqual({ note: "a" });
  });

  it("is a no-op when the target row is already a split layout", () => {
    const doc = docWithRows(
      makeFullRow("r1", makeSection("s1")),
      makeSplitRow("r2", [makeSection("s2")], [makeSection("s3")]),
    );
    expect(duplicateSectionToSplitRow(doc, "r1", "s1", "r2")).toBe(doc);
  });

  it("is a no-op for unknown ids", () => {
    const doc = docWithRows(
      makeFullRow("r1", makeSection("s1")),
      makeFullRow("r2", makeSection("s2")),
    );
    expect(duplicateSectionToSplitRow(doc, "missing", "s1", "r2")).toBe(doc);
    expect(duplicateSectionToSplitRow(doc, "r1", "missing", "r2")).toBe(doc);
    expect(duplicateSectionToSplitRow(doc, "r1", "s1", "missing")).toBe(doc);
  });
});

describe("insertSectionIntoColumn", () => {
  it("inserts at the start, middle, and end of a populated column", () => {
    const doc = docWithRows(
      makeSplitRow(
        "r1",
        [makeSection("s1"), makeSection("s3")],
        [makeSection("s9")],
      ),
    );
    const start = insertSectionIntoColumn(doc, "r1", 0, 0, makeSection("s0"));
    expect(
      (start.rows[0] as SplitRow).columns[0].map((s) => s.id),
    ).toEqual(["s0", "s1", "s3"]);

    const middle = insertSectionIntoColumn(doc, "r1", 0, 1, makeSection("s2"));
    expect(
      (middle.rows[0] as SplitRow).columns[0].map((s) => s.id),
    ).toEqual(["s1", "s2", "s3"]);

    const end = insertSectionIntoColumn(doc, "r1", 0, 2, makeSection("s4"));
    expect((end.rows[0] as SplitRow).columns[0].map((s) => s.id)).toEqual([
      "s1",
      "s3",
      "s4",
    ]);
  });

  it("inserts into the other column independently", () => {
    const doc = docWithRows(
      makeSplitRow("r1", [makeSection("s1")], [makeSection("s2")]),
    );
    const result = insertSectionIntoColumn(doc, "r1", 1, 1, makeSection("s3"));
    const row = result.rows[0] as SplitRow;
    expect(row.columns[0].map((s) => s.id)).toEqual(["s1"]);
    expect(row.columns[1].map((s) => s.id)).toEqual(["s2", "s3"]);
  });

  it("is a no-op when the row isn't a split layout", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1")));
    expect(insertSectionIntoColumn(doc, "r1", 0, 0, makeSection("s2"))).toBe(
      doc,
    );
  });

  it("is a no-op for an unknown row id", () => {
    const doc = docWithRows(
      makeSplitRow("r1", [makeSection("s1")], [makeSection("s2")]),
    );
    expect(
      insertSectionIntoColumn(doc, "missing", 0, 0, makeSection("s3")),
    ).toBe(doc);
  });
});

describe("moveSectionIntoColumn", () => {
  it("moves a solo section into an existing split row's column at an index", () => {
    const doc = docWithRows(
      makeFullRow("r1", makeSection("s1")),
      makeSplitRow("r2", [makeSection("s2")], [makeSection("s3")]),
    );
    const result = moveSectionIntoColumn(doc, "r1", "s1", "r2", 0, 0);
    expect(result.rows).toHaveLength(1);
    const row = result.rows[0] as SplitRow;
    expect(row.columns[0].map((s) => s.id)).toEqual(["s1", "s2"]);
  });

  it("moves an embedded item across rows without collapsing when its column survives", () => {
    const doc = docWithRows(
      makeSplitRow(
        "r1",
        [makeSection("s1"), makeSection("s2")],
        [makeSection("s3")],
      ),
      makeSplitRow("r2", [makeSection("s4")], [makeSection("s5")]),
    );
    const result = moveSectionIntoColumn(doc, "r1", "s1", "r2", 1, 1);
    const source = result.rows[0] as SplitRow;
    expect(source.columns[0].map((s) => s.id)).toEqual(["s2"]);
    const target = result.rows[1] as SplitRow;
    expect(target.columns[1].map((s) => s.id)).toEqual(["s5", "s1"]);
  });

  it("collapses the source row when moving its column's last item away", () => {
    const doc = docWithRows(
      makeSplitRow("r1", [makeSection("s1")], [makeSection("s2")]),
      makeSplitRow("r2", [makeSection("s3")], [makeSection("s4")]),
    );
    const result = moveSectionIntoColumn(doc, "r1", "s1", "r2", 0, 0);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]!.kind).toBe("full");
    expect((result.rows[0] as FullRow).section.id).toBe("s2");
    const target = result.rows[1] as SplitRow;
    expect(target.columns[0].map((s) => s.id)).toEqual(["s1", "s3"]);
  });

  it("moves between the two columns of the same row", () => {
    const doc = docWithRows(
      makeSplitRow(
        "r1",
        [makeSection("s1"), makeSection("s2")],
        [makeSection("s3")],
      ),
    );
    const result = moveSectionIntoColumn(doc, "r1", "s1", "r1", 1, 0);
    const row = result.rows[0] as SplitRow;
    expect(row.columns[0].map((s) => s.id)).toEqual(["s2"]);
    expect(row.columns[1].map((s) => s.id)).toEqual(["s1", "s3"]);
  });

  it("collapses when moving between columns of the same row empties the source side", () => {
    const doc = docWithRows(
      makeSplitRow("r1", [makeSection("s1")], [makeSection("s2")]),
    );
    const result = moveSectionIntoColumn(doc, "r1", "s1", "r1", 1, 0);
    expect(result.rows).toHaveLength(2);
    expect(result.rows.map((r) => (r as FullRow).section.id)).toEqual([
      "s1",
      "s2",
    ]);
  });

  it("is a no-op for a same-row, same-column move (that's reorderSectionWithinColumn's job)", () => {
    const doc = docWithRows(
      makeSplitRow(
        "r1",
        [makeSection("s1"), makeSection("s2")],
        [makeSection("s3")],
      ),
    );
    expect(moveSectionIntoColumn(doc, "r1", "s1", "r1", 0, 1)).toBe(doc);
  });

  it("is a no-op when the target row isn't a split layout", () => {
    const doc = docWithRows(
      makeFullRow("r1", makeSection("s1")),
      makeFullRow("r2", makeSection("s2")),
    );
    expect(moveSectionIntoColumn(doc, "r1", "s1", "r2", 0, 0)).toBe(doc);
  });

  it("is a no-op for unknown ids", () => {
    const doc = docWithRows(
      makeFullRow("r1", makeSection("s1")),
      makeSplitRow("r2", [makeSection("s2")], [makeSection("s3")]),
    );
    expect(moveSectionIntoColumn(doc, "missing", "s1", "r2", 0, 0)).toBe(doc);
    expect(moveSectionIntoColumn(doc, "r1", "missing", "r2", 0, 0)).toBe(doc);
    expect(moveSectionIntoColumn(doc, "r1", "s1", "missing", 0, 0)).toBe(doc);
  });
});

describe("duplicateSectionIntoColumn", () => {
  it("clones the source into the target column at an index, leaving the source untouched", () => {
    const doc = docWithRows(
      makeFullRow("r1", makeSection("s1", "a")),
      makeSplitRow("r2", [makeSection("s2")], [makeSection("s3")]),
    );
    const result = duplicateSectionIntoColumn(doc, "r1", "s1", "r2", 0, 1);
    expect(result.rows[0]).toBe(doc.rows[0]);
    const row = result.rows[1] as SplitRow;
    expect(row.columns[0].map((s) => s.id)[0]).toBe("s2");
    const copy = row.columns[0][1]!;
    expect(copy.id).not.toBe("s1");
    expect(copy.data).toEqual({ note: "a" });
  });

  it("duplicates a column item into its own column right next to itself", () => {
    const doc = docWithRows(
      makeSplitRow("r1", [makeSection("s1", "a")], [makeSection("s2")]),
    );
    const result = duplicateSectionIntoColumn(doc, "r1", "s1", "r1", 0, 1);
    const row = result.rows[0] as SplitRow;
    expect(row.columns[0].map((s) => s.id)[0]).toBe("s1");
    const copy = row.columns[0][1]!;
    expect(copy.id).not.toBe("s1");
    expect(copy.data).toEqual({ note: "a" });
  });

  it("is a no-op when the target row isn't a split layout", () => {
    const doc = docWithRows(
      makeFullRow("r1", makeSection("s1")),
      makeFullRow("r2", makeSection("s2")),
    );
    expect(duplicateSectionIntoColumn(doc, "r1", "s1", "r2", 0, 0)).toBe(doc);
  });

  it("is a no-op for unknown ids", () => {
    const doc = docWithRows(
      makeFullRow("r1", makeSection("s1")),
      makeSplitRow("r2", [makeSection("s2")], [makeSection("s3")]),
    );
    expect(
      duplicateSectionIntoColumn(doc, "missing", "s1", "r2", 0, 0),
    ).toBe(doc);
    expect(
      duplicateSectionIntoColumn(doc, "r1", "missing", "r2", 0, 0),
    ).toBe(doc);
    expect(
      duplicateSectionIntoColumn(doc, "r1", "s1", "missing", 0, 0),
    ).toBe(doc);
  });
});

describe("reorderSectionWithinColumn", () => {
  const doc = docWithRows(
    makeSplitRow(
      "r1",
      [makeSection("s1"), makeSection("s2"), makeSection("s3")],
      [makeSection("s9")],
    ),
  );

  it("moves the first item to last", () => {
    const result = reorderSectionWithinColumn(doc, "r1", 0, 0, 2);
    expect(
      (result.rows[0] as SplitRow).columns[0].map((s) => s.id),
    ).toEqual(["s2", "s3", "s1"]);
  });

  it("moves the last item to first", () => {
    const result = reorderSectionWithinColumn(doc, "r1", 0, 2, 0);
    expect(
      (result.rows[0] as SplitRow).columns[0].map((s) => s.id),
    ).toEqual(["s3", "s1", "s2"]);
  });

  it("is a no-op when moving to its own current index", () => {
    expect(reorderSectionWithinColumn(doc, "r1", 0, 1, 1)).toBe(doc);
  });

  it("is a no-op for an out-of-range fromIndex", () => {
    expect(reorderSectionWithinColumn(doc, "r1", 0, 9, 0)).toBe(doc);
    expect(reorderSectionWithinColumn(doc, "r1", 0, -1, 0)).toBe(doc);
  });

  it("clamps an out-of-range toIndex instead of erroring", () => {
    const result = reorderSectionWithinColumn(doc, "r1", 0, 0, 99);
    expect(
      (result.rows[0] as SplitRow).columns[0].map((s) => s.id),
    ).toEqual(["s2", "s3", "s1"]);
  });

  it("is a no-op when the row isn't a split layout", () => {
    const full = docWithRows(makeFullRow("r1", makeSection("s1")));
    expect(reorderSectionWithinColumn(full, "r1", 0, 0, 0)).toBe(full);
  });
});

describe("swapSections", () => {
  it("swaps two items within the same column", () => {
    const doc = docWithRows(
      makeSplitRow(
        "r1",
        [makeSection("s1"), makeSection("s2")],
        [makeSection("s9")],
      ),
    );
    const result = swapSections(doc, "r1", "s1", "r1", "s2");
    const row = result.rows[0] as SplitRow;
    expect(row.columns[0].map((s) => s.id)).toEqual(["s2", "s1"]);
    expect(row.columns[1].map((s) => s.id)).toEqual(["s9"]);
  });

  it("swaps two items across columns of the same row", () => {
    const doc = docWithRows(
      makeSplitRow("r1", [makeSection("s1")], [makeSection("s2")]),
    );
    const result = swapSections(doc, "r1", "s1", "r1", "s2");
    const row = result.rows[0] as SplitRow;
    expect(row.columns[0].map((s) => s.id)).toEqual(["s2"]);
    expect(row.columns[1].map((s) => s.id)).toEqual(["s1"]);
  });

  it("swaps two embedded items across different rows", () => {
    const doc = docWithRows(
      makeSplitRow("r1", [makeSection("s1")], [makeSection("s2")]),
      makeSplitRow("r2", [makeSection("s3")], [makeSection("s4")]),
    );
    const result = swapSections(doc, "r1", "s1", "r2", "s4");
    const row1 = result.rows[0] as SplitRow;
    const row2 = result.rows[1] as SplitRow;
    expect(row1.columns[0].map((s) => s.id)).toEqual(["s4"]);
    expect(row1.columns[1].map((s) => s.id)).toEqual(["s2"]);
    expect(row2.columns[0].map((s) => s.id)).toEqual(["s3"]);
    expect(row2.columns[1].map((s) => s.id)).toEqual(["s1"]);
  });

  it("swaps a solo FullRow's section with an embedded column item", () => {
    const doc = docWithRows(
      makeFullRow("r1", makeSection("s1")),
      makeSplitRow("r2", [makeSection("s2")], [makeSection("s3")]),
    );
    const result = swapSections(doc, "r1", "s1", "r2", "s2");
    expect((result.rows[0] as FullRow).section.id).toBe("s2");
    const row2 = result.rows[1] as SplitRow;
    expect(row2.columns[0].map((s) => s.id)).toEqual(["s1"]);
    expect(row2.columns[1].map((s) => s.id)).toEqual(["s3"]);
  });

  it("swaps two solo FullRows", () => {
    const doc = docWithRows(
      makeFullRow("r1", makeSection("s1")),
      makeFullRow("r2", makeSection("s2")),
    );
    const result = swapSections(doc, "r1", "s1", "r2", "s2");
    expect((result.rows[0] as FullRow).section.id).toBe("s2");
    expect((result.rows[1] as FullRow).section.id).toBe("s1");
  });

  it("is a no-op for a self-swap", () => {
    const doc = docWithRows(makeFullRow("r1", makeSection("s1")));
    expect(swapSections(doc, "r1", "s1", "r1", "s1")).toBe(doc);
  });

  it("is a no-op for unresolvable locators", () => {
    const doc = docWithRows(
      makeFullRow("r1", makeSection("s1")),
      makeFullRow("r2", makeSection("s2")),
    );
    expect(swapSections(doc, "missing", "s1", "r2", "s2")).toBe(doc);
    expect(swapSections(doc, "r1", "missing", "r2", "s2")).toBe(doc);
    expect(swapSections(doc, "r1", "s1", "r2", "missing")).toBe(doc);
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
