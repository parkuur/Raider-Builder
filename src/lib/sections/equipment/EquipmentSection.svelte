<script lang="ts">
  import type { Section } from "../../model/section-types";
  import {
    addEquipmentItem,
    removeEquipmentItem,
    setEquipmentListTitle,
    updateEquipmentItem,
  } from "../../model/equipment";
  import { setEquipmentData } from "../../state/document.svelte";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "equipment" }> } =
    $props();

  function commit(data: typeof section.data) {
    setEquipmentData(rowId, section.id, data);
  }
</script>

<div class="equipment-section">
  {#each section.data.lists as list, listIndex (list.id)}
    <div class="equipment-section__list">
      <input
        class="equipment-section__title"
        value={list.title}
        oninput={(e) =>
          commit(
            setEquipmentListTitle(
              section.data,
              listIndex as 0 | 1,
              e.currentTarget.value,
            ),
          )}
      />
      {#each list.items as item (item.id)}
        <div class="equipment-section__item">
          <input
            class="equipment-section__item-name"
            value={item.name}
            placeholder="Item"
            oninput={(e) =>
              commit(
                updateEquipmentItem(section.data, listIndex as 0 | 1, item.id, {
                  name: e.currentTarget.value,
                }),
              )}
          />
          <input
            class="equipment-section__item-count"
            value={item.count}
            placeholder="Qty"
            oninput={(e) =>
              commit(
                updateEquipmentItem(section.data, listIndex as 0 | 1, item.id, {
                  count: e.currentTarget.value,
                }),
              )}
          />
          <button
            type="button"
            class="equipment-section__item-remove no-print"
            aria-label="Remove item"
            onclick={() =>
              commit(
                removeEquipmentItem(section.data, listIndex as 0 | 1, item.id),
              )}
          >
            ×
          </button>
        </div>
      {/each}
      <button
        type="button"
        class="equipment-section__add no-print"
        onclick={() =>
          commit(addEquipmentItem(section.data, listIndex as 0 | 1))}
      >
        + Add item
      </button>
    </div>
  {/each}
</div>

<style>
  .equipment-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }

  .equipment-section__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .equipment-section__title {
    border: none;
    background: transparent;
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-body);
    color: var(--color-text);
    padding: 2px 0;
    margin-bottom: var(--space-1);
  }

  .equipment-section__item {
    display: flex;
    align-items: center;
    gap: var(--space-1);
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
    width: 44px;
    text-align: center;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-body);
    padding: 4px;
  }

  .equipment-section__item-remove {
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: var(--font-size-body);
    line-height: 1;
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
