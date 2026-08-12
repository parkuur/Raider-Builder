<script lang="ts">
  import RowView from "./RowView.svelte";
  import AddSectionTrigger from "./AddSectionTrigger.svelte";
  import AddSectionMenu from "./AddSectionMenu.svelte";
  import EmptyState from "./EmptyState.svelte";
  import { addRow, getDocument } from "../state/document.svelte";
  import type { SectionType } from "../model/section-types";

  let addMenuAtIndex = $state<number | null>(null);

  function openAddMenu(index: number): void {
    addMenuAtIndex = index;
  }

  function closeAddMenu(): void {
    addMenuAtIndex = null;
  }

  function pickType(type: SectionType): void {
    if (addMenuAtIndex === null) return;
    addRow(type, addMenuAtIndex);
    closeAddMenu();
  }
</script>

<div class="row-list">
  {#if getDocument().rows.length === 0}
    <EmptyState onAdd={() => openAddMenu(0)} />
  {:else}
    <AddSectionTrigger onClick={() => openAddMenu(0)} />
    {#each getDocument().rows as row, i (row.id)}
      <RowView {row} />
      <AddSectionTrigger onClick={() => openAddMenu(i + 1)} />
    {/each}
  {/if}
</div>

<AddSectionMenu open={addMenuAtIndex !== null} onPick={pickType} onClose={closeAddMenu} />
