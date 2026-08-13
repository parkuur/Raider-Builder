<script lang="ts">
  import DocumentHeader from "./DocumentHeader.svelte";
  import RowList from "./RowList.svelte";
  import SaveLoadControls from "./SaveLoadControls.svelte";
</script>

<div class="toolbar no-print">
  <a
    class="toolbar__logo"
    href="https://frostysound.fi"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Frosty Sound"
  >
    <img src="/fs-logo.png" alt="Frosty Sound" />
  </a>
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-2) var(--space-5);
    background: var(--color-background);
    border-bottom: 1px solid var(--color-border);
  }

  .toolbar__logo {
    flex: none;
    display: block;
  }

  .toolbar__logo img {
    display: block;
    height: 28px;
    width: auto;
    object-fit: contain;
  }

  .document-shell {
    max-width: 8.27in;
    margin: 0 auto;
    padding: var(--space-6) var(--space-5);
  }

  /* Reclaim horizontal space on mobile now that sections have no border to
   * pad inside of (see SectionFrame.svelte) — screen-only, so print keeps
   * today's margins regardless of the originating device's viewport. */
  @media screen and (max-width: 640px) {
    .toolbar {
      /* The hamburger toggle and its dropdown are both position: absolute
       * (see SaveLoadControls.svelte), so neither contributes to this
       * bar's height in normal flow — without an explicit minimum it
       * collapses to just its own padding. */
      min-height: 52px;
      padding: var(--space-2) var(--space-2);
    }

    .document-shell {
      padding: var(--space-4) var(--space-2);
    }
  }
</style>
