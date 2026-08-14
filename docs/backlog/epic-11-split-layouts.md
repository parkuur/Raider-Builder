# Epic 11 — Flexible split layouts

## Goal

Split layouts (two split sections shown side by side) are currently capped at exactly one section
per side. Each side becomes an independently growable column — able to stack any number of split
sections — with add/move/copy affordances equivalent to how the main document flow already works.
Entry into a split layout becomes lazy: adding a lone split section no longer immediately creates a
two-sided layout — it stays a normal document-flow row until a second split section actually joins
it via its own edge affordance. Swap generalizes to work document-wide, and "pairing" terminology is
retired in favor of "split layout"/"split section" (see the CLAUDE.md glossary).

## Scope

- `Row` becomes a discriminated union: `FullRow` (one section, full-width type or a solo split
  section) or `SplitRow` (two independent, unbounded columns of split sections).
- Adding a split section — from the main-flow add menu, or by moving/copying one to a main-flow
  gap — always creates a `FullRow`, rendered nearly full width with a slim "add split section"
  edge affordance whenever its section is split-eligible. That affordance opens the add-menu
  (filtered to split types) and is a drop zone for moving/copying an existing split section onto
  it. Only when a second split section lands there does the row become a real `SplitRow`.
- Once a `SplitRow` exists, each column gets its own add/move/copy gap affordances at
  top/between/bottom, reusing the same gap component the main document flow already uses.
- A split layout exists only while both columns are non-empty. The moment a removal or move-away
  empties one column, the layout is dissolved: every section still in the surviving column becomes
  its own new solo row, in the same order, at the split layout's former position.
- Swap becomes document-wide and unified: any split section (solo or embedded) can swap with any
  other split section anywhere; any full-width row can swap with any other full-width row. The only
  disallowed combination is a true full-width row swapping with an *embedded* split section.
- The split divider (only relevant once a row is an actual `SplitRow`) spans the taller column's
  full height; its badge uses `SquareSplitHorizontalIcon` (replacing `LinkIcon`) pinned at the
  divider's bottom.
- "Pair"/"paired"/"partner"/`Pair`-prefixed identifiers are renamed to "split" terminology
  throughout the model and component layers; the registry's `half: boolean` flag is renamed to
  `split: boolean`.
- Old saved `.json` files using the previous `sections: [Section]|[Section,Section]` shape are not
  supported — `validateRow` rejects them outright, with no migration path.

## Non-goals

- Migrating/loading old-shape saved documents.
- Unifying `RowList`'s top-level row flow and a column's item flow into one fully generic list
  component — only the shared gap component and a new `ColumnView` are shared between them; the two
  flows keep separate outer state machines.
- Enforcing at the `persistence.ts` validation layer that every section inside a split row's
  columns is actually split-eligible per the registry — matches existing precedent of not
  enforcing business-rule invariants (only structural shape) at that layer.
- Renaming the unrelated Monitor List stereo-pair feature or the intra-section
  `pointer-reorder`/`drag-reorder` machinery, which happen to share vocabulary but are separate
  features.

## Stories

### Story: Glossary and epic scaffolding

**Acceptance criteria**
- CLAUDE.md has a Glossary section defining "split layout," "split section," "solo," and
  "embedded."
- This epic doc exists with Goal/Scope/Non-goals/Stories.

### Story: Registry — rename `half` to `split`

**Acceptance criteria**
- `SectionRegistryEntry.half` is renamed to `SectionRegistryEntry.split` in
  `src/lib/sections/registry.ts`, with all registry entries (`contacts`, `quicklook`, `text`)
  updated.
- `filterHalfOnly` is renamed to `filterSplitOnly`; any other `half`-named identifiers in
  `registry-grouping.ts`/`AddSectionMenu.svelte` are renamed to `split` equivalents.
- `pnpm typecheck`/`pnpm lint` clean; no behavior change from this story alone.

### Story: Row data model becomes a `FullRow`/`SplitRow` union

**Acceptance criteria**
- `Row` in `src/lib/model/document-types.ts` is `FullRow | SplitRow`:
  `{ id, kind: "full", section }` / `{ id, kind: "split", columns: [Section[], Section[]] }`.
- No remaining reference to the old `sections: [Section] | [Section, Section]` shape anywhere in
  `src/lib/model/` or `src/lib/state/`.
- `pnpm typecheck` surfaces every downstream call site needing the next stories' work — used as
  the scope map for what follows, even though the app doesn't fully build yet.

### Story: Document mutations — row-level primitives generalized

**Acceptance criteria**
- A private `locateSection`/`replaceSectionInRow` helper pair in `document-mutations.ts` resolves
  a section id to either a `FullRow`'s own section or a specific `SplitRow` column/index, and
  applies an update at that location.
- `removeSection`, `duplicateSectionToNewRow`, `toggleSectionHidden`, `setSectionTitle`,
  `setSectionData` are generalized to work against either row kind via these helpers.
- A private `collapseIfEmptied(rows, rowIndex)` helper: when a `SplitRow`'s column would be left
  empty, replaces that row with one new solo `FullRow` per remaining item in the surviving column,
  in order, at the row's former position.
- `moveSectionToNewRow(doc, sourceRowId, sectionId, atIndex)` (new, replaces
  `extractSectionToNewRow`) moves any section — solo or embedded — into a brand-new standalone
  `FullRow` at a main-flow index, running `collapseIfEmptied` on the source if it was embedded.
- The dead `duplicateSection` function is deleted (confirmed no UI call sites).
- Unit tested: generalized lookup for split-column sources, both `removeSection` branches (row
  deleted vs. row alive), collapse producing 1 vs. multiple solo rows in order, no collapse on
  duplicate.

### Story: Document mutations — promotion functions

**Acceptance criteria**
- `createSplitRow(doc, rowId, section)` (new, replaces `pairSections`) converts a `FullRow` into a
  `SplitRow` with `columns: [[existingSection], [section]]`; no-op if `rowId` isn't a `FullRow`.
- `moveSectionToSplitRow(doc, sourceRowId, sectionId, targetRowId)` (new, replaces
  `moveSectionToPair`) moves any section (solo or embedded) onto a `FullRow` target, converting it
  to a `SplitRow`; runs `collapseIfEmptied` on the source if it was embedded.
- `duplicateSectionToSplitRow(doc, sourceRowId, sectionId, targetRowId)` (new, replaces
  `duplicateSectionIntoPair`) is the copy analog; source untouched.
- `pairSections`, `moveSectionToPair`, `duplicateSectionIntoPair` are deleted.
- Unit tested including no-op-on-wrong-target-kind and solo-vs-embedded source cases.

### Story: Document mutations — column-scoped primitives

**Acceptance criteria**
- `insertSectionIntoColumn(doc, rowId, columnIndex, atIndex, section)`,
  `moveSectionIntoColumn(doc, sourceRowId, sectionId, targetRowId, targetColumnIndex, targetAtIndex)`,
  `duplicateSectionIntoColumn(doc, sourceRowId, sectionId, targetRowId, targetColumnIndex, targetAtIndex)`,
  and `reorderSectionWithinColumn(doc, rowId, columnIndex, fromIndex, toIndex)` are added.
- `moveSectionIntoColumn` runs `collapseIfEmptied` on the source if it was an embedded item whose
  column empties.
- Unit tested: insert into a populated column at start/middle/end; no-op for wrong row `kind` or
  invalid `columnIndex`; same-column self-duplication; full `reorderRows`-style case coverage for
  `reorderSectionWithinColumn`.

### Story: Document mutations — unified swap

**Acceptance criteria**
- `swapSections(doc, locatorA, locatorB)` (new, replaces `swapPairedSections`) swaps section
  content at two arbitrary locators (`{ rowId, column: null }` for a `FullRow`'s section, or
  `{ rowId, column, index }` for a column item); no-op if either locator fails to resolve or both
  resolve to the same slot. Deliberately permissive about *which* combinations are swappable —
  that eligibility is a UI-layer concern (see the RowList story below), not enforced here.
- Unit tested: same-column, cross-column-same-row, cross-row, solo↔solo, solo↔embedded,
  embedded↔embedded, self-swap no-op, unresolvable-locator no-op.

### Story: Validation accepts the new Row union

**Acceptance criteria**
- `validateRow`/`validateDocumentShape` in `src/lib/model/persistence.ts` validate `FullRow` and
  `SplitRow` shapes, rejecting a `split` row whose `columns` isn't a 2-element array of arrays and
  rejecting a `split` row where both columns are empty.
- A file saved in the old `sections: [...]` shape is rejected with a clear validation error.
- `persistence.test.ts` updated: old length-based cases replaced/removed, new `kind`-discriminated
  cases added, including a 3+-item column round-trip.

### Story: Core split-row rendering

**Acceptance criteria**
- `RowView.svelte` branches on `row.kind`: `full` renders one `SectionFrame`, plus the (renamed)
  solo edge-slot whenever `sectionRegistry[section.type].split === true`; `split` renders two new
  `ColumnView.svelte` instances side by side.
- The renamed edge-slot component's CSS changes from today's `flex: 1` (literal 50/50 split) to a
  narrow fixed-width strip, so a solo split section renders nearly full width.
- `ColumnView.svelte` renders a gap before the first item, between each pair, and after the last
  item in its column, reusing the existing shared gap component (no new gap component).
- No swap/collapse/lift wiring required yet — this story is rendering-only, existing specs may
  break at renamed selectors but functional behavior lands in the following stories.

### Story: RowList lift/place rewiring

**Acceptance criteria**
- `liftedSource`'s `kind: "row" | "section"` becomes structural: lifting a `FullRow`'s section is
  always `"row"`, lifting a `SplitRow` column item is always `"section"` (carrying `columnIndex`).
- The edge-slot promotion flow (idle: opens the add-menu filtered to split types; lifted: places
  via `moveSectionToSplitRow`/`duplicateSectionToSplitRow`) and the column-gap flow (places via
  `insertSectionIntoColumn`/`moveSectionIntoColumn`/`duplicateSectionIntoColumn`/
  `reorderSectionWithinColumn`) are both wired.
- `canPairWith` is replaced by a simpler split-eligibility check gating both flows.
- Covered by Playwright cases: add via the edge-slot creates a real split layout; move/copy across
  rows into a specific column position; multi-item column stacking and reorder.

### Story: Document-wide swap wiring

**Acceptance criteria**
- A derived `swapContext` in `RowList.svelte` captures the lifted item's category (full-width /
  solo split / embedded split) and is passed to every row; each row/section locally decides
  swap-target eligibility using the single rule: disallow only (full-width row) × (embedded split
  section) pairs, excluding the lifted item itself.
- Dropping a lifted item on an eligible swap target calls `swapSections` with the two locators.
- Covered by Playwright cases: cross-row split-section swap (solo↔embedded and embedded↔embedded);
  full-width-row swap; confirming an embedded split section never highlights as a target for a
  lifted full-width row (and vice versa).

### Story: Divider/badge visuals

**Acceptance criteria**
- The divider between a `SplitRow`'s two columns spans the taller column's full rendered height
  regardless of item count on either side, via a rule on the column-wrapper boundary (not a
  per-section adjacent-sibling rule).
- The badge is pinned at the divider's bottom, showing `SquareSplitHorizontalIcon` (replacing
  `LinkIcon`), rendering for every `SplitRow` unconditionally.
- `print.css`'s split-row rules are updated for the restructured column-wrapper boundary, including
  the hide-divider-when-a-column-is-fully-hidden-from-print rule.
- Covered by a Playwright case with an uneven multi-item column pairing and a print-emulation
  check.

### Story: Terminology cleanup pass

**Acceptance criteria**
- No "pair"/"paired"/"partner"/`Pair`-prefixed identifier remains in `document-mutations.ts`,
  `document.svelte.ts`, `RowView.svelte`, `SectionFrame.svelte`, `RowList.svelte`, or their CSS
  classes/aria-labels — confirmed via a repo-wide grep excluding the unrelated Monitor List
  stereo-pair feature and the pointer-reorder/drag-reorder machinery.
- `pnpm lint`/`pnpm typecheck` clean; no behavior change from this story alone (pure rename).

### Story: End-to-end regression coverage

**Acceptance criteria**
- `tests/e2e/half-width-pairing.spec.ts` is renamed to `tests/e2e/split-layout.spec.ts`, covering:
  a solo split section rendering near-full-width with the edge affordance; promotion to a real
  split layout; collapse back to solo rows in order when one side empties; multi-item column
  stacking/reorder; cross-row swap; divider spanning a taller multi-item column.
- `save-load-roundtrip.spec.ts` gains a multi-item-column round-trip case;
  `load-invalid-file.spec.ts` gains an old-shape-file-is-rejected case.
- `print-layout.spec.ts`/`print-mobile-parity.spec.ts`/`print-parity-regression.spec.ts` are
  reviewed and updated for the renamed classes/restructured divider; still passing.
- `pnpm test` and `pnpm test:e2e` both pass; `pnpm build`/`pnpm typecheck`/`pnpm lint` clean.
