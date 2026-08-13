<script lang="ts">
  import { sectionRegistry } from "../sections/registry";
  import { groupSectionTypesByWidth } from "../model/registry-grouping";
  import type { SectionType } from "../model/section-types";

  let {
    open,
    filterHalfOnly = false,
    onPick,
    onClose,
  }: {
    open: boolean;
    filterHalfOnly?: boolean;
    onPick: (type: SectionType) => void;
    onClose: () => void;
  } = $props();

  const groups = $derived(
    groupSectionTypesByWidth(
      Object.values(sectionRegistry).filter((entry) => entry.addable !== false),
    ),
  );
  const entries = $derived(
    filterHalfOnly ? groups.half : [...groups.full, ...groups.half],
  );
</script>

{#if open}
  <div
    class="add-section-menu-backdrop no-print"
    role="button"
    tabindex="-1"
    onclick={onClose}
    onkeydown={(e) => e.key === "Escape" && onClose()}
  >
    <div
      class="add-section-menu"
      role="dialog"
      aria-label="Add section"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <div class="add-section-menu__heading">Add Section</div>
      <div class="add-section-menu__grid">
        {#each entries as entry (entry.type)}
          <button
            type="button"
            class="add-section-menu__option"
            onclick={() => onPick(entry.type as SectionType)}
          >
            {entry.label}
            {#if entry.half}
              <span class="add-section-menu__half-tag">(half)</span>
            {/if}
          </button>
        {/each}
      </div>
      <div class="add-section-menu__footer">
        <button type="button" class="add-section-menu__cancel" onclick={onClose}
          >Cancel</button
        >
      </div>
    </div>
  </div>
{/if}

<style>
  .add-section-menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    padding: var(--space-4);
    background: color-mix(in srgb, #000 45%, transparent);
  }

  .add-section-menu {
    width: min(460px, 100%);
    background: var(--color-background);
    border: 1px solid var(--color-border);
    padding: var(--space-5);
  }

  .add-section-menu__heading {
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-section-title);
    margin-bottom: var(--space-4);
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

  .add-section-menu__half-tag {
    opacity: 0.55;
    font-size: var(--font-size-label);
    margin-left: var(--space-1);
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
