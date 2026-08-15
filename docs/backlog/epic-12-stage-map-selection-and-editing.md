# Epic 12 — Stage Map selection & editing tools

## Goal

The Stage Map section supports placing, moving, and removing one item at a time, with no concept
of selection. This epic brings it closer to a real diagramming tool: multi-select via drag-marquee
and Ctrl/Cmd+click, group move, keyboard delete, and copy/paste (including pasting into a different
Stage Map section in the same document). Alongside selection, it adds two new item types (Rack,
I/O) and fixes two standing ergonomics issues: the canvas depth-resize handle is too small and
partly clipped on mobile, and the label field's Enter/Shift+Enter behavior is backwards for mobile
typing (holding Shift for a newline is awkward; committing on plain Enter surprises mid-sentence).

A follow-up pass (this branch) closes two remaining ergonomics gaps the original 8 stories left in
place: copy/paste/delete are only reachable via keyboard shortcuts, with no equivalent on mobile (no
on-screen delete affordance and no way to trigger Ctrl/Cmd+C/V), and every `"name"` category item is
permanently stuck as a live text input, which blocks it from ever being selected, dragged, or grouped
like other items. It also explores two materially larger, optional mobile-canvas affordances —
pinch-to-zoom and two-finger pan — which the canvas has never had any form of, marked as stretch work
given the added complexity.

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

**Follow-up scope (this branch):**
- A right-click (desktop) / long-press (mobile) context menu on Stage Map items, and on the canvas
  background itself, offering Cut, Copy, Paste, and Delete, acting on the current selection with the
  same select-then-act semantics as a plain click when triggered on an item.
- The `"name"` category item renders a static label by default (selectable/draggable like any other
  item) and only becomes an editable `<input>` after a double-click/double-tap, exiting back to the
  static label on blur.
- *Stretch:* a two-finger pan on the canvas below the mobile breakpoint, with one finger still
  reserved for the existing item-drag/marquee-select interactions. (Pinch-to-zoom was considered
  alongside this but dropped: it isn't part of the desktop version, and the canvas's existing
  auto-fit scale already keeps content legible without a user-controlled zoom.)

## Non-goals

- OS clipboard integration (`navigator.clipboard`) — the in-app clipboard does not survive a page
  reload or work across browser tabs/windows.
- Rotation, resizing, or any new geometry field on `StageItem` beyond what Rack/I-O reuse from
  existing categories.
- Arrow-key nudging of selected items, or any other new keyboard interaction beyond
  delete/copy/paste/escape.
- Persisting selection state itself in the saved `.json` document.

**Follow-up non-goals (this branch):**
- Generalizing the new context-menu component or long-press action to any section type other than
  Stage Map — it's written generically, but Stage Map remains its only consumer.
- Any OS/browser-native context menu behavior — Stage Map items suppress the browser's own
  `contextmenu` entirely in favor of the new custom menu, rather than supplementing it.
- Persisting pan state, or adding any new `StageItem`/`StageMapSectionData` geometry field for it —
  it's transient view state with the same lifecycle as the existing `canvasScale`.
- Any change to `pointerDrag`'s public single-pointer contract beyond the minimal cancel hook the
  pan story adds — every other existing drag/marquee/resize call site keeps behaving exactly as
  before.

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

### Story: Right-click / long-press context menu — Cut, Copy, Paste, Delete

**Acceptance criteria**
- A new `src/lib/components/ContextMenu.svelte` renders a `no-print`, fixed-positioned menu clamped
  inside the viewport at a given `x`/`y`, with its item content supplied by the caller via a
  `children` snippet.
- `ContextMenu` closes itself (calls its `onClose` prop) on a `pointerdown` anywhere outside the
  menu, the `Escape` key, or a scroll of the page or the Stage Map's own scroll container.
- A new `src/lib/actions/long-press.ts` exports a `longPress` action: on a non-mouse `pointerdown`,
  starts a ~500ms timer that fires `onLongPress(event)` unless cancelled by the pointer moving past
  a ~14px threshold or being released/cancelled first — it does not rely on the native `contextmenu`
  event, which fires unreliably from a touch long-press on iOS Safari. The threshold is deliberately
  more generous than a typical click/drag threshold so ordinary hand tremor during the hold doesn't
  cancel the gesture before it fires; it is independent of and does not modify `pointerDrag`'s own
  movement handling.
- `oncontextmenu` on a Stage Map item (desktop) calls `preventDefault()`/`stopPropagation()` and
  opens the context menu at the event's coordinates; the same `use:longPress` action on the item
  opens the identical menu from a mobile long-press.
- Right-clicking or long-pressing an item not already part of the current selection first selects
  just that item, using the same rule a plain click uses (`resolveClickSelection`, widened to accept
  any event exposing `ctrlKey`/`metaKey`); an item already part of a multi-selection is left fully
  intact.
- The canvas background itself (not just individual items) also carries `oncontextmenu` and
  `use:longPress`, opening the same menu without changing the current selection — this is the only
  way to reach Paste when the canvas has no items yet, or when the user wants to paste without
  targeting an existing item. The item-level handler stops propagation so a right-click/long-press on
  an item never also triggers the canvas's handler.
- The menu offers Cut, Copy, Paste, and Delete, calling shared `cutSelection`/`copySelection`/
  `pasteClipboard`/`deleteSelection` functions (also reused by matching `Ctrl/Cmd+X/C/V` and
  Backspace/Delete keyboard shortcuts, extracted from `handleCanvasKeydown` — no duplicated logic).
  Cut, Copy, and Delete are disabled when the current selection is empty; Paste is disabled when the
  clipboard is empty — both states captured at the moment the menu opens.
- Paste from the context menu lands the pasted group at the point the menu was opened (converted to
  canvas-percent coordinates via `canvasPercentPoint`), not at a fixed offset from the copied items'
  original position — `cloneStageItemsForPaste` takes an optional `targetCenter`, shifting the whole
  pasted group so its centroid lands there while preserving each item's position relative to the
  others in a multi-item paste. The keyboard `Ctrl/Cmd+V` shortcut has no cursor position to anchor
  to, so it omits `targetCenter` and keeps the original small fixed-offset behavior.
- E2e coverage in `tests/e2e/stage-map.spec.ts`: right-click opens the menu and Delete removes the
  selection; right-clicking an unselected item while another is selected switches the selection
  first; right-clicking a member of a multi-selection leaves the group intact; Copy then Paste via
  the menu duplicates the selection at the paste location rather than next to the original; Cut
  removes the selection and makes it available to Paste; right-clicking empty canvas opens a menu
  whose Paste works and whose Cut/Copy/Delete are disabled when nothing is selected; Escape and an
  outside click both close the menu; a simulated long-press (synthetic `pointerdown` with
  `pointerType: "touch"`, waiting out the delay) opens the same menu.

### Story: Double-click/double-tap edit mode for Name items

**Acceptance criteria**
- The `"name"` category item no longer always renders an `<input>`; by default it renders a static
  label (`item.nameText`, or a distinctly-styled "Name" placeholder when empty) in the input's
  current position, and is selectable/draggable through the normal `pointerDrag` path exactly like
  every other category — the always-present input previously covered the entire hit area and blocked
  drag/select entirely.
- `StageMapSection.svelte` holds a new local `editingNameId: string | undefined` (`$state`, not
  persisted); `ondblclick` on a Name item's static label sets it to that item's id, swapping in the
  `<input>` (autofocused with its text selected, via a new `src/lib/actions/focus-and-select.ts`
  action).
- The input's existing Escape-blurs / live-autosave behavior is unchanged; its `onblur` (from any
  cause) additionally clears `editingNameId`, returning the item to its static-label rendering.
- `editingNameId` is also cleared when the item being edited is removed (Backspace/Delete or the
  context menu's Delete), when a different item is double-clicked into edit mode, and defensively
  alongside the canvas's existing Escape-clears-selection handling.
- `tests/e2e/stage-map.spec.ts`'s existing Name-marker test is updated to double-click the label
  before asserting the input, and gains cases: a plain pointerdown/drag on a non-editing Name item
  selects and moves it like any other item; double-click enters edit mode and typing updates the
  name; Escape/blur exits edit mode without losing the typed value.

### Story: Two-finger pan on the stage map canvas, mobile only (stretch)

*Stretch/optional — materially larger and riskier than the stories above, since it's the first
change to touch `pointer-drag.ts` and the coordinate-conversion math shared by every existing
drag/marquee/resize interaction. Recommended as a separate pass after the stories above are merged
and validated, with the full existing `stage-map.spec.ts` suite re-run as a regression gate.*

**Acceptance criteria**
- A new `src/lib/actions/multi-touch-gesture.ts` tracks concurrent `touch`-type pointers by
  `pointerId`; on a second concurrent touch pointer it calls a new `cancelAllPointerDrags()` (added
  to `pointer-drag.ts`) so any in-progress single-finger drag/marquee cleanly stops rather than
  continuing alongside the new gesture, then computes the pointer midpoint's frame-to-frame delta and
  applies it as a new local `panX`/`panY` (`$state`, not persisted), composed into the canvas's
  transform alongside the existing auto-fit `canvasScale`.
- A single finger continues to drive the existing item-drag and marquee-select interactions
  completely unchanged; a second concurrent touch pointer is required to engage pan.
- The existing native horizontal scroll on `.stage-map__scroll` is disabled in favor of the new pan
  once a two-finger gesture has been used at least once for that instance, avoiding the two
  mechanisms fighting over the same content's position; native scroll remains the fallback until
  then.
- A `no-print` hint, visible only below the 640px mobile breakpoint **and** when
  `matchMedia("(pointer: coarse)")` matches, tells the user to use two fingers to move the map — the
  width breakpoint alone isn't a touch-capability check (it's reused as-is from the rest of the app
  for `canvasScale`), so a mouse-driven narrow desktop window or a mouse/trackpad-driven iPad session
  would otherwise see a hint that doesn't apply to them, even though the pan gesture itself already
  correctly never engages for non-touch pointers either way.
- `tests/e2e/stage-map.spec.ts` gains synthetic two-pointer `dispatchEvent` coverage at the existing
  narrow-viewport breakpoint, plus a regression case confirming a single-finger item drag never pans
  the canvas; Playwright has no first-class multi-touch simulation API, so this validates the
  component's own gesture code path rather than real touch hardware, with a manual-device pass called
  out as part of sign-off.
