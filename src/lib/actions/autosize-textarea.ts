import type { Action } from "svelte/action";

/**
 * An explicit inline `height` (which the JS fallback below sets) fully
 * overrides `field-sizing: content` — confirmed directly: forcing a stale
 * inline height on a field-sizing: content textarea keeps it at that
 * height, ignoring scrollHeight entirely, even though the property is
 * active. So the JS fallback must never write to `style.height` on a
 * browser that honors field-sizing, or it permanently defeats the one
 * sizing path that's actually reliable for real print (see below) —
 * confirmed real: a printed PDF still showed clipped content with the JS
 * path active, even though it passed under Playwright's print-media
 * emulation, which (unlike real printing) never gives the JS path a
 * reason to fail in the first place.
 */
const supportsFieldSizing =
  typeof CSS !== "undefined" && CSS.supports("field-sizing", "content");

/**
 * Grows a textarea's height to fit its content instead of scrolling
 * internally — a scrollable textarea would clip its overflow in print
 * output, so wrapping stretch columns (Channel List Notes, Monitor List Mix
 * Notes) need their full text visible via height, not a scrollbar.
 *
 * This is the fallback path for browsers without `field-sizing: content`
 * support (declared alongside this action's usage in each section's CSS).
 * Where that's supported, this action is a no-op — CSS alone sizes the
 * textarea, with no JS involved and therefore no dependency on any event's
 * timing relative to when a real print pass captures the page, which is
 * the one thing this JS-only approach can't guarantee.
 */
function resize(node: HTMLTextAreaElement): void {
  // scrollHeight measures the content+padding box, but box-sizing:
  // border-box (used throughout this app's form controls) makes `height`
  // include the border too — without adding it back, the assigned height
  // is short by the border width and the content still clips by a couple
  // of pixels.
  const style = getComputedStyle(node);
  const borderHeight =
    parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
  node.style.height = "auto";
  node.style.height = `${node.scrollHeight + borderHeight}px`;
}

// Every currently-mounted fallback-path textarea, so a real print can force
// every one of them to re-measure in one synchronous pass, regardless of
// which one(s) actually changed width. Only populated on the fallback path
// — field-sizing-supporting browsers never need this.
const mountedNodes = new Set<HTMLTextAreaElement>();

/** See resizeAllAutosizedTextareas' call site in SaveLoadControls.svelte. */
export function resizeAllAutosizedTextareas(): void {
  for (const node of mountedNodes) resize(node);
}

export const autosizeTextarea: Action<HTMLTextAreaElement, unknown> = (
  node,
) => {
  if (supportsFieldSizing) {
    // Deliberately does nothing — see the module doc comment above.
    return {};
  }

  resize(node);
  mountedNodes.add(node);
  const onInput = () => resize(node);
  node.addEventListener("input", onInput);

  // A height computed at one width goes stale the moment the textarea's
  // own width changes — the same text now wraps onto a different number of
  // lines (a narrower layout breakpoint, a column that reflows). Tracked
  // by width specifically (not height) so this doesn't loop against its
  // own `resize()` writes above.
  let lastWidth = node.getBoundingClientRect().width;
  const resizeObserver = new ResizeObserver((entries) => {
    const width = entries[0]!.contentRect.width;
    if (width === lastWidth) return;
    lastWidth = width;
    resize(node);
  });
  resizeObserver.observe(node);

  // Belt-and-suspenders alongside the proactive call in
  // SaveLoadControls.svelte — this also catches print triggered outside
  // the app's own button (e.g. the browser's native Ctrl/Cmd+P shortcut).
  const onBeforePrint = () => resize(node);
  window.addEventListener("beforeprint", onBeforePrint);

  return {
    update() {
      resize(node);
    },
    destroy() {
      mountedNodes.delete(node);
      node.removeEventListener("input", onInput);
      resizeObserver.disconnect();
      window.removeEventListener("beforeprint", onBeforePrint);
    },
  };
};
