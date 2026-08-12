<script lang="ts">
  import type { Section } from "../../model/section-types";
  import QuickLookTopic from "./QuickLookTopic.svelte";
  import { addQuickLookTopic } from "../../model/quicklook";
  import { setQuickLookData } from "../../state/document.svelte";
  import SectionEmptyHint from "../../components/SectionEmptyHint.svelte";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "quicklook" }> } =
    $props();

  function commit(data: typeof section.data) {
    setQuickLookData(rowId, section.id, data);
  }
</script>

<div class="quicklook-section">
  {#if section.data.topics.length === 0}
    <SectionEmptyHint text="No topics yet — add a row or table topic above." />
  {/if}
  {#each section.data.topics as topic (topic.id)}
    <QuickLookTopic data={section.data} {topic} onCommit={commit} />
  {/each}
  <div class="quicklook-section__add-buttons no-print">
    <button
      type="button"
      class="quicklook-section__add"
      onclick={() => commit(addQuickLookTopic(section.data, "row"))}
    >
      + Add Row Topic
    </button>
    <button
      type="button"
      class="quicklook-section__add"
      onclick={() => commit(addQuickLookTopic(section.data, "table"))}
    >
      + Add Table Topic
    </button>
  </div>
</div>

<style>
  .quicklook-section {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .quicklook-section__add-buttons {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  .quicklook-section__add {
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
