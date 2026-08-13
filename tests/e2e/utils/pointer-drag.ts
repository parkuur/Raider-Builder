import type { Locator, Page } from "@playwright/test";

/**
 * Simulates a pointer-based drag from `source` to `target` via real mouse
 * events, for reorder handles built on Pointer Events
 * (src/lib/actions/pointer-reorder.ts) rather than native HTML5
 * drag-and-drop — Playwright's `dragTo()` only simulates the latter.
 */
export async function pointerDragTo(
  page: Page,
  source: Locator,
  target: Locator,
): Promise<void> {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) {
    throw new Error("pointerDragTo: source or target has no bounding box");
  }

  const startX = sourceBox.x + sourceBox.width / 2;
  const startY = sourceBox.y + sourceBox.height / 2;
  const endX = targetBox.x + targetBox.width / 2;
  const endY = targetBox.y + targetBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move((startX + endX) / 2, (startY + endY) / 2);
  await page.mouse.move(endX, endY);
  await page.mouse.up();
}
