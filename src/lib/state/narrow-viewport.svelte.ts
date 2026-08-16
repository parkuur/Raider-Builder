import { flushSync } from "svelte";

/**
 * Tracks the shared `(max-width: 640px)` mobile breakpoint used across
 * several section types (Channel List, Band Members, ...) to switch layout
 * shape — e.g. Channel List's Notes column, Band Members' cards-per-row.
 *
 * `MediaQueryList`'s `change` event is confirmed (tested directly against
 * real Chromium) not to reliably fire when entering an actual print — the
 * media type flips but nothing notifies listeners — so a value set on a
 * phone would otherwise survive unchanged into print and produce a
 * mobile-shaped printed document regardless of the device printing it. Some
 * of these DOM-structure changes (e.g. Channel List's Notes column being
 * omitted outright) can't be undone by print CSS after the fact, since the
 * content was never rendered — the reset has to happen before the browser's
 * print layout pass runs. `beforeprint` fires synchronously inside
 * `window.print()`, before that pass, so forcing the value to `false` there
 * and flushing synchronously (rather than waiting for Svelte's normal
 * microtask-batched update) guarantees the desktop shape is actually in the
 * DOM in time. `afterprint` restores the live value so the on-screen mobile
 * layout returns once the print dialog closes.
 */
export class NarrowViewportState {
  #matches = $state(false);

  constructor(breakpoint = 640) {
    $effect(() => {
      const query = window.matchMedia(
        `screen and (max-width: ${breakpoint}px)`,
      );
      this.#matches = query.matches;
      const onChange = (e: MediaQueryListEvent) => (this.#matches = e.matches);
      query.addEventListener("change", onChange);

      const onBeforePrint = () => {
        this.#matches = false;
        flushSync();
      };
      const onAfterPrint = () => {
        this.#matches = query.matches;
      };
      window.addEventListener("beforeprint", onBeforePrint);
      window.addEventListener("afterprint", onAfterPrint);

      return () => {
        query.removeEventListener("change", onChange);
        window.removeEventListener("beforeprint", onBeforePrint);
        window.removeEventListener("afterprint", onAfterPrint);
      };
    });
  }

  get matches(): boolean {
    return this.#matches;
  }
}
