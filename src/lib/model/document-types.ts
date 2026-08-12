import type { Section } from "./section-types";

export interface Header {
  title: string;
  band: string;
  revision: string;
  date: string;
}

/**
 * Two Sections being members of the same Row's `sections` tuple IS the
 * pairing relationship between them — there is no separate boolean/ID
 * field to keep in sync, and nothing is inferred from position in a
 * flatter list. Reordering Rows can never desynchronize a pair, because
 * both Sections always move together as one Row.
 */
export interface Row {
  id: string;
  sections: [Section] | [Section, Section];
}

export interface RiderDocument {
  header: Header;
  rows: Row[];
}

export function createEmptyHeader(): Header {
  return { title: "", band: "", revision: "1.0", date: "" };
}

export function createEmptyDocument(): RiderDocument {
  return { header: createEmptyHeader(), rows: [] };
}
