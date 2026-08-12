# Epic 02 — Document Shell and Data Model

## Goal

Build the document-level scaffolding every section type will plug into: the core data model, the
section-type registry, the document store and its mutation functions, the header, save/load, the
add-section flow, and the print CSS shell. No individual section's content (channels, members, etc.)
is built here — this epic produces the frame those sections snap into.

## Scope

- Core types (`RiderDocument`, `Header`, `Row`, `Section`)
- Section-type registry (type → default data, label, half-width flag, component)
- Document store + pure mutation functions (add/remove/duplicate/reorder rows, pair/unpair
  half-width sections, hide-from-print toggle)
- Header fields
- JSON Save/Load round-trip
- Add-section UI (menu, empty state)
- Print CSS shell (page geometry, hiding editing-only chrome)

## Non-goals

- Any section type's actual field/content UI (epics 03-04)
- Section-specific print rules (epic 05)

## Stories

### Story: Define the core document types

Model the document shape in `src/lib/model/`, independent of Svelte.

**Acceptance criteria**
- Types exist for `RiderDocument` (header + rows), `Header` (title, band, revision, date), `Row` (id +
  ordered list of one or two `Section`s), and a generic `Section` (id, type, title, hidden flag, and a
  `data` payload whose shape is keyed by `type`).
- Section `data` payloads are typed per section type (a discriminated union keyed on `Section.type`),
  not `any`/`unknown` blobs — later epics extend this union rather than loosening it.
- Types live in `src/lib/model/` and have no Svelte imports.

### Story: Build the section-type registry

Implement the single registry described in `CLAUDE.md` §4 that every section type registers into.

**Acceptance criteria**
- One module exports a registry mapping section `type` → `{ label, half, defaultData(), component }`.
- Adding a new section type requires one entry in this registry and nothing else changed in
  document-shell code (no `if/switch` on `type` anywhere in the shell).
- The registry is empty or has only placeholder entries at the end of this epic — epics 03-04 populate
  it with real section types.

### Story: Build the document store and mutation functions

Implement the central store and the pure functions that mutate it, per `CLAUDE.md` §5.

**Acceptance criteria**
- One Svelte store (or runes-based state module) holds the `RiderDocument`.
- Pure, named, unit-tested functions exist for: add row (with a section of a given type), remove a
  section (removing its row if it was the section's only one), duplicate a section, reorder rows,
  pair two half-width sections into one row / unpair them back to separate rows, toggle a section's
  hidden-from-print flag.
- None of this logic lives inline in component code; components call these functions.
- Each mutation function has Vitest unit tests covering at least one edge case (e.g. removing the last
  section in a row, reordering to the first/last position, pairing when one side is already paired).

### Story: Implement row reordering via drag-and-drop

Let users reorder the row stack by dragging, backed by the reorder function above.

**Acceptance criteria**
- Rows can be reordered by drag-and-drop in the UI.
- The visual drop-target/insertion-point feedback is clear (matching the prototype's drop-zone
  affordance is acceptable as a starting point, not a requirement to match pixel-for-pixel).
- A Playwright e2e spec drags a row to a new position and asserts the resulting order, per
  `CLAUDE.md` §9.

### Story: Build the header

Implement the document header fields.

**Acceptance criteria**
- Title, band/act name, revision, and date fields are editable and bound to the store.
- Header renders as the top of the printable document (not just an editing-chrome panel).

### Story: Implement JSON Save and Load

Round-trip the whole document through a local JSON file, matching the prototype's approach.

**Acceptance criteria**
- "Save" downloads the current `RiderDocument` (header + rows) as a `.json` file named from the
  band/title, matching the prototype's naming convention.
- "Load" accepts a `.json` file, validates its shape before applying it (rejecting malformed files
  with a visible error rather than silently corrupting state), and replaces the current document.
- A Playwright e2e spec builds a document, saves it, reloads the page, loads the saved file back, and
  asserts the document is unchanged (per `CLAUDE.md` §9's save/load round-trip requirement).

### Story: Build the add-section flow and empty state

Implement the menu for adding a new section (row-level "Add Section" and pair-level "Pair" flows) and
what an empty document looks like.

**Acceptance criteria**
- "Add Section" (at start, between rows, or at end) opens a menu listing every section type from the
  registry, grouped or flagged by half-width vs. full-width per the registry's `half` field.
- Picking a type inserts a new row with a default-data section of that type at the chosen position.
- An empty document (no rows) shows a clear call-to-action to add the first section, not a blank page.

### Story: Build the print CSS shell

Establish page geometry and editing-chrome hiding for print, independent of any section's content.

**Acceptance criteria**
- Print stylesheet sets page size/margins appropriate for a printable document (e.g. A4, matching the
  prototype's `doc-page` sizing as a reference).
- All editing-only controls (add/remove/drag/menu buttons, file inputs) are hidden in print/print-
  preview, leaving only document content.
- A Playwright spec using print-media emulation asserts editing chrome is absent from the printed
  layout (per `CLAUDE.md` §9); section-specific print layout correctness is out of scope here and
  covered in epic 05.
