<script lang="ts">
  import AddSectionTrigger from "./AddSectionTrigger.svelte";

  let { onAdd }: { onAdd: () => void } = $props();
</script>

<div class="empty-state">
  <p class="empty-state__copy">
    This rider is empty. Add a section to get started.
  </p>
  <AddSectionTrigger label="+ Add your first section" onClick={onAdd} />
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-6) 0;
    color: var(--color-text-muted);
  }

  .empty-state__copy {
    margin: 0;
    font-size: var(--font-size-body);
  }
</style>
