import { test, expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

async function zIndexOf(locator: Locator): Promise<number> {
  return locator.evaluate((el) => Number(getComputedStyle(el).zIndex));
}

test.describe("Stage Map section", () => {
  test("clicking an earlier-created item brings it above a later-created one", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();

    // Item A (mic) is created first, item B (di) second — both spawn at the
    // same default position, so B visually overlaps A and, per the
    // prototype's confirmed defect, would be permanently stuck above A.
    await page.getByRole("button", { name: "MIC", exact: true }).click();
    await page.getByRole("button", { name: "DI", exact: true }).click();

    const itemA = page.locator('[data-category="mic"]');
    const itemB = page.locator('[data-category="di"]');

    // Baseline: B, created after A, renders above it.
    expect(await zIndexOf(itemB)).toBeGreaterThan(await zIndexOf(itemA));

    // Dispatch the pointerdown directly on A's node — A and B fully overlap
    // at this point, so a coordinate-based click could hit either element;
    // dispatching targets A's own listener regardless of what's painted on
    // top, which is what "click A" means at the DOM level.
    await itemA.dispatchEvent("pointerdown", { button: 0 });
    await page.mouse.up();

    expect(await zIndexOf(itemA)).toBeGreaterThan(await zIndexOf(itemB));
  });

  test("dragging an item repositions it on the canvas", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();

    const item = page.locator('[data-category="mic"]');
    const before = await item.boundingBox();
    if (!before) throw new Error("item has no bounding box");

    await page.mouse.move(
      before.x + before.width / 2,
      before.y + before.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      before.x + before.width / 2 + 80,
      before.y + before.height / 2 + 40,
    );
    await page.mouse.up();

    const after = await item.boundingBox();
    if (!after) throw new Error("item has no bounding box after drag");
    expect(after.x).toBeGreaterThan(before.x + 40);
    expect(after.y).toBeGreaterThan(before.y + 20);
  });

  test("editing controls are hidden in print, content stays visible", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "RISER", exact: true }).click();

    await page.emulateMedia({ media: "print" });

    await expect(page.locator(".stage-map__palette")).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Remove item" }),
    ).toBeHidden();
    await expect(page.locator(".stage-map__resize-handle")).toBeHidden();
    await expect(page.locator(".stage-map__depth-handle")).toBeHidden();
    await expect(page.locator(".stage-map__label")).toBeHidden();
    await expect(page.locator(".stage-map__canvas")).toBeVisible();
    await expect(page.locator('[data-category="riser"]')).toBeVisible();
  });
});
