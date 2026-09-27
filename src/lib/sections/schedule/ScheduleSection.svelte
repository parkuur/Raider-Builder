<script lang="ts">
  import type { Section } from "../../model/section-types";
  import {
    addScheduleItem,
    formatSlotTime,
    makeScheduleSlot,
    moveScheduleItem,
    removeScheduleItem,
    resolveScheduleItemDrop,
    scheduleColumnLabels,
    setScheduleColumnLabel,
    slotIdForTarget,
    updateScheduleItem,
    withScheduleEntries,
  } from "../../model/schedule";
  import type {
    ScheduleColumn,
    ScheduleItem,
    ScheduleSlot,
  } from "../../model/schedule";
  import { updateGroupedRow } from "../../model/grouped-list";
  import type { GroupedEntry } from "../../model/grouped-list";
  import { setScheduleData } from "../../state/document.svelte";
  import GroupedRowList from "../../components/GroupedRowList.svelte";
  import ColumnHeaderInput from "../../components/ColumnHeaderInput.svelte";
  import DragHandle from "../../components/DragHandle.svelte";
  import RemoveButton from "../../components/RemoveButton.svelte";
  import { DragReorderState } from "../../components/drag-reorder.svelte";
  import { autosizeTextarea } from "../../actions/autosize-textarea";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "schedule" }> } =
    $props();

  const entries = $derived(section.data.entries);

  function commitEntries(next: GroupedEntry<ScheduleSlot>[]) {
    setScheduleData(rowId, section.id, withScheduleEntries(section.data, next));
  }

  function updateSlot(slot: ScheduleSlot, patch: Partial<ScheduleSlot>) {
    commitEntries(updateGroupedRow(entries, slot.id, patch));
  }

  function updateItem(item: ScheduleItem, patch: Partial<ScheduleItem>) {
    commitEntries(updateScheduleItem(entries, item.id, patch));
  }

  const columnLabels = $derived(scheduleColumnLabels(section.data));
  function setColumnLabel(key: ScheduleColumn, label: string) {
    setScheduleData(
      rowId,
      section.id,
      setScheduleColumnLabel(section.data, key, label),
    );
  }

  // Items get their own drag space, separate from the slot/group drag that
  // GroupedRowList runs: an item can move within its slot or into any other
  // slot, grouped or not.
  const itemDrag = new DragReorderState();

  function dropItem(targetId: string) {
    const draggedId = itemDrag.draggingId;
    itemDrag.end();
    if (!draggedId) return;
    const target = resolveScheduleItemDrop(entries, draggedId, targetId);
    if (target) commitEntries(moveScheduleItem(entries, draggedId, target));
  }
</script>

<GroupedRowList
  {entries}
  onChange={commitEntries}
  makeRow={makeScheduleSlot}
  columnCount={5}
  rowNoun="slot"
  emptyText="No time slots yet — add one below."
  tableClass="schedule"
  resolveTargetId={(id) => slotIdForTarget(entries, id)}
>
  {#snippet header()}
    <th class="schedule__time-head">
      <ColumnHeaderInput
        value={columnLabels.time}
        onChange={(label) => setColumnLabel("time", label)}
      />
    </th>
    <th>
      <ColumnHeaderInput
        value={columnLabels.title}
        onChange={(label) => setColumnLabel("title", label)}
      />
    </th>
    <th>
      <ColumnHeaderInput
        value={columnLabels.who}
        onChange={(label) => setColumnLabel("who", label)}
      />
    </th>
    <th>
      <ColumnHeaderInput
        value={columnLabels.notes}
        onChange={(label) => setColumnLabel("notes", label)}
      />
    </th>
    <th class="no-print"></th>
  {/snippet}
  {#snippet row(slot, ctx)}
    {#each slot.items as item, i (item.id)}
      <tr
        class="schedule__item"
        class:schedule__item--drop-target={itemDrag.isOver(item.id)}
        data-reorder-item={item.id}
      >
        {#if i === 0}
          {@render ctx.lead(slot, slot.items.length)}
          <td class="schedule__time" rowspan={slot.items.length}>
            <div class="schedule__time-inputs no-print">
              <input
                class="schedule__start-input"
                value={slot.start}
                placeholder="18:00"
                aria-label="Start time"
                oninput={(e) =>
                  updateSlot(slot, { start: e.currentTarget.value })}
              />
              <span class="schedule__time-sep" aria-hidden="true">–</span>
              <input
                class="schedule__end-input"
                value={slot.end}
                placeholder="End"
                aria-label="End time"
                oninput={(e) =>
                  updateSlot(slot, { end: e.currentTarget.value })}
              />
            </div>
            <span class="schedule__time-print">{formatSlotTime(slot)}</span>
            <button
              type="button"
              class="schedule__add-item no-print"
              onclick={() => commitEntries(addScheduleItem(entries, slot.id))}
            >
              + Add row
            </button>
          </td>
        {/if}
        <td class="schedule__title">
          <textarea
            class="schedule__title-input"
            use:autosizeTextarea={item.title}
            rows="1"
            value={item.title}
            placeholder="e.g. Soundcheck"
            oninput={(e) => updateItem(item, { title: e.currentTarget.value })}
          ></textarea>
        </td>
        <td class="schedule__who">
          <textarea
            class="schedule__who-input"
            use:autosizeTextarea={item.who}
            rows="1"
            value={item.who}
            placeholder="Who"
            oninput={(e) => updateItem(item, { who: e.currentTarget.value })}
          ></textarea>
        </td>
        <td>
          <textarea
            class="schedule__notes-input"
            use:autosizeTextarea={item.notes}
            rows="1"
            value={item.notes}
            placeholder="Notes"
            oninput={(e) => updateItem(item, { notes: e.currentTarget.value })}
          ></textarea>
        </td>
        <td class="data-table__actions-cell no-print">
          <div class="data-table__actions">
            <DragHandle
              label="Drag to move row"
              onStart={() => itemDrag.start(item.id)}
              onOver={(id) => itemDrag.over(id)}
              onDrop={dropItem}
              onEnd={() => itemDrag.end()}
            />
            {#if slot.items.length > 1}
              <RemoveButton
                label="Remove row"
                onclick={() =>
                  commitEntries(removeScheduleItem(entries, item.id))}
              />
            {/if}
          </div>
        </td>
        {#if i === 0}
          {@render ctx.trail(slot, slot.items.length)}
        {/if}
      </tr>
    {/each}
  {/snippet}
</GroupedRowList>

<style>
  .schedule__time,
  .schedule__time-head {
    width: 8.5rem;
  }

  /* Top-aligned so a slot's time lines up with its first row, and a tall
   * notes field doesn't push its row's other fields down. */
  .schedule__item td {
    vertical-align: top;
  }

  .schedule__time-inputs {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .schedule__time-sep {
    color: var(--color-text-muted);
  }

  .schedule__start-input,
  .schedule__end-input {
    text-align: center;
    font-family: var(--font-heading);
    font-weight: 600;
  }

  /* Matches the textareas' padding so the printed time sits on the same
   * baseline as the row's text. */
  .schedule__time-print {
    display: none;
    padding: 3px var(--space-1);
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-body);
  }

  .schedule__add-item {
    margin-top: 2px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--color-accent);
    cursor: pointer;
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-label);
  }

  .schedule__title {
    width: 26%;
  }

  .schedule__who {
    width: 17%;
  }

  .schedule__item--drop-target td:not(.schedule__time) {
    box-shadow: inset 0 2px 0 var(--color-accent);
  }

  @media print {
    .schedule__time-print {
      display: inline-block;
    }

    /* A lighter rule between the rows within one slot; the slots
     * themselves are separated by GroupedRowList's solid rule. */
    .schedule__item:not(:last-child) td:not(.schedule__time) {
      border-bottom: 1px dashed var(--color-divider-subtle);
    }
  }
</style>
