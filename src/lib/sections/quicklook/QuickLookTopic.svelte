<script lang="ts">
  import type {
    QuickLookSectionData,
    QuickLookTopic as Topic,
  } from "../../model/quicklook";
  import {
    addQuickLookLine,
    removeQuickLookLine,
    removeQuickLookTopic,
    reorderQuickLookTopics,
    setQuickLookTopicIcon,
    setQuickLookTopicTitle,
    updateQuickLookLine,
    updateQuickLookRowValue,
  } from "../../model/quicklook";
  import type { IconKey } from "../../model/icon-keys";
  import QuickLookTopicHeader from "./QuickLookTopicHeader.svelte";
  import RemoveButton from "../../components/RemoveButton.svelte";
  import DragHandle from "../../components/DragHandle.svelte";
  import type { DragReorderState } from "../../components/drag-reorder.svelte";

  let {
    data,
    topic,
    drag,
    onCommit,
  }: {
    data: QuickLookSectionData;
    topic: Topic;
    drag: DragReorderState;
    onCommit: (next: QuickLookSectionData) => void;
  } = $props();
</script>

<div
  class="quicklook-section__topic"
  class:quicklook-section__topic--drag-over={drag.isOver(topic.id)}
  role="presentation"
  ondragover={(e) => {
    e.preventDefault();
    drag.over(topic.id);
  }}
  ondrop={(e) => {
    e.preventDefault();
    const move = drag.resolveDrop(
      data.topics.map((t) => t.id),
      topic.id,
    );
    if (move) onCommit(reorderQuickLookTopics(data, move[0], move[1]));
  }}
>
  <QuickLookTopicHeader
    iconKey={topic.iconKey}
    title={topic.title}
    onIconChange={(key: IconKey) =>
      onCommit(setQuickLookTopicIcon(data, topic.id, key))}
    onTitleChange={(title) =>
      onCommit(setQuickLookTopicTitle(data, topic.id, title))}
    onRemove={() => onCommit(removeQuickLookTopic(data, topic.id))}
  >
    {#snippet leading()}
      <DragHandle
        onDragStart={() => drag.start(topic.id)}
        onDragEnd={() => drag.end()}
      />
    {/snippet}
    {#snippet trailing()}
      {#if topic.kind === "row"}
        <input
          class="quicklook-section__value"
          value={topic.value}
          placeholder="Value"
          oninput={(e) =>
            onCommit(
              updateQuickLookRowValue(data, topic.id, e.currentTarget.value),
            )}
        />
      {/if}
    {/snippet}
  </QuickLookTopicHeader>

  {#if topic.kind === "table"}
    {#each topic.lines as line (line.id)}
      <div class="quicklook-section__line">
        <input
          class="quicklook-section__line-label"
          value={line.label}
          placeholder="Label"
          oninput={(e) =>
            onCommit(
              updateQuickLookLine(data, topic.id, line.id, {
                label: e.currentTarget.value,
              }),
            )}
        />
        <input
          class="quicklook-section__line-value"
          value={line.value}
          placeholder="Value"
          oninput={(e) =>
            onCommit(
              updateQuickLookLine(data, topic.id, line.id, {
                value: e.currentTarget.value,
              }),
            )}
        />
        <RemoveButton
          label="Remove line"
          onclick={() => onCommit(removeQuickLookLine(data, topic.id, line.id))}
        />
      </div>
    {/each}
    <button
      type="button"
      class="quicklook-section__add-line no-print"
      onclick={() => onCommit(addQuickLookLine(data, topic.id))}
    >
      + Add Line
    </button>
  {/if}
</div>

<style>
  .quicklook-section__topic {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--color-border);
  }

  .quicklook-section__topic--drag-over {
    outline: 2px solid var(--color-accent);
    outline-offset: -2px;
  }

  .quicklook-section__value {
    flex: 1;
    min-width: 0;
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
    margin-left: calc(20px + var(--space-2));
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
    margin-left: calc(20px + var(--space-2));
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
