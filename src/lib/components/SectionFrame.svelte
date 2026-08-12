<script lang="ts">
  import { sectionRegistry } from "../sections/registry";
  import {
    duplicateSection,
    removeSection,
    setSectionTitle,
    toggleSectionHidden,
    unpairSection,
  } from "../state/document.svelte";
  import type { Section } from "../model/section-types";
  import type { SectionRegistryEntry } from "../sections/registry";

  let {
    rowId,
    section,
    sectionCount,
    onPairRequest,
  }: {
    rowId: string;
    section: Section;
    sectionCount: number;
    onPairRequest: (rowId: string) => void;
  } = $props();

  // Indexing a mapped-type registry by a widened `SectionType` key yields a
  // union of per-key entry types, which TS can't recombine into one entry
  // generic over the full union — safe to widen back explicitly since
  // `section` and the looked-up entry are always keyed by the same runtime
  // `type`.
  const Entry = $derived(sectionRegistry[section.type] as SectionRegistryEntry);
  const canPair = $derived(Entry.half && sectionCount === 1);
  const canUnpair = $derived(Entry.half && sectionCount === 2);
</script>

<div class="section-frame" class:hidden-from-print={section.hidden}>
  <div class="section-frame__head">
    <input
      class="section-frame__title"
      value={section.title}
      oninput={(e) => setSectionTitle(rowId, section.id, e.currentTarget.value)}
      placeholder="Section title"
    />
    <div class="section-frame__actions no-print">
      {#if canPair}
        <button
          type="button"
          class="section-frame__action"
          title="Pair"
          onclick={() => onPairRequest(rowId)}
        >
          Pair
        </button>
      {/if}
      {#if canUnpair}
        <button
          type="button"
          class="section-frame__action"
          title="Unpair"
          onclick={() => unpairSection(rowId, section.id)}
        >
          Unpair
        </button>
      {/if}
      <button
        type="button"
        class="section-frame__action"
        aria-pressed={section.hidden}
        title="Hide from print"
        onclick={() => toggleSectionHidden(rowId, section.id)}
      >
        {section.hidden ? "Hidden" : "Visible"}
      </button>
      <button
        type="button"
        class="section-frame__action"
        title="Duplicate"
        onclick={() => duplicateSection(rowId, section.id)}
      >
        Duplicate
      </button>
      <button
        type="button"
        class="section-frame__action"
        title="Delete"
        onclick={() => removeSection(rowId, section.id)}
      >
        Delete
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
    border: 1px solid var(--color-border);
    padding: var(--space-4) var(--space-4);
  }

  .section-frame.hidden-from-print {
    opacity: 0.6;
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
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-label);
    padding: 4px var(--space-2);
    cursor: pointer;
  }
</style>
