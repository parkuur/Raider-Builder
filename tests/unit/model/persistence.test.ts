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
  it("preserves a document with a paired row exactly", () => {
    const doc: RiderDocument = {
      header: {
        title: "Rider",
        band: "Band",
        revision: "2.0",
        date: "2026-01-01",
      },
      rows: [
        {
          id: "r1",
          sections: [makeSection("s1", "a"), makeSection("s2", "b")],
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

  it("rejects a row with zero sections", () => {
    const result = validateDocumentShape(
      { header: {}, rows: [{ id: "r1", sections: [] }] },
      KNOWN_TYPES,
    );
    expect(result.ok).toBe(false);
  });

  it("rejects a row with three sections", () => {
    const result = validateDocumentShape(
      {
        header: {},
        rows: [
          {
            id: "r1",
            sections: [makeSection("s1"), makeSection("s2"), makeSection("s3")],
          },
        ],
      },
      KNOWN_TYPES,
    );
    expect(result.ok).toBe(false);
  });

  it("rejects a section with a type not in knownSectionTypes", () => {
    const result = validateDocumentShape(
      {
        header: {},
        rows: [
          { id: "r1", sections: [{ ...makeSection("s1"), type: "bogus" }] },
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
            sections: [
              { type: "placeholder", title: "t", hidden: false, data: {} },
            ],
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
            sections: [
              { id: "s1", type: "placeholder", hidden: false, data: {} },
            ],
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
            sections: [{ id: "s1", type: "placeholder", title: "t", data: {} }],
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
            sections: [
              { id: "s1", type: "placeholder", title: "t", hidden: false },
            ],
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
      expect(result.document.header).toEqual({
        title: "Rider",
        band: "Band",
        revision: "",
        date: "",
      });
    }
  });
});
