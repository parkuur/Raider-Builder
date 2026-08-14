import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDocumentFromLocalStorage,
  loadDocumentFromLocalStorage,
  saveDocumentToLocalStorage,
} from "../../../src/lib/state/local-storage";
import { createEmptyDocument } from "../../../src/lib/model/document-types";
import type { Section } from "../../../src/lib/model/section-types";

const KNOWN_TYPES = ["placeholder"];

function makeSection(id: string, note = ""): Section {
  return { id, type: "placeholder", title: id, hidden: false, data: { note } };
}

beforeEach(() => {
  localStorage.clear();
});

describe("saveDocumentToLocalStorage / loadDocumentFromLocalStorage", () => {
  it("round-trips a document unchanged", () => {
    const doc = {
      ...createEmptyDocument(),
      header: {
        title: "My Rider",
        band: "The Band",
        metaFields: [
          { id: "meta_1", kind: "keyvalue" as const, label: "Rev", value: "1" },
          {
            id: "meta_2",
            kind: "date" as const,
            label: "Date",
            value: "2026-01-01",
          },
        ],
        logos: [],
        creditHidden: false,
      },
      rows: [
        {
          id: "row-1",
          sections: [makeSection("section-1", "hello")] as [Section],
        },
      ],
    };

    saveDocumentToLocalStorage(doc);

    expect(loadDocumentFromLocalStorage(KNOWN_TYPES)).toEqual(doc);
  });

  it("returns null when nothing is stored", () => {
    expect(loadDocumentFromLocalStorage(KNOWN_TYPES)).toBeNull();
  });

  it("returns null instead of throwing on invalid JSON in storage", () => {
    localStorage.setItem("raiderbuilder:document", "not json");

    expect(loadDocumentFromLocalStorage(KNOWN_TYPES)).toBeNull();
  });

  it("returns null on structurally-invalid stored data", () => {
    localStorage.setItem(
      "raiderbuilder:document",
      JSON.stringify({
        header: {},
        rows: [{ id: "row-1", sections: [{ type: "unknown-type" }] }],
      }),
    );

    expect(loadDocumentFromLocalStorage(KNOWN_TYPES)).toBeNull();
  });
});

describe("clearDocumentFromLocalStorage", () => {
  it("removes the stored document", () => {
    saveDocumentToLocalStorage(createEmptyDocument());
    expect(loadDocumentFromLocalStorage(KNOWN_TYPES)).not.toBeNull();

    clearDocumentFromLocalStorage();

    expect(loadDocumentFromLocalStorage(KNOWN_TYPES)).toBeNull();
  });
});
