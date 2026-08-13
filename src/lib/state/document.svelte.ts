import { sectionRegistry } from "../sections/registry";
import * as mutations from "../model/document-mutations";
import { createId } from "../model/id";
import { createEmptyDocument } from "../model/document-types";
import {
  loadDocumentFromLocalStorage,
  saveDocumentToLocalStorage,
} from "./local-storage";
import type { Header, RiderDocument } from "../model/document-types";
import type { Section, SectionType } from "../model/section-types";
import type { RequirementsSectionData } from "../model/requirements";
import type { EquipmentSectionData } from "../model/equipment";
import type { ChannelListSectionData } from "../model/channel-list";
import type { MonitorListSectionData } from "../model/monitor-list";
import type { BandMembersSectionData } from "../model/band-members";
import type { StageMapSectionData } from "../model/stage-map";
import type { ContactsSectionData } from "../model/contacts";
import type { QuickLookSectionData } from "../model/quicklook";

let state = $state<RiderDocument>(
  loadDocumentFromLocalStorage(Object.keys(sectionRegistry)) ??
    createEmptyDocument(),
);

$effect.root(() => {
  $effect(() => {
    const snapshot = state;
    const timer = setTimeout(() => saveDocumentToLocalStorage(snapshot), 300);
    return () => clearTimeout(timer);
  });
});

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
  // Svelte's deep-reactive $state wraps nested objects in proxies that
  // structuredClone (used inside this mutation) can't clone directly — take
  // a plain snapshot first so the pure mutation layer never has to know
  // about Svelte's reactivity at all.
  state = mutations.duplicateSection($state.snapshot(state), rowId, sectionId);
}

export function duplicateSectionToNewRow(
  sourceRowId: string,
  sectionId: string,
  atIndex: number,
): void {
  state = mutations.duplicateSectionToNewRow(
    $state.snapshot(state),
    sourceRowId,
    sectionId,
    atIndex,
  );
}

export function duplicateSectionIntoPair(
  sourceRowId: string,
  sectionId: string,
  targetRowId: string,
): void {
  state = mutations.duplicateSectionIntoPair(
    $state.snapshot(state),
    sourceRowId,
    sectionId,
    targetRowId,
  );
}

export function reorderRows(fromIndex: number, toIndex: number): void {
  state = mutations.reorderRows(state, fromIndex, toIndex);
}

export function pairSections(rowId: string, type: SectionType): void {
  state = mutations.pairSections(state, rowId, buildSection(type));
}

export function extractSectionToNewRow(
  sourceRowId: string,
  sectionId: string,
  atIndex: number,
): void {
  state = mutations.extractSectionToNewRow(
    state,
    sourceRowId,
    sectionId,
    atIndex,
  );
}

export function moveSectionToPair(
  sourceRowId: string,
  sectionId: string,
  targetRowId: string,
): void {
  state = mutations.moveSectionToPair(
    state,
    sourceRowId,
    sectionId,
    targetRowId,
  );
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

export function setEquipmentData(
  rowId: string,
  sectionId: string,
  data: EquipmentSectionData,
): void {
  state = mutations.setSectionData(state, rowId, sectionId, "equipment", data);
}

export function setChannelListData(
  rowId: string,
  sectionId: string,
  data: ChannelListSectionData,
): void {
  state = mutations.setSectionData(
    state,
    rowId,
    sectionId,
    "channel-list",
    data,
  );
}

export function setMonitorListData(
  rowId: string,
  sectionId: string,
  data: MonitorListSectionData,
): void {
  state = mutations.setSectionData(
    state,
    rowId,
    sectionId,
    "monitor-list",
    data,
  );
}

export function setBandMembersData(
  rowId: string,
  sectionId: string,
  data: BandMembersSectionData,
): void {
  state = mutations.setSectionData(
    state,
    rowId,
    sectionId,
    "band-members",
    data,
  );
}

export function setStageMapData(
  rowId: string,
  sectionId: string,
  data: StageMapSectionData,
): void {
  state = mutations.setSectionData(state, rowId, sectionId, "stage-map", data);
}

export function setContactsData(
  rowId: string,
  sectionId: string,
  data: ContactsSectionData,
): void {
  state = mutations.setSectionData(state, rowId, sectionId, "contacts", data);
}

export function setQuickLookData(
  rowId: string,
  sectionId: string,
  data: QuickLookSectionData,
): void {
  state = mutations.setSectionData(state, rowId, sectionId, "quicklook", data);
}

export function setHeaderField<K extends keyof Header>(
  field: K,
  value: Header[K],
): void {
  state = mutations.setHeaderField(state, field, value);
}
