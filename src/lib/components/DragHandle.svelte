<script lang="ts">
  import { pointerReorder } from "../actions/pointer-reorder";

  let {
    onStart,
    onOver,
    onDrop,
    onEnd,
    label = "Drag to reorder",
  }: {
    onStart: () => void;
    onOver: (id: string) => void;
    onDrop: (id: string) => void;
    onEnd: () => void;
    label?: string;
  } = $props();
</script>

<span
  class="drag-handle no-print"
  use:pointerReorder={{ onStart, onOver, onDrop, onEnd }}
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
    touch-action: none;
  }
</style>
