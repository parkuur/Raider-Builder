<script lang="ts">
  import type { Section } from "../../model/section-types";
  import type { QuickLookTopic as Topic } from "../../model/quicklook";
  import QuickLookTopicComponent from "./QuickLookTopic.svelte";
  import { addQuickLookTopic } from "../../model/quicklook";
  import { setQuickLookData } from "../../state/document.svelte";
  import SectionEmptyHint from "../../components/SectionEmptyHint.svelte";
  import { DragReorderState } from "../../components/drag-reorder.svelte";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "quicklook" }> } =
    $props();

  function commit(data: typeof section.data) {
    setQuickLookData(rowId, section.id, data);
  }

  const drag = new DragReorderState();

  let addMenuOpen = $state(false);

  function addTopic(kind: Topic["kind"]): void {
    commit(addQuickLookTopic(section.data, kind));
    addMenuOpen = false;
  }

  const ADD_TOPIC_OPTIONS: { kind: Topic["kind"]; label: string }[] = [
    { kind: "row", label: "Row" },
    { kind: "table", label: "Table" },
    { kind: "text", label: "Text" },
  ];
</script>

<div class="quicklook-section">
  {#if section.data.topics.length === 0}
    <SectionEmptyHint
      text="No topics yet — add a row, table, or text topic above."
    />
  {/if}
  {#each section.data.topics as topic (topic.id)}
    <QuickLookTopicComponent
      data={section.data}
      {topic}
      {drag}
      onCommit={commit}
    />
  {/each}
  <div class="quicklook-section__add-topic no-print">
    <button
      type="button"
      class="quicklook-section__add"
      aria-haspopup="true"
      aria-expanded={addMenuOpen}
      onclick={() => (addMenuOpen = !addMenuOpen)}
    >
      + Add Topic
    </button>
    {#if addMenuOpen}
      <div
        class="quicklook-section__add-topic-backdrop"
        role="button"
        tabindex="-1"
        onclick={() => (addMenuOpen = false)}
        onkeydown={(e) => e.key === "Escape" && (addMenuOpen = false)}
      ></div>
      <div
        class="quicklook-section__add-topic-popover"
        role="menu"
        aria-label="Add topic"
      >
        {#each ADD_TOPIC_OPTIONS as option (option.kind)}
          <button
            type="button"
            role="menuitem"
            onclick={() => addTopic(option.kind)}
          >
            {option.label}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .quicklook-section {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .quicklook-section__add-topic {
    position: relative;
    display: inline-flex;
    align-self: flex-start;
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

  .quicklook-section__add-topic-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: transparent;
  }

  .quicklook-section__add-topic-popover {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 101;
    display: flex;
    flex-direction: column;
    min-width: 120px;
    border: 1px solid var(--color-border);
    background: var(--color-background);
    box-shadow: 0 4px 12px color-mix(in srgb, #000 25%, transparent);
  }

  .quicklook-section__add-topic-popover button {
    padding: var(--space-2);
    border: none;
    background: transparent;
    color: var(--color-text);
    text-align: left;
    cursor: pointer;
    font-size: var(--font-size-body);
  }

  .quicklook-section__add-topic-popover button:hover {
    background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  }
</style>
