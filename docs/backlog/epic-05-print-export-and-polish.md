# Epic 05 — Print/Export and Polish

## Goal

With every section type built (epics 03-04) on top of the document shell (epic 02), finish the
printable output for each section, do a cross-section consistency pass, and run a final manual QA
pass that specifically re-verifies the four defects `CLAUDE.md` §6 was written to prevent.

## Scope

- Section-specific print CSS
- Cross-section UI/UX polish
- Final manual QA checklist covering the four fixed-bug scenarios end-to-end

## Non-goals

- New functionality — this epic is refinement of what epics 01-04 already built.

## Stories

### Story: Section-specific print CSS

Extend epic 02's print shell (page geometry + hiding editing chrome) with per-section rules so each
section's printed layout matches its on-screen composition.

**Acceptance criteria**
- Channel/Monitor tables print without truncation or overflow across a page break-friendly layout.
- The Stage Map canvas prints at a legible, proportionate size (not cut off or excessively scaled).
- The Band Members grid prints using the same balanced-row grouping as on-screen (epic 03's
  `balancedRows`), not a different print-only layout.
- A Playwright spec using print-media emulation checks at least one populated instance of every
  section type for absence of overflow/clipping.

### Story: Cross-section consistency pass

Sweep every section for shared interaction patterns that should look and behave the same everywhere.

**Acceptance criteria**
- Hover/focus states, drag affordances (grip icons, drop-zone highlighting), and remove/duplicate/
  hide controls are visually and behaviorally consistent across all eight section types.
- Every section type has a clear empty state (e.g. "no channels yet — Add Channel") rather than a
  bare empty table/list.

### Story: Final manual QA pass against the four fixed defects

A deliberate, documented walkthrough confirming the product-level intent behind `CLAUDE.md` §6 holds
once every section exists together in one document (not just in isolation, as epics 03-04's own specs
verified).

**Acceptance criteria**
- A checklist (recorded in this file or linked from it) is executed manually against a single realistic
  document containing multiple sections of each type, confirming:
  1. Band Members grid stays balanced (rows differing by at most one) as members are added/removed
     alongside other sections in the same document.
  2. Stereo-paired channels/monitors keep correct numbering after reordering rows at the document
     level (not just within one section).
  3. Stage Map icons added in any order can always be brought to front by clicking them, in a document
     that also has other sections above/below it.
  4. Quick Look row and table topics both show icons consistently when placed in a paired half-width
     row alongside Contacts.
- Any gap found is filed as a follow-up story (in this file or a new epic) before this story is
  considered done — this pass exists to catch integration issues the per-epic specs couldn't see.
