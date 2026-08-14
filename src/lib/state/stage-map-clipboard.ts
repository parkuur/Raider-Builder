import type { StageItem } from "../model/stage-map";

// Shared page state, not persisted — the same clipboard works for pasting
// into a different Stage Map section than the one items were copied from,
// as long as both are rendered in the same page load.
let clipboard: StageItem[] = [];

export function copyStageItems(items: readonly StageItem[]): void {
  clipboard = items.map((item) => ({ ...item }));
}

export function getStageMapClipboard(): StageItem[] {
  return clipboard;
}
