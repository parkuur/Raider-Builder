import type { Header, RiderDocument, Row } from "./document-types";
import type { Section } from "./section-types";
import type { HeaderMetaField } from "./header-meta";
import { legacyHeaderMetaFields } from "./header-meta";

export function deriveFileName(header: Header): string {
  const base = (header.band || header.title || "technical-rider")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return `${base || "technical-rider"}.json`;
}

export function serializeDocument(doc: RiderDocument): string {
  return JSON.stringify(doc, null, 2);
}

export type ValidationResult =
  { ok: true; document: RiderDocument } | { ok: false; errors: string[] };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateHeaderMetaField(
  value: unknown,
  path: string,
  errors: string[],
): HeaderMetaField | null {
  if (!isPlainObject(value)) {
    errors.push(`${path}: expected an object`);
    return null;
  }
  const { id, kind, label, value: fieldValue } = value;
  if (typeof id !== "string") {
    errors.push(`${path}.id: expected a string`);
    return null;
  }
  if (typeof fieldValue !== "string") {
    errors.push(`${path}.value: expected a string`);
    return null;
  }
  if (kind === "keyvalue" || kind === "date") {
    if (typeof label !== "string") {
      errors.push(`${path}.label: expected a string`);
      return null;
    }
    return { id, kind, label, value: fieldValue };
  }
  if (kind === "text") {
    return { id, kind, value: fieldValue };
  }
  errors.push(`${path}.kind: unknown meta field kind ${JSON.stringify(kind)}`);
  return null;
}

/**
 * Documents saved before `metaFields` existed have the old fixed
 * `revision`/`date` strings instead — synthesized here as the two
 * equivalent (now-editable, now-deletable) meta fields so those documents
 * keep showing the same two fields on load.
 */
function validateHeaderMetaFields(
  input: Record<string, unknown>,
  errors: string[],
): HeaderMetaField[] {
  if (input.metaFields === undefined) {
    const revision = typeof input.revision === "string" ? input.revision : "";
    const date = typeof input.date === "string" ? input.date : "";
    return legacyHeaderMetaFields(revision, date);
  }
  if (!Array.isArray(input.metaFields)) {
    errors.push("header.metaFields: expected an array");
    return [];
  }
  const validated = input.metaFields.map((f: unknown, i: number) =>
    validateHeaderMetaField(f, `header.metaFields[${i}]`, errors),
  );
  return validated.every((f) => f !== null)
    ? (validated as HeaderMetaField[])
    : [];
}

function validateHeader(value: unknown, errors: string[]): Header {
  if (value !== undefined && !isPlainObject(value)) {
    errors.push("header: expected an object");
  }
  const input = isPlainObject(value) ? value : {};
  const header: Header = { title: "", band: "", metaFields: [] };
  for (const field of ["title", "band"] as const) {
    const fieldValue = input[field];
    if (fieldValue === undefined) {
      header[field] = "";
    } else if (typeof fieldValue === "string") {
      header[field] = fieldValue;
    } else {
      errors.push(`header.${field}: expected a string`);
    }
  }
  header.metaFields = validateHeaderMetaFields(input, errors);
  return header;
}

function validateSection(
  value: unknown,
  path: string,
  knownSectionTypes: readonly string[],
  errors: string[],
): Section | null {
  if (!isPlainObject(value)) {
    errors.push(`${path}: expected an object`);
    return null;
  }
  const { id, type, title, hidden, data } = value;
  let valid = true;
  if (typeof id !== "string") {
    errors.push(`${path}.id: expected a string`);
    valid = false;
  }
  if (typeof type !== "string" || !knownSectionTypes.includes(type)) {
    errors.push(`${path}.type: unknown section type ${JSON.stringify(type)}`);
    valid = false;
  }
  if (typeof title !== "string") {
    errors.push(`${path}.title: expected a string`);
    valid = false;
  }
  if (typeof hidden !== "boolean") {
    errors.push(`${path}.hidden: expected a boolean`);
    valid = false;
  }
  if (!isPlainObject(data)) {
    errors.push(`${path}.data: expected an object`);
    valid = false;
  }
  if (!valid) return null;
  return { id, type, title, hidden, data } as Section;
}

function validateRow(
  value: unknown,
  path: string,
  knownSectionTypes: readonly string[],
  errors: string[],
): Row | null {
  if (!isPlainObject(value)) {
    errors.push(`${path}: expected an object`);
    return null;
  }
  const { id, sections } = value;
  if (typeof id !== "string") {
    errors.push(`${path}.id: expected a string`);
    return null;
  }
  if (!Array.isArray(sections) || sections.length < 1 || sections.length > 2) {
    errors.push(`${path}.sections: expected an array of 1 or 2 sections`);
    return null;
  }
  const validatedSections = sections.map((s: unknown, i: number) =>
    validateSection(s, `${path}.sections[${i}]`, knownSectionTypes, errors),
  );
  if (validatedSections.some((s) => s === null)) return null;
  return { id, sections: validatedSections as [Section] | [Section, Section] };
}

export function validateDocumentShape(
  value: unknown,
  knownSectionTypes: readonly string[],
): ValidationResult {
  const errors: string[] = [];
  if (!isPlainObject(value)) {
    return {
      ok: false,
      errors: ["Expected the file to contain a JSON object."],
    };
  }
  const header = validateHeader(value.header, errors);
  const rowsValue = value.rows;
  if (!Array.isArray(rowsValue)) {
    errors.push("rows: expected an array");
    return { ok: false, errors };
  }
  const rows = rowsValue.map((r: unknown, i: number) =>
    validateRow(r, `rows[${i}]`, knownSectionTypes, errors),
  );
  if (errors.length > 0 || rows.some((r) => r === null)) {
    return { ok: false, errors };
  }
  return { ok: true, document: { header, rows: rows as Row[] } };
}

export function parseDocumentJson(
  json: string,
  knownSectionTypes: readonly string[],
): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, errors: ["That file isn't valid JSON."] };
  }
  return validateDocumentShape(parsed, knownSectionTypes);
}
