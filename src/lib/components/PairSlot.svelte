<script lang="ts">
  let { onClick }: { onClick: () => void } = $props();
</script>

<div class="pair-slot no-print">
  <button
    type="button"
    class="pair-slot__button"
    aria-label="Add paired section"
    title="Add paired section"
    onclick={onClick}
  >
    + Add Section
  </button>
</div>

<style>
  .pair-slot {
    flex: 1;
    min-width: 0;
    display: flex;
  }

  .pair-slot__button {
    flex: 1;
    min-height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
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
