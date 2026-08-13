<script lang="ts">
  import type { Section } from "../../model/section-types";

  // Page breaks carry no data — rowId/section are accepted only so this
  // component's type matches SectionComponentProps for the registry.
  // eslint-disable-next-line svelte/no-unused-props, @typescript-eslint/no-unused-vars
  let props: {
    rowId: string;
    section: Extract<Section, { type: "page-break" }>;
  } = $props();
</script>

<div class="page-break-section no-print" aria-hidden="true">
  <span class="page-break-section__label">Page Break</span>
</div>

<style>
  .page-break-section {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--color-text-muted);
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-label);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .page-break-section::before,
  .page-break-section::after {
    content: "";
    flex: 1;
    border-top: 1px dashed var(--color-border);
  }
</style>
