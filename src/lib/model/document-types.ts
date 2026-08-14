import type { Section } from "./section-types";
import type { HeaderMetaField } from "./header-meta";
import { createDefaultHeaderMetaFields } from "./header-meta";
import type { HeaderLogo } from "./header-logos";

export interface Header {
  title: string;
  band: string;
  metaFields: HeaderMetaField[];
  logos: HeaderLogo[];
  creditHidden: boolean;
}

/**
 * A split layout is two independently growable columns, not a fixed pair —
 * `SplitRow.columns` holds an unbounded stack of Sections on each side.
 * A Row starts out (and stays, if never split) a FullRow regardless of
 * whether its lone Section happens to be split-eligible; it only becomes a
 * SplitRow once a second split Section actually joins it, and it collapses
 * back into standalone FullRows the moment either column empties out. See
 * the CLAUDE.md glossary for "split layout"/"solo"/"embedded".
 */
export interface FullRow {
  id: string;
  kind: "full";
  section: Section;
}

export interface SplitRow {
  id: string;
  kind: "split";
  columns: [Section[], Section[]];
}

export type Row = FullRow | SplitRow;

export interface RiderDocument {
  header: Header;
  rows: Row[];
}

export function createEmptyHeader(): Header {
  return {
    title: "",
    band: "",
    metaFields: createDefaultHeaderMetaFields(),
    logos: [],
    creditHidden: false,
  };
}

export function createEmptyDocument(): RiderDocument {
  return { header: createEmptyHeader(), rows: [] };
}
