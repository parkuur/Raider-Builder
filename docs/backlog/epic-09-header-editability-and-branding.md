# Epic 09 — Header Editability, Branding, and Field-Level Polish

## Goal

Make the document header fully customizable — freely add/remove/relabel meta fields, attach
up to four logo images, and an optional credit line — add an info modal explaining the app's
client-side data model and linking to Frosty Sound, and fix a handful of smaller field-level
issues (Contacts alignment, Channel/Monitor List column labels and centering, print-clipping
on two freeform text fields, Stage Map z-index/scroll behavior, and a Quick Look table-topic
alignment control). Also replaces the app's hand-drawn `ChromeIcon` set with `phosphor-svelte`
icons throughout.

## Scope

- Header meta fields become a dynamic, ordered, per-field-kind (key:value / date / text) list
  instead of fixed Rev/Date fields, with add/remove/relabel.
- Up to four uploadable logo images in the header, equal height, capped to half the header's
  width, scaling down together as more are added.
- An optional, togglable footer credit line in the header.
- A shared `Modal` component and an info modal reachable from the top bar.
- Contacts value right-align; Channel/Monitor List column labels made editable and their
  numeric/boolean columns' header centering fixed.
- Print-clipping fix for Requirements and Text section freeform fields via the existing
  autosize-textarea action.
- Full replacement of `ChromeIcon`'s hand-drawn icon set with `phosphor-svelte` icons.
- Stage Map: contain item z-index within the canvas so it can't render above the sticky top
  bar; horizontal-only scroll.
- Quick Look: a per-table-topic left/center/right alignment toggle for the Value column.

## Non-goals

- Header meta-field drag-reorder UI (the pure reorder function is included; wiring a drag
  handle to it is optional/stretch).
- i18n of default labels/credit text.
- Extending the autosize-textarea fix to Channel/Monitor List Notes or Stage Map labels — they
  already use it and don't have the clipping bug.
- Making the logo cluster's 50%-of-header-width ratio user-configurable.
- Deep field-level validation of section `data` in `persistence.ts` beyond what already exists
  — the new Channel/Monitor List `columnLabels` field stays self-healing/unvalidated, matching
  every other section's data.

## Stories

### Story: Header meta-fields — data model & migration

**Acceptance criteria**
- `Header.metaFields: HeaderMetaField[]` replaces the fixed `revision`/`date` strings, with a
  `kind`-discriminated union (`keyvalue` / `date` / `text`) mirroring `QuickLookTopic`.
- `src/lib/model/header-meta.ts` exports add/remove/set-label/set-value/reorder functions, all
  immutable and no-op on an unknown id (or, for label-setting, on a `text`-kind field).
- `validateHeader` in `src/lib/model/persistence.ts` synthesizes `metaFields` from legacy
  `revision`/`date` strings when absent, and validates each entry's shape when present.
- Unit tests cover every function's happy path and no-op cases, plus the legacy-migration and
  malformed-entry validation cases.

### Story: Header meta-fields — editor UI

**Acceptance criteria**
- Rev/Date render as editable label + value fields, each individually deletable.
- A "+" button opens an anchored popover offering key:value / date / text kinds; picking one
  appends a new field.
- Covered by a Playwright e2e case: add one field of each kind, rename a label, delete a
  field, reload and confirm the result persisted.

### Story: Header logos — layout foundation

**Acceptance criteria**
- `src/lib/model/logo-layout.ts` exports `computeLogoHeight(aspectRatios, maxHeight,
  maxTotalWidth, minHeight?)`, unit tested for: empty input, a single logo that already fits,
  multiple logos exceeding the width budget (uniformly scaled), and a near-zero budget
  (clamped to `minHeight`).

### Story: Header logos — upload UI

**Acceptance criteria**
- A "+" button on the header's right edge uploads an image (FileReader → data URL, matching
  the Band Members photo pattern); up to 4 logos, capped.
- All logos render at one shared height computed by `computeLogoHeight`; the combined width
  never exceeds half the header's width, and adding more logos scales all of them down
  together to stay equal height.
- Each logo can be removed individually.
- Covered by a Playwright e2e case: upload 2+ images of different aspect ratios, assert equal
  rendered height and combined width ≤ 50% of the header.

### Story: Header footer credit line

**Acceptance criteria**
- A small credit line ("Generated with Frosty Sound rider builder rider.frostysound.fi")
  renders in the header by default, with a hide toggle.
- When hidden, the real credit text is absent from both screen and print, replaced on screen
  only by "Please consider leaving the message in to support my work" with an unhide toggle.
- `Header.creditHidden` defaults to `false` for documents that predate this field.
- Covered by a Playwright e2e case, including a print-emulation check.

### Story: Shared Modal + info modal in top bar

**Acceptance criteria**
- `src/lib/components/Modal.svelte` is extracted from `AddSectionMenu`'s existing
  backdrop+dialog implementation with no visual change to `AddSectionMenu` itself.
- An info button next to the Frosty Sound logo in the top bar opens a modal covering: this is
  a free Frosty Sound service; the app runs fully client-side with no data sent to a server
  after page load; a link to the project's GitHub repository; and a short blurb about Frosty
  Sound.
- Covered by a Playwright e2e case: open via the toolbar button, confirm the GitHub link, and
  confirm Escape closes it.

### Story: Contacts value right-align

**Acceptance criteria**
- Contact mobile/email values render right-aligned.

### Story: Channel List column labels + centering fix

**Acceptance criteria**
- Every Channel List column header (Ch, Channel, Source, 48V, Notes) is independently
  editable, defaulting to today's text, and self-heals for documents saved before this field
  existed.
- The Ch and 48V header cells render centered (fixing a pre-existing CSS specificity bug that
  left them rendering left-aligned despite a centering rule already existing).
- Unit tests cover the column-label default-merge accessor and its setter. Covered by a
  Playwright e2e case: rename a header and confirm it persists; assert the Ch/48V headers are
  computed as center-aligned.

### Story: Monitor List column labels + centering fix

**Acceptance criteria**
- Same as the Channel List story, for Monitor List's Mon, Player, Type, and Mix Notes headers,
  with the Mon header's centering fix. Mode is excluded — its header only ever renders in
  print, so there's no on-screen surface to edit a label for it, and it keeps its fixed text.

### Story: Print-clipping fix — Requirements & Text section fields

**Acceptance criteria**
- Requirements' detail text and the Text section body auto-grow to fit their content (via the
  existing `autosizeTextarea` action) instead of keeping a manually-dragged height.
- Covered by a Playwright e2e case: long multi-line text in each field is fully visible with
  no clipping, on screen and in print-emulation.

### Story: Replace ChromeIcon with phosphor-svelte

**Acceptance criteria**
- Every `ChromeIcon` usage (Section chrome hide/show/duplicate/remove/move, Save/Load menu,
  Contacts add-email, row-gap add-section, and the new credit-line toggle) renders the
  matching `phosphor-svelte` icon instead.
- `ChromeIcon.svelte` and `chrome-icon-keys.ts` are deleted once nothing references them.
- CLAUDE.md's icon guidance no longer references a hand-drawn set that stays as-is.

### Story: Stage Map — contain item z-index

**Acceptance criteria**
- Stage items, regardless of how many times they've been brought to front, never render above
  the sticky top bar when the page is scrolled.

### Story: Stage Map — horizontal-only scroll

**Acceptance criteria**
- The Stage Map canvas wrapper never shows a vertical scrollbar, only horizontal.

### Story: Quick Look — table-topic value alignment toggle

**Acceptance criteria**
- Each table topic has a left/center/right alignment toggle above its Value column, cycling
  through the three states and showing the icon matching the current state.
- Every line's value in a topic shares that topic's alignment; other topics are unaffected.
- `cycleQuickLookTableValueAlign` in `src/lib/model/quicklook.ts` is unit tested. Covered by a
  Playwright e2e case.
