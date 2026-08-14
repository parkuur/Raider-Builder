<script lang="ts">
  import type {
    QuickLookSectionData,
    QuickLookTopic as Topic,
  } from "../../model/quicklook";
  import {
    addQuickLookLine,
    cycleQuickLookTableValueAlign,
    removeQuickLookLine,
    removeQuickLookTopic,
    reorderQuickLookLine,
    reorderQuickLookTopics,
    setQuickLookTopicIcon,
    setQuickLookTopicTitle,
    updateQuickLookLine,
    updateQuickLookRowValue,
    updateQuickLookTextContent,
  } from "../../model/quicklook";
  import type { IconKey } from "../../model/icon-keys";
  import { fitColumnChars } from "../../model/column-fit";
  import QuickLookTopicHeader from "./QuickLookTopicHeader.svelte";
  import RemoveButton from "../../components/RemoveButton.svelte";
  import DragHandle from "../../components/DragHandle.svelte";
  import { DragReorderState } from "../../components/drag-reorder.svelte";
  import { autosizeTextarea } from "../../actions/autosize-textarea";
  import TextAlignLeftIcon from "phosphor-svelte/lib/TextAlignLeftIcon";
  import TextAlignCenterIcon from "phosphor-svelte/lib/TextAlignCenterIcon";
  import TextAlignRightIcon from "phosphor-svelte/lib/TextAlignRightIcon";

  // Describes the *next* alignment a click will switch to (the standard
  // pattern for a cycling toggle's label), keyed by the *current* state.
  const NEXT_VALUE_ALIGN_LABEL = {
    left: "Center-align values",
    center: "Right-align values",
    right: "Left-align values",
  } as const;

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
      {:else if topic.kind === "table"}
        <button
          type="button"
          class="quicklook-section__align-toggle no-print"
          aria-label={NEXT_VALUE_ALIGN_LABEL[topic.valueAlign]}
          title={NEXT_VALUE_ALIGN_LABEL[topic.valueAlign]}
          onclick={() =>
            onCommit(cycleQuickLookTableValueAlign(data, topic.id))}
        >
          {#if topic.valueAlign === "left"}
            <TextAlignLeftIcon size={14} />
          {:else if topic.valueAlign === "center"}
            <TextAlignCenterIcon size={14} />
          {:else}
            <TextAlignRightIcon size={14} />
          {/if}
        </button>
      {/if}
    {/snippet}
  </QuickLookTopicHeader>

  {#if topic.kind === "table"}
    {@const valueChars = fitColumnChars(
      topic.lines.map((l) => l.value),
      "Value",
    )}
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
          style:width="{valueChars}ch"
          style:text-align={topic.valueAlign}
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
  {:else if topic.kind === "text"}
    <div class="quicklook-section__text-row">
      <!-- Matches the drag-handle width a table line's Label starts after,
           so the text body's left edge lines up with Label's. Also
           no-print, like the real DragHandle, so it collapses the same
           way in print and the edges stay aligned there too. -->
      <span
        class="quicklook-section__text-row-spacer no-print"
        aria-hidden="true"
      ></span>
      <textarea
        class="quicklook-section__text-body"
        use:autosizeTextarea={topic.content}
        rows="1"
        value={topic.content}
        placeholder="Text…"
        oninput={(e) =>
          onCommit(
            updateQuickLookTextContent(data, topic.id, e.currentTarget.value),
          )}></textarea>
      <!-- An actual (invisible, inert) RemoveButton, as the flex item
           itself rather than wrapped in a spacer — a table line's Value
           field ends right before its own RemoveButton, and matching that
           width (button default font metrics differ subtly from the
           app's inherited body font) exactly needs the same element, not
           an approximation. Not wrapped: `no-print` is on this real
           button, and it needs to be the flex item that goes away in
           print, the same as it does in a table line, rather than a
           wrapper span that would linger (and keep reserving its `gap`)
           after the button inside it disappears. -->
      <RemoveButton label="" onclick={() => {}} />
    </div>
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
    text-align: right;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-body);
    padding: 4px var(--space-2);
  }

  .quicklook-section__align-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
  }

  .quicklook-section__align-toggle:hover {
    color: var(--color-accent);
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
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-body);
    padding: 4px var(--space-2);
  }

  .quicklook-section__line-label {
    flex: 1;
    min-width: 0;
  }

  .quicklook-section__line-value {
    flex: none;
  }

  .quicklook-section__text-row {
    display: flex;
    align-items: flex-start;
    gap: var(--space-1);
  }

  .quicklook-section__text-row-spacer {
    flex: none;
    width: 20px;
  }

  /* Invisible but still a real flex item (not display:none), so it keeps
     occupying its width and `gap` on screen — its own `no-print` class
     (inherited from RemoveButton) takes it out of the layout in print,
     the same way a table line's own remove button does. */
  .quicklook-section__text-row :global(.remove-button) {
    visibility: hidden;
  }

  .quicklook-section__text-body {
    display: block;
    flex: 1;
    min-width: 0;
    min-height: 56px;
    resize: none;
    overflow: hidden;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: var(--font-size-body);
    padding: var(--space-2);
    box-sizing: border-box;
    field-sizing: content;
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
