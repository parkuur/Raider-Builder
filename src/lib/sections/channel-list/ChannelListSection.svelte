<script lang="ts">
  import type { Section } from "../../model/section-types";
  import {
    addChannelRow,
    numberChannelRows,
    removeChannelRow,
    reorderChannelRows,
    updateChannelRow,
  } from "../../model/channel-list";
  import { setChannelListData } from "../../state/document.svelte";
  import SectionEmptyHint from "../../components/SectionEmptyHint.svelte";
  import DragHandle from "../../components/DragHandle.svelte";
  import RemoveButton from "../../components/RemoveButton.svelte";
  import { DragReorderState } from "../../components/drag-reorder.svelte";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "channel-list" }> } =
    $props();

  function commit(data: typeof section.data) {
    setChannelListData(rowId, section.id, data);
  }

  const numbered = $derived(numberChannelRows(section.data));
  function labelFor(id: string): string {
    return numbered.find((n) => n.id === id)?.label ?? "";
  }

  const drag = new DragReorderState();
</script>

{#if section.data.rows.length === 0}
  <SectionEmptyHint text="No channels yet — add one below." />
{/if}
<div class="channel-list-scroll">
  <table class="channel-list">
    <thead>
      <tr>
        <th class="no-print"></th>
        <th class="channel-list__num">Ch</th>
        <th>Channel</th>
        <th>Source</th>
        <th class="channel-list__phantom">48V</th>
        <th>Notes</th>
        <th class="no-print"></th>
      </tr>
    </thead>
    <tbody>
      {#each section.data.rows as row (row.id)}
        <tr
          data-reorder-item={row.id}
          class:channel-list__row--drag-over={drag.isOver(row.id)}
        >
          <td class="channel-list__drag no-print">
            <DragHandle
              onStart={() => drag.start(row.id)}
              onOver={(id) => drag.over(id)}
              onDrop={(id) => {
                const move = drag.resolveDrop(
                  section.data.rows.map((r) => r.id),
                  id,
                );
                if (move)
                  commit(reorderChannelRows(section.data, move[0], move[1]));
              }}
              onEnd={() => drag.end()}
            />
          </td>
          <td class="channel-list__num">{labelFor(row.id)}</td>
          <td>
            <input
              class="channel-list__name-input"
              value={row.name}
              placeholder="e.g. Kick In"
              oninput={(e) =>
                commit(
                  updateChannelRow(section.data, row.id, {
                    name: e.currentTarget.value,
                  }),
                )}
            />
          </td>
          <td>
            <input
              value={row.source}
              placeholder="SM58 / DI"
              oninput={(e) =>
                commit(
                  updateChannelRow(section.data, row.id, {
                    source: e.currentTarget.value,
                  }),
                )}
            />
          </td>
          <td class="channel-list__phantom">
            <input
              type="checkbox"
              checked={row.phantom}
              onchange={(e) =>
                commit(
                  updateChannelRow(section.data, row.id, {
                    phantom: e.currentTarget.checked,
                  }),
                )}
            />
          </td>
          <td>
            <input
              value={row.notes}
              placeholder="Notes"
              oninput={(e) =>
                commit(
                  updateChannelRow(section.data, row.id, {
                    notes: e.currentTarget.value,
                  }),
                )}
            />
          </td>
          <td class="channel-list__actions no-print">
            <button
              type="button"
              class="channel-list__stereo-toggle"
              class:channel-list__stereo-toggle--active={row.stereo}
              aria-pressed={row.stereo}
              title={row.stereo ? "Switch to mono" : "Switch to stereo"}
              onclick={() =>
                commit(
                  updateChannelRow(section.data, row.id, {
                    stereo: !row.stereo,
                  }),
                )}
            >
              {row.stereo ? "Stereo" : "Mono"}
            </button>
            <RemoveButton
              label="Remove channel"
              onclick={() => commit(removeChannelRow(section.data, row.id))}
            />
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<button
  type="button"
  class="channel-list__add no-print"
  onclick={() => commit(addChannelRow(section.data))}
>
  + Add Channel
</button>

<style>
  .channel-list {
    width: 100%;
    border-collapse: collapse;
  }

  /* This table's fixed-width columns plus several text inputs don't fit a
   * narrow phone even with the page's own padding minimized (see
   * DocumentShell.svelte) — contain the overflow to the table itself so a
   * long row never forces the whole page to scroll horizontally. */
  @media screen and (max-width: 640px) {
    .channel-list-scroll {
      overflow-x: auto;
    }
  }

  .channel-list th {
    text-align: left;
    font-size: var(--font-size-label);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    padding: 4px var(--space-1);
    border-bottom: 1px solid var(--color-border);
  }

  .channel-list td {
    padding: 2px var(--space-1);
    vertical-align: middle;
  }

  .channel-list__num {
    width: 40px;
    text-align: center;
    font-family: var(--font-heading);
    font-weight: 600;
  }

  .channel-list__phantom {
    width: 44px;
    text-align: center;
  }

  .channel-list__drag {
    width: 20px;
    text-align: center;
  }

  .channel-list__row--drag-over {
    outline: 2px solid var(--color-accent);
    outline-offset: -2px;
  }

  @media print {
    .channel-list tbody tr:not(:last-child) td {
      border-bottom: 1px solid var(--color-border);
    }
  }

  .channel-list input {
    width: 100%;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-body);
    padding: 3px var(--space-1);
    box-sizing: border-box;
  }

  .channel-list input[type="checkbox"] {
    width: auto;
  }

  .channel-list__actions {
    display: flex;
    gap: 4px;
    white-space: nowrap;
  }

  .channel-list__stereo-toggle {
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-muted);
    font-size: var(--font-size-label);
    padding: 3px 6px;
    cursor: pointer;
  }

  .channel-list__stereo-toggle--active {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .channel-list__add {
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
