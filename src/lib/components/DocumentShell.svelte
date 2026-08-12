<script lang="ts">
  import DocumentHeader from "./DocumentHeader.svelte";
  import RowList from "./RowList.svelte";
  import SaveLoadControls from "./SaveLoadControls.svelte";
</script>

<div class="toolbar no-print">
  <SaveLoadControls />
</div>

<div class="document-shell">
  <DocumentHeader />
  <RowList />
</div>

<style>
  .toolbar {
    position: sticky;
    top: 0;
    z-index: 40;
    padding: var(--space-2) var(--space-5);
    background: var(--color-background);
    border-bottom: 1px solid var(--color-border);
  }

  .document-shell {
    max-width: 8.27in;
    margin: 0 auto;
    padding: var(--space-6) var(--space-5);
  }
</style>
