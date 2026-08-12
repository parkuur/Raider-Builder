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
    padding: 4px;
  }

  .remove-button:hover,
  .remove-button:focus-visible {
    color: var(--color-danger);
  }
</style>
