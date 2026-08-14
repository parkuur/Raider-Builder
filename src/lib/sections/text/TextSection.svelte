<script lang="ts">
  import type { Section } from "../../model/section-types";
  import { setTextData } from "../../state/document.svelte";
  import { autosizeTextarea } from "../../actions/autosize-textarea";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "text" }> } = $props();
</script>

<textarea
  class="text-section__body"
  use:autosizeTextarea={section.data.text}
  rows="1"
  value={section.data.text}
  placeholder="Text…"
  oninput={(e) =>
    setTextData(rowId, section.id, { text: e.currentTarget.value })}></textarea>

<style>
  .text-section__body {
    display: block;
    width: 100%;
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
    /* See the comment on .channel-list textarea (ChannelListSection.svelte). */
    field-sizing: content;
  }
</style>
