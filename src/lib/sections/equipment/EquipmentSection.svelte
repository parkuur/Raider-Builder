<script lang="ts">
  import type { Section } from "../../model/section-types";
  import {
    addEquipmentItem,
    removeEquipmentItem,
    reorderEquipmentItem,
    updateEquipmentItem,
  } from "../../model/equipment";
  import { fitColumnChars } from "../../model/column-fit";
  import { setEquipmentData } from "../../state/document.svelte";
  import SectionEmptyHint from "../../components/SectionEmptyHint.svelte";
  import RemoveButton from "../../components/RemoveButton.svelte";
  import DragHandle from "../../components/DragHandle.svelte";
  import { DragReorderState } from "../../components/drag-reorder.svelte";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "equipment" }> } =
    $props();

  function commit(data: typeof section.data) {
    setEquipmentData(rowId, section.id, data);
  }

  const drag = new DragReorderState();
  const countChars = $derived(
    fitColumnChars(
      section.data.items.map((i) => i.count),
      "Qty",
    ),
  );
</script>

<div class="equipment-section">
  {#if section.data.items.length === 0}
    <SectionEmptyHint text="No items yet — add one below." />
  {/if}
  {#each section.data.items as item (item.id)}
    <div
      class="equipment-section__item"
      data-reorder-item={item.id}
      class:equipment-section__item--drag-over={drag.isOver(item.id)}
    >
      <DragHandle
        onStart={() => drag.start(item.id)}
        onOver={(id) => drag.over(id)}
        onDrop={(id) => {
          const move = drag.resolveDrop(
            section.data.items.map((i) => i.id),
            id,
          );
          if (move)
            commit(reorderEquipmentItem(section.data, move[0], move[1]));
        }}
        onEnd={() => drag.end()}
      />
      <input
        class="equipment-section__item-name"
        value={item.name}
        placeholder="Item"
        oninput={(e) =>
          commit(
            updateEquipmentItem(section.data, item.id, {
              name: e.currentTarget.value,
            }),
          )}
      />
      <input
        class="equipment-section__item-count"
        style:width="{countChars}ch"
        value={item.count}
        placeholder="Qty"
        oninput={(e) =>
          commit(
            updateEquipmentItem(section.data, item.id, {
              count: e.currentTarget.value,
            }),
          )}
      />
      <RemoveButton
        label="Remove item"
        onclick={() => commit(removeEquipmentItem(section.data, item.id))}
      />
    </div>
  {/each}
  <button
    type="button"
    class="equipment-section__add no-print"
    onclick={() => commit(addEquipmentItem(section.data))}
  >
    + Add item
  </button>
</div>

<style>
  .equipment-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .equipment-section__item {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .equipment-section__item--drag-over {
    outline: 2px solid var(--color-accent);
    outline-offset: -2px;
  }

  @media print {
    /*
     * :last-of-type (not :last-child) because the "+ Add item" button
     * trails the item divs in the same container — it would
     * otherwise be the true last-child, making every item match.
     */
    .equipment-section__item:not(:last-of-type) {
      border-bottom: 1px solid var(--color-border);
    }
  }

  .equipment-section__item-name {
    flex: 1;
    min-width: 0;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-body);
    padding: 4px var(--space-2);
  }

  .equipment-section__item-count {
    flex: none;
    text-align: center;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-body);
    padding: 4px;
  }

  .equipment-section__add {
    align-self: flex-start;
    margin-top: var(--space-1);
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
