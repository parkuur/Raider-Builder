<script lang="ts">
  import SectionFrame from "./SectionFrame.svelte";
  import PairSlot from "./PairSlot.svelte";
  import { sectionRegistry } from "../sections/registry";
  import type { SectionRegistryEntry } from "../sections/registry";
  import type { Row } from "../model/document-types";

  let {
    row,
    first,
    dragging,
    draggingSectionId,
    pairDropActive,
    onDragStart,
    onDragEnd,
    onSectionDragStart,
    onSectionDragEnd,
    onPairRequest,
    onPairDragOver,
    onPairDrop,
  }: {
    row: Row;
    first: boolean;
    dragging: boolean;
    draggingSectionId: string | null;
    pairDropActive: boolean;
    onDragStart: () => void;
    onDragEnd: () => void;
    onSectionDragStart: (sectionId: string) => void;
    onSectionDragEnd: () => void;
    onPairRequest: (rowId: string) => void;
    onPairDragOver: (e: DragEvent) => void;
    onPairDrop: (e: DragEvent) => void;
  } = $props();

  const soleEntry = $derived(
    row.sections.length === 1
      ? (sectionRegistry[row.sections[0]!.type] as SectionRegistryEntry)
      : undefined,
  );
  const showPairSlot = $derived(soleEntry?.half === true);
  const paired = $derived(row.sections.length === 2);
</script>

<div
  class="row-view"
  class:row-view--first={first}
  class:row-view--dragging={dragging}
>
  <div
    class="row-view__handle no-print"
    draggable="true"
    ondragstart={onDragStart}
    ondragend={onDragEnd}
    title="Drag to reorder"
    role="button"
    tabindex="0"
    aria-label="Drag to reorder row"
  >
    ⠿
  </div>
  <div class="row-view__sections" class:row-view__sections--paired={paired}>
    {#each row.sections as section (section.id)}
      <SectionFrame
        rowId={row.id}
        {section}
        sectionCount={row.sections.length}
        dragging={draggingSectionId === section.id}
        onSectionDragStart={() => onSectionDragStart(section.id)}
        {onSectionDragEnd}
      />
    {/each}
    {#if showPairSlot}
      <PairSlot
        onClick={() => onPairRequest(row.id)}
        active={pairDropActive}
        onDragOver={onPairDragOver}
        onDrop={onPairDrop}
      />
    {/if}
  </div>
</div>

<style>
  .row-view {
    display: flex;
    gap: var(--space-2);
    align-items: flex-start;
  }

  .row-view:not(.row-view--first) {
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
  }

  .row-view--dragging {
    opacity: 0.5;
  }

  .row-view__handle {
    flex: none;
    width: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    opacity: 0.35;
    padding-top: var(--space-4);
  }

  .row-view__sections {
    flex: 1;
    display: flex;
    gap: var(--space-4);
    align-items: flex-start;
    min-width: 0;
  }

  .row-view__sections--paired {
    gap: var(--space-2);
  }

  .row-view__sections--paired > :global(.section-frame) + :global(.section-frame) {
    border-left: 1px solid var(--color-divider-subtle);
    padding-left: var(--space-2);
  }
</style>
