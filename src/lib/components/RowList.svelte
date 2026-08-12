<script lang="ts">
  import RowView from "./RowView.svelte";
  import RowDropZone from "./RowDropZone.svelte";
  import AddSectionTrigger from "./AddSectionTrigger.svelte";
  import AddSectionMenu from "./AddSectionMenu.svelte";
  import EmptyState from "./EmptyState.svelte";
  import { addRow, getDocument, reorderRows } from "../state/document.svelte";
  import type { SectionType } from "../model/section-types";

  let addMenuAtIndex = $state<number | null>(null);
  let draggingRowId = $state<string | null>(null);
  let hoverZoneIndex = $state<number | null>(null);

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

  function handleDragStart(rowId: string): void {
    draggingRowId = rowId;
  }

  function handleDragEnd(): void {
    draggingRowId = null;
    hoverZoneIndex = null;
  }

  function handleZoneDragOver(zoneIndex: number, e: DragEvent): void {
    if (!draggingRowId) return;
    e.preventDefault();
    hoverZoneIndex = zoneIndex;
  }

  function handleZoneDrop(zoneIndex: number, e: DragEvent): void {
    e.preventDefault();
    const fromId = draggingRowId;
    draggingRowId = null;
    hoverZoneIndex = null;
    if (!fromId) return;
    const fromIndex = getDocument().rows.findIndex((r) => r.id === fromId);
    if (fromIndex === -1) return;
    // A zone's index means "the gap before the row currently at that index."
    // Once the dragged row is spliced out, every gap after its own original
    // position shifts down by one — this is that correction.
    const finalIndex = zoneIndex > fromIndex ? zoneIndex - 1 : zoneIndex;
    reorderRows(fromIndex, finalIndex);
  }
</script>

<div class="row-list">
  {#if getDocument().rows.length === 0}
    <EmptyState onAdd={() => openAddMenu(0)} />
  {:else}
    <RowDropZone
      active={hoverZoneIndex === 0}
      onDragOver={(e) => handleZoneDragOver(0, e)}
      onDrop={(e) => handleZoneDrop(0, e)}
    />
    <AddSectionTrigger onClick={() => openAddMenu(0)} />
    {#each getDocument().rows as row, i (row.id)}
      <RowView
        {row}
        dragging={draggingRowId === row.id}
        onDragStart={() => handleDragStart(row.id)}
        onDragEnd={handleDragEnd}
      />
      <RowDropZone
        active={hoverZoneIndex === i + 1}
        onDragOver={(e) => handleZoneDragOver(i + 1, e)}
        onDrop={(e) => handleZoneDrop(i + 1, e)}
      />
      <AddSectionTrigger onClick={() => openAddMenu(i + 1)} />
    {/each}
  {/if}
</div>

<AddSectionMenu open={addMenuAtIndex !== null} onPick={pickType} onClose={closeAddMenu} />
