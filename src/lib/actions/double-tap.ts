import type { Action } from "svelte/action";

const DEFAULT_TIMEOUT_MS = 350;
const DEFAULT_MOVE_THRESHOLD_PX = 10;

export interface DoubleTapOptions {
  onDoubleTap: (event: PointerEvent) => void;
  timeoutMs?: number;
  moveThresholdPx?: number;
}

/*
 * Deliberately built on raw pointer events rather than the native `dblclick`
 * event. `pointerDrag` (mounted on the same node) calls preventDefault() on
 * every pointerdown it handles, which — per the Pointer Events spec — makes
 * the browser suppress the touch-synthesized compatibility mouse events
 * (mousedown/mouseup/click) for that gesture. Since `dblclick` is itself
 * built from two `click` events, a double-tap on this element would never
 * reach a native `ondblclick` listener; tracking taps directly here sidesteps
 * that suppression entirely and behaves identically for mouse and touch.
 */
export const doubleTap: Action<HTMLElement, DoubleTapOptions> = (
  node,
  options,
) => {
  let current = options;
  let downX = 0;
  let downY = 0;
  let lastTapAt: number | undefined;
  let lastTapX = 0;
  let lastTapY = 0;

  function onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    downX = e.clientX;
    downY = e.clientY;
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
  }

  function onPointerCancel(): void {
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerCancel);
  }

  function onPointerUp(e: PointerEvent): void {
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerCancel);

    const threshold = current.moveThresholdPx ?? DEFAULT_MOVE_THRESHOLD_PX;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > threshold) {
      lastTapAt = undefined;
      return;
    }

    const now = e.timeStamp;
    const timeout = current.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (
      lastTapAt !== undefined &&
      now - lastTapAt <= timeout &&
      Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) <= threshold
    ) {
      lastTapAt = undefined;
      current.onDoubleTap(e);
      return;
    }

    lastTapAt = now;
    lastTapX = e.clientX;
    lastTapY = e.clientY;
  }

  node.addEventListener("pointerdown", onPointerDown);

  return {
    update(newOptions) {
      current = newOptions;
    },
    destroy() {
      node.removeEventListener("pointerdown", onPointerDown);
      onPointerCancel();
    },
  };
};
