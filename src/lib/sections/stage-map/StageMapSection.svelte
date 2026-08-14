<script lang="ts">
  import type { Section } from "../../model/section-types";
  import { pointerDrag } from "../../actions/pointer-drag";
  import {
    STAGE_ITEM_CATEGORIES,
    addStageItem,
    bringStageItemToFront,
    moveStageItem,
    removeStageItem,
    resizeStageItem,
    setCanvasHeight,
    updateStageItemLabel,
    updateStageItemName,
  } from "../../model/stage-map";
  import type { StageItem, StageItemCategory } from "../../model/stage-map";
  import { setStageMapData } from "../../state/document.svelte";
  import SectionEmptyHint from "../../components/SectionEmptyHint.svelte";
  import RemoveButton from "../../components/RemoveButton.svelte";
  import { autoFitText } from "../../components/auto-fit-text";

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

  const categories: StageItemCategory[] = [
    "mic",
    "di",
    "xlr",
    "amp",
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

  $effect(() => {
    if (!scrollEl) return;
    const query = window.matchMedia("screen and (max-width: 640px)");

    function updateScale(): void {
      if (!scrollEl || !query.matches) {
        canvasScale = 1;
        return;
      }
      canvasScale = Math.min(
        1,
        Math.max(CANVAS_FLOOR_SCALE, scrollEl.clientWidth / CANVAS_BASE_WIDTH),
      );
    }

    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(scrollEl);
    query.addEventListener("change", updateScale);
    return () => {
      resizeObserver.disconnect();
      query.removeEventListener("change", updateScale);
    };
  });

  function moveByPixelDelta(item: StageItem, dx: number, dy: number) {
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const deltaX = (dx / rect.width) * 100;
    const deltaY = (dy / rect.height) * 100;
    commit(
      moveStageItem(section.data, item.id, item.x + deltaX, item.y + deltaY),
    );
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
<div class="stage-map__scroll" bind:this={scrollEl}>
  <div
    class="stage-map__scale-box"
    style:width={canvasScale < 1
      ? `${CANVAS_BASE_WIDTH * canvasScale}px`
      : undefined}
    style:height={canvasScale < 1
      ? `${section.data.canvasHeight * canvasScale}px`
      : undefined}
  >
    <div
      class="stage-map__canvas"
      bind:this={canvasEl}
      style:height="{section.data.canvasHeight}px"
      style:width={canvasScale < 1 ? `${CANVAS_BASE_WIDTH}px` : undefined}
      style:transform={canvasScale < 1 ? `scale(${canvasScale})` : undefined}
      style:transform-origin="top left"
    >
      {#each section.data.items as item (item.id)}
        {@const meta = STAGE_ITEM_CATEGORIES[item.category]}
        <div
          class="stage-map__item stage-map__item--{meta.shape}"
          class:stage-map__item--dashed={meta.dashed}
          style:left="{item.x}%"
          style:top="{item.y}%"
          style:width={item.w ? `${item.w}px` : undefined}
          style:height={item.h ? `${item.h}px` : undefined}
          style:z-index={item.order}
          data-item-id={item.id}
          data-category={item.category}
          use:pointerDrag={{
            onStart: () => commit(bringStageItemToFront(section.data, item.id)),
            onMove: (dx, dy) => moveByPixelDelta(item, dx, dy),
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
            <input
              class="stage-map__name-input"
              value={item.nameText}
              placeholder="Name"
              use:autoFitText={{ min: 6 }}
              oninput={(e) =>
                commit(
                  updateStageItemName(
                    section.data,
                    item.id,
                    e.currentTarget.value,
                  ),
                )}
            />
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
          <div class="stage-map__remove no-print">
            <RemoveButton
              label="Remove item"
              onclick={() => commit(removeStageItem(section.data, item.id))}
            />
          </div>
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
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}></textarea>
        </div>
      {/each}
      <div
        class="stage-map__depth-handle no-print"
        use:pointerDrag={{
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

  .stage-map__remove {
    position: absolute;
    top: -10px;
    right: -10px;
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
    bottom: -3px;
    transform: translateX(-50%);
    width: 40px;
    height: 6px;
    border: 1px solid var(--color-border);
    background: var(--color-background);
    cursor: ns-resize;
    touch-action: none;
  }
</style>
