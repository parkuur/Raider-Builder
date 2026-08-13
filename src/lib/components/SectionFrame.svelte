<script lang="ts">
  import { sectionRegistry } from "../sections/registry";
  import {
    duplicateSection,
    removeSection,
    setSectionTitle,
    toggleSectionHidden,
  } from "../state/document.svelte";
  import type { Section } from "../model/section-types";
  import type { SectionRegistryEntry } from "../sections/registry";
  import ChromeIcon from "./icons/ChromeIcon.svelte";

  let {
    rowId,
    section,
    sectionCount,
    lifted,
    onToggleLift,
  }: {
    rowId: string;
    section: Section;
    sectionCount: number;
    lifted: boolean;
    onToggleLift: () => void;
  } = $props();

  // Indexing a mapped-type registry by a widened `SectionType` key yields a
  // union of per-key entry types, which TS can't recombine into one entry
  // generic over the full union — safe to widen back explicitly since
  // `section` and the looked-up entry are always keyed by the same runtime
  // `type`.
  const Entry = $derived(sectionRegistry[section.type] as SectionRegistryEntry);
</script>

<div
  class="section-frame"
  class:hidden-from-print={section.hidden}
  class:section-frame--lifted={lifted}
>
  <div class="section-frame__head">
    <input
      class="section-frame__title"
      value={section.title}
      oninput={(e) => setSectionTitle(rowId, section.id, e.currentTarget.value)}
      placeholder="Section title"
    />
    <div class="section-frame__actions no-print">
      {#if sectionCount === 2}
        <button
          type="button"
          class="section-frame__action"
          class:section-frame__action--active={lifted}
          data-lift-ui
          aria-pressed={lifted}
          aria-label={lifted ? "Cancel move" : "Move or unpair this section"}
          title={lifted ? "Cancel move" : "Move or unpair this section"}
          onclick={onToggleLift}
        >
          <ChromeIcon key="move" />
        </button>
      {/if}
      <button
        type="button"
        class="section-frame__action"
        aria-pressed={section.hidden}
        aria-label={section.hidden ? "Show section" : "Hide section"}
        title={section.hidden ? "Show section" : "Hide section"}
        onclick={() => toggleSectionHidden(rowId, section.id)}
      >
        <ChromeIcon key={section.hidden ? "eye-off" : "eye"} />
      </button>
      <button
        type="button"
        class="section-frame__action"
        aria-label="Duplicate section"
        title="Duplicate section"
        onclick={() => duplicateSection(rowId, section.id)}
      >
        <ChromeIcon key="copy" />
      </button>
      <button
        type="button"
        class="section-frame__action"
        aria-label="Delete section"
        title="Delete section"
        onclick={() => removeSection(rowId, section.id)}
      >
        <ChromeIcon key="trash" />
      </button>
    </div>
  </div>
  <div class="section-frame__body">
    <Entry.component {rowId} {section} />
  </div>
</div>

<style>
  .section-frame {
    flex: 1;
    min-width: 0;
    position: relative;
    padding: var(--space-4) 0;
  }

  .section-frame.hidden-from-print {
    opacity: 0.6;
  }

  .section-frame--lifted {
    opacity: 0.5;
  }

  .section-frame__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .section-frame__title {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-section-title);
    color: var(--color-text);
    padding: 2px 0;
  }

  .section-frame__actions {
    display: flex;
    gap: var(--space-1);
    flex: none;
  }

  .section-frame__action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
  }

  .section-frame__action--active {
    border-color: var(--color-accent);
    background: var(--color-accent);
    color: var(--color-background);
  }
</style>
