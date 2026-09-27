<script lang="ts">
  import type { Section } from "../../model/section-types";
  import {
    makePackingItem,
    packingListColumnLabels,
    setPackingListColumnLabel,
    withPackingEntries,
  } from "../../model/packing-list";
  import type {
    PackingItem,
    PackingListColumn,
  } from "../../model/packing-list";
  import { allRows, updateGroupedRow } from "../../model/grouped-list";
  import type { GroupedEntry } from "../../model/grouped-list";
  import { fitColumnChars } from "../../model/column-fit";
  import { setPackingListData } from "../../state/document.svelte";
  import GroupedRowList from "../../components/GroupedRowList.svelte";
  import ColumnHeaderInput from "../../components/ColumnHeaderInput.svelte";
  import { autosizeTextarea } from "../../actions/autosize-textarea";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "packing-list" }> } =
    $props();

  function commitEntries(entries: GroupedEntry<PackingItem>[]) {
    setPackingListData(
      rowId,
      section.id,
      withPackingEntries(section.data, entries),
    );
  }

  function update(item: PackingItem, patch: Partial<PackingItem>) {
    commitEntries(updateGroupedRow(section.data.entries, item.id, patch));
  }

  const columnLabels = $derived(packingListColumnLabels(section.data));
  function setColumnLabel(key: PackingListColumn, label: string) {
    setPackingListData(
      rowId,
      section.id,
      setPackingListColumnLabel(section.data, key, label),
    );
  }

  const rows = $derived(allRows(section.data.entries));
  const countChars = $derived(
    fitColumnChars(
      rows.map((r) => r.count),
      "Qty",
    ),
  );
  const sourceChars = $derived(
    fitColumnChars(
      rows.map((r) => r.source),
      "Band / Venue",
    ),
  );
</script>

<GroupedRowList
  entries={section.data.entries}
  onChange={commitEntries}
  makeRow={makePackingItem}
  columnCount={4}
  rowNoun="item"
  emptyText="Nothing to pack yet — add an item or a group below."
  tableClass="packing-list"
>
  {#snippet header()}
    <th>
      <ColumnHeaderInput
        value={columnLabels.item}
        onChange={(label) => setColumnLabel("item", label)}
      />
    </th>
    <th class="packing-list__count-head">
      <ColumnHeaderInput
        value={columnLabels.count}
        onChange={(label) => setColumnLabel("count", label)}
      />
    </th>
    <th>
      <ColumnHeaderInput
        value={columnLabels.source}
        onChange={(label) => setColumnLabel("source", label)}
      />
    </th>
    <th>
      <ColumnHeaderInput
        value={columnLabels.notes}
        onChange={(label) => setColumnLabel("notes", label)}
      />
    </th>
  {/snippet}
  {#snippet row(item, ctx)}
    <tr>
      {@render ctx.lead(item, 1)}
      <td class="packing-list__item">
        <textarea
          class="packing-list__item-input"
          use:autosizeTextarea={item.item}
          rows="1"
          value={item.item}
          placeholder="Item"
          oninput={(e) => update(item, { item: e.currentTarget.value })}
        ></textarea>
      </td>
      <td style:width="{countChars}ch">
        <input
          class="packing-list__count-input"
          value={item.count}
          placeholder="Qty"
          oninput={(e) => update(item, { count: e.currentTarget.value })}
        />
      </td>
      <td style:width="{sourceChars}ch">
        <input
          class="packing-list__source-input"
          value={item.source}
          placeholder="Band / Venue"
          oninput={(e) => update(item, { source: e.currentTarget.value })}
        />
      </td>
      <td>
        <textarea
          class="packing-list__notes-input"
          use:autosizeTextarea={item.notes}
          rows="1"
          value={item.notes}
          placeholder="Notes"
          oninput={(e) => update(item, { notes: e.currentTarget.value })}
        ></textarea>
      </td>
      {@render ctx.trail(item, 1)}
    </tr>
  {/snippet}
</GroupedRowList>

<style>
  .packing-list__item {
    width: 35%;
  }

  .packing-list__count-input {
    text-align: center;
  }

  .packing-list__count-head {
    text-align: center;
  }
</style>
