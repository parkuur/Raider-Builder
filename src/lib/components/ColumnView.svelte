<script lang="ts">
  import SectionFrame from "./SectionFrame.svelte";
  import RowGap from "./RowGap.svelte";
  import { isSwapTarget } from "./swap-context";
  import type { SwapContext } from "./swap-context";
  import type { Section } from "../model/section-types";

  let {
    rowId,
    items,
    liftedSectionId,
    liftedMode,
    gapAvailable,
    gapMode,
    swapContext,
    onToggleMoveLift,
    onToggleCopyLift,
    onAdd,
    onPlace,
    onSwapPlace,
  }: {
    rowId: string;
    items: Section[];
    liftedSectionId: string | null;
    liftedMode: "move" | "copy" | null;
    gapAvailable: boolean;
    gapMode: "move" | "copy" | null;
    swapContext: SwapContext;
    onToggleMoveLift: (sectionId: string) => void;
    onToggleCopyLift: (sectionId: string) => void;
    onAdd: (atIndex: number) => void;
    onPlace: (atIndex: number) => void;
    onSwapPlace: (sectionId: string) => void;
  } = $props();
</script>

<div class="column-view">
  <RowGap
    available={gapAvailable}
    mode={gapMode}
    showRule={false}
    onAdd={() => onAdd(0)}
    onPlace={() => onPlace(0)}
  />
  {#each items as section, index (section.id)}
    <SectionFrame
      {rowId}
      {section}
      liftedMode={liftedSectionId === section.id ? liftedMode : null}
      swapAvailable={isSwapTarget(swapContext, "embedded", section.id)}
      onToggleMoveLift={() => onToggleMoveLift(section.id)}
      onToggleCopyLift={() => onToggleCopyLift(section.id)}
      onSwapPlace={() => onSwapPlace(section.id)}
    />
    <RowGap
      available={gapAvailable}
      mode={gapMode}
      showRule={index < items.length - 1}
      onAdd={() => onAdd(index + 1)}
      onPlace={() => onPlace(index + 1)}
    />
  {/each}
</div>

<style>
  .column-view {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }
</style>
