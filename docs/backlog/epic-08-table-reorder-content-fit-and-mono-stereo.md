# Epic 08 — Table Reorder, Content-Fit Columns, and Monitor List Mono/Stereo

## Goal

Bring every list/table section up to a consistent standard: drag-reorder everywhere a list
of things is edited, columns that size themselves to their content instead of static CSS
widths, a fixed mobile layout for the Channel List table, and Monitor List migrated off its
row-pairing model onto the same `stereo: boolean` shape Channel List already uses.

## Scope

- Drag-reorder for Quick Look table-topic lines, Equipment items, and Band Members.
- Content-fit column sizing (one designated stretch column per table, others sized to their
  longest current value) for Channel List, Monitor List, Equipment, and Quick Look
  table-topic lines; a simple right-aligned value field for Quick Look row topics.
- Channel List mobile reflow: 48V, Notes, and the mono/stereo toggle move to a labeled
  second row per channel under the existing mobile breakpoint; desktop and print are
  unaffected.
- Monitor List: remove the Pair/Unpair feature and `pairedWithId` model field, replace with
  a Channel-List-style `stereo: boolean` toggle and a print-only mode label.

## Non-goals

- User-driven drag-to-resize columns (considered and rejected — doesn't hold up across the
  range of screen sizes this app needs to support; content-fit sizing replaces it).
- Any change to Channel List's existing stereo numbering (`"3–4"` combined labels) — Monitor
  List explicitly does **not** get that behavior, per this epic's Monitor List story.
- Reordering at the document-row/section level (already exists, unrelated system).

## Stories

### Story: Content-fit column foundation

A shared, pure `fitColumnChars` function and an `autosizeTextarea` action that other stories
build on — no product-visible change on its own.

**Acceptance criteria**
- `src/lib/model/column-fit.ts` exports `fitColumnChars(values, placeholder?, min?,
  padding?)`, unit tested for: longest value wins, placeholder sets the floor when every
  value is shorter than it, `padding` is added, `min` is enforced.
- `src/lib/actions/autosize-textarea.ts` exports a Svelte action that sizes a textarea's
  height to its content on mount, on input, and when its bound value changes externally.

### Story: Quick Look table-topic line drag reorder

**Acceptance criteria**
- Lines within a table topic can be dragged to reorder, using the same drag-handle pattern
  as topic-level reordering, without interfering with it.
- `reorderQuickLookLine` in `src/lib/model/quicklook.ts` is unit tested (happy path, no-op
  on unknown topic/line, no-op when the topic isn't a table topic).
- Covered by a Playwright e2e case.

### Story: Equipment item drag reorder

**Acceptance criteria**
- Items within either of Equipment's two lists can be dragged to reorder; dragging within
  one list never affects the other.
- `reorderEquipmentItem` in `src/lib/model/equipment.ts` is unit tested.
- Covered by a Playwright e2e case.

### Story: Band Members drag reorder

**Acceptance criteria**
- Member cards can be dragged to reorder, operating on the underlying flat member list
  regardless of which balanced-grid visual row a card currently renders in.
- `reorderBandMember` in `src/lib/model/band-members.ts` is unit tested.
- Covered by a Playwright e2e case that drags a card across a visual-row boundary.

### Story: Monitor List — remove pairing, add mono/stereo

**Acceptance criteria**
- `MonitorRow` no longer has `pairedWithId`; it has `stereo: boolean` instead.
- The Pair/Unpair buttons are gone; a mono/stereo toggle (shared `StereoToggle` component,
  also adopted by Channel List) replaces them.
- Monitor List numbering is always one sequential number per row — never a combined
  "N–N+1" label, regardless of stereo/mono.
- A `MONO`/`STEREO` label renders at the end of each row, print-only.
- `row-list.ts`'s now-unused pairing exports (`PairableRow`, `pairListRows`,
  `unpairListRow`, `numberRows`) are removed.
- Unit tests updated/added for `numberMonitorRows`, `updateMonitorRow` stereo toggling, and
  `removeMonitorRow` without pairing cleanup.
- Covered by a Playwright e2e case (stereo toggle + print-only label visibility).

### Story: Channel List content-fit columns

**Acceptance criteria**
- Name and Source size themselves to their longest current value (or placeholder, if
  shorter); Notes is the stretch column and wraps (textarea) instead of overflowing.
- Covered by a Playwright e2e case: typing a long value widens its column uniformly across
  rows; long Notes text wraps and is fully visible in print, not clipped/scrolled.

### Story: Monitor List content-fit columns

**Acceptance criteria**
- Player and Type size themselves to their longest current value; Mix Notes is the stretch
  column and wraps.
- Covered by a Playwright e2e case, mirroring the Channel List one.

### Story: Equipment content-fit columns

**Acceptance criteria**
- Item name is the stretch column; Count sizes itself to its longest current value.
- Covered by a Playwright e2e case.

### Story: Quick Look table-topic content-fit columns

**Acceptance criteria**
- Within a table topic, Label is the stretch column; Value sizes itself to the longest
  value across all of that topic's lines, so every line in the topic shares one width.
- Covered by a Playwright e2e case.

### Story: Quick Look row-topic value right-align

**Acceptance criteria**
- A row topic's value field is right-aligned. No column-width/model change.

### Story: Channel List mobile reflow

**Acceptance criteria**
- Under the existing ≤640px breakpoint, 48V, Notes, and the mono/stereo toggle render in a
  labeled second row per channel; the header row no longer shows `48V`/`Notes` column
  headers.
- Desktop layout (any width above the breakpoint) is unaffected.
- Print always renders the desktop single-row layout, regardless of the viewport that
  printed it.
- Covered by a Playwright e2e case, including a print-emulation assertion at a narrow
  viewport.
