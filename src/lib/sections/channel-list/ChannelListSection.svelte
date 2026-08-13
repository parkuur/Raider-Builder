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

  // Notes and the stereo toggle move to a labeled second row per channel
  // below this breakpoint — the table has too many columns to stay
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
        <th class="channel-list__phantom">48V</th>
        {#if !isNarrowViewport}
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
          <td style:width={isNarrowViewport ? undefined : `${nameChars}ch`}>
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
          {#if !isNarrowViewport}
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
          <td class="channel-list__actions-cell no-print">
            <div class="channel-list__actions">
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
            </div>
          </td>
        </tr>
        {#if isNarrowViewport}
          <tr class="channel-list__row-mobile no-print">
            <td colspan="2" class="channel-list__notes-label">
              <label for="channel-notes-{row.id}">Notes</label>
            </td>
            <td colspan="2">
              <textarea
                id="channel-notes-{row.id}"
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
            <td>
              <!--
                Deliberately un-spanned (colspan 1) so this cell falls in
                the 48V column, not the trailing actions column — that
                lines the stereo toggle up under the 48V checkbox above,
                leaving the remove button in the actions column as the only
                thing extending further right than either row.
              -->
              <StereoToggle
                active={row.stereo}
                onToggle={() =>
                  commit(
                    updateChannelRow(section.data, row.id, {
                      stereo: !row.stereo,
                    }),
                  )}
              />
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

  /*
   * Spans the drag-handle + Ch columns (colspan="2" at the call site) so
   * the label's right edge — and therefore the Notes textarea that follows
   * it in the next cell — lines up exactly with the Channel column's left
   * edge above it, matching the primary row's column boundaries via the
   * table's own layout rather than hand-computed offsets.
   */
  .channel-list__notes-label {
    text-align: right;
    white-space: nowrap;
    color: var(--color-text-muted);
    font-size: var(--font-size-label);
  }

  .channel-list__notes-label label {
    cursor: pointer;
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

  .channel-list__actions-cell {
    /* Without an explicit width, this column has no content-based hint
     * either (its content is a flex row of small buttons, not text), so
     * the auto-layout table treats it as a second unconstrained column
     * alongside Notes and gives it a share of the leftover space too —
     * `width: 1%` is the standard shrink-to-fit trick that tells the
     * table this column only wants its content's width, leaving Notes as
     * the sole recipient of whatever space is left over. It has to sit on
     * the `<td>` itself (kept as a plain table-cell) rather than on the
     * flex row directly — a `display: flex` cell stops reporting its
     * content's intrinsic width to the table layout algorithm, which
     * collapsed this column to a few px when tried directly on it.
     */
    width: 1%;
    white-space: nowrap;
  }

  .channel-list__actions {
    display: flex;
    gap: 4px;
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
