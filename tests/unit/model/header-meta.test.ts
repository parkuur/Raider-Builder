import { describe, expect, it } from "vitest";
import {
  addHeaderMetaField,
  createDefaultHeaderMetaFields,
  legacyHeaderMetaFields,
  removeHeaderMetaField,
  reorderHeaderMetaFields,
  setHeaderMetaFieldLabel,
  setHeaderMetaFieldValue,
} from "../../../src/lib/model/header-meta";
import type { HeaderMetaField } from "../../../src/lib/model/header-meta";

describe("createDefaultHeaderMetaFields", () => {
  it("seeds a Rev key:value field and a Date field", () => {
    const fields = createDefaultHeaderMetaFields();
    expect(fields).toEqual([
      { id: expect.any(String), kind: "keyvalue", label: "Rev", value: "1.0" },
      { id: expect.any(String), kind: "date", label: "Date", value: "" },
    ]);
  });
});

describe("legacyHeaderMetaFields", () => {
  it("carries the legacy revision/date strings into the two equivalent fields", () => {
    const fields = legacyHeaderMetaFields("2.0", "2026-01-01");
    expect(fields).toEqual([
      {
        id: expect.any(String),
        kind: "keyvalue",
        label: "Rev",
        value: "2.0",
      },
      {
        id: expect.any(String),
        kind: "date",
        label: "Date",
        value: "2026-01-01",
      },
    ]);
  });
});

describe("addHeaderMetaField", () => {
  it("appends a keyvalue field", () => {
    const result = addHeaderMetaField([], "keyvalue");
    expect(result).toEqual([
      { id: expect.any(String), kind: "keyvalue", label: "", value: "" },
    ]);
  });

  it("appends a date field", () => {
    const result = addHeaderMetaField([], "date");
    expect(result).toEqual([
      { id: expect.any(String), kind: "date", label: "", value: "" },
    ]);
  });

  it("appends a text field with no label", () => {
    const result = addHeaderMetaField([], "text");
    expect(result).toEqual([
      { id: expect.any(String), kind: "text", value: "" },
    ]);
  });
});

describe("removeHeaderMetaField", () => {
  it("removes the targeted field", () => {
    const fields = createDefaultHeaderMetaFields();
    const result = removeHeaderMetaField(fields, fields[0]!.id);
    expect(result).toEqual([fields[1]]);
  });

  it("is a no-op on an unknown id", () => {
    const fields = createDefaultHeaderMetaFields();
    expect(removeHeaderMetaField(fields, "nope")).toBe(fields);
  });
});

describe("setHeaderMetaFieldLabel", () => {
  it("updates the label of a keyvalue field", () => {
    const fields: HeaderMetaField[] = [
      { id: "f1", kind: "keyvalue", label: "Rev", value: "1.0" },
    ];
    const result = setHeaderMetaFieldLabel(fields, "f1", "Version");
    expect(result[0]).toEqual({
      id: "f1",
      kind: "keyvalue",
      label: "Version",
      value: "1.0",
    });
  });

  it("updates the label of a date field", () => {
    const fields: HeaderMetaField[] = [
      { id: "f1", kind: "date", label: "Date", value: "" },
    ];
    const result = setHeaderMetaFieldLabel(fields, "f1", "Show Date");
    expect(result[0]).toEqual({
      id: "f1",
      kind: "date",
      label: "Show Date",
      value: "",
    });
  });

  it("is a no-op on a text field, which has no label", () => {
    const fields: HeaderMetaField[] = [
      { id: "f1", kind: "text", value: "hello" },
    ];
    expect(setHeaderMetaFieldLabel(fields, "f1", "Nope")).toBe(fields);
  });

  it("is a no-op on an unknown id", () => {
    const fields = createDefaultHeaderMetaFields();
    expect(setHeaderMetaFieldLabel(fields, "nope", "X")).toBe(fields);
  });
});

describe("setHeaderMetaFieldValue", () => {
  it("updates the value of any field kind", () => {
    const fields: HeaderMetaField[] = [{ id: "f1", kind: "text", value: "" }];
    const result = setHeaderMetaFieldValue(fields, "f1", "Backline provided");
    expect(result[0]).toEqual({
      id: "f1",
      kind: "text",
      value: "Backline provided",
    });
  });

  it("is a no-op on an unknown id", () => {
    const fields = createDefaultHeaderMetaFields();
    expect(setHeaderMetaFieldValue(fields, "nope", "X")).toBe(fields);
  });
});

describe("reorderHeaderMetaFields", () => {
  it("moves a field to a new index", () => {
    const fields = createDefaultHeaderMetaFields();
    const [rev, date] = fields;
    const result = reorderHeaderMetaFields(fields, 0, 1);
    expect(result).toEqual([date, rev]);
  });

  it("is a no-op when fromIndex is out of range", () => {
    const fields = createDefaultHeaderMetaFields();
    expect(reorderHeaderMetaFields(fields, 5, 0)).toBe(fields);
  });

  it("is a no-op when fromIndex equals the clamped toIndex", () => {
    const fields = createDefaultHeaderMetaFields();
    expect(reorderHeaderMetaFields(fields, 0, 0)).toBe(fields);
  });
});
