<script lang="ts">
  import type {
    QuickLookSectionData,
    QuickLookTopic as Topic,
  } from "../../model/quicklook";
  import {
    addQuickLookLine,
    removeQuickLookLine,
    removeQuickLookTopic,
    reorderQuickLookLine,
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
  import { DragReorderState } from "../../components/drag-reorder.svelte";

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

  const lineDrag = new DragReorderState();
</script>

<div
  class="quicklook-section__topic"
  data-reorder-item={topic.id}
  class:quicklook-section__topic--drag-over={drag.isOver(topic.id)}
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
        onStart={() => drag.start(topic.id)}
        onOver={(id) => drag.over(id)}
        onDrop={(id) => {
          const move = drag.resolveDrop(
            data.topics.map((t) => t.id),
            id,
          );
          if (move) onCommit(reorderQuickLookTopics(data, move[0], move[1]));
        }}
        onEnd={() => drag.end()}
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
      <div
        class="quicklook-section__line"
        data-reorder-item={line.id}
        class:quicklook-section__line--drag-over={lineDrag.isOver(line.id)}
      >
        <DragHandle
          label="Drag to reorder line"
          onStart={() => lineDrag.start(line.id)}
          onOver={(id) => lineDrag.over(id)}
          onDrop={(id) => {
            const move = lineDrag.resolveDrop(
              topic.lines.map((l) => l.id),
              id,
            );
            if (move)
              onCommit(reorderQuickLookLine(data, topic.id, move[0], move[1]));
          }}
          onEnd={() => lineDrag.end()}
        />
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
  }

  .quicklook-section__topic:not(:first-child) {
    border-top: 1px solid var(--color-border);
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
  }

  .quicklook-section__line--drag-over {
    outline: 2px solid var(--color-accent);
    outline-offset: -2px;
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
    margin-left: calc(20px + var(--space-1));
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
