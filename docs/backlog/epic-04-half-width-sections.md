# Epic 04 — Half-Width Sections

## Goal

Implement the two half-width, pairable section types (`half: true` in the registry): Contacts and
Quick Look. They're grouped into one epic because, beyond their own content, they share the pairing UI
that lets two half-width sections sit side-by-side in one row — full-width sections never participate
in that flow.

Quick Look's story carries a direct fix for a confirmed defect in the reference prototype (see
`CLAUDE.md` §6): row-topic and table-topic rendering diverging instead of sharing structure.

## Scope

- The shared half-width pair-add UI/flow
- Contacts section
- Quick Look section, with row/table topics unified behind one title-row component

## Non-goals

- Full-width sections (epic 03)
- Section-specific print CSS refinement (epic 05)

## Stories

### Story: Build the half-width pairing UI

Implement the UI on top of epic 02's `pair`/`unpair` mutation functions: the "Pair" affordance on a
lone half-width section's row, and the add-menu path that lets a user fill an empty pair slot.

**Acceptance criteria**
- A row containing exactly one half-width section shows a "Pair" control that opens the add-section
  menu filtered to half-width types only (per the registry's `half` field — no hardcoded type list).
- Picking a type from that menu adds it as the second section in the same row, using epic 02's `pair`
  mutation.
- A half-width section can be unpaired back into its own row (removing its partner does this
  implicitly, per epic 02's `remove` behavior).
- A Playwright e2e spec: add a Contacts section, pair a Quick Look section onto it, and assert both
  render side-by-side in one row.

### Story: Register the Contacts section

Rows of name/role/mobile/email for crew and band contacts.

**Acceptance criteria**
- Contact rows support add/edit (name, role, mobile, email)/remove.
- Section is registered per epic 02's registry with `half: true` and sensible default data for a new
  instance.

### Story: Register the Quick Look section with unified row/table topics

Quick Look holds a list of "topics," each either a single-line row (icon + title + short value) or a
small table (tag + title + multiple label/value lines). Both topic kinds must share one title-row
presentational component (icon + icon-picker + title input), so a table topic renders an icon exactly
like a row topic does — the direct fix for the prototype's inconsistency where only row topics got an
icon and table topics didn't even store an `iconKey`.

**Acceptance criteria**
- Both topic kinds carry an `iconKey` in their data (the type union from epic 02 is extended so table
  topics are not missing this field), and both render through the same title-row component.
- Row topics: icon-picker + title + single value field.
- Table topics: icon-picker + title (using the shared title-row component, plus their own tag field)
  + a list of label/value lines that can be added/edited/removed.
- Topics of both kinds can be added, reordered, and removed within the section.
- A Playwright e2e spec adds one row topic and one table topic and asserts both render an icon and
  that changing a table topic's icon via the picker updates its rendered icon — the direct regression
  test for the prototype's row/table icon-parity bug.
