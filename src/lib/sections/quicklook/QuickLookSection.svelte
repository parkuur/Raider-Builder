<script lang="ts">
  import type { Section } from "../../model/section-types";
  import QuickLookTopicHeader from "./QuickLookTopicHeader.svelte";
  import {
    addQuickLookLine,
    addQuickLookTopic,
    removeQuickLookLine,
    removeQuickLookTopic,
    reorderQuickLookTopics,
    setQuickLookTableTag,
    setQuickLookTopicIcon,
    setQuickLookTopicTitle,
    updateQuickLookLine,
    updateQuickLookRowValue,
  } from "../../model/quicklook";
  import { setQuickLookData } from "../../state/document.svelte";
  import type { IconKey } from "../../model/icon-keys";
  import SectionEmptyHint from "../../components/SectionEmptyHint.svelte";
  import RemoveButton from "../../components/RemoveButton.svelte";

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
  {#each section.data.topics as topic, index (topic.id)}
    <div class="quicklook-section__topic">
      <QuickLookTopicHeader
        iconKey={topic.iconKey}
        title={topic.title}
        onIconChange={(key: IconKey) =>
          commit(setQuickLookTopicIcon(section.data, topic.id, key))}
        onTitleChange={(title) =>
          commit(setQuickLookTopicTitle(section.data, topic.id, title))}
        onRemove={() => commit(removeQuickLookTopic(section.data, topic.id))}
      />
      {#if topic.kind === "row"}
        <input
          class="quicklook-section__value"
          value={topic.value}
          placeholder="Value"
          oninput={(e) =>
            commit(
              updateQuickLookRowValue(
                section.data,
                topic.id,
                e.currentTarget.value,
              ),
            )}
        />
      {:else}
        <input
          class="quicklook-section__tag"
          value={topic.tag}
          placeholder="Tag"
          oninput={(e) =>
            commit(
              setQuickLookTableTag(
                section.data,
                topic.id,
                e.currentTarget.value,
              ),
            )}
        />
        {#each topic.lines as line (line.id)}
          <div class="quicklook-section__line">
            <input
              class="quicklook-section__line-label"
              value={line.label}
              placeholder="Label"
              oninput={(e) =>
                commit(
                  updateQuickLookLine(section.data, topic.id, line.id, {
                    label: e.currentTarget.value,
                  }),
                )}
            />
            <input
              class="quicklook-section__line-value"
              value={line.value}
              placeholder="Value"
              oninput={(e) =>
                commit(
                  updateQuickLookLine(section.data, topic.id, line.id, {
                    value: e.currentTarget.value,
                  }),
                )}
            />
            <RemoveButton
              label="Remove line"
              onclick={() =>
                commit(removeQuickLookLine(section.data, topic.id, line.id))}
            />
          </div>
        {/each}
        <button
          type="button"
          class="quicklook-section__add-line no-print"
          onclick={() => commit(addQuickLookLine(section.data, topic.id))}
        >
          + Add Line
        </button>
      {/if}
      <div class="quicklook-section__topic-actions no-print">
        <button
          type="button"
          aria-label="Move up"
          title="Move up"
          disabled={index === 0}
          onclick={() =>
            commit(reorderQuickLookTopics(section.data, index, index - 1))}
        >
          ↑
        </button>
        <button
          type="button"
          aria-label="Move down"
          title="Move down"
          disabled={index === section.data.topics.length - 1}
          onclick={() =>
            commit(reorderQuickLookTopics(section.data, index, index + 1))}
        >
          ↓
        </button>
      </div>
    </div>
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
    gap: var(--space-3);
  }

  .quicklook-section__topic {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    border: 1px solid var(--color-border);
    padding: var(--space-2) var(--space-3);
  }

  .quicklook-section__value,
  .quicklook-section__tag {
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-body);
    padding: 4px var(--space-2);
  }

  .quicklook-section__line {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .quicklook-section__line-label,
  .quicklook-section__line-value {
    flex: 1;
    min-width: 0;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-body);
    padding: 4px var(--space-2);
  }

  .quicklook-section__add-line {
    align-self: flex-start;
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

  .quicklook-section__topic-actions {
    display: flex;
    gap: var(--space-1);
    align-self: flex-end;
  }

  .quicklook-section__topic-actions button {
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-label);
    padding: 4px var(--space-2);
    cursor: pointer;
  }

  .quicklook-section__topic-actions button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .quicklook-section__add-buttons {
    display: flex;
    gap: var(--space-2);
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
