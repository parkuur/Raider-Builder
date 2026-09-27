<script lang="ts">
  let { label, onclick }: { label: string; onclick: () => void } = $props();
</script>

<button
  type="button"
  class="remove-button no-print"
  aria-label={label}
  title={label}
  {onclick}
>
  ×
</button>

<style>
  .remove-button {
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: var(--font-size-body);
    line-height: 1;
    padding: 2px 4px;
  }

  .remove-button:hover,
  .remove-button:focus-visible {
    color: var(--color-danger);
  }

  /* Compact on desktop to keep list rows short; a full-size hit target on
   * touch screens. */
  @media (pointer: coarse) {
    .remove-button {
      padding: 4px;
    }
  }
</style>
