import { describe, expect, it } from "vitest";
import {
  deriveFileName,
  parseDocumentJson,
  serializeDocument,
  validateDocumentShape,
} from "../../../src/lib/model/persistence";
import { createEmptyHeader } from "../../../src/lib/model/document-types";
import type { RiderDocument } from "../../../src/lib/model/document-types";
import type { Section } from "../../../src/lib/model/section-types";

const KNOWN_TYPES = ["placeholder"];

function makeSection(id: string, note = ""): Section {
  return { id, type: "placeholder", title: id, hidden: false, data: { note } };
}

describe("deriveFileName", () => {
  it("uses the band name when present", () => {
    const header = {
      ...createEmptyHeader(),
      band: "The Test Band",
      title: "Ignored",
    };
    expect(deriveFileName(header)).toBe("the-test-band.json");
  });

  it("falls back to the title when band is empty", () => {
    const header = {
      ...createEmptyHeader(),
      band: "",
      title: "Fallback Title",
    };
    expect(deriveFileName(header)).toBe("fallback-title.json");
  });

  it("falls back to technical-rider when both are empty", () => {
    const header = { ...createEmptyHeader(), band: "", title: "" };
    expect(deriveFileName(header)).toBe("technical-rider.json");
  });

  it("hyphenates multi-space, mixed-case names", () => {
    const header = {
      ...createEmptyHeader(),
      band: "  The   TEST Band  ",
      title: "",
    };
    expect(deriveFileName(header)).toBe("the-test-band.json");
  });
});

describe("serializeDocument / parseDocumentJson round-trip", () => {
  it("preserves a document with a full row and a split row exactly", () => {
    const doc: RiderDocument = {
      header: {
        title: "Rider",
        band: "Band",
        metaFields: [
          { id: "meta_1", kind: "keyvalue", label: "Rev", value: "2.0" },
          { id: "meta_2", kind: "date", label: "Date", value: "2026-01-01" },
          { id: "meta_3", kind: "text", value: "Free text" },
        ],
        logos: [{ id: "logo_1", dataUrl: "data:image/png;base64,abc" }],
        creditHidden: true,
      },
      rows: [
        { id: "r1", kind: "full", section: makeSection("s0", "solo") },
        {
          id: "r2",
          kind: "split",
          columns: [[makeSection("s1", "a")], [makeSection("s2", "b")]],
        },
      ],
    };
    const result = parseDocumentJson(serializeDocument(doc), KNOWN_TYPES);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document).toEqual(doc);
    }
  });

  it("preserves a split row with 3+ items stacked in one column", () => {
    const doc: RiderDocument = {
      header: createEmptyHeader(),
      rows: [
        {
          id: "r1",
          kind: "split",
          columns: [
            [makeSection("s1"), makeSection("s2"), makeSection("s3")],
            [makeSection("s4")],
          ],
        },
      ],
    };
    const result = parseDocumentJson(serializeDocument(doc), KNOWN_TYPES);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document).toEqual(doc);
    }
  });
});

describe("parseDocumentJson rejection cases", () => {
  it("rejects text that isn't valid JSON", () => {
    const result = parseDocumentJson("not json at all", KNOWN_TYPES);
    expect(result.ok).toBe(false);
  });
});

describe("validateDocumentShape rejection cases", () => {
  it("rejects a non-object value", () => {
    expect(validateDocumentShape([1, 2, 3], KNOWN_TYPES).ok).toBe(false);
    expect(validateDocumentShape("a string", KNOWN_TYPES).ok).toBe(false);
    expect(validateDocumentShape(42, KNOWN_TYPES).ok).toBe(false);
    expect(validateDocumentShape(null, KNOWN_TYPES).ok).toBe(false);
  });

  it("rejects a missing or non-array rows field", () => {
    expect(validateDocumentShape({ header: {} }, KNOWN_TYPES).ok).toBe(false);
    expect(
      validateDocumentShape({ header: {}, rows: "nope" }, KNOWN_TYPES).ok,
    ).toBe(false);
  });

  it("rejects a row with an unknown or missing kind", () => {
    expect(
      validateDocumentShape({ header: {}, rows: [{ id: "r1" }] }, KNOWN_TYPES)
        .ok,
    ).toBe(false);
    expect(
      validateDocumentShape(
        { header: {}, rows: [{ id: "r1", kind: "bogus" }] },
        KNOWN_TYPES,
      ).ok,
    ).toBe(false);
  });

  it("rejects a full row with a malformed section", () => {
    const result = validateDocumentShape(
      { header: {}, rows: [{ id: "r1", kind: "full", section: {} }] },
      KNOWN_TYPES,
    );
    expect(result.ok).toBe(false);
  });

  it("rejects a split row whose columns field isn't an array of exactly 2 columns", () => {
    expect(
      validateDocumentShape(
        { header: {}, rows: [{ id: "r1", kind: "split", columns: [] }] },
        KNOWN_TYPES,
      ).ok,
    ).toBe(false);
    expect(
      validateDocumentShape(
        {
          header: {},
          rows: [{ id: "r1", kind: "split", columns: [[], [], []] }],
        },
        KNOWN_TYPES,
      ).ok,
    ).toBe(false);
    expect(
      validateDocumentShape(
        {
          header: {},
          rows: [{ id: "r1", kind: "split", columns: [[], "nope"] }],
        },
        KNOWN_TYPES,
      ).ok,
    ).toBe(false);
  });

  it("rejects a split row where both columns are empty", () => {
    const result = validateDocumentShape(
      { header: {}, rows: [{ id: "r1", kind: "split", columns: [[], []] }] },
      KNOWN_TYPES,
    );
    expect(result.ok).toBe(false);
  });

  it("accepts a split row with one empty column", () => {
    const result = validateDocumentShape(
      {
        header: {},
        rows: [
          {
            id: "r1",
            kind: "split",
            columns: [[makeSection("s1")], []],
          },
        ],
      },
      KNOWN_TYPES,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects a section with a type not in knownSectionTypes", () => {
    const result = validateDocumentShape(
      {
        header: {},
        rows: [
          {
            id: "r1",
            kind: "full",
            section: { ...makeSection("s1"), type: "bogus" },
          },
        ],
      },
      KNOWN_TYPES,
    );
    expect(result.ok).toBe(false);
  });

  it("rejects a section missing required fields", () => {
    const missingId = validateDocumentShape(
      {
        header: {},
        rows: [
          {
            id: "r1",
            kind: "full",
            section: {
              type: "placeholder",
              title: "t",
              hidden: false,
              data: {},
            },
          },
        ],
      },
      KNOWN_TYPES,
    );
    expect(missingId.ok).toBe(false);

    const missingTitle = validateDocumentShape(
      {
        header: {},
        rows: [
          {
            id: "r1",
            kind: "full",
            section: { id: "s1", type: "placeholder", hidden: false, data: {} },
          },
        ],
      },
      KNOWN_TYPES,
    );
    expect(missingTitle.ok).toBe(false);

    const missingHidden = validateDocumentShape(
      {
        header: {},
        rows: [
          {
            id: "r1",
            kind: "full",
            section: { id: "s1", type: "placeholder", title: "t", data: {} },
          },
        ],
      },
      KNOWN_TYPES,
    );
    expect(missingHidden.ok).toBe(false);

    const missingData = validateDocumentShape(
      {
        header: {},
        rows: [
          {
            id: "r1",
            kind: "full",
            section: {
              id: "s1",
              type: "placeholder",
              title: "t",
              hidden: false,
            },
          },
        ],
      },
      KNOWN_TYPES,
    );
    expect(missingData.ok).toBe(false);
  });

  it("rejects a header field with the wrong primitive type", () => {
    const result = validateDocumentShape(
      { header: { title: 123 }, rows: [] },
      KNOWN_TYPES,
    );
    expect(result.ok).toBe(false);
  });

  it("accepts a document missing an individual header field, defaulting it to empty", () => {
    const result = validateDocumentShape(
      { header: { title: "Rider", band: "Band" }, rows: [] },
      KNOWN_TYPES,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.header.title).toBe("Rider");
      expect(result.document.header.band).toBe("Band");
      expect(result.document.header.metaFields).toEqual([
        {
          id: expect.any(String),
          kind: "keyvalue",
          label: "Rev",
          value: "",
        },
        { id: expect.any(String), kind: "date", label: "Date", value: "" },
      ]);
    }
  });

  it("migrates a legacy header (revision/date strings, no metaFields) into two meta fields", () => {
    const result = validateDocumentShape(
      {
        header: {
          title: "Rider",
          band: "Band",
          revision: "3.1",
          date: "2026-02-01",
        },
        rows: [],
      },
      KNOWN_TYPES,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.header.metaFields).toEqual([
        {
          id: expect.any(String),
          kind: "keyvalue",
          label: "Rev",
          value: "3.1",
        },
        {
          id: expect.any(String),
          kind: "date",
          label: "Date",
          value: "2026-02-01",
        },
      ]);
    }
  });

  it("round-trips a present metaFields array unchanged", () => {
    const metaFields = [
      { id: "meta_1", kind: "text" as const, value: "Custom note" },
    ];
    const result = validateDocumentShape(
      { header: { title: "Rider", band: "Band", metaFields }, rows: [] },
      KNOWN_TYPES,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.header.metaFields).toEqual(metaFields);
    }
  });

  it("rejects a malformed metaFields entry", () => {
    const result = validateDocumentShape(
      {
        header: {
          title: "Rider",
          band: "Band",
          metaFields: [{ id: "meta_1", kind: "keyvalue", value: "no label" }],
        },
        rows: [],
      },
      KNOWN_TYPES,
    );
    expect(result.ok).toBe(false);
  });

  it("rejects a metaFields entry with an unknown kind", () => {
    const result = validateDocumentShape(
      {
        header: {
          title: "Rider",
          band: "Band",
          metaFields: [{ id: "meta_1", kind: "bogus", value: "x" }],
        },
        rows: [],
      },
      KNOWN_TYPES,
    );
    expect(result.ok).toBe(false);
  });

  it("defaults logos to an empty array when absent", () => {
    const result = validateDocumentShape(
      { header: { title: "Rider", band: "Band" }, rows: [] },
      KNOWN_TYPES,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.header.logos).toEqual([]);
    }
  });

  it("round-trips a present logos array unchanged", () => {
    const logos = [{ id: "logo_1", dataUrl: "data:image/png;base64,abc" }];
    const result = validateDocumentShape(
      { header: { title: "Rider", band: "Band", logos }, rows: [] },
      KNOWN_TYPES,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.header.logos).toEqual(logos);
    }
  });

  it("rejects a malformed logos entry", () => {
    const result = validateDocumentShape(
      {
        header: {
          title: "Rider",
          band: "Band",
          logos: [{ id: "logo_1" }],
        },
        rows: [],
      },
      KNOWN_TYPES,
    );
    expect(result.ok).toBe(false);
  });

  it("defaults creditHidden to false when absent", () => {
    const result = validateDocumentShape(
      { header: { title: "Rider", band: "Band" }, rows: [] },
      KNOWN_TYPES,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.header.creditHidden).toBe(false);
    }
  });

  it("preserves an explicit creditHidden value", () => {
    const result = validateDocumentShape(
      {
        header: { title: "Rider", band: "Band", creditHidden: true },
        rows: [],
      },
      KNOWN_TYPES,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.header.creditHidden).toBe(true);
    }
  });

  it("rejects a non-boolean creditHidden", () => {
    const result = validateDocumentShape(
      {
        header: { title: "Rider", band: "Band", creditHidden: "yes" },
        rows: [],
      },
      KNOWN_TYPES,
    );
    expect(result.ok).toBe(false);
  });
});
