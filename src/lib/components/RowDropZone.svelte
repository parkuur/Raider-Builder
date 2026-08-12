<script lang="ts">
  let {
    active,
    onDragOver,
    onDrop,
  }: {
    active: boolean;
    onDragOver: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
  } = $props();
</script>

<div
  class="row-drop-zone no-print"
  class:row-drop-zone--active={active}
  role="presentation"
  ondragover={onDragOver}
  ondrop={onDrop}
></div>

<style>
  .row-drop-zone {
    height: 8px;
    margin: 2px 0;
  }

  .row-drop-zone--active {
    background: var(--color-accent);
    border-radius: 2px;
  }
</style>
