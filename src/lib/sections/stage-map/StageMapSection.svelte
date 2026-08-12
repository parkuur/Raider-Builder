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
  } from "../../model/stage-map";
  import type { StageItem, StageItemCategory } from "../../model/stage-map";
  import { setStageMapData } from "../../state/document.svelte";
  import SectionEmptyHint from "../../components/SectionEmptyHint.svelte";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "stage-map" }> } =
    $props();

  function commit(data: typeof section.data) {
    setStageMapData(rowId, section.id, data);
  }

  let canvasEl: HTMLDivElement | undefined = $state();

  const categories: StageItemCategory[] = [
    "mic",
    "di",
    "xlr",
    "amp",
    "drum",
    "mon",
    "power",
    "riser",
  ];

  function moveByPixelDelta(item: StageItem, dx: number, dy: number) {
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const deltaX = (dx / rect.width) * 100;
    const deltaY = (dy / rect.height) * 100;
    commit(
      moveStageItem(section.data, item.id, item.x + deltaX, item.y + deltaY),
    );
  }

  function resizeByPixelDelta(item: StageItem, dx: number, dy: number) {
    const w = (item.w ?? 0) + dx;
    const h = (item.h ?? 0) + dy;
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
<div
  class="stage-map__canvas"
  bind:this={canvasEl}
  style:height="{section.data.canvasHeight}px"
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
      <span class="stage-map__abbr">{meta.abbreviation}</span>
      {#if meta.resizable}
        <div
          class="stage-map__resize-handle no-print"
          use:pointerDrag={{
            stopPropagation: true,
            onMove: (dx, dy) => resizeByPixelDelta(item, dx, dy),
          }}
        ></div>
      {/if}
      <button
        type="button"
        class="stage-map__remove no-print"
        aria-label="Remove item"
        onclick={() => commit(removeStageItem(section.data, item.id))}
      >
        ×
      </button>
      <input
        class="stage-map__label"
        value={item.label}
        oninput={(e) =>
          commit(
            updateStageItemLabel(section.data, item.id, e.currentTarget.value),
          )}
      />
    </div>
  {/each}
  <div
    class="stage-map__depth-handle no-print"
    use:pointerDrag={{
      onMove: (dx, dy) =>
        commit(setCanvasHeight(section.data, section.data.canvasHeight + dy)),
    }}
  ></div>
</div>

<style>
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

  .stage-map__item--triangle {
    width: 40px;
    height: 36px;
    border: none;
    background: var(--color-accent);
    color: var(--color-background);
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  }

  .stage-map__abbr {
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.02em;
    pointer-events: none;
    margin-top: auto;
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
    top: -8px;
    right: -8px;
    width: 14px;
    height: 14px;
    line-height: 1;
    border: none;
    background: var(--color-danger);
    color: #fff;
    cursor: pointer;
    font-size: 10px;
  }

  .stage-map__label {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 70px;
    text-align: center;
    border: none;
    background: transparent;
    color: var(--color-text);
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
