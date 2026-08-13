import type { Action } from "svelte/action";

const REORDER_ITEM_ATTR = "data-reorder-item";

function reorderItemIdAt(x: number, y: number): string | null {
  const el = document
    .elementFromPoint(x, y)
    ?.closest(`[${REORDER_ITEM_ATTR}]`);
  return el instanceof HTMLElement ? el.getAttribute(REORDER_ITEM_ATTR) : null;
}

export interface PointerReorderOptions {
  onStart: () => void;
  onOver: (id: string) => void;
  onDrop: (id: string) => void;
  onEnd: () => void;
}

/**
 * Pointer-Events counterpart to native HTML5 drag-and-drop for reordering a
 * list: works uniformly for mouse and touch, unlike native DnD which never
 * fires on touch. Hit-tests the element under the pointer against the
 * nearest ancestor carrying `data-reorder-item` (marking each row/item in
 * the list being reordered), so callers don't need to pre-measure sibling
 * rects — the browser's own hit-testing does that.
 */
export const pointerReorder: Action<HTMLElement, PointerReorderOptions> = (
  node,
  options,
) => {
  let current = options;
  let dragging = false;

  function onPointerMove(e: PointerEvent): void {
    if (!dragging) return;
    const id = reorderItemIdAt(e.clientX, e.clientY);
    if (id) current.onOver(id);
  }

  function onPointerUp(e: PointerEvent): void {
    if (!dragging) return;
    dragging = false;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    const id = reorderItemIdAt(e.clientX, e.clientY);
    if (id) current.onDrop(id);
    current.onEnd();
  }

  function onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    e.preventDefault();
    dragging = true;
    current.onStart();
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  node.addEventListener("pointerdown", onPointerDown);

  return {
    update(newOptions) {
      current = newOptions;
    },
    destroy() {
      node.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    },
  };
};
