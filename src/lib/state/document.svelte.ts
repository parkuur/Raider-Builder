import { sectionRegistry } from "../sections/registry";
import * as mutations from "../model/document-mutations";
import { createId } from "../model/id";
import { createEmptyDocument } from "../model/document-types";
import type { Header, RiderDocument } from "../model/document-types";
import type { Section, SectionType } from "../model/section-types";
import type { RequirementsSectionData } from "../model/requirements";

let state = $state<RiderDocument>(createEmptyDocument());

export function getDocument(): RiderDocument {
  return state;
}

export function setDocument(next: RiderDocument): void {
  state = next;
}

function buildSection(type: SectionType): Section {
  const meta = sectionRegistry[type];
  // Safe: `meta` and `meta.defaultData()` are both keyed by the same
  // runtime `type`; TS just can't prove it across the generic SectionType
  // parameter boundary.
  return {
    id: createId("section"),
    type,
    title: meta.label,
    hidden: false,
    data: meta.defaultData(),
  } as Section;
}

export function addRow(type: SectionType, atIndex: number): void {
  state = mutations.addRow(state, atIndex, buildSection(type));
}

export function removeSection(rowId: string, sectionId: string): void {
  state = mutations.removeSection(state, rowId, sectionId);
}

export function duplicateSection(rowId: string, sectionId: string): void {
  state = mutations.duplicateSection(state, rowId, sectionId);
}

export function reorderRows(fromIndex: number, toIndex: number): void {
  state = mutations.reorderRows(state, fromIndex, toIndex);
}

export function pairSections(rowId: string, type: SectionType): void {
  state = mutations.pairSections(state, rowId, buildSection(type));
}

export function unpairSection(rowId: string, sectionId: string): void {
  state = mutations.unpairSection(state, rowId, sectionId);
}

export function toggleSectionHidden(rowId: string, sectionId: string): void {
  state = mutations.toggleSectionHidden(state, rowId, sectionId);
}

export function setSectionTitle(
  rowId: string,
  sectionId: string,
  title: string,
): void {
  state = mutations.setSectionTitle(state, rowId, sectionId, title);
}

export function setRequirementsData(
  rowId: string,
  sectionId: string,
  data: RequirementsSectionData,
): void {
  state = mutations.setSectionData(
    state,
    rowId,
    sectionId,
    "requirements",
    data,
  );
}

export function setHeaderField<K extends keyof Header>(
  field: K,
  value: Header[K],
): void {
  state = mutations.setHeaderField(state, field, value);
}
