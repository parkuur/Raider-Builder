import type { Action } from "svelte/action";

const DEFAULT_DELAY_MS = 500;

/*
 * The cancel threshold is deliberately larger than a typical click/drag
 * threshold: it only needs to rule out a *deliberate* drag, not absorb every
 * bit of hand tremor during a half-second hold. A tight threshold cancels
 * the long-press before it ever fires; ~14px matches the tolerance mobile
 * platforms themselves use for long-press.
 */
const DEFAULT_MOVE_THRESHOLD_PX = 14;

export interface LongPressOptions {
  onLongPress: (event: PointerEvent) => void;
  delayMs?: number;
  moveThresholdPx?: number;
}

// Mirrors pointer-drag.ts's activeDrags/cancelAllPointerDrags — every
// mounted longPress instance registers a cancel callback here for the
// lifetime of its mount, so a two-finger gesture landing anywhere on the
// page can cleanly kill whichever single instance (if any) is still timing
// a hold, without either side needing a reference to the other.
const activeLongPresses = new Set<() => void>();

export function cancelAllLongPresses(): void {
  for (const cancel of activeLongPresses) cancel();
}

/*
 * Deliberately independent of the native `contextmenu` event, which fires
 * unreliably from a touch long-press on iOS Safari. Also independent of
 * `pointerDrag`'s own move handling — the two listen to the same raw
 * pointerdown stream but never coordinate, so a little concurrent jitter
 * during the hold (a sub-threshold `moveByPixelDelta` nudge) is an accepted,
 * pre-existing quirk rather than something this action needs to prevent.
 */
export const longPress: Action<HTMLElement, LongPressOptions> = (
  node,
  options,
) => {
  let current = options;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let startX = 0;
  let startY = 0;

  function clearTimer(): void {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  }

  function onPointerMove(e: PointerEvent): void {
    const threshold = current.moveThresholdPx ?? DEFAULT_MOVE_THRESHOLD_PX;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.hypot(dx, dy) > threshold) endGesture();
  }

  function endGesture(): void {
    clearTimer();
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endGesture);
    window.removeEventListener("pointercancel", endGesture);
  }

  function onPointerDown(e: PointerEvent): void {
    if (e.pointerType === "mouse") return;
    if (e.button !== 0) return;
    startX = e.clientX;
    startY = e.clientY;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endGesture);
    window.addEventListener("pointercancel", endGesture);
    timer = setTimeout(() => {
      endGesture();
      current.onLongPress(e);
    }, current.delayMs ?? DEFAULT_DELAY_MS);
  }

  function cancelThisGesture(): void {
    if (timer !== undefined) endGesture();
  }

  node.addEventListener("pointerdown", onPointerDown);
  activeLongPresses.add(cancelThisGesture);

  return {
    update(newOptions) {
      current = newOptions;
    },
    destroy() {
      node.removeEventListener("pointerdown", onPointerDown);
      endGesture();
      activeLongPresses.delete(cancelThisGesture);
    },
  };
};
