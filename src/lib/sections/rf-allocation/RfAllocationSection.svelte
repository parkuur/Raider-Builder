<script lang="ts">
  import type { Section } from "../../model/section-types";
  import {
    addRfAllocationRow,
    removeRfAllocationRow,
    reorderRfAllocationRows,
    rfAllocationColumnLabels,
    setRfAllocationColumnLabel,
    updateRfAllocationRow,
  } from "../../model/rf-allocation";
  import type {
    RfAllocationColumn,
    RfAllocationRow,
  } from "../../model/rf-allocation";
  import { fitColumnChars } from "../../model/column-fit";
  import { setRfAllocationData } from "../../state/document.svelte";
  import SectionEmptyHint from "../../components/SectionEmptyHint.svelte";
  import DragHandle from "../../components/DragHandle.svelte";
  import RemoveButton from "../../components/RemoveButton.svelte";
  import ColumnHeaderInput from "../../components/ColumnHeaderInput.svelte";
  import { DragReorderState } from "../../components/drag-reorder.svelte";
  import { autosizeTextarea } from "../../actions/autosize-textarea";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "rf-allocation" }> } =
    $props();

  function commit(data: typeof section.data) {
    setRfAllocationData(rowId, section.id, data);
  }

  const columnLabels = $derived(rfAllocationColumnLabels(section.data));
  function setColumnLabel(key: RfAllocationColumn, label: string) {
    commit(setRfAllocationColumnLabel(section.data, key, label));
  }

  /** The short, content-fit input columns, in display order. */
  const fitColumns: {
    key: Exclude<RfAllocationColumn, "notes">;
    placeholder: string;
  }[] = [
    { key: "device", placeholder: "e.g. Vox 1 / IEM A" },
    { key: "window", placeholder: "470–608 MHz" },
    { key: "bandwidth", placeholder: "25 kHz" },
    { key: "frequency", placeholder: "606.125" },
  ];

  const widths = $derived(
    Object.fromEntries(
      fitColumns.map(({ key, placeholder }) => [
        key,
        fitColumnChars(
          section.data.rows.map((r) => r[key]),
          placeholder,
        ),
      ]),
    ) as Record<(typeof fitColumns)[number]["key"], number>,
  );

  function update(row: RfAllocationRow, patch: Partial<RfAllocationRow>) {
    commit(updateRfAllocationRow(section.data, row.id, patch));
  }

  const drag = new DragReorderState();
</script>

{#if section.data.rows.length === 0}
  <SectionEmptyHint text="No wireless units yet — add one below." />
{/if}
<div class="data-table-scroll">
  <table class="data-table data-table--wide rf-allocation">
    <thead>
      <tr>
        <th class="no-print"></th>
        {#each fitColumns as { key } (key)}
          <th>
            <ColumnHeaderInput
              value={columnLabels[key]}
              onChange={(label) => setColumnLabel(key, label)}
            />
          </th>
        {/each}
        <th>
          <ColumnHeaderInput
            value={columnLabels.notes}
            onChange={(label) => setColumnLabel("notes", label)}
          />
        </th>
        <th class="no-print"></th>
      </tr>
    </thead>
    <tbody>
      {#each section.data.rows as row (row.id)}
        <tr
          data-reorder-item={row.id}
          class:data-table__row--drag-over={drag.isOver(row.id)}
        >
          <td class="data-table__drag no-print">
            <DragHandle
              onStart={() => drag.start(row.id)}
              onOver={(id) => drag.over(id)}
              onDrop={(id) => {
                const move = drag.resolveDrop(
                  section.data.rows.map((r) => r.id),
                  id,
                );
                if (move)
                  commit(
                    reorderRfAllocationRows(section.data, move[0], move[1]),
                  );
              }}
              onEnd={() => drag.end()}
            />
          </td>
          {#each fitColumns as { key, placeholder } (key)}
            <td style:width="{widths[key]}ch">
              <input
                class="rf-allocation__{key}-input"
                value={row[key]}
                {placeholder}
                oninput={(e) => update(row, { [key]: e.currentTarget.value })}
              />
            </td>
          {/each}
          <td>
            <textarea
              class="rf-allocation__notes-input"
              use:autosizeTextarea={row.notes}
              rows="1"
              value={row.notes}
              placeholder="e.g. Only during support act"
              oninput={(e) => update(row, { notes: e.currentTarget.value })}
            ></textarea>
          </td>
          <td class="data-table__actions-cell no-print">
            <RemoveButton
              label="Remove wireless unit"
              onclick={() =>
                commit(removeRfAllocationRow(section.data, row.id))}
            />
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<button
  type="button"
  class="data-table__add no-print"
  onclick={() => commit(addRfAllocationRow(section.data))}
>
  + Add Wireless Unit
</button>

<style>
  /* The assigned frequency is what the RF tech scans for — set it apart. */
  .rf-allocation :global(.rf-allocation__frequency-input) {
    font-family: var(--font-heading);
    font-weight: 600;
  }
</style>
