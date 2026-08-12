<script lang="ts">
  import type { Section } from "../../model/section-types";
  import {
    addMonitorRow,
    pairMonitorRows,
    removeMonitorRow,
    reorderMonitorRows,
    unpairMonitorRow,
    updateMonitorRow,
  } from "../../model/monitor-list";
  import { numberRows } from "../../model/row-list";
  import { setMonitorListData } from "../../state/document.svelte";
  import SectionEmptyHint from "../../components/SectionEmptyHint.svelte";
  import DragHandle from "../../components/DragHandle.svelte";
  import { DragReorderState } from "../../components/drag-reorder.svelte";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "monitor-list" }> } =
    $props();

  function commit(data: typeof section.data) {
    setMonitorListData(rowId, section.id, data);
  }

  const numbered = $derived(numberRows(section.data.rows));
  function labelFor(id: string): string {
    return numbered.find((n) => n.id === id)?.label ?? "";
  }

  const drag = new DragReorderState();
</script>

{#if section.data.rows.length === 0}
  <SectionEmptyHint text="No monitor mixes yet — add one below." />
{/if}
<table class="monitor-list">
  <thead>
    <tr>
      <th class="no-print"></th>
      <th class="monitor-list__num">Mon</th>
      <th>Player</th>
      <th>Type</th>
      <th>Mix Notes</th>
      <th class="no-print"></th>
    </tr>
  </thead>
  <tbody>
    {#each section.data.rows as row, index (row.id)}
      {@const next = section.data.rows[index + 1]}
      <tr
        class:monitor-list__row--drag-over={drag.isOver(row.id)}
        ondragover={(e) => {
          e.preventDefault();
          drag.over(row.id);
        }}
        ondrop={(e) => {
          e.preventDefault();
          const move = drag.resolveDrop(
            section.data.rows.map((r) => r.id),
            row.id,
          );
          if (move) commit(reorderMonitorRows(section.data, move[0], move[1]));
        }}
      >
        <td class="monitor-list__drag no-print">
          <DragHandle
            onDragStart={() => drag.start(row.id)}
            onDragEnd={() => drag.end()}
          />
        </td>
        <td class="monitor-list__num">{labelFor(row.id)}</td>
        <td>
          <input
            class="monitor-list__player-input"
            value={row.player}
            placeholder="Player"
            oninput={(e) =>
              commit(
                updateMonitorRow(section.data, row.id, {
                  player: e.currentTarget.value,
                }),
              )}
          />
        </td>
        <td>
          <input
            value={row.type}
            placeholder="Wedge / IEM"
            oninput={(e) =>
              commit(
                updateMonitorRow(section.data, row.id, {
                  type: e.currentTarget.value,
                }),
              )}
          />
        </td>
        <td>
          <input
            value={row.notes}
            placeholder="Mix notes"
            oninput={(e) =>
              commit(
                updateMonitorRow(section.data, row.id, {
                  notes: e.currentTarget.value,
                }),
              )}
          />
        </td>
        <td class="monitor-list__actions no-print">
          {#if row.pairedWithId !== undefined}
            <button
              type="button"
              title="Unpair"
              onclick={() => commit(unpairMonitorRow(section.data, row.id))}
            >
              Unpair
            </button>
          {:else if next && next.pairedWithId === undefined}
            <button
              type="button"
              title="Pair with next row"
              onclick={() =>
                commit(pairMonitorRows(section.data, row.id, next.id))}
            >
              Pair
            </button>
          {/if}
          <button
            type="button"
            title="Remove"
            onclick={() => commit(removeMonitorRow(section.data, row.id))}
          >
            Remove
          </button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>
<button
  type="button"
  class="monitor-list__add no-print"
  onclick={() => commit(addMonitorRow(section.data))}
>
  + Add Monitor
</button>

<style>
  .monitor-list {
    width: 100%;
    border-collapse: collapse;
  }

  .monitor-list th {
    text-align: left;
    font-size: var(--font-size-label);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    padding: 4px var(--space-1);
    border-bottom: 1px solid var(--color-border);
  }

  .monitor-list td {
    padding: 2px var(--space-1);
    vertical-align: middle;
  }

  .monitor-list__num {
    width: 40px;
    text-align: center;
    font-family: var(--font-heading);
    font-weight: 600;
  }

  .monitor-list__drag {
    width: 20px;
    text-align: center;
  }

  .monitor-list__row--drag-over {
    outline: 2px solid var(--color-accent);
    outline-offset: -2px;
  }

  .monitor-list input {
    width: 100%;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-body);
    padding: 3px var(--space-1);
    box-sizing: border-box;
  }

  .monitor-list__actions {
    display: flex;
    gap: 4px;
    white-space: nowrap;
  }

  .monitor-list__actions button {
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-label);
    padding: 3px 6px;
    cursor: pointer;
  }

  .monitor-list__actions button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .monitor-list__add {
    margin-top: var(--space-2);
    padding: 4px var(--space-2);
    border: 1px dashed var(--color-border);
    background: transparent;
    cursor: pointer;
    font-size: var(--font-size-label);
    color: var(--color-accent);
    font-family: var(--font-heading);
    font-weight: 600;
    letter-spacing: 0.02em;
  }
</style>
