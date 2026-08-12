# Epic 03 — Full-Width Sections

## Goal

Implement the six full-width section types (`half: false` in the registry): Channel List, Monitor
List, Band Members, Stage Map, Requirements, Equipment. These are grouped into one epic because they
share the same layout contract (always occupy a full row) even though their content differs — unlike
the half-width sections in epic 04, which additionally share a pairing UI.

Three of these stories carry direct fixes for confirmed defects in the reference prototype (see
`CLAUDE.md` §6): stereo-channel numbering, the Band Members grid, and Stage Map stacking order. Those
stories' acceptance criteria are non-negotiable regression coverage, not nice-to-haves.

## Scope

- Channel List and Monitor List sections, with a correct stereo-pairing model
- Band Members section, with a balanced-grid layout function
- Stage Map section, with explicit item stacking order
- Requirements section
- Equipment section

## Non-goals

- Contacts and Quick Look (epic 04)
- Section-specific print CSS refinement beyond basic printability (epic 05)

## Stories

### Story: Register Channel List and Monitor List, with a correct stereo-pairing model

Both sections are tabular row-lists (channel: number/name/source/48V/notes; monitor: number/player/
type/mix notes) that share the same numbering problem the prototype got wrong.

Model pairing as an explicit relationship between two row IDs — e.g. each row carries an optional
`pairedWithId` pointing at its stereo partner, validated to be mutual and adjacent when displayed —
rather than a lone `linked` boolean plus a sequential "skip the next label" counter. The numbering
function must be pure, live in `src/lib/model/`, and handle: an unmatched/broken pairing (a row whose
`pairedWithId` doesn't resolve to a mutual partner) by numbering it normally rather than corrupting
subsequent numbers, and a pairing that survives a reorder because it's keyed by ID, not position.

**Acceptance criteria**
- Both section types are registered (per epic 02's registry) with row add/remove/reorder, and their
  type-specific fields (48V toggle + transducer/source for channels; type + mix notes for monitors).
- A pure `numberRows(rows)` (or equivalent) function in `src/lib/model/` assigns display numbers,
  giving a paired row's two members a combined label (e.g. "3–4") and is unit-tested against: a normal
  unpaired list, a pair in the middle of the list, a pair at the very end, a row with a dangling/
  unmatched pairing, two independent pairs back-to-back, and a pairing surviving a row reorder.
- No row ever renders with a missing/blank number as a side effect of an unrelated row's pairing state
  — every row either gets its own number or is clearly part of a pair's combined number.
- A Playwright e2e spec: create a stereo pair, reorder rows around it, delete one side of the pair, and
  assert numbering stays correct/predictable throughout (the epic's regression spec per `CLAUDE.md`
  §9).

### Story: Register the Band Members section with a balanced-grid layout

Cards show avatar/initials, name, and instrument(s), with an optional photo. Row composition must be
computed, not left to CSS wrapping.

Implement a pure `balancedRows(n, maxPerRow = 4): number[]` in `src/lib/model/` returning the item
count for each row such that: it minimizes row count first (height), then minimizes the widest row
(width) subject to that row count, and per-row counts differ by at most one. E.g. `n=1..4` → `[n]`;
`n=5` → `[3,2]` or `[2,3]`; `n=6` → `[3,3]`; `n=7` → `[4,3]`; `n=8` → `[4,4]`; `n=9` → `[3,3,3]`.

**Acceptance criteria**
- `balancedRows` is unit-tested for `n = 0..20`, asserting: row count equals `ceil(n / maxPerRow)`, no
  row exceeds `maxPerRow`, and the difference between the largest and smallest row in the result is at
  most 1.
- The Band Members component renders cards grouped into rows using this function's output, not CSS
  `flex-wrap`.
- Photo upload, initials fallback, and the show/hide-photos toggle work as in the prototype.
- A Playwright e2e spec adds members up to at least `n=9`, checking row membership counts at a few
  values (e.g. 4, 5, 7, 9) against `balancedRows`'s contract.

### Story: Register the Stage Map section with explicit stacking order

A freeform canvas where icons (mic/DI/amp/drum/monitor/xlr/power/riser) are placed, dragged, and (for
risers) resized. Each item must carry an explicit order/`z` field that a pure "bring to front" function
updates on interaction — never inferred from array position or creation order.

**Acceptance criteria**
- Items are added via the category buttons, matching the prototype's shapes/abbreviations (circle/
  square/triangle, dashed border for risers) as a visual reference.
- Items can be dragged to reposition; risers can be resized via a drag handle; canvas depth (height) is
  resizable.
- Each item has an explicit stacking field; a pure `bringToFront(items, id)` function in
  `src/lib/model/` returns items with that field updated so the given item renders above all others,
  and is unit-tested (e.g.: item A created first, item B created after; clicking A must bring it above
  B despite B's later creation).
- Any pointerdown/drag-start on an item calls `bringToFront` before the drag begins.
- A Playwright e2e spec: create item A, create item B (which visually overlaps/renders above A per
  creation order), click A, and assert A now renders above B — the direct regression test for the
  prototype's stacking bug.

### Story: Register the Requirements section

Free-text requirement groups, each with a heading and body text.

**Acceptance criteria**
- Groups can be added, edited (heading + text), reordered within the section, and removed.
- Section is registered per epic 02's registry with sensible default data for a new instance.

### Story: Register the Equipment section

Two parallel lists (e.g. "Band Provides" / "Venue Provides"), each a set of item/quantity rows with
editable list titles.

**Acceptance criteria**
- Both list titles are editable; each list supports add/edit/remove of item rows (name + quantity).
- Section is registered per epic 02's registry with sensible default titles/data for a new instance.
