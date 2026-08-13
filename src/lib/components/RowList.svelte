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

  type LiftedSource =
    | { kind: "row"; rowId: string }
    | { kind: "section"; rowId: string; sectionId: string };

  let menuRequest = $state<MenuRequest | null>(null);
  let liftedSource = $state<LiftedSource | null>(null);

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

  // Resolves the lifted item's underlying Section, regardless of whether the
  // lift started from a whole-row trigger (only meaningful here when that
  // row has exactly one section) or a section-level trigger inside a paired
  // row.
  function liftedSectionOf(source: LiftedSource): Section | null {
    const row = getDocument().rows.find((r) => r.id === source.rowId);
    if (!row) return null;
    if (source.kind === "row") {
      return row.sections.length === 1 ? row.sections[0] : null;
    }
    return row.sections.find((s) => s.id === source.sectionId) ?? null;
  }

  function canPairWith(targetRowId: string): boolean {
    if (!liftedSource) return false;
    if (liftedSource.rowId === targetRowId) return false;
    const section = liftedSectionOf(liftedSource);
    if (!section) return false;
    const entry = sectionRegistry[section.type] as SectionRegistryEntry;
    return entry.half === true;
  }

  function toggleLiftRow(rowId: string): void {
    liftedSource =
      liftedSource?.kind === "row" && liftedSource.rowId === rowId
        ? null
        : { kind: "row", rowId };
  }

  function toggleLiftSection(rowId: string, sectionId: string): void {
    liftedSource =
      liftedSource?.kind === "section" && liftedSource.sectionId === sectionId
        ? null
        : { kind: "section", rowId, sectionId };
  }

  function placeAtZone(zoneIndex: number): void {
    const source = liftedSource;
    liftedSource = null;
    if (!source) return;
    if (source.kind === "row") {
      const fromIndex = getDocument().rows.findIndex(
        (r) => r.id === source.rowId,
      );
      if (fromIndex === -1) return;
      // A zone's index means "the gap before the row currently at that
      // index." Once the lifted row is spliced out, every gap after its own
      // original position shifts down by one — this is that correction.
      const finalIndex = zoneIndex > fromIndex ? zoneIndex - 1 : zoneIndex;
      reorderRows(fromIndex, finalIndex);
    } else {
      extractSectionToNewRow(source.rowId, source.sectionId, zoneIndex);
    }
  }

  function placeAtPair(targetRowId: string): void {
    const source = liftedSource;
    const eligible = canPairWith(targetRowId);
    liftedSource = null;
    if (!source || !eligible) return;
    const section = source.kind === "row" ? liftedSectionOf(source) : undefined;
    const sectionId = source.kind === "row" ? section?.id : source.sectionId;
    if (!sectionId) return;
    moveSectionToPair(source.rowId, sectionId, targetRowId);
  }

  // Clicking or tapping anywhere outside the lift/drop-target controls
  // cancels an in-progress lift without otherwise interrupting the click —
  // this is what lets the user freely scroll or edit elsewhere mid-move
  // instead of being stuck in a modal "drag" state. Controls involved in the
  // lift/place flow are marked with `data-lift-ui` and are excluded here so
  // their own click handlers still see the in-progress lift.
  $effect(() => {
    if (!liftedSource) return;
    function handleDocumentClick(e: MouseEvent): void {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-lift-ui]")) return;
      liftedSource = null;
    }
    function handleKeydown(e: KeyboardEvent): void {
      if (e.key === "Escape") liftedSource = null;
    }
    document.addEventListener("click", handleDocumentClick, true);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      document.removeEventListener("keydown", handleKeydown);
    };
  });
</script>

<div class="row-list">
  {#if getDocument().rows.length === 0}
    <EmptyState onAdd={() => openInsertMenu(0)} />
  {:else}
    <RowDropZone
      available={liftedSource !== null}
      onClick={() => placeAtZone(0)}
    />
    <AddSectionTrigger onClick={() => openInsertMenu(0)} />
    {#each getDocument().rows as row, i (row.id)}
      <RowView
        {row}
        first={i === 0}
        liftedRow={liftedSource?.kind === "row" &&
          liftedSource.rowId === row.id}
        liftedSectionId={liftedSource?.kind === "section" &&
        liftedSource.rowId === row.id
          ? liftedSource.sectionId
          : null}
        pairAvailable={canPairWith(row.id)}
        onToggleLift={() => toggleLiftRow(row.id)}
        onToggleSectionLift={(sectionId) =>
          toggleLiftSection(row.id, sectionId)}
        onPairAdd={() => openPairMenu(row.id)}
        onPairPlace={() => placeAtPair(row.id)}
      />
      <RowDropZone
        available={liftedSource !== null}
        onClick={() => placeAtZone(i + 1)}
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
