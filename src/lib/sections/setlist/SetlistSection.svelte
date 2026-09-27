<script lang="ts">
  import type { Section } from "../../model/section-types";
  import {
    addSetlistRow,
    numberSetlistRows,
    removeSetlistRow,
    reorderSetlistRows,
    setSetlistColumnLabel,
    setlistColumnLabels,
    updateSetlistRow,
  } from "../../model/setlist";
  import type { SetlistColumn } from "../../model/setlist";
  import { setSetlistData } from "../../state/document.svelte";
  import SectionEmptyHint from "../../components/SectionEmptyHint.svelte";
  import DragHandle from "../../components/DragHandle.svelte";
  import RemoveButton from "../../components/RemoveButton.svelte";
  import ColumnHeaderInput from "../../components/ColumnHeaderInput.svelte";
  import { DragReorderState } from "../../components/drag-reorder.svelte";
  import { autosizeTextarea } from "../../actions/autosize-textarea";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "setlist" }> } =
    $props();

  function commit(data: typeof section.data) {
    setSetlistData(rowId, section.id, data);
  }

  const numbered = $derived(numberSetlistRows(section.data));
  function labelFor(id: string): string {
    return numbered.find((n) => n.id === id)?.label ?? "";
  }

  const columnLabels = $derived(setlistColumnLabels(section.data));
  function setColumnLabel(key: SetlistColumn, label: string) {
    commit(setSetlistColumnLabel(section.data, key, label));
  }

  const drag = new DragReorderState();
</script>

{#if section.data.rows.length === 0}
  <SectionEmptyHint text="No songs yet — add one below." />
{/if}
<div class="data-table-scroll">
  <table class="data-table setlist">
    <thead>
      <tr>
        <th class="no-print"></th>
        <th class="data-table__num">
          <ColumnHeaderInput
            value={columnLabels.num}
            onChange={(label) => setColumnLabel("num", label)}
          />
        </th>
        <th>
          <ColumnHeaderInput
            value={columnLabels.song}
            onChange={(label) => setColumnLabel("song", label)}
          />
        </th>
        <th>
          <ColumnHeaderInput
            value={columnLabels.artist}
            onChange={(label) => setColumnLabel("artist", label)}
          />
        </th>
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
                  commit(reorderSetlistRows(section.data, move[0], move[1]));
              }}
              onEnd={() => drag.end()}
            />
          </td>
          <td class="data-table__num setlist__num">{labelFor(row.id)}</td>
          <td class="setlist__song">
            <textarea
              class="setlist__song-input"
              use:autosizeTextarea={row.song}
              rows="1"
              value={row.song}
              placeholder="Song"
              oninput={(e) =>
                commit(
                  updateSetlistRow(section.data, row.id, {
                    song: e.currentTarget.value,
                  }),
                )}></textarea>
          </td>
          <td class="setlist__artist">
            <textarea
              class="setlist__artist-input"
              use:autosizeTextarea={row.artist}
              rows="1"
              value={row.artist}
              placeholder="Artist"
              oninput={(e) =>
                commit(
                  updateSetlistRow(section.data, row.id, {
                    artist: e.currentTarget.value,
                  }),
                )}></textarea>
          </td>
          <td>
            <textarea
              class="setlist__notes-input"
              use:autosizeTextarea={row.notes}
              rows="1"
              value={row.notes}
              placeholder="Notes"
              oninput={(e) =>
                commit(
                  updateSetlistRow(section.data, row.id, {
                    notes: e.currentTarget.value,
                  }),
                )}></textarea>
          </td>
          <td class="data-table__actions-cell no-print">
            <RemoveButton
              label="Remove song"
              onclick={() => commit(removeSetlistRow(section.data, row.id))}
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
  onclick={() => commit(addSetlistRow(section.data))}
>
  + Add Song
</button>

<style>
  /* Proportions rather than content-fit, since a setlist often sits in a
   * narrow split column; every field wraps (autosized textareas) so a long
   * title prints in full instead of being clipped. */
  .setlist__song {
    width: 40%;
  }

  .setlist__artist {
    width: 25%;
  }
</style>
