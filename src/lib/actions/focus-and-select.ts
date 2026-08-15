import type { Action } from "svelte/action";

export const focusAndSelect: Action<HTMLInputElement> = (node) => {
  node.focus({ preventScroll: true });
  node.select();
};
