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
  import ChromeIcon from "./icons/ChromeIcon.svelte";

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
          class="section-frame__action section-frame__action--text"
          title="Pair"
          onclick={() => onPairRequest(rowId)}
        >
          Pair
        </button>
      {/if}
      {#if canUnpair}
        <button
          type="button"
          class="section-frame__action section-frame__action--text"
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

  .section-frame__action--text {
    width: auto;
    height: auto;
    font-size: var(--font-size-label);
    padding: 4px var(--space-2);
  }
</style>
