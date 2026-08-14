# Epic 12 — Stage Map selection & editing tools

## Goal

The Stage Map section supports placing, moving, and removing one item at a time, with no concept
of selection. This epic brings it closer to a real diagramming tool: multi-select via drag-marquee
and Ctrl/Cmd+click, group move, keyboard delete, and copy/paste (including pasting into a different
Stage Map section in the same document). Alongside selection, it adds two new item types (Rack,
I/O) and fixes two standing ergonomics issues: the canvas depth-resize handle is too small and
partly clipped on mobile, and the label field's Enter/Shift+Enter behavior is backwards for mobile
typing (holding Shift for a newline is awkward; committing on plain Enter surprises mid-sentence).

## Scope

- Two new `StageItemCategory` values: `rack` (square, like `amp`) and `io` (rectangle, like
  `xlr`/`di`), added to `STAGE_ITEM_CATEGORIES`, `DEFAULT_LABELS`, and the palette.
- Label `textarea`: remove the current `Enter (no Shift) → blur` interception so Enter always
  inserts a newline like a normal textarea; add `Escape → blur` on both the label textarea and the
  name input, keeping whatever text is currently there (matches the existing
  live-autosave-per-keystroke model).
- `.stage-map__depth-handle` grows to 3x its current height and no longer gets clipped by
  `.stage-map__scroll`'s `overflow-y: hidden`.
- A `selectedIds` selection concept, local to each `StageMapSection` instance (not persisted to the
  document): click selects, Ctrl/Cmd+click toggles membership, a drag-marquee over empty canvas
  selects everything it intersects (replacing the selection, or adding to it under Ctrl/Cmd), and a
  plain click/tap on empty canvas clears it. Selected items render with a red outline, suppressed
  under `@media print`.
- Dragging one item of a multi-item selection moves the whole selection together; starting a drag
  brings the whole selection to front together, preserving relative order among themselves.
- Backspace/Delete removes every selected item, scoped so it never fires while the user is typing
  in a label/name field.
- Ctrl/Cmd+C copies the current selection to an in-app (module-level, non-persisted) clipboard;
  Ctrl/Cmd+V pastes it back with a small position offset, re-selecting the newly-pasted items.
  Works between any two Stage Map sections rendered in the same page, since the clipboard is shared
  page state rather than per-component.

## Non-goals

- OS clipboard integration (`navigator.clipboard`) — the in-app clipboard does not survive a page
  reload or work across browser tabs/windows.
- Rotation, resizing, or any new geometry field on `StageItem` beyond what Rack/I-O reuse from
  existing categories.
- Arrow-key nudging of selected items, or any other new keyboard interaction beyond
  delete/copy/paste/escape.
- Persisting selection state itself in the saved `.json` document.

## Stories

### Story: New item types — Rack and I/O

**Acceptance criteria**
- `StageItemCategory` gains `"rack"` and `"io"`; `STAGE_ITEM_CATEGORIES` gives `rack` a `"square"`
  shape (matching `amp`) and `io` a `"rectangle"` shape (matching `xlr`/`di`); `DEFAULT_LABELS` adds
  `rack: "Rack"`, `io: "I/O"`.
- Both appear as palette buttons in `StageMapSection.svelte`'s `categories` list.
- Unit tests in `tests/unit/model/stage-map.test.ts` cover `addStageItem` defaults for both new
  categories.
- E2e coverage in `tests/e2e/stage-map.spec.ts` asserts Rack renders as a full-height square (like
  Amp) and I/O renders as a half-height rectangle (like XLR/DI).

### Story: Label field Enter/Escape rework

**Acceptance criteria**
- The label `textarea`'s `onkeydown` no longer intercepts Enter/Shift+Enter at all — both insert a
  newline via native behavior.
- Both the label `textarea` and the name `input` blur on Escape, keeping their current value as-is.
- `tests/e2e/stage-map.spec.ts`'s existing Shift+Enter/Enter test is updated to assert plain Enter
  now inserts a newline; a new case asserts Escape exits edit mode without needing a click away.

### Story: Depth-handle touch target and clipping fix

**Acceptance criteria**
- `.stage-map__depth-handle` height goes from `6px` to `18px`, with its `bottom` offset adjusted so
  it stays centered on the canvas's bottom edge at the new size.
- `.stage-map__scroll` gains enough bottom padding that the enlarged handle is never clipped by its
  retained `overflow-y: hidden` (kept for the reason already documented in that rule: pairing an
  explicit `auto`/`hidden` avoids the CSS spec forcing an implicit `visible` axis to compute as
  `auto`).
- E2e coverage asserts the handle's full bounding box (≈18px tall) is present and unclipped within
  the scroll container, and remains draggable to adjust canvas height.

### Story: Single/multi selection — click, Ctrl/Cmd+click, red highlight

**Acceptance criteria**
- `StageMapSection.svelte` holds `selectedIds: Set<string>` as local `$state`, not part of
  `StageMapSectionData`.
- Clicking an item selects only it; Ctrl/Cmd+click toggles that item's membership without affecting
  the rest of the selection; clicking an item already part of a multi-selection leaves the whole
  selection intact (so a subsequent drag can move the group — wired in a later story).
- Selected items render `.stage-map__item--selected` (red outline), which is reset to nothing under
  `@media print`.
- E2e coverage: click selects and highlights one item; Ctrl+click adds a second item to the
  selection without deselecting the first; Ctrl+click again on a selected item removes just that
  one.

### Story: Marquee drag-select and click-empty-canvas clears

**Acceptance criteria**
- A `pointerDrag` on the canvas background (not on items) tracks a marquee rectangle from pointerdown
  to the live pointer position and renders a `.stage-map__marquee` overlay while active.
- On release, every item whose element intersects the marquee rectangle is selected — replacing the
  existing selection by default, or added to it when Ctrl/Cmd is held during the drag.
- Item drags gain `stopPropagation: true` (matching the existing resize-handle) so starting an item
  drag never also starts a marquee underneath it.
- A release with no meaningful movement (a plain click on empty canvas) selects nothing, which is
  the same code path as "clicking empty canvas clears the selection" — no separate handler needed.
- E2e coverage: dragging a rectangle across several items selects all of them; clicking empty canvas
  afterward clears the selection.

### Story: Group move and group bring-to-front

**Acceptance criteria**
- `bringManyToFront(items, ids)` and `moveStageItemsBy(data, ids, dxPercent, dyPercent)` added to
  `stage-map.ts`, unit tested: relative order among the moved/raised items is preserved, each item's
  position is still independently clamped, and ids not present in `data.items` are ignored.
- Starting a drag on any item in a multi-item selection brings the whole selection to front together
  (instead of just the dragged item) and moves every selected item by the same per-tick delta.
- E2e coverage: select two items, drag one, and assert both moved by the same amount.

### Story: Backspace/Delete removes selection

**Acceptance criteria**
- `removeStageItems(data, ids)` added to `stage-map.ts`, unit tested (removes multiple present ids,
  no-ops on ids not present).
- `.stage-map__canvas` is made focusable (`tabindex={0}`); every item-click, marquee-drag, and
  canvas-background interaction focuses it. A single `onkeydown` on the canvas itself, guarded to
  only act when the canvas element (not a descendant form control) is the event target, handles
  Backspace/Delete (remove the selection) and Escape (clear the selection).
- E2e coverage: selecting items and pressing Backspace removes them; as a regression check, typing
  and backspacing inside a label `textarea` still edits its text normally and does not delete the
  item.

### Story: Copy/paste

**Acceptance criteria**
- New `src/lib/state/stage-map-clipboard.ts` holds the last-copied `StageItem[]` as module-level
  (non-reactive, non-persisted) state, with `copyStageItems`/`getStageMapClipboard` functions.
- `cloneStageItemsForPaste(data, items)` added to `stage-map.ts`, unit tested: assigns fresh ids,
  applies a fixed position offset (clamped the same way `moveStageItem` clamps), stacks the new
  items' `order` above the existing max, and leaves the original items/data untouched.
- Ctrl/Cmd+C and Ctrl/Cmd+V are wired into the same canvas `onkeydown` handler as the delete story;
  paste re-selects the newly-pasted items.
- E2e coverage: copying and pasting a single item and a multi-item selection within one Stage Map
  section (offset applied, pasted items become the new selection); copying in one Stage Map section
  and pasting into a second Stage Map section in the same document.
