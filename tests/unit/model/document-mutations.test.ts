import { describe, expect, it } from "vitest";
import {
  addRow,
  duplicateSection,
  pairSections,
  removeSection,
  reorderRows,
  setHeaderField,
  setSectionData,
  setSectionTitle,
  toggleSectionHidden,
  unpairSection,
} from "../../../src/lib/model/document-mutations";
import { createEmptyDocument } from "../../../src/lib/model/document-types";
import type { RiderDocument, Row } from "../../../src/lib/model/document-types";
import type { Section } from "../../../src/lib/model/section-types";

function makeSection(id: string, note = ""): Section {
  return { id, type: "placeholder", title: id, hidden: false, data: { note } };
}

function makeRow(id: string, ...sections: Section[]): Row {
  return { id, sections: sections as [Section] | [Section, Section] };
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
    expect(result.rows[0]!.sections).toEqual([section]);
  });

  it("appends when the index equals rows.length", () => {
    const doc = docWithRows(makeRow("r1", makeSection("s1")));
    const result = addRow(doc, 1, makeSection("s2"));
    expect(result.rows.map((r) => r.id)).toEqual(["r1", result.rows[1]!.id]);
    expect(result.rows[1]!.sections[0]!.id).toBe("s2");
  });

  it("inserts in the middle", () => {
    const doc = docWithRows(
      makeRow("r1", makeSection("s1")),
      makeRow("r3", makeSection("s3")),
    );
    const result = addRow(doc, 1, makeSection("s2"));
    expect(result.rows.map((r) => r.id)[1]).not.toBe("r1");
    expect(result.rows[1]!.sections[0]!.id).toBe("s2");
    expect(result.rows.map((r) => r.sections[0]!.id)).toEqual([
      "s1",
      "s2",
      "s3",
    ]);
  });
});

describe("removeSection", () => {
  it("removes the row when it was the only section in it", () => {
    const doc = docWithRows(
      makeRow("r1", makeSection("s1")),
      makeRow("r2", makeSection("s2")),
    );
    const result = removeSection(doc, "r1", "s1");
    expect(result.rows.map((r) => r.id)).toEqual(["r2"]);
  });

  it("removing one side of a pair leaves the row with the remaining section", () => {
    const doc = docWithRows(
      makeRow("r1", makeSection("s1"), makeSection("s2")),
    );
    const result = removeSection(doc, "r1", "s1");
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]!.sections).toEqual([makeSection("s2")]);
  });

  it("is a no-op for an unknown row id", () => {
    const doc = docWithRows(makeRow("r1", makeSection("s1")));
    expect(removeSection(doc, "missing", "s1")).toBe(doc);
  });

  it("is a no-op for an unknown section id", () => {
    const doc = docWithRows(makeRow("r1", makeSection("s1")));
    expect(removeSection(doc, "r1", "missing")).toBe(doc);
  });
});

describe("duplicateSection", () => {
  it("creates a new row immediately after with a deep-equal, different-id copy", () => {
    const doc = docWithRows(makeRow("r1", makeSection("s1", "hello")));
    const result = duplicateSection(doc, "r1", "s1");
    expect(result.rows).toHaveLength(2);
    const copy = result.rows[1]!.sections[0]!;
    expect(copy.id).not.toBe("s1");
    expect(copy.data).toEqual({ note: "hello" });
  });

  it("leaves the original row and section untouched (reference-equal)", () => {
    const doc = docWithRows(makeRow("r1", makeSection("s1")));
    const result = duplicateSection(doc, "r1", "s1");
    expect(result.rows[0]).toBe(doc.rows[0]);
  });

  it("produces a deep clone, not a shared reference", () => {
    const doc = docWithRows(makeRow("r1", makeSection("s1", "hello")));
    const result = duplicateSection(doc, "r1", "s1");
    const copy = result.rows[1]!.sections[0]! as Section & {
      type: "placeholder";
    };
    copy.data.note = "changed";
    expect((doc.rows[0]!.sections[0] as typeof copy).data.note).toBe("hello");
  });

  it("duplicating one section of a paired row creates a standalone new row", () => {
    const doc = docWithRows(
      makeRow("r1", makeSection("s1"), makeSection("s2")),
    );
    const result = duplicateSection(doc, "r1", "s1");
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]!.sections).toHaveLength(2);
    expect(result.rows[1]!.sections).toHaveLength(1);
  });

  it("is a no-op for unknown ids", () => {
    const doc = docWithRows(makeRow("r1", makeSection("s1")));
    expect(duplicateSection(doc, "missing", "s1")).toBe(doc);
    expect(duplicateSection(doc, "r1", "missing")).toBe(doc);
  });
});

describe("reorderRows", () => {
  const doc = docWithRows(
    makeRow("r1", makeSection("s1")),
    makeRow("r2", makeSection("s2")),
    makeRow("r3", makeSection("s3")),
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
      makeRow("r1", makeSection("s1")),
      makeRow("r2", makeSection("s2")),
      makeRow("r3", makeSection("s3")),
      makeRow("r4", makeSection("s4")),
    );
    const result = reorderRows(four, 1, 2);
    expect(result.rows.map((r) => r.id)).toEqual(["r1", "r3", "r2", "r4"]);
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

describe("pairSections", () => {
  it("pairs a section onto a lone-section row, in append order", () => {
    const doc = docWithRows(makeRow("r1", makeSection("s1")));
    const result = pairSections(doc, "r1", makeSection("s2"));
    expect(result.rows[0]!.sections.map((s) => s.id)).toEqual(["s1", "s2"]);
  });

  it("is a no-op when the row is already paired", () => {
    const doc = docWithRows(
      makeRow("r1", makeSection("s1"), makeSection("s2")),
    );
    expect(pairSections(doc, "r1", makeSection("s3"))).toBe(doc);
  });

  it("is a no-op for an unknown row id", () => {
    const doc = docWithRows(makeRow("r1", makeSection("s1")));
    expect(pairSections(doc, "missing", makeSection("s2"))).toBe(doc);
  });
});

describe("unpairSection", () => {
  it("splits a paired row, preserving content on both sides", () => {
    const doc = docWithRows(
      makeRow("r1", makeSection("s1", "a"), makeSection("s2", "b")),
    );
    const result = unpairSection(doc, "r1", "s2");
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]!.sections).toEqual([makeSection("s1", "a")]);
    expect(result.rows[1]!.sections).toEqual([makeSection("s2", "b")]);
  });

  it("inserts the split-off row directly after the original", () => {
    const doc = docWithRows(
      makeRow("r1", makeSection("s1"), makeSection("s2")),
      makeRow("r3", makeSection("s3")),
    );
    const result = unpairSection(doc, "r1", "s2");
    expect(result.rows.map((r) => r.sections[0]!.id)).toEqual([
      "s1",
      "s2",
      "s3",
    ]);
  });

  it("is a no-op on a row that isn't paired", () => {
    const doc = docWithRows(makeRow("r1", makeSection("s1")));
    expect(unpairSection(doc, "r1", "s1")).toBe(doc);
  });

  it("is a no-op for unknown ids", () => {
    const doc = docWithRows(
      makeRow("r1", makeSection("s1"), makeSection("s2")),
    );
    expect(unpairSection(doc, "missing", "s1")).toBe(doc);
    expect(unpairSection(doc, "r1", "missing")).toBe(doc);
  });
});

describe("toggleSectionHidden", () => {
  it("flips hidden on only the targeted section", () => {
    const doc = docWithRows(
      makeRow("r1", makeSection("s1"), makeSection("s2")),
    );
    const result = toggleSectionHidden(doc, "r1", "s1");
    expect(result.rows[0]!.sections[0]!.hidden).toBe(true);
    expect(result.rows[0]!.sections[1]!.hidden).toBe(false);
  });

  it("toggling twice returns to the original value", () => {
    const doc = docWithRows(makeRow("r1", makeSection("s1")));
    const once = toggleSectionHidden(doc, "r1", "s1");
    const twice = toggleSectionHidden(once, "r1", "s1");
    expect(twice.rows[0]!.sections[0]!.hidden).toBe(false);
  });

  it("is a no-op for unknown ids", () => {
    const doc = docWithRows(makeRow("r1", makeSection("s1")));
    expect(toggleSectionHidden(doc, "missing", "s1")).toBe(doc);
    expect(toggleSectionHidden(doc, "r1", "missing")).toBe(doc);
  });
});

describe("setSectionTitle", () => {
  it("updates the title of only the targeted section", () => {
    const doc = docWithRows(
      makeRow("r1", makeSection("s1"), makeSection("s2")),
    );
    const result = setSectionTitle(doc, "r1", "s1", "Channel List");
    expect(result.rows[0]!.sections[0]!.title).toBe("Channel List");
    expect(result.rows[0]!.sections[1]!.title).toBe("s2");
  });

  it("is a no-op for unknown ids", () => {
    const doc = docWithRows(makeRow("r1", makeSection("s1")));
    expect(setSectionTitle(doc, "missing", "s1", "x")).toBe(doc);
    expect(setSectionTitle(doc, "r1", "missing", "x")).toBe(doc);
  });
});

describe("setSectionData", () => {
  it("replaces the data of the targeted section", () => {
    const doc = docWithRows(makeRow("r1", makeSection("s1", "old")));
    const result = setSectionData(doc, "r1", "s1", "placeholder", {
      note: "new",
    });
    expect(result.rows[0]!.sections[0]!.data).toEqual({ note: "new" });
  });

  it("leaves other sections in the same row untouched", () => {
    const doc = docWithRows(
      makeRow("r1", makeSection("s1", "a"), makeSection("s2", "b")),
    );
    const result = setSectionData(doc, "r1", "s1", "placeholder", {
      note: "changed",
    });
    expect(result.rows[0]!.sections[1]!.data).toEqual({ note: "b" });
  });

  it("is a no-op for an unknown row id", () => {
    const doc = docWithRows(makeRow("r1", makeSection("s1")));
    expect(
      setSectionData(doc, "missing", "s1", "placeholder", { note: "x" }),
    ).toBe(doc);
  });

  it("is a no-op for an unknown section id", () => {
    const doc = docWithRows(makeRow("r1", makeSection("s1")));
    expect(
      setSectionData(doc, "r1", "missing", "placeholder", { note: "x" }),
    ).toBe(doc);
  });

  it("is a no-op when the given type doesn't match the section's actual type", () => {
    const doc = docWithRows(makeRow("r1", makeSection("s1")));
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
    expect(result.header.revision).toBe(doc.header.revision);
    expect(result.header.date).toBe(doc.header.date);
  });
});
