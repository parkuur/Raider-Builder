<script lang="ts">
  let { text }: { text: string } = $props();
</script>

<p class="section-empty-hint no-print">{text}</p>

<style>
  .section-empty-hint {
    margin: 0 0 var(--space-2) 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-label);
  }
</style>
