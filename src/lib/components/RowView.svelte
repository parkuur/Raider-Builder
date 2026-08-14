<script lang="ts">
  import SectionFrame from "./SectionFrame.svelte";
  import SplitEdgeSlot from "./SplitEdgeSlot.svelte";
  import ColumnView from "./ColumnView.svelte";
  import SquareSplitHorizontalIcon from "phosphor-svelte/lib/SquareSplitHorizontalIcon";
  import { sectionRegistry } from "../sections/registry";
  import type { SectionRegistryEntry } from "../sections/registry";
  import type { Row } from "../model/document-types";
  import { isSwapTarget } from "./swap-context";
  import type { SwapCategory, SwapContext } from "./swap-context";

  let {
    row,
    liftedSectionId,
    liftedColumn,
    liftedMode,
    splitSlotAvailable,
    splitAvailable,
    splitMode,
    swapContext,
    onToggleMoveLift,
    onToggleCopyLift,
    onSplitSlotAdd,
    onSplitSlotPlace,
    onColumnAdd,
    onColumnPlace,
    onSwapPlace,
  }: {
    row: Row;
    liftedSectionId: string | null;
    liftedColumn: 0 | 1 | null;
    liftedMode: "move" | "copy" | null;
    splitSlotAvailable: boolean;
    splitAvailable: boolean;
    splitMode: "move" | "copy" | null;
    swapContext: SwapContext;
    onToggleMoveLift: (sectionId: string, column: 0 | 1 | null) => void;
    onToggleCopyLift: (sectionId: string, column: 0 | 1 | null) => void;
    onSplitSlotAdd: () => void;
    onSplitSlotPlace: () => void;
    onColumnAdd: (column: 0 | 1, atIndex: number) => void;
    onColumnPlace: (column: 0 | 1, atIndex: number) => void;
    onSwapPlace: (sectionId: string) => void;
  } = $props();

  // A FullRow's own section is either a genuinely full-width type (never
  // split-eligible) or a "solo" split section — one not currently part of
  // a split layout. Solo sections show the trailing add-split-section
  // affordance and are swap-compatible with everything (see swap-context.ts).
  const fullEntry = $derived(
    row.kind === "full"
      ? (sectionRegistry[row.section.type] as SectionRegistryEntry)
      : undefined,
  );
  const showSplitSlot = $derived(fullEntry?.split === true);
  const fullCategory = $derived<SwapCategory>(
    fullEntry?.split === true ? "solo" : "full",
  );
</script>

<div class="row-view">
  {#if row.kind === "full"}
    <div class="row-view__sections">
      <SectionFrame
        rowId={row.id}
        section={row.section}
        liftedMode={liftedSectionId === row.section.id ? liftedMode : null}
        swapAvailable={isSwapTarget(swapContext, fullCategory, row.section.id)}
        onToggleMoveLift={() => onToggleMoveLift(row.section.id, null)}
        onToggleCopyLift={() => onToggleCopyLift(row.section.id, null)}
        onSwapPlace={() => onSwapPlace(row.section.id)}
      />
      {#if showSplitSlot}
        <SplitEdgeSlot
          available={splitSlotAvailable}
          mode={splitMode}
          onAddClick={onSplitSlotAdd}
          onPlaceClick={onSplitSlotPlace}
        />
      {/if}
    </div>
  {:else}
    <div class="row-view__sections row-view__sections--split">
      <div class="row-view__column">
        <ColumnView
          rowId={row.id}
          items={row.columns[0]}
          liftedSectionId={liftedColumn === 0 ? liftedSectionId : null}
          liftedMode={liftedColumn === 0 ? liftedMode : null}
          gapAvailable={splitAvailable}
          gapMode={splitMode}
          {swapContext}
          onToggleMoveLift={(sectionId) => onToggleMoveLift(sectionId, 0)}
          onToggleCopyLift={(sectionId) => onToggleCopyLift(sectionId, 0)}
          onAdd={(atIndex) => onColumnAdd(0, atIndex)}
          onPlace={(atIndex) => onColumnPlace(0, atIndex)}
          {onSwapPlace}
        />
      </div>
      <div class="row-view__column">
        <span class="row-view__split-badge no-print" aria-hidden="true">
          <SquareSplitHorizontalIcon size={12} />
        </span>
        <ColumnView
          rowId={row.id}
          items={row.columns[1]}
          liftedSectionId={liftedColumn === 1 ? liftedSectionId : null}
          liftedMode={liftedColumn === 1 ? liftedMode : null}
          gapAvailable={splitAvailable}
          gapMode={splitMode}
          {swapContext}
          onToggleMoveLift={(sectionId) => onToggleMoveLift(sectionId, 1)}
          onToggleCopyLift={(sectionId) => onToggleCopyLift(sectionId, 1)}
          onAdd={(atIndex) => onColumnAdd(1, atIndex)}
          onPlace={(atIndex) => onColumnPlace(1, atIndex)}
          {onSwapPlace}
        />
      </div>
    </div>
  {/if}
</div>

<style>
  .row-view__sections {
    display: flex;
    gap: var(--space-4);
    align-items: flex-start;
    min-width: 0;
  }

  .row-view__sections--split {
    gap: var(--space-2);
    /*
     * Each `.row-view__column` is otherwise only as tall as its own
     * content, so the divider on the second column would stop short of
     * the taller one's bottom. Stretching both to the container's
     * height — already exactly the taller column's height, container
     * height being the max of its children's regardless of
     * `align-items` — makes the divider always exactly as tall as the
     * taller column, including its own gap affordances.
     */
    align-items: stretch;
  }

  .row-view__column {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  /*
   * A split layout's two columns get an accent-colored (not neutral-gray)
   * rule between them so a split reads as a distinct signal — every other
   * seam in the document (RowGap, between unrelated rows) uses the neutral
   * border color, so hue alone marks "these two columns belong together."
   * The badge sits on the divider's own bottom corner, not offset in from
   * it, since the divider is now genuinely this column's own boundary
   * rather than a rule borrowed from a section box.
   */
  .row-view__column + .row-view__column {
    position: relative;
    border-left: 1px solid
      color-mix(in srgb, var(--color-accent) 35%, transparent);
    padding-left: var(--space-4);
  }

  .row-view__split-badge {
    position: absolute;
    left: 0;
    bottom: 0;
    transform: translate(-50%, 50%);
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 1.5px solid color-mix(in srgb, var(--color-accent) 55%, transparent);
    background: var(--color-background);
    color: var(--color-accent);
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

    .row-view__sections--split {
      gap: var(--space-2);
    }

    .row-view__column + .row-view__column {
      border-left: none;
      padding-left: 0;
      border-top: 1px solid
        color-mix(in srgb, var(--color-accent) 35%, transparent);
      padding-top: var(--space-4);
    }

    .row-view__split-badge {
      left: calc(5mm + 10px);
      top: 0;
      bottom: auto;
      transform: translate(-50%, -50%);
    }
  }
</style>
