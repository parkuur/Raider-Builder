import { createId } from "./id";
import { clamp } from "./util";
import type { Header, RiderDocument, Row } from "./document-types";
import type { Section } from "./section-types";

/**
 * Every function here is immutable and no-ops by returning the exact same
 * `doc` reference (checkable via `result === doc`) whenever a precondition
 * fails — unknown id, out-of-range index, pairing an already-paired row,
 * unpairing a row that isn't paired. Invalid calls degrade predictably
 * instead of throwing or silently producing a malformed document.
 */

export function addRow(
  doc: RiderDocument,
  atIndex: number,
  section: Section,
): RiderDocument {
  const index = clamp(atIndex, 0, doc.rows.length);
  const row: Row = { id: createId("row"), sections: [section] };
  const rows = [...doc.rows.slice(0, index), row, ...doc.rows.slice(index)];
  return { ...doc, rows };
}

export function removeSection(
  doc: RiderDocument,
  rowId: string,
  sectionId: string,
): RiderDocument {
  const rowIndex = doc.rows.findIndex((r) => r.id === rowId);
  if (rowIndex === -1) return doc;
  const row = doc.rows[rowIndex]!;
  if (!row.sections.some((s) => s.id === sectionId)) return doc;
  const remaining = row.sections.filter((s) => s.id !== sectionId);
  const rows = [...doc.rows];
  if (remaining.length === 0) {
    rows.splice(rowIndex, 1);
  } else {
    rows[rowIndex] = { ...row, sections: remaining as [Section] };
  }
  return { ...doc, rows };
}

export function duplicateSection(
  doc: RiderDocument,
  rowId: string,
  sectionId: string,
): RiderDocument {
  const rowIndex = doc.rows.findIndex((r) => r.id === rowId);
  if (rowIndex === -1) return doc;
  const source = doc.rows[rowIndex]!.sections.find((s) => s.id === sectionId);
  if (!source) return doc;
  const copy: Section = { ...structuredClone(source), id: createId("section") };
  const newRow: Row = { id: createId("row"), sections: [copy] };
  const rows = [
    ...doc.rows.slice(0, rowIndex + 1),
    newRow,
    ...doc.rows.slice(rowIndex + 1),
  ];
  return { ...doc, rows };
}

export function reorderRows(
  doc: RiderDocument,
  fromIndex: number,
  toIndex: number,
): RiderDocument {
  if (fromIndex < 0 || fromIndex >= doc.rows.length) return doc;
  const target = clamp(toIndex, 0, doc.rows.length - 1);
  if (fromIndex === target) return doc;
  const rows = [...doc.rows];
  const [moved] = rows.splice(fromIndex, 1);
  rows.splice(target, 0, moved!);
  return { ...doc, rows };
}

export function pairSections(
  doc: RiderDocument,
  rowId: string,
  section: Section,
): RiderDocument {
  const rowIndex = doc.rows.findIndex((r) => r.id === rowId);
  if (rowIndex === -1) return doc;
  const row = doc.rows[rowIndex]!;
  if (row.sections.length !== 1) return doc;
  const rows = [...doc.rows];
  rows[rowIndex] = { ...row, sections: [row.sections[0], section] };
  return { ...doc, rows };
}

export function unpairSection(
  doc: RiderDocument,
  rowId: string,
  sectionId: string,
): RiderDocument {
  const rowIndex = doc.rows.findIndex((r) => r.id === rowId);
  if (rowIndex === -1) return doc;
  const row = doc.rows[rowIndex]!;
  if (row.sections.length !== 2) return doc;
  const removed = row.sections.find((s) => s.id === sectionId);
  const remaining = row.sections.find((s) => s.id !== sectionId);
  if (!removed || !remaining) return doc;
  const rows = [...doc.rows];
  rows[rowIndex] = { ...row, sections: [remaining] };
  const newRow: Row = { id: createId("row"), sections: [removed] };
  rows.splice(rowIndex + 1, 0, newRow);
  return { ...doc, rows };
}

export function toggleSectionHidden(
  doc: RiderDocument,
  rowId: string,
  sectionId: string,
): RiderDocument {
  const rowIndex = doc.rows.findIndex((r) => r.id === rowId);
  if (rowIndex === -1) return doc;
  const row = doc.rows[rowIndex]!;
  if (!row.sections.some((s) => s.id === sectionId)) return doc;
  const rows = [...doc.rows];
  rows[rowIndex] = {
    ...row,
    sections: row.sections.map((s) =>
      s.id === sectionId ? { ...s, hidden: !s.hidden } : s,
    ) as [Section] | [Section, Section],
  };
  return { ...doc, rows };
}

export function setSectionTitle(
  doc: RiderDocument,
  rowId: string,
  sectionId: string,
  title: string,
): RiderDocument {
  const rowIndex = doc.rows.findIndex((r) => r.id === rowId);
  if (rowIndex === -1) return doc;
  const row = doc.rows[rowIndex]!;
  if (!row.sections.some((s) => s.id === sectionId)) return doc;
  const rows = [...doc.rows];
  rows[rowIndex] = {
    ...row,
    sections: row.sections.map((s) =>
      s.id === sectionId ? { ...s, title } : s,
    ) as [Section] | [Section, Section],
  };
  return { ...doc, rows };
}

export function setHeaderField<K extends keyof Header>(
  doc: RiderDocument,
  field: K,
  value: Header[K],
): RiderDocument {
  return { ...doc, header: { ...doc.header, [field]: value } };
}
