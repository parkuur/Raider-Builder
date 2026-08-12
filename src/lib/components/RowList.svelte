<script lang="ts">
  import RowView from "./RowView.svelte";
  import RowDropZone from "./RowDropZone.svelte";
  import AddSectionTrigger from "./AddSectionTrigger.svelte";
  import AddSectionMenu from "./AddSectionMenu.svelte";
  import EmptyState from "./EmptyState.svelte";
  import {
    addRow,
    getDocument,
    pairSections,
    reorderRows,
  } from "../state/document.svelte";
  import type { SectionType } from "../model/section-types";

  type MenuRequest =
    { kind: "insert"; index: number } | { kind: "pair"; rowId: string };

  let menuRequest = $state<MenuRequest | null>(null);
  let draggingRowId = $state<string | null>(null);
  let hoverZoneIndex = $state<number | null>(null);

  function openInsertMenu(index: number): void {
    menuRequest = { kind: "insert", index };
  }

  function openPairMenu(rowId: string): void {
    menuRequest = { kind: "pair", rowId };
  }

  function closeMenu(): void {
    menuRequest = null;
  }

  function pickType(type: SectionType): void {
    if (!menuRequest) return;
    if (menuRequest.kind === "insert") {
      addRow(type, menuRequest.index);
    } else {
      pairSections(menuRequest.rowId, type);
    }
    closeMenu();
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
    <EmptyState onAdd={() => openInsertMenu(0)} />
  {:else}
    <RowDropZone
      active={hoverZoneIndex === 0}
      onDragOver={(e) => handleZoneDragOver(0, e)}
      onDrop={(e) => handleZoneDrop(0, e)}
    />
    <AddSectionTrigger onClick={() => openInsertMenu(0)} />
    {#each getDocument().rows as row, i (row.id)}
      <RowView
        {row}
        dragging={draggingRowId === row.id}
        onDragStart={() => handleDragStart(row.id)}
        onDragEnd={handleDragEnd}
        onPairRequest={openPairMenu}
      />
      <RowDropZone
        active={hoverZoneIndex === i + 1}
        onDragOver={(e) => handleZoneDragOver(i + 1, e)}
        onDrop={(e) => handleZoneDrop(i + 1, e)}
      />
      <AddSectionTrigger onClick={() => openInsertMenu(i + 1)} />
    {/each}
  {/if}
</div>

<AddSectionMenu
  open={menuRequest !== null}
  filterHalfOnly={menuRequest?.kind === "pair"}
  onPick={pickType}
  onClose={closeMenu}
/>
