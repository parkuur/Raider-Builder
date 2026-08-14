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

export const autosizeTextarea: Action<HTMLTextAreaElement, unknown> = (
  node,
) => {
  resize(node);
  const onInput = () => resize(node);
  node.addEventListener("input", onInput);

  // A height computed at one width goes stale the moment the textarea's
  // own width changes — the same text now wraps onto a different number of
  // lines (a narrower layout breakpoint, a column that reflows, or print's
  // own page width, which is usually narrower than the screen the height
  // was last computed at) — without re-measuring, the stale height clips
  // the now-taller wrapped content. Tracked by width specifically (not
  // height) so this doesn't loop against its own `resize()` writes above.
  let lastWidth = node.getBoundingClientRect().width;
  const resizeObserver = new ResizeObserver((entries) => {
    const width = entries[0]!.contentRect.width;
    if (width === lastWidth) return;
    lastWidth = width;
    resize(node);
  });
  resizeObserver.observe(node);

  return {
    update() {
      resize(node);
    },
    destroy() {
      node.removeEventListener("input", onInput);
      resizeObserver.disconnect();
    },
  };
};
