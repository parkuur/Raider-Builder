<script lang="ts">
  import SectionFrame from "./SectionFrame.svelte";
  import PairSlot from "./PairSlot.svelte";
  import { sectionRegistry } from "../sections/registry";
  import type { SectionRegistryEntry } from "../sections/registry";
  import type { Row } from "../model/document-types";

  let {
    row,
    liftedSectionId,
    liftedMode,
    pairAvailable,
    pairMode,
    onToggleMoveLift,
    onToggleCopyLift,
    onPairAdd,
    onPairPlace,
    onSwapPlace,
  }: {
    row: Row;
    liftedSectionId: string | null;
    liftedMode: "move" | "copy" | null;
    pairAvailable: boolean;
    pairMode: "move" | "copy" | null;
    onToggleMoveLift: (sectionId: string) => void;
    onToggleCopyLift: (sectionId: string) => void;
    onPairAdd: () => void;
    onPairPlace: () => void;
    onSwapPlace: () => void;
  } = $props();

  const soleEntry = $derived(
    row.sections.length === 1
      ? (sectionRegistry[row.sections[0]!.type] as SectionRegistryEntry)
      : undefined,
  );
  const showPairSlot = $derived(soleEntry?.split === true);
  const paired = $derived(row.sections.length === 2);
  // `liftedSectionId`/`liftedMode` only arrive non-null when the lift
  // originated in this very row (RowList scopes them per-row), so a
  // non-null id here already means "one of this row's own two sections is
  // lifted" once `paired` is true — no extra check needed against `row.id`.
  const swapAvailable = $derived(
    paired && liftedMode === "move" && liftedSectionId !== null,
  );
</script>

<div class="row-view">
  <div class="row-view__sections" class:row-view__sections--paired={paired}>
    {#each row.sections as section, sectionIndex (section.id)}
      <SectionFrame
        rowId={row.id}
        {section}
        sectionCount={row.sections.length}
        showPairBadge={paired && sectionIndex === 1}
        liftedMode={liftedSectionId === section.id ? liftedMode : null}
        swapAvailable={swapAvailable && liftedSectionId !== section.id}
        onToggleMoveLift={() => onToggleMoveLift(section.id)}
        onToggleCopyLift={() => onToggleCopyLift(section.id)}
        {onSwapPlace}
      />
    {/each}
    {#if showPairSlot}
      <PairSlot
        available={pairAvailable}
        mode={pairMode}
        onAddClick={onPairAdd}
        onPlaceClick={onPairPlace}
      />
    {/if}
  </div>
</div>

<style>
  .row-view__sections {
    display: flex;
    gap: var(--space-4);
    align-items: flex-start;
    min-width: 0;
  }

  .row-view__sections--paired {
    gap: var(--space-2);
    /*
     * Overrides the container's own `align-items: flex-start` above: each
     * `.section-frame` is otherwise only as tall as its own content, so a
     * border on the shorter one (below) would stop short of the taller
     * one's bottom. Stretching both to the container's height — which is
     * already exactly the taller section's height, container height being
     * the max of its children's regardless of align-items — makes the
     * border-carrying section always exactly as tall as its partner. Safe
     * because no half-width section (Contacts/Quick Look/Text) relies on
     * its own box height for internal layout.
     */
    align-items: stretch;
  }

  /*
   * Paired sections get an accent-colored (not neutral-gray) rule between
   * them so pairing reads as a distinct signal — every other seam in the
   * document (RowGap, between unrelated rows) uses the neutral border
   * color, so hue alone marks "these two belong together." The rule itself
   * stays subtle; the link badge (SectionFrame.svelte) carries the signal
   * and sits on top of it, offset in from the line's true end (rather than
   * exactly at it) so a short tail of the full-length line still shows
   * past the badge.
   */
  .row-view__sections--paired
    > :global(.section-frame)
    + :global(.section-frame) {
    border-left: 1px solid
      color-mix(in srgb, var(--color-accent) 35%, transparent);
    /* Wider than the usual paired gap (space-2) — the badge's own circle
       (~11.5px radius including its border) is wider than that, so content
       would otherwise start before the badge visually clears the line. */
    padding-left: var(--space-4);
  }

  @media screen and (max-width: 640px) {
    .row-view__sections {
      flex-direction: column;
      /* `align-items` governs the cross axis, which flips from vertical to
       * horizontal once flex-direction goes column — without this, each
       * stacked section shrinks to its own content width instead of
       * filling the row, which let wide content overflow the page. */
      align-items: stretch;
    }

    .row-view__sections--paired {
      gap: var(--space-2);
    }

    .row-view__sections--paired
      > :global(.section-frame)
      + :global(.section-frame) {
      border-left: none;
      padding-left: 0;
      border-top: 1px solid
        color-mix(in srgb, var(--color-accent) 35%, transparent);
      padding-top: var(--space-4);
    }
  }
</style>
