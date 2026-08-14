# Epic 10 — Quick Look Text Topic & Editor Polish

## Goal

A handful of independent editor-quality fixes: stop empty fields from printing their placeholder
text, add a third Quick Look topic kind for longer free-form notes, fold Quick Look's two add
buttons into one dropdown to match the header meta-field pattern now that there are three kinds,
fix the paired-section divider's height, and let move mode swap two paired sections by dropping
one onto the other.

## Scope

- A general print rule hiding placeholder text (without collapsing field boxes) for every
  placeholder-bearing input/textarea in the app, not just the section title field that already
  had a targeted fix.
- A new Quick Look "Text" topic kind: icon + title row, with an auto-sizing multi-line text box
  below (mirroring the Text section's body field).
- Quick Look's "+ Add Row Topic" / "+ Add Table Topic" buttons replaced by a single "Add topic"
  trigger + dropdown offering Row / Table / Text, matching `DocumentHeader`'s add-field pattern.
- The divider line between two paired half-width sections stretches to the height of the taller
  section, not just the second section's own box height.
- In move mode, dropping a lifted half-width section onto its own paired sibling swaps their
  positions.

## Non-goals

- Promoting Quick Look's topic-kind union to a full section-type-style registry — the existing
  small discriminated-union/switch pattern (already used for header meta fields' 3-kind union)
  is kept for consistency at this scale.
- Cross-row swapping (dropping a lifted section onto a section in a *different* paired row) —
  only swapping within a section's own existing pair is in scope.
- A shared reusable Dropdown/Menu component — both the header meta-field add menu and this new
  Quick Look add menu stay hand-rolled per usage, matching existing precedent.

## Stories

### Story: Placeholder text must not print

**Acceptance criteria**
- No placeholder-bearing `input`/`textarea` in the app shows its placeholder text when printed
  or in print-media emulation, while its box/layout position is unaffected (no column/grid
  reflow from an empty field).
- The existing section-title print behavior (collapsing the blank line entirely for an untitled
  section) is unchanged.
- Covered by a Playwright print-emulation case exercising at least one field per section type.

### Story: Quick Look — Text topic type

**Acceptance criteria**
- A Text topic renders its icon + title on one row (shared with Row/Table topics) and an
  auto-sizing multi-line text box below.
- `addQuickLookTopic`/`updateQuickLookTextContent` in `src/lib/model/quicklook.ts` are unit
  tested (happy path + no-op cases), matching the existing row/table function coverage.
- Covered by a Playwright e2e case: add a Text topic, enter multi-line content, confirm it
  autosizes and survives a JSON save/load round trip.

### Story: Quick Look — "Add topic" dropdown

**Acceptance criteria**
- The two always-visible add buttons are replaced by one "Add topic" trigger that opens a
  dropdown offering Row / Table / Text; picking one appends that topic kind.
- Existing Playwright coverage that added a row/table topic via the old buttons is updated to
  use the dropdown, and confirms all three kinds are reachable.

### Story: Paired-section divider spans the taller section

**Acceptance criteria**
- When two paired half-width sections differ in height, the divider between them spans the full
  height of the taller one, on screen.
- Print output still shows a full-height divider between visible paired sections, and no divider
  when one side of a pair is hidden from print.
- Covered by a Playwright case in `half-width-pairing.spec.ts` asserting the divider's rendered
  height matches the taller section at more than one content-length combination.

### Story: Move mode — drop on own pair swaps places

**Acceptance criteria**
- `swapPairedSections` in `src/lib/model/document-mutations.ts` swaps the two sections of a
  paired row and is a no-op for an unknown row id or a row that isn't a pair; unit tested.
- In move mode, lifting one half of a pair and dropping it onto its sibling swaps their
  positions; the row still has exactly two sections afterward.
- Covered by a Playwright case in `half-width-pairing.spec.ts` driving the full lift → drop →
  swap flow through the UI.

### Story: Quick Look text topic aligns with table topic fields

**Acceptance criteria**
- A Text topic's body left edge lines up with a Table topic's Label field left edge, and its
  right edge lines up with a Table topic's Value field right edge, on screen and in print.
- Covered by a Playwright case in `quicklook.spec.ts` asserting the alignment in both media.

### Story: Band Members avatar circle sized to balance its card

**Acceptance criteria**
- The avatar circle's side gaps (to the card's left/right edge) match its top gap (to the
  card's top edge), instead of the circle reading as small and off-center.
- Covered by a Playwright case in `band-members.spec.ts` asserting the three gaps match.
