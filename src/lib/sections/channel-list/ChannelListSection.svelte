<script lang="ts">
  import type { Section } from "../../model/section-types";
  import {
    addChannelRow,
    pairChannelRows,
    removeChannelRow,
    reorderChannelRows,
    unpairChannelRow,
    updateChannelRow,
  } from "../../model/channel-list";
  import { numberRows } from "../../model/row-list";
  import { setChannelListData } from "../../state/document.svelte";
  import SectionEmptyHint from "../../components/SectionEmptyHint.svelte";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "channel-list" }> } =
    $props();

  function commit(data: typeof section.data) {
    setChannelListData(rowId, section.id, data);
  }

  const numbered = $derived(numberRows(section.data.rows));
  function labelFor(id: string): string {
    return numbered.find((n) => n.id === id)?.label ?? "";
  }
</script>

{#if section.data.rows.length === 0}
  <SectionEmptyHint text="No channels yet — add one below." />
{/if}
<table class="channel-list">
  <thead>
    <tr>
      <th class="channel-list__num">Ch</th>
      <th>Channel</th>
      <th>Source</th>
      <th class="channel-list__phantom">48V</th>
      <th>Notes</th>
      <th class="no-print"></th>
    </tr>
  </thead>
  <tbody>
    {#each section.data.rows as row, index (row.id)}
      {@const next = section.data.rows[index + 1]}
      <tr>
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
          {#if row.pairedWithId !== undefined}
            <button
              type="button"
              title="Unpair"
              onclick={() => commit(unpairChannelRow(section.data, row.id))}
            >
              Unpair
            </button>
          {:else if next && next.pairedWithId === undefined}
            <button
              type="button"
              title="Pair with next row"
              onclick={() =>
                commit(pairChannelRows(section.data, row.id, next.id))}
            >
              Pair
            </button>
          {/if}
          <button
            type="button"
            aria-label="Move up"
            title="Move up"
            disabled={index === 0}
            onclick={() =>
              commit(reorderChannelRows(section.data, index, index - 1))}
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="Move down"
            title="Move down"
            disabled={index === section.data.rows.length - 1}
            onclick={() =>
              commit(reorderChannelRows(section.data, index, index + 1))}
          >
            ↓
          </button>
          <button
            type="button"
            title="Remove"
            onclick={() => commit(removeChannelRow(section.data, row.id))}
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

  .channel-list__actions button {
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-label);
    padding: 3px 6px;
    cursor: pointer;
  }

  .channel-list__actions button:disabled {
    opacity: 0.4;
    cursor: default;
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
