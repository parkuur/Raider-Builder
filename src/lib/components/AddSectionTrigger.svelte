<script lang="ts">
  let {
    label = "+ Add Section",
    onClick,
  }: { label?: string; onClick: () => void } = $props();
</script>

<div class="add-section-trigger-wrap no-print">
  <button type="button" class="add-section-trigger" onclick={onClick}>
    {label}
  </button>
</div>

<style>
  .add-section-trigger-wrap {
    display: flex;
    justify-content: center;
    margin: var(--space-2) 0;
  }

  .add-section-trigger {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: 6px var(--space-3);
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
