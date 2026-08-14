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
