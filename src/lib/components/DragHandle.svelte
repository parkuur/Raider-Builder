<script lang="ts">
  let {
    onDragStart,
    onDragEnd,
    label = "Drag to reorder",
  }: {
    onDragStart: (e: DragEvent) => void;
    onDragEnd: (e: DragEvent) => void;
    label?: string;
  } = $props();
</script>

<span
  class="drag-handle no-print"
  draggable="true"
  ondragstart={onDragStart}
  ondragend={onDragEnd}
  role="button"
  tabindex="0"
  aria-label={label}
  title={label}
>
  ⠿
</span>

<style>
  .drag-handle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    cursor: grab;
    opacity: 0.35;
    padding: 4px;
  }
</style>
