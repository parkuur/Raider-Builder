<script lang="ts">
  import type { Section } from "../../model/section-types";
  import {
    addChannelRow,
    numberChannelRows,
    removeChannelRow,
    reorderChannelRows,
    updateChannelRow,
  } from "../../model/channel-list";
  import { fitColumnChars } from "../../model/column-fit";
  import { setChannelListData } from "../../state/document.svelte";
  import SectionEmptyHint from "../../components/SectionEmptyHint.svelte";
  import DragHandle from "../../components/DragHandle.svelte";
  import RemoveButton from "../../components/RemoveButton.svelte";
  import StereoToggle from "../../components/StereoToggle.svelte";
  import { DragReorderState } from "../../components/drag-reorder.svelte";
  import { autosizeTextarea } from "../../actions/autosize-textarea";

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

  const nameChars = $derived(
    fitColumnChars(
      section.data.rows.map((r) => r.name),
      "e.g. Kick In",
    ),
  );
  const sourceChars = $derived(
    fitColumnChars(
      section.data.rows.map((r) => r.source),
      "SM58 / DI",
    ),
  );

  const drag = new DragReorderState();

  // 48V, Notes, and the stereo toggle move to a labeled second row per
  // channel below this breakpoint — the table has too many columns to stay
  // readable on a phone otherwise. `screen` (not just the width condition)
  // keeps this out of print regardless of the viewport that printed it, the
  // same guarantee BandMembersSection/EquipmentSection rely on for their
  // own mobile layouts.
  let isNarrowViewport = $state(false);
  $effect(() => {
    const query = window.matchMedia("screen and (max-width: 640px)");
    isNarrowViewport = query.matches;
    const onChange = (e: MediaQueryListEvent) => (isNarrowViewport = e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  });
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
        {#if !isNarrowViewport}
          <th class="channel-list__phantom">48V</th>
          <th>Notes</th>
        {/if}
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
          <td style:width="{nameChars}ch">
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
          <td style:width="{sourceChars}ch">
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
          {#if !isNarrowViewport}
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
            <td class="channel-list__notes">
              <textarea
                use:autosizeTextarea={row.notes}
                rows="1"
                value={row.notes}
                placeholder="Notes"
                oninput={(e) =>
                  commit(
                    updateChannelRow(section.data, row.id, {
                      notes: e.currentTarget.value,
                    }),
                  )}></textarea>
            </td>
          {/if}
          <td class="channel-list__actions no-print">
            {#if !isNarrowViewport}
              <StereoToggle
                active={row.stereo}
                onToggle={() =>
                  commit(
                    updateChannelRow(section.data, row.id, {
                      stereo: !row.stereo,
                    }),
                  )}
              />
            {/if}
            <RemoveButton
              label="Remove channel"
              onclick={() => commit(removeChannelRow(section.data, row.id))}
            />
          </td>
        </tr>
        {#if isNarrowViewport}
          <tr class="channel-list__row-mobile no-print">
            <td colspan="5">
              <div class="channel-list__mobile-fields">
                <label class="channel-list__mobile-field">
                  48V
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
                </label>
                <label
                  class="channel-list__mobile-field channel-list__mobile-field--notes"
                >
                  Notes
                  <textarea
                    use:autosizeTextarea={row.notes}
                    rows="1"
                    value={row.notes}
                    placeholder="Notes"
                    oninput={(e) =>
                      commit(
                        updateChannelRow(section.data, row.id, {
                          notes: e.currentTarget.value,
                        }),
                      )}></textarea>
                </label>
                <StereoToggle
                  active={row.stereo}
                  onToggle={() =>
                    commit(
                      updateChannelRow(section.data, row.id, {
                        stereo: !row.stereo,
                      }),
                    )}
                />
              </div>
            </td>
          </tr>
        {/if}
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

    /* Belt-and-suspenders restatement: isNarrowViewport is already
     * `screen`-scoped so this row never renders under print, but print
     * always gets the desktop single-row shape regardless of the device
     * that printed it, so this is worth being explicit about. */
    .channel-list__row-mobile {
      display: none !important;
    }
  }

  .channel-list__mobile-fields {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    padding: 2px 0;
  }

  .channel-list__mobile-field {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--font-size-label);
    color: var(--color-text-muted);
  }

  .channel-list__mobile-field--notes {
    flex: 1;
    min-width: 120px;
  }

  .channel-list__mobile-field input[type="checkbox"] {
    width: auto;
  }

  .channel-list input,
  .channel-list textarea {
    width: 100%;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-family: inherit;
    font-size: var(--font-size-body);
    padding: 3px var(--space-1);
    box-sizing: border-box;
  }

  .channel-list input[type="checkbox"] {
    width: auto;
  }

  .channel-list textarea {
    display: block;
    resize: none;
    overflow: hidden;
  }

  .channel-list__actions {
    display: flex;
    gap: 4px;
    white-space: nowrap;
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
