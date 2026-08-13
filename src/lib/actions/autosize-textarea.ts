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

  return {
    update() {
      resize(node);
    },
    destroy() {
      node.removeEventListener("input", onInput);
    },
  };
};
