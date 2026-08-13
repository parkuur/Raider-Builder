<script lang="ts">
  import type { Section } from "../../model/section-types";
  import {
    addMonitorRow,
    numberMonitorRows,
    removeMonitorRow,
    reorderMonitorRows,
    updateMonitorRow,
  } from "../../model/monitor-list";
  import { setMonitorListData } from "../../state/document.svelte";
  import SectionEmptyHint from "../../components/SectionEmptyHint.svelte";
  import DragHandle from "../../components/DragHandle.svelte";
  import RemoveButton from "../../components/RemoveButton.svelte";
  import StereoToggle from "../../components/StereoToggle.svelte";
  import { DragReorderState } from "../../components/drag-reorder.svelte";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "monitor-list" }> } =
    $props();

  function commit(data: typeof section.data) {
    setMonitorListData(rowId, section.id, data);
  }

  const numbered = $derived(numberMonitorRows(section.data));
  function labelFor(id: string): string {
    return numbered.find((n) => n.id === id)?.label ?? "";
  }

  const drag = new DragReorderState();
</script>

{#if section.data.rows.length === 0}
  <SectionEmptyHint text="No monitor mixes yet — add one below." />
{/if}
<div class="monitor-list-scroll">
  <table class="monitor-list">
    <thead>
      <tr>
        <th class="no-print"></th>
        <th class="monitor-list__num">Mon</th>
        <th>Player</th>
        <th class="monitor-list__type">Type</th>
        <th>Mix Notes</th>
        <th class="no-print"></th>
        <th class="monitor-list__mode">Mode</th>
      </tr>
    </thead>
    <tbody>
      {#each section.data.rows as row (row.id)}
        <tr
          data-reorder-item={row.id}
          class:monitor-list__row--drag-over={drag.isOver(row.id)}
        >
          <td class="monitor-list__drag no-print">
            <DragHandle
              onStart={() => drag.start(row.id)}
              onOver={(id) => drag.over(id)}
              onDrop={(id) => {
                const move = drag.resolveDrop(
                  section.data.rows.map((r) => r.id),
                  id,
                );
                if (move)
                  commit(reorderMonitorRows(section.data, move[0], move[1]));
              }}
              onEnd={() => drag.end()}
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
          <td class="monitor-list__type">
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
            <StereoToggle
              active={row.stereo}
              onToggle={() =>
                commit(
                  updateMonitorRow(section.data, row.id, {
                    stereo: !row.stereo,
                  }),
                )}
            />
            <RemoveButton
              label="Remove monitor"
              onclick={() => commit(removeMonitorRow(section.data, row.id))}
            />
          </td>
          <td class="monitor-list__mode">{row.stereo ? "Stereo" : "Mono"}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<button
  type="button"
  class="monitor-list__add no-print"
  onclick={() => commit(addMonitorRow(section.data))}
>
  + Add Monitor
</button>

<style>
  /* This table's fixed-width columns plus several text inputs don't fit a
   * narrow phone even with the page's own padding minimized (see
   * DocumentShell.svelte) — contain the overflow to the table itself so a
   * long row never forces the whole page to scroll horizontally. */
  @media screen and (max-width: 640px) {
    .monitor-list-scroll {
      overflow-x: auto;
    }
  }

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

  .monitor-list__type {
    width: 80px;
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

  /*
   * The on-screen toggle button already shows its own "Mono"/"Stereo"
   * label, but it's `no-print`, so print needs its own substitute — a
   * trailing, print-only cell rather than duplicating the label on screen.
   */
  .monitor-list__mode {
    display: none;
    text-align: center;
    font-size: var(--font-size-label);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  @media print {
    .monitor-list__mode {
      display: table-cell;
    }
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
