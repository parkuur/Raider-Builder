<script lang="ts">
  import type { Section } from "../../model/section-types";
  import {
    addMonitorRow,
    monitorListColumnLabels,
    numberMonitorRows,
    removeMonitorRow,
    reorderMonitorRows,
    setMonitorListColumnLabel,
    updateMonitorRow,
  } from "../../model/monitor-list";
  import type { MonitorListColumnLabels } from "../../model/monitor-list";
  import { fitColumnChars } from "../../model/column-fit";
  import { setMonitorListData } from "../../state/document.svelte";
  import SectionEmptyHint from "../../components/SectionEmptyHint.svelte";
  import DragHandle from "../../components/DragHandle.svelte";
  import RemoveButton from "../../components/RemoveButton.svelte";
  import StereoToggle from "../../components/StereoToggle.svelte";
  import { DragReorderState } from "../../components/drag-reorder.svelte";
  import { autosizeTextarea } from "../../actions/autosize-textarea";

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

  const columnLabels = $derived(monitorListColumnLabels(section.data));
  function setColumnLabel(key: keyof MonitorListColumnLabels, label: string) {
    commit(setMonitorListColumnLabel(section.data, key, label));
  }

  const playerChars = $derived(
    fitColumnChars(
      section.data.rows.map((r) => r.player),
      "Player",
    ),
  );
  const typeChars = $derived(
    fitColumnChars(
      section.data.rows.map((r) => r.type),
      "Wedge / IEM",
    ),
  );

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
        <th class="monitor-list__num">
          <input
            class="monitor-list__header-input"
            value={columnLabels.mon}
            oninput={(e) => setColumnLabel("mon", e.currentTarget.value)}
          />
        </th>
        <th>
          <input
            class="monitor-list__header-input"
            value={columnLabels.player}
            oninput={(e) => setColumnLabel("player", e.currentTarget.value)}
          />
        </th>
        <th>
          <input
            class="monitor-list__header-input"
            value={columnLabels.type}
            oninput={(e) => setColumnLabel("type", e.currentTarget.value)}
          />
        </th>
        <th>
          <input
            class="monitor-list__header-input"
            value={columnLabels.notes}
            oninput={(e) => setColumnLabel("notes", e.currentTarget.value)}
          />
        </th>
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
          <td style:width="{playerChars}ch">
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
          <td style:width="{typeChars}ch">
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
            <textarea
              use:autosizeTextarea={row.notes}
              rows="1"
              value={row.notes}
              placeholder="Mix notes"
              oninput={(e) =>
                commit(
                  updateMonitorRow(section.data, row.id, {
                    notes: e.currentTarget.value,
                  }),
                )}></textarea>
          </td>
          <td class="monitor-list__actions-cell no-print">
            <div class="monitor-list__actions">
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
            </div>
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

  /*
   * `.monitor-list th` above pairs a class with an element selector, which
   * out-specifies the plain single-class `.monitor-list__num` rule below on
   * a `<th>` that carries both classes — without this, the Mon header
   * renders left-aligned despite the centering rule existing. Qualifying
   * with `th` here beats it back.
   */
  .monitor-list th.monitor-list__num {
    text-align: center;
  }

  /*
   * Beats the later, more general `.monitor-list input` rule (class+type,
   * specificity 0-1-1) below, which would otherwise reapply its border/
   * padding/background here — this selector adds the `th` ancestor to stay
   * above it regardless of source order.
   */
  .monitor-list th .monitor-list__header-input {
    width: 100%;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
    text-align: inherit;
    padding: 0;
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

  .monitor-list input,
  .monitor-list textarea {
    width: 100%;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-family: inherit;
    font-size: var(--font-size-body);
    padding: 3px var(--space-1);
    box-sizing: border-box;
  }

  .monitor-list textarea {
    display: block;
    resize: none;
    overflow: hidden;
    /* See the identical comment in ChannelListSection.svelte. */
    field-sizing: content;
  }

  .monitor-list__actions-cell {
    /* Without an explicit width, this column has no content-based hint
     * either (its content is a flex row of small buttons, not text), so
     * the auto-layout table treats it as a second unconstrained column
     * alongside Mix Notes and gives it a share of the leftover space too —
     * `width: 1%` is the standard shrink-to-fit trick that tells the
     * table this column only wants its content's width, leaving Mix Notes
     * as the sole recipient of whatever space is left over. It has to sit
     * on the `<td>` itself (kept as a plain table-cell) rather than on the
     * flex row directly — a `display: flex` cell stops reporting its
     * content's intrinsic width to the table layout algorithm, which
     * collapses this column to a few px when tried directly on it.
     */
    width: 1%;
    white-space: nowrap;
  }

  .monitor-list__actions {
    display: flex;
    gap: 4px;
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
