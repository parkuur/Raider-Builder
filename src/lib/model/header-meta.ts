import { createId } from "./id";
import { clamp } from "./util";

export interface HeaderMetaKeyValueField {
  id: string;
  kind: "keyvalue";
  label: string;
  value: string;
}

export interface HeaderMetaDateField {
  id: string;
  kind: "date";
  label: string;
  value: string;
}

export interface HeaderMetaTextField {
  id: string;
  kind: "text";
  value: string;
}

export type HeaderMetaField =
  HeaderMetaKeyValueField | HeaderMetaDateField | HeaderMetaTextField;

export type HeaderMetaFieldKind = HeaderMetaField["kind"];

export function createDefaultHeaderMetaFields(): HeaderMetaField[] {
  return [
    { id: createId("meta"), kind: "keyvalue", label: "Rev", value: "1.0" },
    { id: createId("meta"), kind: "date", label: "Date", value: "" },
  ];
}

/**
 * Migration-only: reconstructs the pre-epic-09 fixed `revision`/`date`
 * header strings as the two equivalent meta fields, so documents saved
 * before this field existed keep showing the same two fields (now editable
 * and deletable like any other) instead of losing them.
 */
export function legacyHeaderMetaFields(
  revision: string,
  date: string,
): HeaderMetaField[] {
  return [
    { id: createId("meta"), kind: "keyvalue", label: "Rev", value: revision },
    { id: createId("meta"), kind: "date", label: "Date", value: date },
  ];
}

function makeHeaderMetaField(kind: HeaderMetaFieldKind): HeaderMetaField {
  switch (kind) {
    case "keyvalue":
      return { id: createId("meta"), kind, label: "", value: "" };
    case "date":
      return { id: createId("meta"), kind, label: "", value: "" };
    case "text":
      return { id: createId("meta"), kind, value: "" };
  }
}

export function addHeaderMetaField(
  fields: HeaderMetaField[],
  kind: HeaderMetaFieldKind,
): HeaderMetaField[] {
  return [...fields, makeHeaderMetaField(kind)];
}

export function removeHeaderMetaField(
  fields: HeaderMetaField[],
  fieldId: string,
): HeaderMetaField[] {
  if (!fields.some((f) => f.id === fieldId)) return fields;
  return fields.filter((f) => f.id !== fieldId);
}

export function setHeaderMetaFieldLabel(
  fields: HeaderMetaField[],
  fieldId: string,
  label: string,
): HeaderMetaField[] {
  const field = fields.find((f) => f.id === fieldId);
  if (!field || field.kind === "text") return fields;
  return fields.map((f) => (f.id === fieldId ? { ...f, label } : f));
}

export function setHeaderMetaFieldValue(
  fields: HeaderMetaField[],
  fieldId: string,
  value: string,
): HeaderMetaField[] {
  if (!fields.some((f) => f.id === fieldId)) return fields;
  return fields.map((f) => (f.id === fieldId ? { ...f, value } : f));
}

export function reorderHeaderMetaFields(
  fields: HeaderMetaField[],
  fromIndex: number,
  toIndex: number,
): HeaderMetaField[] {
  if (fromIndex < 0 || fromIndex >= fields.length) return fields;
  const target = clamp(toIndex, 0, fields.length - 1);
  if (fromIndex === target) return fields;
  const next = [...fields];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(target, 0, moved!);
  return next;
}
