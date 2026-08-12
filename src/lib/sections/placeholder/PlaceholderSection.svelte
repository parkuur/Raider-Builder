<script lang="ts">
  import type { Section } from "../../model/section-types";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "placeholder" }> } =
    $props();
</script>

<p class="placeholder-section" data-row-id={rowId}>
  {section.data.note || "This section type has no content yet."}
</p>

<style>
  .placeholder-section {
    margin: 0;
    color: var(--color-text-muted);
    font-style: italic;
  }
</style>
