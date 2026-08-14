<script lang="ts">
  import RowView from "./RowView.svelte";
  import RowGap from "./RowGap.svelte";
  import AddSectionMenu from "./AddSectionMenu.svelte";
  import EmptyState from "./EmptyState.svelte";
  import {
    addRow,
    duplicateSectionIntoPair,
    duplicateSectionToNewRow,
    extractSectionToNewRow,
    getDocument,
    moveSectionToPair,
    pairSections,
    reorderRows,
    swapPairedSections,
  } from "../state/document.svelte";
  import { sectionRegistry } from "../sections/registry";
  import type { SectionRegistryEntry } from "../sections/registry";
  import type { Row } from "../model/document-types";
  import type { Section } from "../model/section-types";
  import type { SectionType } from "../model/section-types";

  type MenuRequest =
    { kind: "insert"; index: number } | { kind: "pair"; rowId: string };

  type LiftMode = "move" | "copy";

  type LiftedSource =
    | { kind: "row"; rowId: string; mode: LiftMode }
    | { kind: "section"; rowId: string; sectionId: string; mode: LiftMode };

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
  // lift started on a lone section (kind "row" — moving/copying it moves/
  // copies its whole one-section row) or on one side of a paired row (kind
  // "section").
  function liftedSectionOf(source: LiftedSource): Section | null {
    const row = getDocument().rows.find((r) => r.id === source.rowId);
    if (!row) return null;
    if (source.kind === "row") {
      return row.sections.length === 1 ? row.sections[0]! : null;
    }
    return row.sections.find((s) => s.id === source.sectionId) ?? null;
  }

  function canPairWith(targetRowId: string): boolean {
    if (!liftedSource) return false;
    // Moving a section onto a pair slot on its own row is a meaningless
    // no-op (there's nothing to move — moveSectionToPair guards this too),
    // but copying a solo half-width section onto its own row's pair slot
    // is exactly how you pair it with a copy of itself, so only move mode
    // is excluded here.
    if (liftedSource.rowId === targetRowId && liftedSource.mode === "move")
      return false;
    const section = liftedSectionOf(liftedSource);
    if (!section) return false;
    const entry = sectionRegistry[section.type] as SectionRegistryEntry;
    return entry.half === true;
  }

  // The single entry point for both the move and copy triggers on a
  // section: which underlying mutation kind applies (whole row vs. one side
  // of a pair) is derived from the row's current section count, not tracked
  // separately by the caller.
  function toggleLift(row: Row, sectionId: string, mode: LiftMode): void {
    const isSameLift =
      liftedSource?.mode === mode &&
      (liftedSource.kind === "row"
        ? liftedSource.rowId === row.id
        : liftedSource.sectionId === sectionId);
    if (isSameLift) {
      liftedSource = null;
      return;
    }
    liftedSource =
      row.sections.length === 1
        ? { kind: "row", rowId: row.id, mode }
        : { kind: "section", rowId: row.id, sectionId, mode };
  }

  function placeAtZone(zoneIndex: number): void {
    const source = liftedSource;
    liftedSource = null;
    if (!source) return;
    if (source.mode === "copy") {
      const section = liftedSectionOf(source);
      if (!section) return;
      duplicateSectionToNewRow(source.rowId, section.id, zoneIndex);
      return;
    }
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
    const section = liftedSectionOf(source);
    if (!section) return;
    if (source.mode === "copy") {
      duplicateSectionIntoPair(source.rowId, section.id, targetRowId);
    } else {
      moveSectionToPair(source.rowId, section.id, targetRowId);
    }
  }

  // Dropping a lifted half onto its own row's other half swaps the two
  // sections' positions — a distinct target from `placeAtPair` (which
  // pairs onto a *different* row's single-section pair slot).
  function placeAtSwap(rowId: string): void {
    const source = liftedSource;
    liftedSource = null;
    if (!source || source.kind !== "section" || source.mode !== "move") return;
    if (source.rowId !== rowId) return;
    swapPairedSections(rowId);
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
    <RowGap
      available={liftedSource !== null}
      mode={liftedSource?.mode ?? null}
      showRule={false}
      onAdd={() => openInsertMenu(0)}
      onPlace={() => placeAtZone(0)}
    />
    {#each getDocument().rows as row, i (row.id)}
      <RowView
        {row}
        liftedSectionId={liftedSource && liftedSource.rowId === row.id
          ? liftedSource.kind === "row"
            ? row.sections[0]!.id
            : liftedSource.sectionId
          : null}
        liftedMode={liftedSource && liftedSource.rowId === row.id
          ? liftedSource.mode
          : null}
        pairAvailable={canPairWith(row.id)}
        pairMode={liftedSource?.mode ?? null}
        onToggleMoveLift={(sectionId) => toggleLift(row, sectionId, "move")}
        onToggleCopyLift={(sectionId) => toggleLift(row, sectionId, "copy")}
        onPairAdd={() => openPairMenu(row.id)}
        onPairPlace={() => placeAtPair(row.id)}
        onSwapPlace={() => placeAtSwap(row.id)}
      />
      <RowGap
        available={liftedSource !== null}
        mode={liftedSource?.mode ?? null}
        showRule={i < getDocument().rows.length - 1}
        onAdd={() => openInsertMenu(i + 1)}
        onPlace={() => placeAtZone(i + 1)}
      />
    {/each}
  {/if}
</div>

<AddSectionMenu
  open={menuRequest !== null}
  filterHalfOnly={menuRequest?.kind === "pair"}
  onPick={pickType}
  onClose={closeMenu}
/>
