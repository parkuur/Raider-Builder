import { createId } from "./id";
import { clamp } from "./util";
import type { Header, RiderDocument, Row } from "./document-types";
import type { Section, SectionDataMap, SectionType } from "./section-types";

/**
 * Every function here is immutable and no-ops by returning the exact same
 * `doc` reference (checkable via `result === doc`) whenever a precondition
 * fails — unknown id, out-of-range index, promoting an already-split row,
 * targeting a row of the wrong kind. Invalid calls degrade predictably
 * instead of throwing or silently producing a malformed document.
 */

/** Finds a Section by id regardless of which row kind/column holds it. */
function findSectionInRow(row: Row, sectionId: string): Section | null {
  if (row.kind === "full") {
    return row.section.id === sectionId ? row.section : null;
  }
  return (
    row.columns[0].find((s) => s.id === sectionId) ??
    row.columns[1].find((s) => s.id === sectionId) ??
    null
  );
}

/** Locates which column/index of a SplitRow holds a given section id. */
function locateInSplitRow(
  row: Row & { kind: "split" },
  sectionId: string,
): { column: 0 | 1; index: number } | null {
  for (const column of [0, 1] as const) {
    const index = row.columns[column].findIndex((s) => s.id === sectionId);
    if (index !== -1) return { column, index };
  }
  return null;
}

/** Applies `updater` to whichever section (in either row kind) has this id. */
function replaceSectionInRow(
  row: Row,
  sectionId: string,
  updater: (section: Section) => Section,
): Row {
  if (row.kind === "full") {
    return row.section.id === sectionId
      ? { ...row, section: updater(row.section) }
      : row;
  }
  const located = locateInSplitRow(row, sectionId);
  if (!located) return row;
  const columns = row.columns.map((column, i) =>
    i === located.column
      ? column.map((s) => (s.id === sectionId ? updater(s) : s))
      : column,
  ) as [Section[], Section[]];
  return { ...row, columns };
}

/**
 * A split layout exists only while both columns are non-empty (see the
 * CLAUDE.md glossary). Whenever a mutation could shrink a column to zero,
 * it calls this afterward: if one column emptied, the row is replaced by
 * one new solo FullRow per section still in the surviving column, in
 * order, at the row's former position — collapse is symmetric with the
 * lazy promotion that created the split layout in the first place.
 */
function collapseIfEmptied(rows: Row[], rowIndex: number): Row[] {
  const row = rows[rowIndex]!;
  if (row.kind !== "split") return rows;
  const [columnA, columnB] = row.columns;
  if (columnA.length > 0 && columnB.length > 0) return rows;
  const survivors = columnA.length > 0 ? columnA : columnB;
  const replacement: Row[] = survivors.map((section) => ({
    id: createId("row"),
    kind: "full",
    section,
  }));
  return [...rows.slice(0, rowIndex), ...replacement, ...rows.slice(rowIndex + 1)];
}

export function addRow(
  doc: RiderDocument,
  atIndex: number,
  section: Section,
): RiderDocument {
  const index = clamp(atIndex, 0, doc.rows.length);
  const row: Row = { id: createId("row"), kind: "full", section };
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
  if (row.kind === "full") {
    if (row.section.id !== sectionId) return doc;
    const rows = [...doc.rows];
    rows.splice(rowIndex, 1);
    return { ...doc, rows };
  }
  const located = locateInSplitRow(row, sectionId);
  if (!located) return doc;
  const columns = row.columns.map((column, i) =>
    i === located.column ? column.filter((s) => s.id !== sectionId) : column,
  ) as [Section[], Section[]];
  const rows = [...doc.rows];
  rows[rowIndex] = { ...row, columns };
  return { ...doc, rows: collapseIfEmptied(rows, rowIndex) };
}

function cloneSection(source: Section): Section {
  return { ...structuredClone(source), id: createId("section") };
}

/**
 * Inserts a clone of the section as a new standalone row at `atIndex`,
 * leaving the source row completely untouched — the source can be a solo
 * section or one embedded in a split layout's column, either way.
 */
export function duplicateSectionToNewRow(
  doc: RiderDocument,
  sourceRowId: string,
  sectionId: string,
  atIndex: number,
): RiderDocument {
  const sourceRow = doc.rows.find((r) => r.id === sourceRowId);
  const source = sourceRow && findSectionInRow(sourceRow, sectionId);
  if (!source) return doc;
  const copy = cloneSection(source);
  const newRow: Row = { id: createId("row"), kind: "full", section: copy };
  const index = clamp(atIndex, 0, doc.rows.length);
  const rows = [...doc.rows.slice(0, index), newRow, ...doc.rows.slice(index)];
  return { ...doc, rows };
}

/**
 * Moves any section — solo or embedded in a split layout's column — into a
 * brand-new standalone row at `atIndex`. `atIndex` is interpreted against
 * the *original* `doc.rows` (the gap before the row currently at that
 * index); since removing/collapsing the source row can turn its one slot
 * into zero, one, or several rows, any insertion point that fell after the
 * source row is shifted by however many net rows that change produced.
 */
export function moveSectionToNewRow(
  doc: RiderDocument,
  sourceRowId: string,
  sectionId: string,
  atIndex: number,
): RiderDocument {
  const sourceIndex = doc.rows.findIndex((r) => r.id === sourceRowId);
  if (sourceIndex === -1) return doc;
  const sourceRow = doc.rows[sourceIndex]!;
  const section = findSectionInRow(sourceRow, sectionId);
  if (!section) return doc;

  let rowsAfterRemoval: Row[];
  if (sourceRow.kind === "full") {
    rowsAfterRemoval = [
      ...doc.rows.slice(0, sourceIndex),
      ...doc.rows.slice(sourceIndex + 1),
    ];
  } else {
    const located = locateInSplitRow(sourceRow, sectionId)!;
    const columns = sourceRow.columns.map((column, i) =>
      i === located.column ? column.filter((s) => s.id !== sectionId) : column,
    ) as [Section[], Section[]];
    rowsAfterRemoval = collapseIfEmptied(
      [
        ...doc.rows.slice(0, sourceIndex),
        { ...sourceRow, columns },
        ...doc.rows.slice(sourceIndex + 1),
      ],
      sourceIndex,
    );
  }

  const producedCount = rowsAfterRemoval.length - (doc.rows.length - 1);
  const shifted =
    atIndex > sourceIndex ? atIndex + producedCount - 1 : atIndex;
  const insertIndex = clamp(shifted, 0, rowsAfterRemoval.length);

  const newRow: Row = { id: createId("row"), kind: "full", section };
  const rows = [
    ...rowsAfterRemoval.slice(0, insertIndex),
    newRow,
    ...rowsAfterRemoval.slice(insertIndex),
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

/**
 * Promotes a `FullRow` into a `SplitRow`: a brand-new section joins the
 * row's existing solo section as the second column. No-op unless `rowId`
 * currently names a `FullRow` — this is how a solo split section first
 * becomes an actual split layout.
 */
export function createSplitRow(
  doc: RiderDocument,
  rowId: string,
  section: Section,
): RiderDocument {
  const rowIndex = doc.rows.findIndex((r) => r.id === rowId);
  if (rowIndex === -1) return doc;
  const row = doc.rows[rowIndex]!;
  if (row.kind !== "full") return doc;
  const rows = [...doc.rows];
  rows[rowIndex] = {
    id: row.id,
    kind: "split",
    columns: [[row.section], [section]],
  };
  return { ...doc, rows };
}

/**
 * Moves any section — solo or embedded in a split layout's column — onto a
 * `FullRow` target, promoting the target into a `SplitRow`. No-op if the
 * source and target are the same row (nothing to move onto itself) or the
 * target isn't currently a `FullRow`.
 */
export function moveSectionToSplitRow(
  doc: RiderDocument,
  sourceRowId: string,
  sectionId: string,
  targetRowId: string,
): RiderDocument {
  if (sourceRowId === targetRowId) return doc;
  const sourceIndex = doc.rows.findIndex((r) => r.id === sourceRowId);
  const targetIndex = doc.rows.findIndex((r) => r.id === targetRowId);
  if (sourceIndex === -1 || targetIndex === -1) return doc;
  const sourceRow = doc.rows[sourceIndex]!;
  const targetRow = doc.rows[targetIndex]!;
  if (targetRow.kind !== "full") return doc;
  const moved = findSectionInRow(sourceRow, sectionId);
  if (!moved) return doc;

  const rows = [...doc.rows];
  rows[targetIndex] = {
    id: targetRow.id,
    kind: "split",
    columns: [[targetRow.section], [moved]],
  };

  if (sourceRow.kind === "full") {
    rows.splice(sourceIndex, 1);
    return { ...doc, rows };
  }
  const located = locateInSplitRow(sourceRow, sectionId)!;
  const columns = sourceRow.columns.map((column, i) =>
    i === located.column ? column.filter((s) => s.id !== sectionId) : column,
  ) as [Section[], Section[]];
  rows[sourceIndex] = { ...sourceRow, columns };
  return { ...doc, rows: collapseIfEmptied(rows, sourceIndex) };
}

/**
 * Copy counterpart to `moveSectionToSplitRow` — clones the section into a
 * new column alongside `targetRowId`'s existing solo section, leaving the
 * source untouched. `sourceRowId === targetRowId` is allowed on purpose:
 * that's how a solo section gets split with a copy of itself.
 */
export function duplicateSectionToSplitRow(
  doc: RiderDocument,
  sourceRowId: string,
  sectionId: string,
  targetRowId: string,
): RiderDocument {
  const sourceRow = doc.rows.find((r) => r.id === sourceRowId);
  const source = sourceRow && findSectionInRow(sourceRow, sectionId);
  const targetIndex = doc.rows.findIndex((r) => r.id === targetRowId);
  const targetRow = doc.rows[targetIndex];
  if (!source || !targetRow || targetRow.kind !== "full") return doc;
  const copy = cloneSection(source);
  const rows = [...doc.rows];
  rows[targetIndex] = {
    id: targetRow.id,
    kind: "split",
    columns: [[targetRow.section], [copy]],
  };
  return { ...doc, rows };
}

/** Inserts a fresh section at any index of an existing split row's column. */
export function insertSectionIntoColumn(
  doc: RiderDocument,
  rowId: string,
  columnIndex: 0 | 1,
  atIndex: number,
  section: Section,
): RiderDocument {
  const rowIndex = doc.rows.findIndex((r) => r.id === rowId);
  if (rowIndex === -1) return doc;
  const row = doc.rows[rowIndex]!;
  if (row.kind !== "split") return doc;
  const column = row.columns[columnIndex];
  const index = clamp(atIndex, 0, column.length);
  const newColumn = [
    ...column.slice(0, index),
    section,
    ...column.slice(index),
  ];
  const columns = row.columns.map((c, i) =>
    i === columnIndex ? newColumn : c,
  ) as [Section[], Section[]];
  const rows = [...doc.rows];
  rows[rowIndex] = { ...row, columns };
  return { ...doc, rows };
}

/**
 * Moves any section — solo or embedded — into a specific position of an
 * existing split row's column. Moving between the two columns of the same
 * row is a single combined splice/insert so the row is never transiently
 * read from a stale reference; moving within the same column is a no-op
 * here (that's `reorderSectionWithinColumn`'s job). No-op unless the
 * target is currently a `SplitRow`.
 */
export function moveSectionIntoColumn(
  doc: RiderDocument,
  sourceRowId: string,
  sectionId: string,
  targetRowId: string,
  targetColumnIndex: 0 | 1,
  targetAtIndex: number,
): RiderDocument {
  const targetIndex = doc.rows.findIndex((r) => r.id === targetRowId);
  if (targetIndex === -1) return doc;
  const targetRow = doc.rows[targetIndex]!;
  if (targetRow.kind !== "split") return doc;

  if (sourceRowId === targetRowId) {
    const located = locateInSplitRow(targetRow, sectionId);
    if (!located || located.column === targetColumnIndex) return doc;
    const moved = targetRow.columns[located.column][located.index]!;
    const withoutSource = targetRow.columns[located.column].filter(
      (s) => s.id !== sectionId,
    );
    const targetColumn = targetRow.columns[targetColumnIndex];
    const insertAt = clamp(targetAtIndex, 0, targetColumn.length);
    const newTargetColumn = [
      ...targetColumn.slice(0, insertAt),
      moved,
      ...targetColumn.slice(insertAt),
    ];
    const columns = (
      located.column === 0
        ? [withoutSource, newTargetColumn]
        : [newTargetColumn, withoutSource]
    ) as [Section[], Section[]];
    const rows = [...doc.rows];
    rows[targetIndex] = { ...targetRow, columns };
    return { ...doc, rows: collapseIfEmptied(rows, targetIndex) };
  }

  const sourceIndex = doc.rows.findIndex((r) => r.id === sourceRowId);
  if (sourceIndex === -1) return doc;
  const sourceRow = doc.rows[sourceIndex]!;
  const moved = findSectionInRow(sourceRow, sectionId);
  if (!moved) return doc;

  const targetColumn = targetRow.columns[targetColumnIndex];
  const insertAt = clamp(targetAtIndex, 0, targetColumn.length);
  const newTargetColumn = [
    ...targetColumn.slice(0, insertAt),
    moved,
    ...targetColumn.slice(insertAt),
  ];
  const rows = [...doc.rows];
  rows[targetIndex] = {
    ...targetRow,
    columns: targetRow.columns.map((c, i) =>
      i === targetColumnIndex ? newTargetColumn : c,
    ) as [Section[], Section[]],
  };

  if (sourceRow.kind === "full") {
    rows.splice(sourceIndex, 1);
    return { ...doc, rows };
  }
  const located = locateInSplitRow(sourceRow, sectionId)!;
  const columns = sourceRow.columns.map((column, i) =>
    i === located.column ? column.filter((s) => s.id !== sectionId) : column,
  ) as [Section[], Section[]];
  rows[sourceIndex] = { ...sourceRow, columns };
  return { ...doc, rows: collapseIfEmptied(rows, sourceIndex) };
}

/**
 * Copy counterpart to `moveSectionIntoColumn` — clones the source into a
 * target split row's column at any index, leaving the source untouched.
 * Same-row, same-column duplication needs no special-casing: it's just
 * clone + insert like every other case.
 */
export function duplicateSectionIntoColumn(
  doc: RiderDocument,
  sourceRowId: string,
  sectionId: string,
  targetRowId: string,
  targetColumnIndex: 0 | 1,
  targetAtIndex: number,
): RiderDocument {
  const sourceRow = doc.rows.find((r) => r.id === sourceRowId);
  const source = sourceRow && findSectionInRow(sourceRow, sectionId);
  const targetIndex = doc.rows.findIndex((r) => r.id === targetRowId);
  const targetRow = doc.rows[targetIndex];
  if (!source || !targetRow || targetRow.kind !== "split") return doc;
  const copy = cloneSection(source);
  const targetColumn = targetRow.columns[targetColumnIndex];
  const insertAt = clamp(targetAtIndex, 0, targetColumn.length);
  const newTargetColumn = [
    ...targetColumn.slice(0, insertAt),
    copy,
    ...targetColumn.slice(insertAt),
  ];
  const columns = targetRow.columns.map((c, i) =>
    i === targetColumnIndex ? newTargetColumn : c,
  ) as [Section[], Section[]];
  const rows = [...doc.rows];
  rows[targetIndex] = { ...targetRow, columns };
  return { ...doc, rows };
}

/** Direct per-column analog of `reorderRows`. */
export function reorderSectionWithinColumn(
  doc: RiderDocument,
  rowId: string,
  columnIndex: 0 | 1,
  fromIndex: number,
  toIndex: number,
): RiderDocument {
  const rowIndex = doc.rows.findIndex((r) => r.id === rowId);
  if (rowIndex === -1) return doc;
  const row = doc.rows[rowIndex]!;
  if (row.kind !== "split") return doc;
  const column = row.columns[columnIndex];
  if (fromIndex < 0 || fromIndex >= column.length) return doc;
  const target = clamp(toIndex, 0, column.length - 1);
  if (fromIndex === target) return doc;
  const newColumn = [...column];
  const [moved] = newColumn.splice(fromIndex, 1);
  newColumn.splice(target, 0, moved!);
  const columns = row.columns.map((c, i) =>
    i === columnIndex ? newColumn : c,
  ) as [Section[], Section[]];
  const rows = [...doc.rows];
  rows[rowIndex] = { ...row, columns };
  return { ...doc, rows };
}

export function swapPairedSections(
  doc: RiderDocument,
  rowId: string,
): RiderDocument {
  const rowIndex = doc.rows.findIndex((r) => r.id === rowId);
  if (rowIndex === -1) return doc;
  const row = doc.rows[rowIndex]!;
  if (row.sections.length !== 2) return doc;
  const rows = [...doc.rows];
  rows[rowIndex] = { ...row, sections: [row.sections[1], row.sections[0]] };
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
  if (!findSectionInRow(row, sectionId)) return doc;
  const rows = [...doc.rows];
  rows[rowIndex] = replaceSectionInRow(row, sectionId, (s) => ({
    ...s,
    hidden: !s.hidden,
  }));
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
  if (!findSectionInRow(row, sectionId)) return doc;
  const rows = [...doc.rows];
  rows[rowIndex] = replaceSectionInRow(row, sectionId, (s) => ({
    ...s,
    title,
  }));
  return { ...doc, rows };
}

export function setSectionData<T extends SectionType>(
  doc: RiderDocument,
  rowId: string,
  sectionId: string,
  type: T,
  data: SectionDataMap[T],
): RiderDocument {
  const rowIndex = doc.rows.findIndex((r) => r.id === rowId);
  if (rowIndex === -1) return doc;
  const row = doc.rows[rowIndex]!;
  const section = findSectionInRow(row, sectionId);
  if (!section || section.type !== type) return doc;
  const rows = [...doc.rows];
  rows[rowIndex] = replaceSectionInRow(
    row,
    sectionId,
    (s) => ({ ...s, data }) as Section,
  );
  return { ...doc, rows };
}

export function setHeaderField<K extends keyof Header>(
  doc: RiderDocument,
  field: K,
  value: Header[K],
): RiderDocument {
  return { ...doc, header: { ...doc.header, [field]: value } };
}
