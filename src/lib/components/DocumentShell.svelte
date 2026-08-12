<script lang="ts">
  import DocumentHeader from "./DocumentHeader.svelte";
  import RowList from "./RowList.svelte";
</script>

<div class="document-shell">
  <DocumentHeader />
  <RowList />
</div>

<style>
  .document-shell {
    max-width: 8.27in;
    margin: 0 auto;
    padding: var(--space-6) var(--space-5);
  }
</style>
