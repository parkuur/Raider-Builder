<script lang="ts">
  let {
    available,
    onClick,
  }: {
    available: boolean;
    onClick: () => void;
  } = $props();
</script>

<button
  type="button"
  class="row-drop-zone no-print"
  class:row-drop-zone--available={available}
  data-lift-ui
  disabled={!available}
  aria-label="Move here"
  onclick={onClick}
></button>

<style>
  .row-drop-zone {
    display: block;
    width: 100%;
    height: 8px;
    margin: 2px 0;
    padding: 0;
    border: none;
    background: transparent;
  }

  .row-drop-zone--available {
    height: 12px;
    background: var(--color-accent);
    opacity: 0.35;
    border-radius: 2px;
    cursor: pointer;
  }

  .row-drop-zone--available:hover {
    opacity: 0.7;
  }
</style>
