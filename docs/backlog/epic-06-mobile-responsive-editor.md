# Epic 06 — Mobile-Responsive Editor

## Goal

Make the editor fully usable on mobile viewports — editing, reordering, and pairing all work by
touch, and nothing requires pinch-zoom or horizontal panning to reach — while print output stays
governed entirely by `@page`/print.css and is unaffected by any screen-only responsive change.
Alongside this, replace the app's native-HTML5-drag-and-drop interaction model, which doesn't work
on touch at all and has known rough edges on desktop (no auto-scroll near the viewport edge), with
a touch-capable model everywhere.

## Scope

- Section framing switches from bordered boxes to divider rules (horizontal between stacked rows,
  vertical between paired half-width sections), at every viewport size — this also becomes the
  visual signal that two sections are paired once they're no longer necessarily side-by-side.
- The toolbar collapses into a hamburger menu below the mobile breakpoint.
- Document-level row/section reordering and pairing move to a tap-to-lift/tap-to-place model,
  replacing native drag-and-drop, on both desktop and mobile.
- Within-section row-list reordering (channel list, monitor list, contacts, requirements,
  quicklook) moves from native HTML5 DnD to a Pointer-Events-based continuous drag.
- Half-width layouts and Equipment's two-column grid stack vertically below the mobile breakpoint
  (screen-only; print keeps today's side-by-side layout regardless of the originating device).
- Section padding goes edge-to-edge on mobile now that the border is gone.
- The Stage Map canvas scales down to a floor size on narrow viewports, then pans horizontally for
  anything past that floor, so no icon is ever unreachable on a phone.

## Non-goals

- No changes to the model/mutation-layer signatures (`reorderRows`, `moveSectionToPair`,
  `pairSections`, `extractSectionToNewRow`, `DragReorderState`, the row-list model helpers) — this
  epic is entirely a presentation/interaction-layer change, per `CLAUDE.md` §5's
  view/model separation.
- No offline/PWA support, no native app wrapper.
- No change to the save/load JSON document format.
- The header logo (tracked separately, outside this epic).

## Stories

### Story: Replace section boxes with divider rules

`SectionFrame.svelte` currently draws a full 1px border with horizontal padding around every
section. Replace it with a divider-rule model: a horizontal rule between stacked rows (rendered
once per row boundary, in `RowView.svelte`/`RowList.svelte`'s row stack, not per section), and a
vertical rule between the two sections of a paired row. The rule between paired sections is
visually lighter/tighter than the rule between unrelated rows — that difference in weight is the
"these two are paired" signal once pairing can no longer only rely on physical side-by-side
adjacency (needed ahead of the mobile-stacking story below). Horizontal section padding is
dropped now that there's no box to pad inside of.

**Acceptance criteria**
- No section renders a bordered box; adjacent rows are separated by a single horizontal rule, and
  a paired row's two sections are separated by a single vertical rule.
- The paired-row rule is visually distinct (weight/spacing) from the between-rows rule, with no
  new component or model field required — driven by the existing `row.sections.length === 2`
  already available where the rule is rendered.
- The first row has no leading rule and the last row has no trailing rule.
- Print output is checked against today's baseline via `pnpm build && pnpm preview` and Playwright
  print-media emulation — spacing may tighten (padding removal) but no section becomes bordered or
  loses its visual grouping.
- Existing Playwright specs that assert on `.section-frame` structure/spacing still pass or are
  updated for the new rule-based DOM.

### Story: Collapse the toolbar into a hamburger menu on narrow screens

Below the mobile breakpoint (this story introduces the breakpoint value the rest of the epic
reuses — plain CSS has no shared token for use inside `@media` conditions, so the literal value is
documented once here, `640px`, and repeated verbatim with a comment in each later story's media
query), `SaveLoadControls.svelte`'s four buttons (Load/Save/Clear/Print) collapse behind a single
hamburger icon button that opens/closes a menu listing the same four actions.

**Acceptance criteria**
- Above the breakpoint, the toolbar is pixel-equivalent to today.
- Below the breakpoint, the toolbar shows one hamburger button; opening it reveals all four
  actions (with their existing icons/labels), each still calling the same handlers
  (`triggerLoad`/`save`/`clear`/`print`) — no change to `SaveLoadControls.svelte`'s script logic,
  only to how the buttons are exposed.
- The menu closes after an action is chosen, and on outside click/Escape.
- A Playwright e2e spec drives the mobile-width toolbar: open the hamburger menu, trigger Save,
  confirm the download fires.

### Story: Tap-to-lift/tap-to-place row and section reordering

Replace `RowList.svelte`'s native-DnD-driven `dragSource`/`hoverZoneIndex`/`hoverPairRowId` state
machine with a click-driven `liftedSource`. A "move" trigger toggles the lift; while something is
lifted, every `RowDropZone` and eligible `PairSlot` renders as an available target (not just
whichever one a pointer happens to be hovering), and tapping/clicking a target calls the same
`reorderRows` / `extractSectionToNewRow` / `moveSectionToPair` functions already wired to
`onDrop` today (`src/lib/state/document.svelte.ts`) — the model layer does not change.

Moves the "move whole row" trigger out of the current fixed-width side gutter
(`.row-view__handle`) into a slim full-width bar above each row (frees the horizontal strip for
mobile; vertical space is cheap). Moves "detach one side of a pair" into `SectionFrame.svelte`'s
existing header icon row (alongside hide/duplicate/delete), replacing the per-section
`DragHandle` shown today only when `sectionCount === 2`.

**Acceptance criteria**
- Lifting a row (or a paired section) via its trigger highlights every valid drop target
  simultaneously; tapping/clicking one performs the move and clears the lift; tapping the lift
  trigger again, or a non-target area, cancels without moving anything.
- Reordering, extracting a paired section back to its own row, and pairing a standalone half
  section onto another's `PairSlot` all produce the same document state as today's drag-based
  flows (covered by existing `document-mutations.test.ts` / `row-list.test.ts`, unchanged).
- Works identically via mouse click and touch tap; no `draggable`/`dragstart`/`dragover`/`drop`
  remains in `RowList.svelte`, `RowView.svelte`, or `SectionFrame.svelte`'s document-level wiring.
- `tests/e2e/reorder-rows.spec.ts` and `tests/e2e/half-width-pairing.spec.ts` are rewritten to
  drive the lift/place interaction instead of Playwright's `dragTo`.

### Story: Pointer-Events-based row reordering within sections

Add a Pointer-Events-based reorder action (sibling to `src/lib/actions/pointer-drag.ts`, which is
already the pattern for the Stage Map's freeform positioning) that hit-tests the row under the
pointer against sibling row rects and feeds the existing `DragReorderState.start`/`over`/
`resolveDrop` (`src/lib/components/drag-reorder.svelte.ts` — unchanged). Swap channel-list,
monitor-list, contacts, requirements, and quicklook (which threads its `DragReorderState` through
`QuickLookTopic.svelte`) from native `DragHandle` wiring onto the new action. `touch-action: none`
is scoped to the handle element only, so page/list scrolling elsewhere is unaffected.

**Acceptance criteria**
- Dragging a row's handle reorders that row's list the same way for mouse and touch, in every one
  of the five sections listed above.
- `DragReorderState`'s existing unit tests (`tests/unit/components/drag-reorder.test.ts`) and the
  model-level row-list tests pass unchanged — only the DOM input layer changed.
- `tests/e2e/contacts.spec.ts`, `tests/e2e/quicklook.spec.ts`, `tests/e2e/requirements.spec.ts`,
  and the incidental reorder step in `tests/e2e/channel-list-stereo.spec.ts` are rewritten for the
  new pointer-based gesture (Playwright's `dragTo` no longer applies).
- Scrolling a long list on a touch viewport still works everywhere except directly on a drag
  handle.

### Story: Responsive stacking for half-width layouts and Equipment

Below the mobile breakpoint, `RowView.svelte`'s `.row-view__sections` switches from a row flex
layout to a column, and Equipment's internal `grid-template-columns: 1fr 1fr`
(`EquipmentSection.svelte`) collapses to one column. Both changes are screen-only
(`@media screen and (max-width: …)`); `print.css` gains the matching override to force the
side-by-side layout back regardless of the printing device's viewport, since print already reflows
to the `@page` box independent of screen width.

**Acceptance criteria**
- Below the breakpoint, a paired row's two sections stack vertically in document order; Equipment
  renders as one column.
- At/above the breakpoint, layout is pixel-equivalent to today.
- A new Playwright print-media-emulation spec, run against a narrow (mobile) viewport, asserts
  paired sections and Equipment still render side-by-side/two-column under print — confirming
  print is unaffected by the screen breakpoint, per `CLAUDE.md` §9.

### Story: Edge-to-edge mobile section padding

Below the same breakpoint, `DocumentShell.svelte`'s own horizontal padding (currently a fixed
`var(--space-5)` on the shell, regardless of viewport) drops toward zero, and `SectionFrame`'s
remaining padding drops to vertical-only, so section content spans the full device width. (The
shell's `max-width: 8.27in` itself already caps rather than forces the width, so it needs no
change — this story is about the padding budget stacked on top of it, both the shell's own and
each section's.)

**Acceptance criteria**
- No horizontal scroll/pan is needed to read or edit any section on a viewport as narrow as
  360px, other than the Stage Map (covered by its own story below).
- Print is unaffected (the shell's print-time width is already governed independently, per the
  above story's reasoning).

**Note (found during implementation):** Channel List and Monitor List are dense multi-column
tables (several fixed-width columns plus multiple text inputs) that don't fit a 360px viewport
even with the shell's own padding minimized — reducing padding alone can't fix a table whose
*content* needs more than the available width. Rather than force those columns/inputs
illegibly small, each table's overflow is contained to the table itself
(`overflow-x: auto` on a wrapper, screen-only) so a long row never forces the page itself to
scroll horizontally — the invariant this story actually guarantees is "the page never scrolls
horizontally," not "no element ever needs a contained scroll." Channel List and Monitor List are
therefore a second carve-out alongside the Stage Map.

### Story: Responsive Stage Map canvas

Below the breakpoint, the Stage Map canvas scales down (items are positioned by `%` of container
width but sized in fixed px today — `StageMapSection.svelte` — so a naive shrink lets fixed-size
icons crowd or spill past the 0%/100% edge) to a floor scale that keeps icons tappable and labels
legible; past that floor, the canvas becomes horizontally pannable (`overflow-x: auto`) so every
icon stays reachable regardless of viewport width.

**Acceptance criteria**
- No canvas item or its label is ever fully unreachable (off-screen with no way to scroll to it)
  on a viewport as narrow as 360px.
- Existing pointer-based item drag/resize/canvas-height behavior (`pointer-drag.ts`) is unaffected
  at any scale.
- A regression e2e spec (per `CLAUDE.md` §9's Stage Map click-to-front requirement) confirms
  click-to-front ordering still works at a narrow viewport and scaled canvas.
- Print renders the Stage Map at its current fixed print layout, unaffected by the mobile
  scale/pan mechanism.

### Story: Print-parity regression pass

A dedicated QA pass (matching epic 05's precedent of an appended QA-results section) running
Playwright print-media emulation across every section type, populated with representative data, at
a viewport that originated the mobile-stacked layout — confirming the printed page is unchanged
from the pre-epic baseline.

**Acceptance criteria**
- Print-media Playwright run across all nine section types (per `CLAUDE.md` §9) from both a
  desktop-width and a mobile-width originating viewport produces the same rendered print layout.
- Any divergence found is fixed or explicitly documented as an accepted change, not silently left.
