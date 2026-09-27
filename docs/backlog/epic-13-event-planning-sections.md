# Epic 13 — Event planning sections

## Goal

Extend the editor from a rider-only document to band-internal gig planning. Equipment becomes a
single-list split section (the old "Band Provides / Venue Provides" look is recreated by placing two
Equipment sections in a split layout). Four new section types are added — Packing List, Schedule,
RF Allocation and Setlist — and grouped under their own "Planning" heading in the Add Section menu
so they don't get mixed in with the rider sections. Channel List rows gain a per-row hide toggle.

## Scope

- **Registry category.** `SectionRegistryEntry` gains `category: "rider" | "planning"`.
  `groupSectionTypesByWidth` in `registry-grouping.ts` is replaced by `groupSectionTypes`, returning
  categories in a fixed order (Rider, Planning), each listing full-width types before split types.
  `AddSectionMenu.svelte` renders a heading per category; with `filterSplitOnly`, empty categories
  are dropped.
- **Equipment.** `EquipmentSectionData` becomes `{ items: EquipmentItem[] }`; the registry entry
  becomes `split: true`. The per-list title is gone — the section title does that job. Every
  function in `equipment.ts` loses its `listIndex` parameter.
- **Legacy Equipment migration (temporary).** `migrateLegacyEquipmentRows` in
  `src/lib/model/migrations/legacy-equipment.ts`, called from `validateDocumentShape` in
  `persistence.ts` (so both file load and localStorage restore pass through it). A `FullRow` whose
  Equipment `data` still has a `lists` array becomes a `SplitRow`: column 1 keeps the original
  section id, titled `lists[0].title` with `lists[0].items`; column 2 is a new section id titled
  `lists[1].title` with `lists[1].items`; both copy the section's `hidden` flag. Logged in
  `docs/backlog/migration-removals.md` per CLAUDE.md §5.1.
- **Migration notice (permanent).** `ValidationResult`'s ok branch gains `migrated: string[]`. When a
  file load or localStorage restore reports migrations, a dismissible, non-printing notice says:
  "This file used an older format and was converted. Save it again to keep it in the current
  format."
- **Row hiding.** `ChannelRow` gains `hidden?: boolean` (missing = `false`). `numberChannelRows`
  gives a hidden row an empty label and does not advance the counter (a hidden stereo row claims no
  numbers). Hidden rows are dimmed on screen and carry `.hidden-from-print`. A shared
  `RowHideToggle.svelte` (Phosphor `EyeIcon`/`EyeSlashIcon`, matching `SectionFrame`'s toggle) is
  used by every row/group hide UI. Hiding means the same as section hide: dimmed on screen, absent
  from print, skipped in numbering; hiding a group hides its contents.
- **Editable column labels.** Every new table has editable column headers, as Channel List and
  Monitor List do. The optional-`columnLabels`-merge logic moves into a shared
  `src/lib/model/column-labels.ts` used by all tables (Channel/Monitor refactored onto it, no
  behavior change). Defaults: Packing List `Item / Qty / From / Notes`; Schedule
  `Time / Item / Who / Notes`; RF Allocation `Device / Window / Bandwidth / Frequency / Notes`;
  Setlist `# / Song / Artist / Notes`.
- **Shared grouped list.** Packing List and Schedule share one model (`grouped-list.ts`) and one
  component (`GroupedRowList.svelte`), per CLAUDE.md §6's "same concept, shared code" rule.
  - `GroupedList<R> = { entries: GroupedEntry<R>[] }`, an entry being `{ kind: "row"; row: R }` or
    `{ kind: "group"; id; title; hidden; rows: R[] }`. Top level is an ordered mix of rows and
    groups; groups don't nest.
  - Pure functions: add row (top level or into a group, at an index), add group, remove row, remove
    group with contents, ungroup (release rows to the top level at the group's position), set group
    title, toggle row/group hidden, update row, `moveGroupedRow(list, rowId, { groupId, index })`
    (within/into/out of/between groups), `moveGroup(list, groupId, index)`,
    `isRowEffectivelyHidden`, and `resolveGroupedDrop(list, draggedId, targetId)` which maps a drop
    on a row or group header to a move — a group dropped inside another group resolves to that
    group's top-level position, so groups never nest.
  - `GroupedRowList.svelte` renders entries, a shared group-header row (drag handle, title input,
    `RowHideToggle`, ungroup, delete) and add-row/add-group controls; each section supplies its row
    cells via a `row` snippet. Drag uses one flat id drop space, generalizing `DragReorderState` /
    `pointer-reorder`, with `resolveGroupedDrop` deciding what a drop means.
- **Packing List** (`packing-list`, full width, planning). Row:
  `{ id, item, count, source, notes, hidden }`. Grouped; hide on rows and groups. Qty column sized
  with `fitColumnChars`.
- **Schedule** (`schedule`, full width, planning). Grouped-list row type is a slot:
  `{ id, start, end, hidden, items: ScheduleItem[] }`, `ScheduleItem = { id, title, who, notes }`.
  Times are free text (end optional), ordered by drag, never auto-sorted. A new slot starts with one
  empty item; items can be added/removed (no remove button when a slot has one item — deleting the
  slot is separate). `moveScheduleItem(data, itemId, { slotId, index })` moves items within or
  across slots (including across groups); moving a slot's only item out leaves a fresh empty item
  behind, so a slot never has zero items. Item drag has its own drop space inside the Schedule
  component, separate from slot/group drag. The time cell spans all of a slot's items, shown as
  "start–end" or just "start". Hide on slots and groups.
- **RF Allocation** (`rf-allocation`, full width, planning). Row:
  `{ id, device, window, bandwidth, frequency, notes }`, all free text. Flat list using
  `row-list.ts` helpers.
- **Setlist** (`setlist`, split, planning). Row: `{ id, song, artist, notes }`, numbered 1…n by
  `numberSetlistRows` (reusing `NumberedRow`).
- Each new type is wired through `SectionDataMap`, the registry, a `set<Type>Data` setter in
  `document.svelte.ts` and its own `src/lib/sections/<type>/` folder.

## Non-goals

- RF helpers: frequency clash/intermod detection, checking a frequency lies within its window.
- Parsing or sorting schedule times.
- Nested groups.
- Per-row hide for Monitor List, Setlist or RF Allocation.
- Any migration beyond Equipment.

## Stories

### Story: Migration ledger and CLAUDE.md rule

**Acceptance criteria**
- `docs/backlog/migration-removals.md` exists with a table of temporary migrations (migration, code
  location, reason, date added, remove after), seeded with the existing legacy header
  `revision`/`date` → `metaFields` migration.
- CLAUDE.md has a §5.1 "Temporary data migrations" rule; §1 and §3 list the new section types.
- This epic doc exists.

### Story: Add Section menu categories

**Acceptance criteria**
- Every registry entry has a `category`; `groupSectionTypes` is unit tested (category order,
  full-before-split within a category, empty categories).
- The Add Section menu shows "Rider" and "Planning" headings; split-only mode drops empty
  categories.
- `add-section-and-empty-state.spec.ts` asserts the headings and that each type is under the right
  one.

### Story: Channel List — hide rows

**Acceptance criteria**
- `RowHideToggle.svelte` exists and is used for the Channel List row toggle.
- `numberChannelRows` skips hidden rows; unit tested for a hidden middle row, a hidden stereo row,
  hide-then-reorder and hide-then-delete.
- `channel-list-hidden-rows.spec.ts` covers the dimmed style, numbering skipping the hidden row, the
  row being absent in print emulation, and the flag surviving a save → load round-trip.

### Story: Equipment — single-list split section and legacy migration

**Acceptance criteria**
- Equipment is a single list with `split: true`; `equipment.ts` functions have no `listIndex`.
- `migrateLegacyEquipmentRows` is unit tested (full conversion, hidden section, empty second list,
  current-format data untouched), carries the `TEMPORARY MIGRATION` comment and has a ledger row.
- `migrated` is reported on load and is empty for current-format documents (unit tested); the
  "save it again" notice shows for both file load and localStorage restore.
- `equipment.spec.ts` / `equipment-content-fit.spec.ts` updated; an e2e case loads a legacy fixture
  and asserts a split layout plus the notice, and a current-format file shows no notice.

### Story: Shared column-label helper

**Acceptance criteria**
- `column-labels.ts` is unit tested; Channel List and Monitor List use it, and their existing
  column-label specs pass unchanged.

### Story: Setlist section

**Acceptance criteria**
- Model functions and `numberSetlistRows` unit tested.
- `setlist.spec.ts`: add/edit/reorder/remove songs with correct numbering, edit column labels, and
  place the section in a split layout beside another split section.

### Story: RF Allocation section

**Acceptance criteria**
- Model functions unit tested.
- `rf-allocation.spec.ts`: add/edit/reorder/remove, edit column labels, save → load round-trip.

### Story: Grouped-list model

**Acceptance criteria**
- `grouped-list.ts` unit tested: row moves within/into/out of/between groups, clamped indices,
  unknown-id no-ops, ungroup preserving order, group-hide cascade via `isRowEffectivelyHidden`,
  `resolveGroupedDrop` for each target kind and never nesting groups.

### Story: Grouped-list component and cross-group drag

**Acceptance criteria**
- `GroupedRowList.svelte` renders groups and ungrouped rows with a shared group header, supports
  dragging rows and groups via `resolveGroupedDrop`, and reuses `RowHideToggle`.

### Story: Packing List section

**Acceptance criteria**
- Model built on `grouped-list.ts`, unit tested.
- `packing-list.spec.ts`: add groups and rows, drag a row into/out of/between groups, hide a row and
  a group (checked under print emulation), edit column labels, save → load round-trip.

### Story: Schedule section

**Acceptance criteria**
- Slot/item model unit tested: new slot has one item, add/remove items, `moveScheduleItem` within a
  slot and across slots in different groups, moving a slot's only item leaves an empty item behind,
  unknown-id no-ops.
- `schedule.spec.ts`: add slots and items, group slots under a heading (e.g. "Packing up"), drag a
  slot between groups, drag an item from one slot into another, edit column labels, print layout
  with the time cell spanning the slot's items, save → load round-trip.

### Story: Cross-cutting suite updates

**Acceptance criteria**
- Every new type is covered by `save-load-roundtrip.spec.ts`, `print-layout.spec.ts` and
  `mobile-no-overflow.spec.ts`.
- The placeholder-not-printed check covers the new fields.
