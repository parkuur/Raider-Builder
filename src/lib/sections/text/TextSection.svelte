<script lang="ts">
  import type { Section } from "../../model/section-types";
  import { setTextData } from "../../state/document.svelte";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "text" }> } = $props();
</script>

<textarea
  class="text-section__body"
  value={section.data.text}
  placeholder="Text…"
  oninput={(e) =>
    setTextData(rowId, section.id, { text: e.currentTarget.value })}></textarea>

<style>
  .text-section__body {
    width: 100%;
    min-height: 56px;
    resize: vertical;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: var(--font-size-body);
    padding: var(--space-2);
  }
</style>
