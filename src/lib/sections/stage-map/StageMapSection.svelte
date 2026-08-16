<script lang="ts">
  import type { Section } from "../../model/section-types";
  import { SvelteSet } from "svelte/reactivity";
  import { pointerDrag } from "../../actions/pointer-drag";
  import { longPress } from "../../actions/long-press";
  import { multiTouchGesture } from "../../actions/multi-touch-gesture";
  import { doubleTap } from "../../actions/double-tap";
  import { focusAndSelect } from "../../actions/focus-and-select";
  import {
    STAGE_ITEM_CATEGORIES,
    addStageItem,
    bringManyToFront,
    cloneStageItemsForPaste,
    moveStageItemsBy,
    removeStageItems,
    resizeStageItem,
    setCanvasHeight,
    updateStageItemLabel,
    updateStageItemName,
  } from "../../model/stage-map";
  import type { StageItem, StageItemCategory } from "../../model/stage-map";
  import { setStageMapData } from "../../state/document.svelte";
  import {
    copyStageItems,
    getStageMapClipboard,
  } from "../../state/stage-map-clipboard";
  import SectionEmptyHint from "../../components/SectionEmptyHint.svelte";
  import ContextMenu from "../../components/ContextMenu.svelte";
  import { autoFitText } from "../../components/auto-fit-text";
  import ScissorsIcon from "phosphor-svelte/lib/ScissorsIcon";
  import CopyIcon from "phosphor-svelte/lib/CopyIcon";
  import ClipboardTextIcon from "phosphor-svelte/lib/ClipboardTextIcon";
  import TrashIcon from "phosphor-svelte/lib/TrashIcon";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "stage-map" }> } =
    $props();

  function commit(data: typeof section.data) {
    setStageMapData(rowId, section.id, data);
  }

  let canvasEl: HTMLDivElement | undefined = $state();
  let scrollEl: HTMLDivElement | undefined = $state();
  const selectedIds = new SvelteSet<string>();

  // Which Name item (if any) currently shows its editable input instead of
  // its static label — local, transient view state, same lifecycle as
  // selectedIds (never persisted to the document).
  let editingNameId: string | undefined = $state();

  interface ContextMenuState {
    x: number;
    y: number;
    clipboardEmpty: boolean;
    selectionEmpty: boolean;
  }
  let contextMenu: ContextMenuState | undefined = $state();

  // A click inside the canvas already clears the selection through its own
  // pointerDrag (an empty-rect marquee, see finishMarquee below) — this
  // covers everywhere else on the page, which that handler never sees.
  $effect(() => {
    function handleWindowPointerDown(event: PointerEvent): void {
      if (selectedIds.size === 0) return;
      if (canvasEl?.contains(event.target as Node)) return;
      // The context menu renders outside the canvas (so its fixed
      // positioning isn't broken by an ancestor's CSS transform — see
      // ContextMenu.svelte) — without this check, the pointerdown half of
      // clicking one of its own Copy/Cut/Delete buttons would clear the
      // selection those buttons are about to act on, before their click
      // handler ever runs.
      if ((event.target as HTMLElement)?.closest(".context-menu")) return;
      selectedIds.clear();
    }
    window.addEventListener("pointerdown", handleWindowPointerDown);
    return () =>
      window.removeEventListener("pointerdown", handleWindowPointerDown);
  });

  // Ctrl/Cmd+click toggles an item's own membership. A plain click replaces
  // the selection with just that item — unless it's already part of a
  // multi-item selection, in which case the whole selection is left intact
  // so a drag starting from it can move the group.
  function resolveClickSelection(
    item: StageItem,
    event: { ctrlKey: boolean; metaKey: boolean },
  ): void {
    if (event.ctrlKey || event.metaKey) {
      if (selectedIds.has(item.id)) selectedIds.delete(item.id);
      else selectedIds.add(item.id);
      return;
    }
    if (!selectedIds.has(item.id)) {
      selectedIds.clear();
      selectedIds.add(item.id);
    }
  }

  // The set of item ids a drag gesture moves together, fixed for the
  // duration of that gesture (selection changes mid-drag don't retarget it).
  let dragGroupIds: string[] = [];

  function beginItemDrag(item: StageItem, event: PointerEvent): void {
    canvasEl?.focus({ preventScroll: true });
    resolveClickSelection(item, event);
    dragGroupIds = selectedIds.has(item.id) ? [...selectedIds] : [item.id];
    commit({
      ...section.data,
      items: bringManyToFront(section.data.items, dragGroupIds),
    });
  }

  // Shared by the keyboard shortcuts below and the context menu, so
  // copy/paste/delete logic is never duplicated between the two triggers.
  function deleteSelection(): void {
    if (selectedIds.size === 0) return;
    commit(removeStageItems(section.data, [...selectedIds]));
    if (editingNameId && selectedIds.has(editingNameId)) {
      editingNameId = undefined;
    }
    selectedIds.clear();
  }

  function copySelection(): void {
    if (selectedIds.size === 0) return;
    copyStageItems(
      section.data.items.filter((item) => selectedIds.has(item.id)),
    );
  }

  function cutSelection(): void {
    if (selectedIds.size === 0) return;
    copySelection();
    deleteSelection();
  }

  // With no target, pastes with the small fixed offset `cloneStageItemsForPaste`
  // defaults to (used for the keyboard shortcut, which has no cursor position
  // to anchor to). The context menu passes the point it was opened at, so
  // Paste lands there instead of next to the original.
  function pasteClipboard(target?: { x: number; y: number }): void {
    const clipboardItems = getStageMapClipboard();
    if (clipboardItems.length === 0) return;
    const originalCount = section.data.items.length;
    const pasted = cloneStageItemsForPaste(
      section.data,
      clipboardItems,
      target,
    );
    commit(pasted);
    selectedIds.clear();
    for (const newItem of pasted.items.slice(originalCount)) {
      selectedIds.add(newItem.id);
    }
  }

  // Converts a viewport point to the percentage-of-canvas coordinates
  // StageItem.x/y are stored in — using the canvas's actual rendered
  // bounding box (already reflecting any CSS scale), the same way
  // moveByPixelDelta derives percentages, rather than canvasLocalPoint's
  // unscaled space (that one's for children that live inside the scaled
  // canvas itself, like the marquee overlay).
  function canvasPercentPoint(
    clientX: number,
    clientY: number,
  ): { x: number; y: number } | undefined {
    if (!canvasEl) return undefined;
    const rect = canvasEl.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  }

  // Backspace/Delete/Escape/Ctrl+X/C/V only act while the canvas element
  // itself is focused — not a descendant like the label textarea or name
  // input — so typing/backspacing/copy-paste inside those fields is
  // completely unaffected. Every item-click, marquee-drag, or
  // canvas-background interaction focuses the canvas first, so whichever
  // Stage Map section was last interacted with is naturally where these
  // keys apply — including as the paste target for a copy made elsewhere.
  function handleCanvasKeydown(event: KeyboardEvent): void {
    if (event.target !== canvasEl) return;
    const withModifier = event.ctrlKey || event.metaKey;

    if (event.key === "Backspace" || event.key === "Delete") {
      if (selectedIds.size === 0) return;
      event.preventDefault();
      deleteSelection();
    } else if (event.key === "Escape") {
      selectedIds.clear();
      editingNameId = undefined;
    } else if (withModifier && event.key.toLowerCase() === "x") {
      if (selectedIds.size === 0) return;
      event.preventDefault();
      cutSelection();
    } else if (withModifier && event.key.toLowerCase() === "c") {
      if (selectedIds.size === 0) return;
      event.preventDefault();
      copySelection();
    } else if (withModifier && event.key.toLowerCase() === "v") {
      if (getStageMapClipboard().length === 0) return;
      event.preventDefault();
      pasteClipboard();
    }
  }

  // Right-click (desktop) or long-press (mobile) on an item selects it —
  // same rule a plain click uses — then opens the context menu at the
  // pointer's position. clipboardEmpty/selectionEmpty are captured once
  // here rather than read reactively, since the module-level clipboard
  // isn't itself reactive and the menu's lifetime is short.
  function openContextMenuForItem(
    item: StageItem,
    event: {
      clientX: number;
      clientY: number;
      ctrlKey: boolean;
      metaKey: boolean;
    },
  ): void {
    resolveClickSelection(item, event);
    contextMenu = {
      x: event.clientX,
      y: event.clientY,
      clipboardEmpty: getStageMapClipboard().length === 0,
      selectionEmpty: selectedIds.size === 0,
    };
  }

  // Right-click/long-press on empty canvas — as opposed to on an item —
  // leaves the current selection untouched (there's no item to select) so
  // the menu's Copy/Delete act on whatever was already selected, if
  // anything; this is the only way to reach Paste when the canvas has no
  // items to right-click yet, or when pasting into an empty section.
  function openContextMenuForCanvas(event: {
    clientX: number;
    clientY: number;
  }): void {
    contextMenu = {
      x: event.clientX,
      y: event.clientY,
      clipboardEmpty: getStageMapClipboard().length === 0,
      selectionEmpty: selectedIds.size === 0,
    };
  }

  interface ClientPoint {
    x: number;
    y: number;
  }

  let marqueeStartClient: ClientPoint | undefined = $state();
  let marqueeCurrentClient: ClientPoint | undefined = $state();
  let marqueeAdditive = false;

  // Converts a viewport point into the canvas's own (unscaled) local
  // coordinate space — the space item x/y percentages and the marquee
  // overlay's own inline position are both expressed in, since the overlay
  // is a descendant of the canvas and inherits its CSS `transform: scale()`.
  function canvasLocalPoint(client: ClientPoint): ClientPoint {
    if (!canvasEl) return { x: 0, y: 0 };
    const rect = canvasEl.getBoundingClientRect();
    return {
      x: (client.x - rect.left) / canvasScale,
      y: (client.y - rect.top) / canvasScale,
    };
  }

  // Hit-testing happens directly in viewport coordinates (both the marquee
  // corners and each item's own getBoundingClientRect() are already in that
  // space), sidestepping any scale conversion entirely.
  function finishMarquee(): void {
    const start = marqueeStartClient;
    const current = marqueeCurrentClient;
    marqueeStartClient = undefined;
    marqueeCurrentClient = undefined;
    if (!start || !current || !canvasEl) return;

    const left = Math.min(start.x, current.x);
    const right = Math.max(start.x, current.x);
    const top = Math.min(start.y, current.y);
    const bottom = Math.max(start.y, current.y);

    const matchedIds = section.data.items
      .filter((item) => {
        const el = canvasEl!.querySelector<HTMLElement>(
          `[data-item-id="${item.id}"]`,
        );
        if (!el) return false;
        const box = el.getBoundingClientRect();
        return (
          box.left < right &&
          box.right > left &&
          box.top < bottom &&
          box.bottom > top
        );
      })
      .map((item) => item.id);

    if (!marqueeAdditive) selectedIds.clear();
    for (const id of matchedIds) selectedIds.add(id);
  }

  const categories: StageItemCategory[] = [
    "mic",
    "di",
    "io",
    "xlr",
    "amp",
    "rack",
    "drum",
    "mon",
    "power",
    "riser",
    "name",
  ];

  // Below the mobile breakpoint, the canvas renders at this fixed authored
  // width and is scaled down to fit whatever's actually available — down to
  // CANVAS_FLOOR_SCALE, past which it stays at the floor and the wrapper
  // pans horizontally instead, so icons/labels never shrink past legible.
  const CANVAS_BASE_WIDTH = 640;
  const CANVAS_FLOOR_SCALE = 0.85;

  let canvasScale = $state(1);

  // Two-finger pan, mobile only — transient view state with the same
  // lifecycle as canvasScale (never persisted). hasUsedTwoFingerGesture is
  // the exception: it's an instance-lifetime latch, not reset alongside
  // panX, so native horizontal scroll stays the fallback until the first
  // two-finger gesture and stays disabled afterward for this instance.
  // Horizontal only — the canvas never needs vertical panning (its height
  // is user-adjustable via the depth handle and always fits), and the
  // mobile fallback this replaces (.stage-map__scroll's overflow-x) was
  // horizontal-only too.
  let panX = $state(0);
  let hasUsedTwoFingerGesture = $state(false);
  let showTwoFingerHint = $state(false);

  const canvasTransform = $derived(
    canvasScale < 1 || panX !== 0
      ? `translate(${panX}px, 0) scale(${canvasScale})`
      : undefined,
  );

  function handlePanDelta(dx: number): void {
    panX += dx;
  }

  $effect(() => {
    if (!scrollEl) return;
    const query = window.matchMedia("screen and (max-width: 640px)");
    // The width breakpoint alone isn't a touch-capability check — it's the
    // same one canvasScale reuses from the rest of the app's responsive
    // layout. The two-finger hint additionally requires a coarse (touch)
    // pointer so it doesn't show for a mouse-driven narrow window or a
    // mouse/trackpad-driven iPad session, neither of which can ever trigger
    // the gesture itself.
    const pointerQuery = window.matchMedia("(pointer: coarse)");

    function updateScale(): void {
      if (!scrollEl || !query.matches) {
        canvasScale = 1;
        panX = 0;
      } else {
        canvasScale = Math.min(
          1,
          Math.max(
            CANVAS_FLOOR_SCALE,
            scrollEl.clientWidth / CANVAS_BASE_WIDTH,
          ),
        );
      }
      showTwoFingerHint = query.matches && pointerQuery.matches;
    }

    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(scrollEl);
    query.addEventListener("change", updateScale);
    pointerQuery.addEventListener("change", updateScale);
    return () => {
      resizeObserver.disconnect();
      query.removeEventListener("change", updateScale);
      pointerQuery.removeEventListener("change", updateScale);
    };
  });

  function moveByPixelDelta(dx: number, dy: number) {
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const deltaX = (dx / rect.width) * 100;
    const deltaY = (dy / rect.height) * 100;
    commit(moveStageItemsBy(section.data, dragGroupIds, deltaX, deltaY));
  }

  // Divided by the current scale so a resize/height-drag tracks the pointer
  // 1:1 visually even while the canvas itself is rendered scaled down.
  function resizeByPixelDelta(item: StageItem, dx: number, dy: number) {
    const w = (item.w ?? 0) + dx / canvasScale;
    const h = (item.h ?? 0) + dy / canvasScale;
    commit(resizeStageItem(section.data, item.id, w, h));
  }
</script>

<div class="stage-map__palette no-print">
  {#each categories as category (category)}
    <button
      type="button"
      onclick={() => commit(addStageItem(section.data, category))}
    >
      {STAGE_ITEM_CATEGORIES[category].abbreviation}
    </button>
  {/each}
</div>

{#if section.data.items.length === 0}
  <SectionEmptyHint text="No items placed yet — choose a category above." />
{/if}
{#if showTwoFingerHint}
  <p class="stage-map__gesture-hint no-print">
    Drag with two fingers to move the map.
  </p>
{/if}
<div
  class="stage-map__scroll"
  class:stage-map__scroll--gesture-active={hasUsedTwoFingerGesture}
  bind:this={scrollEl}
>
  <div
    class="stage-map__scale-box"
    style:width={canvasScale < 1
      ? `${CANVAS_BASE_WIDTH * canvasScale}px`
      : undefined}
    style:height={canvasScale < 1
      ? `${section.data.canvasHeight * canvasScale}px`
      : undefined}
  >
    <!--
      role="application" plus a focusable, keydown-handling canvas is the
      free-form editing-surface pattern (a whiteboard/diagram canvas, not a
      document-flow region) — svelte's a11y checks don't recognize it as
      "interactive" on its own, but the role and keyboard handling here are
      intentional and paired.
    -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="stage-map__canvas"
      bind:this={canvasEl}
      style:height="{section.data.canvasHeight}px"
      style:width={canvasScale < 1 ? `${CANVAS_BASE_WIDTH}px` : undefined}
      style:transform={canvasTransform}
      style:transform-origin="top left"
      role="application"
      aria-label="Stage map canvas"
      tabindex="0"
      onkeydown={handleCanvasKeydown}
      oncontextmenu={(event) => {
        event.preventDefault();
        openContextMenuForCanvas(event);
      }}
      use:longPress={{
        onLongPress: (event) => openContextMenuForCanvas(event),
      }}
      use:multiTouchGesture={{
        onGestureStart: () => {
          hasUsedTwoFingerGesture = true;
        },
        onPanDelta: handlePanDelta,
      }}
      use:pointerDrag={{
        onStart: (event) => {
          canvasEl?.focus({ preventScroll: true });
          marqueeAdditive = event.ctrlKey || event.metaKey;
          marqueeStartClient = { x: event.clientX, y: event.clientY };
          marqueeCurrentClient = marqueeStartClient;
        },
        onMove: (_dx, _dy, event) => {
          marqueeCurrentClient = { x: event.clientX, y: event.clientY };
        },
        onEnd: () => finishMarquee(),
      }}
    >
      {#each section.data.items as item (item.id)}
        {@const meta = STAGE_ITEM_CATEGORIES[item.category]}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="stage-map__item stage-map__item--{meta.shape}"
          class:stage-map__item--dashed={meta.dashed}
          class:stage-map__item--selected={selectedIds.has(item.id)}
          style:left="{item.x}%"
          style:top="{item.y}%"
          style:width={item.w ? `${item.w}px` : undefined}
          style:height={item.h ? `${item.h}px` : undefined}
          style:z-index={item.order}
          data-item-id={item.id}
          data-category={item.category}
          use:pointerDrag={{
            stopPropagation: true,
            onStart: (event) => beginItemDrag(item, event),
            onMove: (dx, dy) => moveByPixelDelta(dx, dy),
          }}
          use:longPress={{
            onLongPress: (event) => openContextMenuForItem(item, event),
          }}
          use:doubleTap={{
            onDoubleTap: () => {
              if (item.category === "name") editingNameId = item.id;
            },
          }}
          oncontextmenu={(event) => {
            event.preventDefault();
            event.stopPropagation();
            openContextMenuForItem(item, event);
          }}
        >
          {#if meta.shape === "triangle"}
            <svg
              class="stage-map__triangle-outline"
              viewBox="0 0 40 36"
              aria-hidden="true"
            >
              <polygon points="20,2 2,34 38,34" />
            </svg>
          {/if}
          {#if item.category === "name"}
            {#if editingNameId === item.id}
              <input
                class="stage-map__name-input"
                value={item.nameText}
                placeholder="Name"
                use:autoFitText={{ min: 6 }}
                use:focusAndSelect
                oninput={(e) =>
                  commit(
                    updateStageItemName(
                      section.data,
                      item.id,
                      e.currentTarget.value,
                    ),
                  )}
                onblur={() => {
                  if (editingNameId === item.id) editingNameId = undefined;
                }}
                onkeydown={(e) => {
                  if (e.key === "Escape") e.currentTarget.blur();
                }}
              />
            {:else}
              <span
                class="stage-map__abbr stage-map__abbr--name"
                class:stage-map__abbr--placeholder={!item.nameText}
                >{item.nameText || "Name"}</span
              >
            {/if}
          {:else}
            <span class="stage-map__abbr">{meta.abbreviation}</span>
          {/if}
          {#if meta.resizable}
            <div
              class="stage-map__resize-handle no-print"
              use:pointerDrag={{
                stopPropagation: true,
                onMove: (dx, dy) => resizeByPixelDelta(item, dx, dy),
              }}
            ></div>
          {/if}
          <textarea
            class="stage-map__label"
            rows={item.label.split("\n").length}
            value={item.label}
            oninput={(e) =>
              commit(
                updateStageItemLabel(
                  section.data,
                  item.id,
                  e.currentTarget.value,
                ),
              )}
            onkeydown={(e) => {
              if (e.key === "Escape") e.currentTarget.blur();
            }}></textarea>
        </div>
      {/each}
      {#if marqueeStartClient && marqueeCurrentClient}
        {@const a = canvasLocalPoint(marqueeStartClient)}
        {@const b = canvasLocalPoint(marqueeCurrentClient)}
        <div
          class="stage-map__marquee no-print"
          style:left="{Math.min(a.x, b.x)}px"
          style:top="{Math.min(a.y, b.y)}px"
          style:width="{Math.abs(b.x - a.x)}px"
          style:height="{Math.abs(b.y - a.y)}px"
        ></div>
      {/if}
      <div
        class="stage-map__depth-handle no-print"
        use:pointerDrag={{
          stopPropagation: true,
          onMove: (dx, dy) =>
            commit(
              setCanvasHeight(
                section.data,
                section.data.canvasHeight + dy / canvasScale,
              ),
            ),
        }}
      ></div>
    </div>
  </div>
</div>

{#if contextMenu}
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    onClose={() => (contextMenu = undefined)}
  >
    <button
      type="button"
      class="context-menu__item"
      role="menuitem"
      disabled={contextMenu.selectionEmpty}
      onclick={() => {
        cutSelection();
        contextMenu = undefined;
      }}
    >
      <ScissorsIcon size={14} />
      Cut
    </button>
    <button
      type="button"
      class="context-menu__item"
      role="menuitem"
      disabled={contextMenu.selectionEmpty}
      onclick={() => {
        copySelection();
        contextMenu = undefined;
      }}
    >
      <CopyIcon size={14} />
      Copy
    </button>
    <button
      type="button"
      class="context-menu__item"
      role="menuitem"
      disabled={contextMenu.clipboardEmpty}
      onclick={() => {
        pasteClipboard(canvasPercentPoint(contextMenu!.x, contextMenu!.y));
        contextMenu = undefined;
      }}
    >
      <ClipboardTextIcon size={14} />
      Paste
    </button>
    <button
      type="button"
      class="context-menu__item context-menu__item--danger"
      role="menuitem"
      disabled={contextMenu.selectionEmpty}
      onclick={() => {
        deleteSelection();
        contextMenu = undefined;
      }}
    >
      <TrashIcon size={14} />
      Delete
    </button>
  </ContextMenu>
{/if}

<style>
  /*
   * Items sit at 0–100% of the canvas but are fixed-px boxes centered on
   * that position, so one near an edge always spills half its width past
   * the canvas's own edge — contained here rather than leaking into the
   * page's own horizontal scroll (see mobile-no-overflow.spec.ts's earlier
   * findings for other sections with the same class of bug). This is also
   * the pan mechanism for whatever's still off-screen once the canvas hits
   * its floor scale below the mobile breakpoint (see the script).
   */
  .stage-map__scroll {
    overflow-x: auto;
    /*
     * Explicit, rather than left to the default `visible` — CSS's overflow
     * computed-value rules force `visible` to compute as `auto` alongside
     * an explicit `auto` on the other axis, so this wrapper could already
     * scroll vertically today. Items are always contained within the
     * canvas's own height (canvasHeight, user-adjustable via the depth
     * handle; y is clamped to 8–92% in moveStageItem), so nothing here
     * legitimately needs vertical scroll.
     */
    overflow-y: hidden;
    /*
     * The depth handle (below) intentionally sits half outside the
     * canvas's own box, centered on its bottom edge — at its current size
     * that's 9px of overflow below the canvas, which `overflow-y: hidden`
     * above would otherwise clip. This padding gives it room without
     * reintroducing scroll on this axis.
     */
    padding-bottom: 12px;
  }

  /*
   * Ceded to the two-finger pan gesture only once it's actually been used
   * for this instance — native touch-scroll stays the fallback until then,
   * so the two mechanisms never fight over the same content's position.
   */
  .stage-map__scroll--gesture-active {
    touch-action: none;
  }

  .stage-map__gesture-hint {
    font-size: var(--font-size-label);
    color: var(--color-text-muted);
    margin: 0 0 var(--space-1);
  }

  /*
   * The mobile scale is applied as an inline style from a matchMedia
   * effect in the script, which — confirmed directly — does not reliably
   * re-fire its `change` listener when entering print (Chromium's print
   * emulation updates `matches` but not the change event), so it can't be
   * trusted to reset itself before printing. This stylesheet rule forces
   * the reset instead, the same way screen-scoped mobile rules elsewhere
   * in this epic are naturally excluded from print — but here as an
   * explicit override (`!important`) since it has to beat a JS-set inline
   * style rather than just not apply in the first place.
   */
  @media print {
    .stage-map__canvas {
      width: 100% !important;
      transform: none !important;
    }

    .stage-map__scale-box {
      width: 100% !important;
      height: auto !important;
    }

    /* Selection is an editing affordance only, never printed. */
    .stage-map__item--selected {
      outline: none !important;
    }
  }

  .stage-map__palette {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    margin-bottom: var(--space-2);
  }

  .stage-map__palette button {
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-label);
    padding: 4px var(--space-2);
    cursor: pointer;
  }

  .stage-map__canvas {
    position: relative;
    width: 100%;
    /*
     * Items inside grow z-index without bound as they're brought to front
     * (see bringToFront in stage-map.ts) — without a stacking context here,
     * those z-index values compete directly against the rest of the page
     * (e.g. the sticky toolbar's z-index: 40), and once enough items have
     * been brought to front, one can render above it. `isolation: isolate`
     * contains every descendant z-index within this element regardless of
     * canvasScale (a `transform` only applies, and only conditionally
     * creates a stacking context of its own, below the mobile breakpoint).
     */
    isolation: isolate;
    border: 1px solid var(--color-border);
    break-inside: avoid;
    background-image:
      repeating-linear-gradient(
        0deg,
        color-mix(in srgb, var(--color-text) 6%, transparent) 0,
        color-mix(in srgb, var(--color-text) 6%, transparent) 1px,
        transparent 1px,
        transparent 24px
      ),
      repeating-linear-gradient(
        90deg,
        color-mix(in srgb, var(--color-text) 6%, transparent) 0,
        color-mix(in srgb, var(--color-text) 6%, transparent) 1px,
        transparent 1px,
        transparent 24px
      );
  }

  /*
   * The canvas is a focusable keyboard-shortcut target (Backspace/Delete,
   * Ctrl/Cmd+C/V, Escape — see handleCanvasKeydown), which is otherwise
   * exactly the kind of element that should keep its default focus ring for
   * keyboard users. Its own border already reads clearly as the canvas's
   * boundary, so the browser's default focus ring just doubled that edge
   * with a second, heavier one — dropped in favor of the existing border.
   */
  .stage-map__canvas:focus {
    outline: none;
  }

  .stage-map__item {
    position: absolute;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 36px;
    height: 36px;
    border: 1px solid var(--color-accent);
    color: var(--color-accent);
    background: color-mix(in srgb, var(--color-background) 80%, transparent);
    cursor: grab;
    touch-action: none;
    user-select: none;
  }

  .stage-map__item--circle {
    border-radius: 50%;
  }

  .stage-map__item--dashed {
    border-style: dashed;
  }

  .stage-map__item--selected {
    outline: 2px solid #d64545;
    outline-offset: 2px;
  }

  .stage-map__item--rectangle {
    height: 18px;
  }

  .stage-map__item--ellipse {
    width: 54px;
    border-radius: 50%;
  }

  .stage-map__item--triangle {
    width: 40px;
    height: 36px;
    border: none;
    background: transparent;
  }

  /*
   * An outline (not a fill) for consistency with the other shapes, which
   * are all drawn with a plain border — a CSS border can't itself form a
   * triangle, and a background-color fill (the earlier approach) doesn't
   * print reliably since browsers skip background colors by default.
   * An SVG stroke sidesteps both problems.
   */
  .stage-map__triangle-outline {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .stage-map__triangle-outline polygon {
    fill: none;
    stroke: var(--color-accent);
    stroke-width: 1.5;
  }

  .stage-map__abbr {
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.02em;
    pointer-events: none;
    margin-top: auto;
  }

  .stage-map__name-input {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 44px;
    border: none;
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-weight: 600;
    font-size: 10px;
    text-align: center;
    padding: 0;
    cursor: text;
    touch-action: none;
  }

  /*
   * Shares the input's centered position/typography so switching in and out
   * of edit mode (double-click/double-tap) causes no visible jump.
   */
  .stage-map__abbr--name {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 44px;
    font-weight: 600;
    font-size: 10px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stage-map__abbr--placeholder {
    color: var(--color-text-muted);
    font-weight: 400;
  }

  .stage-map__marquee {
    position: absolute;
    border: 1px dashed #d64545;
    background: color-mix(in srgb, #d64545 12%, transparent);
    pointer-events: none;
  }

  .stage-map__resize-handle {
    position: absolute;
    right: -4px;
    bottom: -4px;
    width: 10px;
    height: 10px;
    border: 1px solid var(--color-accent);
    background: var(--color-background);
    cursor: nwse-resize;
    touch-action: none;
  }

  .stage-map__label {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 70px;
    resize: none;
    overflow: hidden;
    text-align: center;
    line-height: 1.3;
    border: none;
    background: transparent;
    color: var(--color-text);
    font-family: inherit;
    font-size: 9px;
  }

  .stage-map__depth-handle {
    position: absolute;
    left: 50%;
    bottom: -9px;
    transform: translateX(-50%);
    width: 40px;
    height: 18px;
    border: 1px solid var(--color-border);
    background: var(--color-background);
    cursor: ns-resize;
    touch-action: none;
  }

  .context-menu__item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    border: none;
    background: transparent;
    color: var(--color-text);
    text-align: left;
    font-family: inherit;
    font-size: var(--font-size-body);
    padding: var(--space-2) var(--space-3);
    cursor: pointer;
  }

  .context-menu__item:hover:not(:disabled),
  .context-menu__item:focus-visible {
    background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  }

  .context-menu__item:disabled {
    color: var(--color-text-muted);
    cursor: default;
  }

  .context-menu__item--danger {
    color: var(--color-danger);
  }
</style>
