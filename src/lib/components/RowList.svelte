<script lang="ts">
  import RowView from "./RowView.svelte";
  import RowGap from "./RowGap.svelte";
  import AddSectionMenu from "./AddSectionMenu.svelte";
  import EmptyState from "./EmptyState.svelte";
  import {
    addRow,
    createSplitRow,
    duplicateSectionIntoColumn,
    duplicateSectionToNewRow,
    duplicateSectionToSplitRow,
    getDocument,
    insertSectionIntoColumn,
    moveSectionIntoColumn,
    moveSectionToNewRow,
    moveSectionToSplitRow,
    reorderRows,
    reorderSectionWithinColumn,
    swapSections,
  } from "../state/document.svelte";
  import { sectionRegistry } from "../sections/registry";
  import type { SectionRegistryEntry } from "../sections/registry";
  import type { SwapCategory, SwapContext } from "./swap-context";
  import type { SectionType } from "../model/section-types";
  import type { Row } from "../model/document-types";

  type MenuRequest =
    | { kind: "insert"; index: number }
    | { kind: "split-edge"; rowId: string }
    | { kind: "column-insert"; rowId: string; column: 0 | 1; atIndex: number };

  type LiftMode = "move" | "copy";

  // A row-kind lift (kind: "row") always means "this is a FullRow's own
  // section" — never inferred from column-emptiness, since a solo split
  // section is structurally just a FullRow like any other. A section-kind
  // lift always means "an item embedded in a SplitRow's column."
  type LiftedSource =
    | {
        kind: "row";
        rowId: string;
        sectionId: string;
        mode: LiftMode;
        category: "full" | "solo";
      }
    | {
        kind: "section";
        rowId: string;
        column: 0 | 1;
        sectionId: string;
        mode: LiftMode;
        category: "embedded";
      };

  let menuRequest = $state<MenuRequest | null>(null);
  let liftedSource = $state<LiftedSource | null>(null);

  function splitEligible(type: SectionType): boolean {
    return (sectionRegistry[type] as SectionRegistryEntry).split === true;
  }

  function openInsertMenu(index: number): void {
    menuRequest = { kind: "insert", index };
  }

  function openSplitEdgeMenu(rowId: string): void {
    menuRequest = { kind: "split-edge", rowId };
  }

  function openColumnInsertMenu(
    rowId: string,
    column: 0 | 1,
    atIndex: number,
  ): void {
    menuRequest = { kind: "column-insert", rowId, column, atIndex };
  }

  function closeMenu(): void {
    menuRequest = null;
  }

  function pickType(type: SectionType): void {
    if (!menuRequest) return;
    if (menuRequest.kind === "insert") {
      addRow(type, menuRequest.index);
    } else if (menuRequest.kind === "split-edge") {
      createSplitRow(menuRequest.rowId, type);
    } else {
      insertSectionIntoColumn(
        menuRequest.rowId,
        menuRequest.column,
        menuRequest.atIndex,
        type,
      );
    }
    closeMenu();
  }

  // The single entry point for both the move and copy triggers on a
  // section: whether this is a row-kind or section-kind lift is derived
  // from the row's own kind, not tracked separately by the caller.
  function toggleLift(
    row: Row,
    sectionId: string,
    column: 0 | 1 | null,
    mode: LiftMode,
  ): void {
    const isSameLift =
      liftedSource?.mode === mode && liftedSource?.sectionId === sectionId;
    if (isSameLift) {
      liftedSource = null;
      return;
    }
    if (row.kind === "full") {
      const category: "full" | "solo" = splitEligible(row.section.type)
        ? "solo"
        : "full";
      liftedSource = { kind: "row", rowId: row.id, sectionId, mode, category };
    } else {
      liftedSource = {
        kind: "section",
        rowId: row.id,
        column: column!,
        sectionId,
        mode,
        category: "embedded",
      };
    }
  }

  function placeAtZone(zoneIndex: number): void {
    const source = liftedSource;
    liftedSource = null;
    if (!source) return;
    if (source.mode === "copy") {
      duplicateSectionToNewRow(source.rowId, source.sectionId, zoneIndex);
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
      moveSectionToNewRow(source.rowId, source.sectionId, zoneIndex);
    }
  }

  // A FullRow's split-edge slot is only a meaningful move target when the
  // lifted section is itself split-eligible (solo or embedded); moving it
  // onto its own row in move mode would be a no-op (nothing to place next
  // to itself), but copying a solo section onto its own slot is exactly
  // how it gets split with a copy of itself, so only move mode is excluded.
  function splitSlotAvailable(targetRowId: string): boolean {
    if (!liftedSource || liftedSource.category === "full") return false;
    if (liftedSource.rowId === targetRowId && liftedSource.mode === "move") {
      return false;
    }
    return true;
  }

  function placeAtSplitEdge(targetRowId: string): void {
    const source = liftedSource;
    const eligible = splitSlotAvailable(targetRowId);
    liftedSource = null;
    if (!source || !eligible) return;
    if (source.mode === "copy") {
      duplicateSectionToSplitRow(source.rowId, source.sectionId, targetRowId);
    } else {
      moveSectionToSplitRow(source.rowId, source.sectionId, targetRowId);
    }
  }

  function placeAtColumn(
    targetRowId: string,
    column: 0 | 1,
    atIndex: number,
  ): void {
    const source = liftedSource;
    liftedSource = null;
    if (!source || source.category === "full") return;
    if (source.mode === "copy") {
      duplicateSectionIntoColumn(
        source.rowId,
        source.sectionId,
        targetRowId,
        column,
        atIndex,
      );
      return;
    }
    if (
      source.kind === "section" &&
      source.rowId === targetRowId &&
      source.column === column
    ) {
      const row = getDocument().rows.find((r) => r.id === targetRowId);
      const fromIndex =
        row?.kind === "split"
          ? row.columns[column].findIndex((s) => s.id === source.sectionId)
          : -1;
      if (fromIndex === -1) return;
      const finalIndex = atIndex > fromIndex ? atIndex - 1 : atIndex;
      reorderSectionWithinColumn(targetRowId, column, fromIndex, finalIndex);
      return;
    }
    moveSectionIntoColumn(
      source.rowId,
      source.sectionId,
      targetRowId,
      column,
      atIndex,
    );
  }

  function placeAtSwap(targetRowId: string, targetSectionId: string): void {
    const source = liftedSource;
    liftedSource = null;
    if (!source || source.mode !== "move") return;
    swapSections(source.rowId, source.sectionId, targetRowId, targetSectionId);
  }

  const splitAvailable = $derived(
    liftedSource !== null && liftedSource.category !== "full",
  );
  const splitMode = $derived(liftedSource?.mode ?? null);
  const swapContext = $derived.by((): SwapContext => {
    if (!liftedSource || liftedSource.mode !== "move") return { active: false };
    const category: SwapCategory = liftedSource.category;
    return { active: true, category, excludeSectionId: liftedSource.sectionId };
  });

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
          ? liftedSource.sectionId
          : null}
        liftedColumn={liftedSource &&
        liftedSource.kind === "section" &&
        liftedSource.rowId === row.id
          ? liftedSource.column
          : null}
        liftedMode={liftedSource && liftedSource.rowId === row.id
          ? liftedSource.mode
          : null}
        splitSlotAvailable={splitSlotAvailable(row.id)}
        {splitAvailable}
        {splitMode}
        {swapContext}
        onToggleMoveLift={(sectionId, column) =>
          toggleLift(row, sectionId, column, "move")}
        onToggleCopyLift={(sectionId, column) =>
          toggleLift(row, sectionId, column, "copy")}
        onSplitSlotAdd={() => openSplitEdgeMenu(row.id)}
        onSplitSlotPlace={() => placeAtSplitEdge(row.id)}
        onColumnAdd={(column, atIndex) =>
          openColumnInsertMenu(row.id, column, atIndex)}
        onColumnPlace={(column, atIndex) =>
          placeAtColumn(row.id, column, atIndex)}
        onSwapPlace={(sectionId) => placeAtSwap(row.id, sectionId)}
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
  filterSplitOnly={menuRequest !== null && menuRequest.kind !== "insert"}
  onPick={pickType}
  onClose={closeMenu}
/>
