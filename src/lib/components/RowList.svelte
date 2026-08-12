<script lang="ts">
  import RowView from "./RowView.svelte";
  import RowDropZone from "./RowDropZone.svelte";
  import AddSectionTrigger from "./AddSectionTrigger.svelte";
  import AddSectionMenu from "./AddSectionMenu.svelte";
  import EmptyState from "./EmptyState.svelte";
  import {
    addRow,
    extractSectionToNewRow,
    getDocument,
    moveSectionToPair,
    pairSections,
    reorderRows,
  } from "../state/document.svelte";
  import { sectionRegistry } from "../sections/registry";
  import type { SectionRegistryEntry } from "../sections/registry";
  import type { Section } from "../model/section-types";
  import type { SectionType } from "../model/section-types";

  type MenuRequest =
    { kind: "insert"; index: number } | { kind: "pair"; rowId: string };

  type DragSource =
    | { kind: "row"; rowId: string }
    | { kind: "section"; rowId: string; sectionId: string };

  let menuRequest = $state<MenuRequest | null>(null);
  let dragSource = $state<DragSource | null>(null);
  let hoverZoneIndex = $state<number | null>(null);
  let hoverPairRowId = $state<string | null>(null);

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

  // Resolves the dragged item's underlying Section, regardless of whether
  // the drag started from a row-level handle (only meaningful here when
  // that row has exactly one section) or a section-level handle inside a
  // paired row.
  function draggedSection(source: DragSource): Section | null {
    const row = getDocument().rows.find((r) => r.id === source.rowId);
    if (!row) return null;
    if (source.kind === "row") {
      return row.sections.length === 1 ? row.sections[0] : null;
    }
    return row.sections.find((s) => s.id === source.sectionId) ?? null;
  }

  function canPairWith(targetRowId: string): boolean {
    if (!dragSource) return false;
    if (dragSource.rowId === targetRowId) return false;
    const section = draggedSection(dragSource);
    if (!section) return false;
    const entry = sectionRegistry[section.type] as SectionRegistryEntry;
    return entry.half === true;
  }

  function handleRowDragStart(rowId: string): void {
    dragSource = { kind: "row", rowId };
  }

  function handleSectionDragStart(rowId: string, sectionId: string): void {
    dragSource = { kind: "section", rowId, sectionId };
  }

  function handleDragEnd(): void {
    dragSource = null;
    hoverZoneIndex = null;
    hoverPairRowId = null;
  }

  function handleZoneDragOver(zoneIndex: number, e: DragEvent): void {
    if (!dragSource) return;
    e.preventDefault();
    hoverZoneIndex = zoneIndex;
    hoverPairRowId = null;
  }

  function handleZoneDrop(zoneIndex: number, e: DragEvent): void {
    e.preventDefault();
    const source = dragSource;
    dragSource = null;
    hoverZoneIndex = null;
    hoverPairRowId = null;
    if (!source) return;
    if (source.kind === "row") {
      const fromIndex = getDocument().rows.findIndex(
        (r) => r.id === source.rowId,
      );
      if (fromIndex === -1) return;
      // A zone's index means "the gap before the row currently at that
      // index." Once the dragged row is spliced out, every gap after its
      // own original position shifts down by one — this is that
      // correction.
      const finalIndex = zoneIndex > fromIndex ? zoneIndex - 1 : zoneIndex;
      reorderRows(fromIndex, finalIndex);
    } else {
      extractSectionToNewRow(source.rowId, source.sectionId, zoneIndex);
    }
  }

  function handlePairDragOver(targetRowId: string, e: DragEvent): void {
    if (!canPairWith(targetRowId)) return;
    e.preventDefault();
    hoverPairRowId = targetRowId;
    hoverZoneIndex = null;
  }

  function handlePairDrop(targetRowId: string, e: DragEvent): void {
    e.preventDefault();
    const source = dragSource;
    const eligible = canPairWith(targetRowId);
    dragSource = null;
    hoverZoneIndex = null;
    hoverPairRowId = null;
    if (!source || !eligible) return;
    const section = source.kind === "row" ? draggedSection(source) : undefined;
    const sectionId = source.kind === "row" ? section?.id : source.sectionId;
    if (!sectionId) return;
    moveSectionToPair(source.rowId, sectionId, targetRowId);
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
        dragging={dragSource?.kind === "row" && dragSource.rowId === row.id}
        draggingSectionId={dragSource?.kind === "section" &&
        dragSource.rowId === row.id
          ? dragSource.sectionId
          : null}
        pairDropActive={hoverPairRowId === row.id}
        onDragStart={() => handleRowDragStart(row.id)}
        onDragEnd={handleDragEnd}
        onSectionDragStart={(sectionId) =>
          handleSectionDragStart(row.id, sectionId)}
        onSectionDragEnd={handleDragEnd}
        onPairRequest={openPairMenu}
        onPairDragOver={(e) => handlePairDragOver(row.id, e)}
        onPairDrop={(e) => handlePairDrop(row.id, e)}
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
