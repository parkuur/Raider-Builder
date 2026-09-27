<script lang="ts">
  import { sectionRegistry } from "../sections/registry";
  import { groupSectionTypes } from "../model/registry-grouping";
  import type { SectionType } from "../model/section-types";
  import SquareSplitHorizontalIcon from "phosphor-svelte/lib/SquareSplitHorizontalIcon";
  import Modal from "./Modal.svelte";

  let {
    open,
    filterSplitOnly = false,
    onPick,
    onClose,
  }: {
    open: boolean;
    filterSplitOnly?: boolean;
    onPick: (type: SectionType) => void;
    onClose: () => void;
  } = $props();

  const groups = $derived(
    groupSectionTypes(
      Object.values(sectionRegistry).filter((entry) => entry.addable !== false),
      { splitOnly: filterSplitOnly },
    ),
  );
</script>

<Modal {open} title="Add Section" {onClose}>
  {#each groups as group (group.category)}
    <section
      class="add-section-menu__group"
      aria-labelledby="add-section-menu-{group.category}"
    >
      <h3
        class="add-section-menu__group-heading"
        id="add-section-menu-{group.category}"
      >
        {group.label}
      </h3>
      <div class="add-section-menu__grid">
        {#each group.entries as entry (entry.type)}
          <button
            type="button"
            class="add-section-menu__option"
            onclick={() => onPick(entry.type as SectionType)}
          >
            {entry.label}
            {#if entry.split}
              <span class="add-section-menu__split-tag" aria-hidden="true">
                <SquareSplitHorizontalIcon size={14} />
              </span>
              <span class="add-section-menu__split-sr">(split)</span>
            {/if}
          </button>
        {/each}
      </div>
    </section>
  {/each}
  <div class="add-section-menu__footer">
    <button type="button" class="add-section-menu__cancel" onclick={onClose}
      >Cancel</button
    >
  </div>
</Modal>

<style>
  .add-section-menu__group + .add-section-menu__group {
    margin-top: var(--space-4);
  }

  .add-section-menu__group-heading {
    margin: 0 0 var(--space-2);
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-label);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .add-section-menu__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2);
  }

  .add-section-menu__option {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    background: transparent;
    cursor: pointer;
    text-align: left;
    font-size: var(--font-size-body);
    color: var(--color-text);
  }

  .add-section-menu__split-tag {
    display: inline-flex;
    opacity: 0.55;
    margin-left: var(--space-1);
  }

  /* Kept for screen readers: the icon above is decorative (aria-hidden), so
     this preserves "Contacts (split)" etc. as the option's accessible name. */
  .add-section-menu__split-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .add-section-menu__footer {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--space-4);
  }

  .add-section-menu__cancel {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-label);
  }
</style>
