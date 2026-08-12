<script lang="ts">
  import type { Section } from "../../model/section-types";
  import {
    addRequirementGroup,
    removeRequirementGroup,
    reorderRequirementGroups,
    updateRequirementGroup,
  } from "../../model/requirements";
  import { setRequirementsData } from "../../state/document.svelte";
  import SectionEmptyHint from "../../components/SectionEmptyHint.svelte";
  import DragHandle from "../../components/DragHandle.svelte";
  import { DragReorderState } from "../../components/drag-reorder.svelte";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "requirements" }> } =
    $props();

  function commit(data: typeof section.data) {
    setRequirementsData(rowId, section.id, data);
  }

  const drag = new DragReorderState();
</script>

<div class="requirements-section">
  {#if section.data.groups.length === 0}
    <SectionEmptyHint text="No requirements yet — add one below." />
  {/if}
  {#each section.data.groups as group (group.id)}
    <div
      class="requirements-section__group"
      class:requirements-section__group--drag-over={drag.isOver(group.id)}
      role="presentation"
      ondragover={(e) => {
        e.preventDefault();
        drag.over(group.id);
      }}
      ondrop={(e) => {
        e.preventDefault();
        const move = drag.resolveDrop(
          section.data.groups.map((g) => g.id),
          group.id,
        );
        if (move)
          commit(reorderRequirementGroups(section.data, move[0], move[1]));
      }}
    >
      <div class="requirements-section__group-head">
        <DragHandle
          onDragStart={() => drag.start(group.id)}
          onDragEnd={() => drag.end()}
        />
        <input
          class="requirements-section__heading"
          value={group.heading}
          placeholder="Requirement heading"
          oninput={(e) =>
            commit(
              updateRequirementGroup(section.data, group.id, {
                heading: e.currentTarget.value,
              }),
            )}
        />
        <div class="requirements-section__group-actions no-print">
          <button
            type="button"
            title="Remove"
            onclick={() =>
              commit(removeRequirementGroup(section.data, group.id))}
          >
            Remove
          </button>
        </div>
      </div>
      <textarea
        class="requirements-section__text"
        value={group.text}
        placeholder="Details…"
        oninput={(e) =>
          commit(
            updateRequirementGroup(section.data, group.id, {
              text: e.currentTarget.value,
            }),
          )}></textarea>
    </div>
  {/each}
  <button
    type="button"
    class="requirements-section__add no-print"
    onclick={() => commit(addRequirementGroup(section.data))}
  >
    + Add Item
  </button>
</div>

<style>
  .requirements-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .requirements-section__group {
    border: 1px solid var(--color-border);
    padding: var(--space-2) var(--space-3);
  }

  .requirements-section__group--drag-over {
    outline: 2px solid var(--color-accent);
    outline-offset: -2px;
  }

  .requirements-section__group-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    margin-bottom: var(--space-1);
  }

  .requirements-section__heading {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-body);
    color: var(--color-text);
    padding: 2px 0;
  }

  .requirements-section__group-actions {
    display: flex;
    gap: var(--space-1);
    flex: none;
  }

  .requirements-section__group-actions button {
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-label);
    padding: 4px var(--space-2);
    cursor: pointer;
  }

  .requirements-section__group-actions button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .requirements-section__text {
    width: 100%;
    min-height: 56px;
    resize: vertical;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: var(--font-size-body);
    padding: var(--space-2);
  }

  .requirements-section__add {
    align-self: flex-start;
    padding: 6px var(--space-3);
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
