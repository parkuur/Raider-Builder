<script lang="ts">
  import SectionFrame from "./SectionFrame.svelte";
  import PairSlot from "./PairSlot.svelte";
  import { sectionRegistry } from "../sections/registry";
  import type { SectionRegistryEntry } from "../sections/registry";
  import type { Row } from "../model/document-types";

  let {
    row,
    first,
    liftedRow,
    liftedSectionId,
    pairAvailable,
    onToggleLift,
    onToggleSectionLift,
    onPairAdd,
    onPairPlace,
  }: {
    row: Row;
    first: boolean;
    liftedRow: boolean;
    liftedSectionId: string | null;
    pairAvailable: boolean;
    onToggleLift: () => void;
    onToggleSectionLift: (sectionId: string) => void;
    onPairAdd: () => void;
    onPairPlace: () => void;
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
  class:row-view--lifted={liftedRow}
>
  <button
    type="button"
    class="row-view__handle no-print"
    class:row-view__handle--lifted={liftedRow}
    data-lift-ui
    aria-pressed={liftedRow}
    aria-label={liftedRow ? "Cancel move" : "Move row"}
    title={liftedRow ? "Cancel move" : "Move row"}
    onclick={onToggleLift}
  >
    ⠿
  </button>
  <div class="row-view__sections" class:row-view__sections--paired={paired}>
    {#each row.sections as section (section.id)}
      <SectionFrame
        rowId={row.id}
        {section}
        sectionCount={row.sections.length}
        lifted={liftedSectionId === section.id}
        onToggleLift={() => onToggleSectionLift(section.id)}
      />
    {/each}
    {#if showPairSlot}
      <PairSlot
        available={pairAvailable}
        onAddClick={onPairAdd}
        onPlaceClick={onPairPlace}
      />
    {/if}
  </div>
</div>

<style>
  .row-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .row-view:not(.row-view--first) {
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
  }

  .row-view--lifted {
    opacity: 0.6;
  }

  .row-view__handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 18px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--color-text-subtle);
    opacity: 0.35;
    letter-spacing: 0.2em;
    cursor: pointer;
  }

  .row-view__handle:hover {
    opacity: 0.7;
  }

  .row-view__handle--lifted {
    opacity: 1;
    background: var(--color-accent);
    color: var(--color-background);
  }

  .row-view__sections {
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

  /*
   * Below this breakpoint, a paired row's two sections stack vertically
   * instead of squeezing side-by-side. `screen` (not just the width
   * condition) is what excludes this from print — the printed page is
   * governed by the @page box, not the originating device's viewport, so
   * pairs always print side-by-side regardless (see print.css).
   */
  @media screen and (max-width: 640px) {
    .row-view__sections {
      flex-direction: column;
    }

    .row-view__sections--paired {
      gap: var(--space-2);
    }

    .row-view__sections--paired
      > :global(.section-frame)
      + :global(.section-frame) {
      border-left: none;
      padding-left: 0;
      border-top: 1px solid var(--color-divider-subtle);
      padding-top: var(--space-2);
    }
  }
</style>
