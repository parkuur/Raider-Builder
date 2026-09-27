<script lang="ts" module>
  import type { Snippet } from "svelte";

  /**
   * What a section's `row` snippet gets besides the row itself. `lead` and
   * `trail` render the shared drag-handle cell and actions cell (hide +
   * remove); the snippet places them in its first `<tr>` as
   * `{@render ctx.lead(row, rowspan)}` / `{@render ctx.trail(row, rowspan)}`,
   * with a rowspan above 1 when one row entry spans several `<tr>`s
   * (Schedule slots).
   */
  export interface GroupedRowContext<R> {
    lead: Snippet<[R, number]>;
    trail: Snippet<[R, number]>;
    /** True if the row or its group is hidden. */
    hidden: boolean;
    inGroup: boolean;
  }
</script>

<script lang="ts" generics="R extends GroupableRow">
  import {
    GROUPED_LIST_END,
    addGroup,
    addGroupedRow,
    applyGroupedMove,
    entryId,
    isRowEffectivelyHidden,
    removeGroup,
    removeGroupedRow,
    resolveGroupedDrop,
    setGroupTitle,
    toggleGroupHidden,
    toggleGroupedRowHidden,
    ungroup,
  } from "../model/grouped-list";
  import type { GroupableRow, GroupedEntry } from "../model/grouped-list";
  import DragHandle from "./DragHandle.svelte";
  import RemoveButton from "./RemoveButton.svelte";
  import RowHideToggle from "./RowHideToggle.svelte";
  import SectionEmptyHint from "./SectionEmptyHint.svelte";
  import { DragReorderState } from "./drag-reorder.svelte";
  import PlusIcon from "phosphor-svelte/lib/PlusIcon";
  import FolderDashedIcon from "phosphor-svelte/lib/FolderDashedIcon";
  import TrashIcon from "phosphor-svelte/lib/TrashIcon";

  let {
    entries,
    onChange,
    makeRow,
    columnCount,
    rowNoun,
    emptyText,
    tableClass = "",
    resolveTargetId = (id: string) => id,
    header,
    row,
  }: {
    entries: GroupedEntry<R>[];
    onChange: (entries: GroupedEntry<R>[]) => void;
    makeRow: () => R;
    /** Number of columns the `header`/`row` snippets render between the
     * shared drag and actions columns. */
    columnCount: number;
    /** Singular, lower-case: "item", "slot" — used in button labels. */
    rowNoun: string;
    emptyText: string;
    tableClass?: string;
    /** Maps a hit-tested drop id to a row/group id — for sections whose
     * rows contain their own nested drop targets (Schedule's items). */
    resolveTargetId?: (id: string) => string;
    header: Snippet;
    row: Snippet<[R, GroupedRowContext<R>]>;
  } = $props();

  const drag = new DragReorderState();

  function drop(rawTargetId: string): void {
    const draggedId = drag.draggingId;
    drag.end();
    if (!draggedId) return;
    const move = resolveGroupedDrop(
      entries,
      draggedId,
      resolveTargetId(rawTargetId),
    );
    if (move) onChange(applyGroupedMove(entries, move));
  }

  function dragProps(id: string) {
    return {
      onStart: () => drag.start(id),
      onOver: (overId: string) => drag.over(resolveTargetId(overId)),
      onDrop: drop,
      onEnd: () => drag.end(),
    };
  }

  function confirmRemoveGroup(groupId: string, rowCount: number): void {
    if (
      rowCount === 0 ||
      window.confirm(
        `Delete this group and the ${rowCount} ${rowNoun}${rowCount === 1 ? "" : "s"} in it?`,
      )
    ) {
      onChange(removeGroup(entries, groupId));
    }
  }

  const totalColumns = $derived(columnCount + 2);
</script>

{#snippet lead(item: R, rowspan: number)}
  <td class="data-table__drag no-print" {rowspan}>
    <DragHandle {...dragProps(item.id)} />
  </td>
{/snippet}

{#snippet trail(item: R, rowspan: number)}
  <td class="data-table__actions-cell no-print" {rowspan}>
    <div class="data-table__actions">
      <RowHideToggle
        hidden={item.hidden}
        noun={rowNoun}
        onToggle={() => onChange(toggleGroupedRowHidden(entries, item.id))}
      />
      <RemoveButton
        label="Remove {rowNoun}"
        onclick={() => onChange(removeGroupedRow(entries, item.id))}
      />
    </div>
  </td>
{/snippet}

{#snippet rowBody(item: R, inGroup: boolean)}
  {@const hidden = isRowEffectivelyHidden(entries, item.id)}
  <tbody
    class="grouped-table__row"
    class:grouped-table__row--in-group={inGroup}
    class:data-table__row--hidden={hidden}
    class:hidden-from-print={hidden}
    class:grouped-table__drop-target={drag.isOver(item.id)}
    data-reorder-item={item.id}
  >
    {@render row(item, { lead, trail, hidden, inGroup })}
  </tbody>
{/snippet}

{#if entries.length === 0}
  <SectionEmptyHint text={emptyText} />
{/if}
<div class="data-table-scroll">
  <table class="data-table data-table--wide grouped-table {tableClass}">
    <thead>
      <tr>
        <th class="no-print"></th>
        {@render header()}
        <th class="no-print"></th>
      </tr>
    </thead>
    {#each entries as entry (entryId(entry))}
      {#if entry.kind === "row"}
        {@render rowBody(entry.row, false)}
      {:else}
        <tbody
          class="grouped-table__group"
          class:data-table__row--hidden={entry.hidden}
          class:hidden-from-print={entry.hidden}
          class:grouped-table__drop-target={drag.isOver(entry.id)}
          data-reorder-item={entry.id}
        >
          <tr class="grouped-table__group-header">
            <td class="data-table__drag no-print">
              <DragHandle {...dragProps(entry.id)} label="Drag to move group" />
            </td>
            <td colspan={columnCount}>
              <input
                class="grouped-table__group-title"
                value={entry.title}
                placeholder="Group heading"
                aria-label="Group heading"
                oninput={(e) =>
                  onChange(
                    setGroupTitle(entries, entry.id, e.currentTarget.value),
                  )}
              />
            </td>
            <td class="data-table__actions-cell no-print">
              <div class="data-table__actions">
                <button
                  type="button"
                  class="grouped-table__group-action"
                  aria-label="Add {rowNoun} to group"
                  title="Add {rowNoun} to group"
                  onclick={() =>
                    onChange(
                      addGroupedRow(entries, makeRow, { groupId: entry.id }),
                    )}
                >
                  <PlusIcon size={14} />
                </button>
                <RowHideToggle
                  hidden={entry.hidden}
                  noun="group"
                  onToggle={() =>
                    onChange(toggleGroupHidden(entries, entry.id))}
                />
                <button
                  type="button"
                  class="grouped-table__group-action"
                  aria-label="Ungroup"
                  title="Ungroup (keep its {rowNoun}s)"
                  onclick={() => onChange(ungroup(entries, entry.id))}
                >
                  <FolderDashedIcon size={14} />
                </button>
                <button
                  type="button"
                  class="grouped-table__group-action grouped-table__group-action--danger"
                  aria-label="Delete group"
                  title="Delete group"
                  onclick={() =>
                    confirmRemoveGroup(entry.id, entry.rows.length)}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
        {#each entry.rows as item (item.id)}
          {@render rowBody(item, true)}
        {/each}
      {/if}
    {/each}
    {#if drag.draggingId}
      <tbody
        class="grouped-table__end no-print"
        class:grouped-table__drop-target={drag.isOver(GROUPED_LIST_END)}
        data-reorder-item={GROUPED_LIST_END}
      >
        <tr>
          <td colspan={totalColumns}>Drop here to move to the end</td>
        </tr>
      </tbody>
    {/if}
  </table>
</div>
<div class="grouped-table__add-row no-print">
  <button
    type="button"
    class="data-table__add"
    onclick={() => onChange(addGroupedRow(entries, makeRow))}
  >
    + Add {rowNoun}
  </button>
  <button
    type="button"
    class="data-table__add"
    onclick={() => onChange(addGroup(entries))}
  >
    + Add group
  </button>
</div>

<style>
  .grouped-table__group-header td {
    padding-top: var(--space-3);
  }

  .grouped-table__group-title {
    width: 100%;
    border: none;
    border-bottom: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-body);
    padding: 2px 0;
  }

  /* Grouped rows are indented under their heading's text. */
  .grouped-table__row--in-group :global(td:nth-child(2)) {
    padding-left: var(--space-4);
  }

  .grouped-table__group-action {
    display: inline-flex;
    align-items: center;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 4px;
  }

  .grouped-table__group-action:hover,
  .grouped-table__group-action:focus-visible {
    color: var(--color-accent);
  }

  .grouped-table__group-action--danger:hover,
  .grouped-table__group-action--danger:focus-visible {
    color: var(--color-danger);
  }

  /* An insertion line above the drop target: rows land before the row
   * they're dropped on, and at the top of a group dropped on its header. */
  .grouped-table__drop-target :global(td) {
    box-shadow: inset 0 2px 0 var(--color-accent);
  }

  .grouped-table__end td {
    padding: var(--space-2);
    text-align: center;
    font-size: var(--font-size-label);
    color: var(--color-text-muted);
    border: 1px dashed var(--color-border);
  }

  .grouped-table__add-row {
    display: flex;
    gap: var(--space-2);
  }

  @media print {
    /* A rule under each printed row entry except the last printed one. */
    .grouped-table__row:has(~ tbody:not(.hidden-from-print):not(.no-print))
      > :global(tr:last-child > td) {
      border-bottom: 1px solid var(--color-border);
    }

    .grouped-table__group-title {
      border-bottom-color: var(--color-text);
    }
  }
</style>
