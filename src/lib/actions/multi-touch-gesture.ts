import type { Action } from "svelte/action";
import { cancelAllPointerDrags } from "./pointer-drag";

interface Point {
  x: number;
  y: number;
}

export interface MultiTouchGestureOptions {
  onGestureStart?: () => void;
  onPanDelta?: (dx: number, dy: number) => void;
  onGestureEnd?: () => void;
}

/*
 * Tracks concurrent touch pointers by id and reports the two-pointer
 * midpoint's frame-to-frame delta — the mechanical half of two-finger pan,
 * with no clamping or transform math of its own (the caller owns that, same
 * division of responsibility as pointerDrag). A third finger landing is
 * ignored rather than tracked: only the first two touch pointers (Map
 * insertion order) ever drive the gesture.
 *
 * Deliberately listens in the capture phase — item drags stopPropagation()
 * their own bubble-phase pointerdown, so a bubble-phase listener here would
 * never see a first finger that happened to land on an item.
 */
export const multiTouchGesture: Action<
  HTMLElement,
  MultiTouchGestureOptions
> = (node, options) => {
  let current = options;
  const pointers = new Map<number, Point>();
  let prevMid: Point | undefined;

  // Averaging over whatever's tracked, rather than indexing into a fixed
  // pair, sidesteps needing a possibly-undefined array element — onPointerDown
  // already caps tracking at two pointers, so this is always their midpoint.
  function activeMidpoint(): Point {
    let sumX = 0;
    let sumY = 0;
    for (const p of pointers.values()) {
      sumX += p.x;
      sumY += p.y;
    }
    return { x: sumX / pointers.size, y: sumY / pointers.size };
  }

  function onPointerMove(e: PointerEvent): void {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size !== 2) return;

    const mid = activeMidpoint();
    if (prevMid) current.onPanDelta?.(mid.x - prevMid.x, mid.y - prevMid.y);
    prevMid = mid;
  }

  function endTracking(pointerId: number): void {
    if (!pointers.has(pointerId)) return;
    pointers.delete(pointerId);
    if (pointers.size < 2) prevMid = undefined;
    if (pointers.size === 1) current.onGestureEnd?.();
    if (pointers.size === 0) {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    }
  }

  function onPointerUp(e: PointerEvent): void {
    endTracking(e.pointerId);
  }

  function onPointerDown(e: PointerEvent): void {
    if (e.pointerType !== "touch") return;
    if (pointers.size >= 2 && !pointers.has(e.pointerId)) return;
    // Listeners are wired up from the very first tracked pointer (not just
    // once a second one arrives) so a lone finger's id is always cleaned up
    // on its own pointerup/pointercancel. Gating this behind pointers.size
    // === 2 left single-finger touches (an ordinary item drag) permanently
    // stuck in `pointers` — the next touch would then spuriously read as a
    // second concurrent pointer and misfire the pan gesture.
    if (pointers.size === 0) {
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      cancelAllPointerDrags();
      prevMid = undefined;
      current.onGestureStart?.();
    }
  }

  node.addEventListener("pointerdown", onPointerDown, { capture: true });

  return {
    update(newOptions) {
      current = newOptions;
    },
    destroy() {
      node.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    },
  };
};
