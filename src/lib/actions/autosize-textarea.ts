import type { Action } from "svelte/action";

/**
 * Grows a textarea's height to fit its content instead of scrolling
 * internally — a scrollable textarea would clip its overflow in print
 * output, so wrapping stretch columns (Channel List Notes, Monitor List Mix
 * Notes) need their full text visible via height, not a scrollbar.
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

// Every currently-mounted autosized textarea, so a real print (see below)
// can force every one of them to re-measure in one synchronous pass,
// regardless of which one(s) actually changed width.
const mountedNodes = new Set<HTMLTextAreaElement>();

/**
 * Real printing (window.print(), including the OS/browser print dialog and
 * "Save as PDF") doesn't reliably give a pending ResizeObserver callback a
 * turn to run before it captures the page — confirmed directly: a document
 * printed to PDF still showed stale, clipped heights even though the same
 * scenario re-measured correctly under Playwright's `emulateMedia("print")`
 * (which only toggles CSS on the live page, unlike a real print pass).
 * Calling this right before `window.print()` (see SaveLoadControls.svelte)
 * forces every textarea to re-measure synchronously, in the same call
 * stack, so nothing depends on an async callback's timing relative to the
 * print snapshot.
 */
export function resizeAllAutosizedTextareas(): void {
  for (const node of mountedNodes) resize(node);
}

export const autosizeTextarea: Action<HTMLTextAreaElement, unknown> = (
  node,
) => {
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
