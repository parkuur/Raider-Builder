<script lang="ts">
  import SectionFrame from "./SectionFrame.svelte";
  import type { Row } from "../model/document-types";

  let { row }: { row: Row } = $props();
</script>

<div class="row-view">
  <div class="row-view__handle no-print" aria-hidden="true">⠿</div>
  <div class="row-view__sections">
    {#each row.sections as section (section.id)}
      <SectionFrame rowId={row.id} {section} />
    {/each}
  </div>
</div>

<style>
  .row-view {
    display: flex;
    gap: var(--space-2);
    align-items: flex-start;
    margin-bottom: var(--space-1);
  }

  .row-view__handle {
    flex: none;
    width: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.35;
    padding-top: var(--space-4);
  }

  .row-view__sections {
    flex: 1;
    display: flex;
    gap: var(--space-4);
    align-items: flex-start;
    min-width: 0;
  }
</style>
