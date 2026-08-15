import type { Action } from "svelte/action";

const FORM_CONTROL_TAGS = new Set(["TEXTAREA", "INPUT", "SELECT", "BUTTON"]);

/**
 * Pointerdown on a nested form control (the stage-map item label, its
 * remove button, a resize handle's own controls, ...) must keep its native
 * focus/click behavior — starting a drag here would call preventDefault()
 * on the pointerdown, which silently blocks the browser from focusing the
 * control.
 */
function isFormControl(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && FORM_CONTROL_TAGS.has(target.tagName);
}

export interface PointerDragOptions {
  onStart?: (event: PointerEvent) => void;
  onMove: (dx: number, dy: number, event: PointerEvent) => void;
  onEnd?: (event: PointerEvent) => void;
  stopPropagation?: boolean;
}

// Every mounted pointerDrag instance registers a cancel callback here for
// the lifetime of its mount (not just while dragging), so a two-finger
// gesture starting anywhere on the page can cleanly stop whichever single
// pointerDrag instance (if any) is currently mid-drag, without either side
// needing a reference to the other.
const activeDrags = new Set<() => void>();

export function cancelAllPointerDrags(): void {
  for (const cancel of activeDrags) cancel();
}

/**
 * Purely mechanical pointer-capture + delta tracking, with zero business
 * logic (no clamping, no percent conversion, no data mutation) — the
 * caller supplies semantics per use site. This is the freeform-positioning
 * counterpart to the native HTML5 drag-and-drop used for row reordering
 * elsewhere in the app, which only supports discrete before/after drops.
 */
export const pointerDrag: Action<HTMLElement, PointerDragOptions> = (
  node,
  options,
) => {
  let current = options;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let lastEvent: PointerEvent | undefined;

  function endDrag(e?: PointerEvent) {
    dragging = false;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    current.onEnd?.(e ?? lastEvent!);
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    lastEvent = e;
    current.onMove(dx, dy, e);
  }

  function onPointerUp(e: PointerEvent) {
    endDrag(e);
  }

  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return;
    if (isFormControl(e.target)) return;
    e.preventDefault();
    if (current.stopPropagation) e.stopPropagation();
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    lastEvent = e;
    current.onStart?.(e);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function cancelThisDrag(): void {
    if (dragging) endDrag();
  }

  node.addEventListener("pointerdown", onPointerDown);
  activeDrags.add(cancelThisDrag);

  return {
    update(newOptions) {
      current = newOptions;
    },
    destroy() {
      if (dragging) endDrag();
      node.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      activeDrags.delete(cancelThisDrag);
    },
  };
};
