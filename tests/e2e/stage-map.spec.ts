import { test, expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

async function zIndexOf(locator: Locator): Promise<number> {
  return locator.evaluate((el) => Number(getComputedStyle(el).zIndex));
}

// A real MouseEvent constructed and dispatched in-page, rather than a real
// Playwright `.click({ button: "right" })` (items can fully overlap — they
// all spawn at the canvas's default center position — which would fail a
// real click's hit-test even though the element is a perfectly valid
// target) and rather than locator.dispatchEvent("contextmenu", { clientX,
// clientY, ... }) (confirmed directly: Playwright's dispatchEvent doesn't
// construct "contextmenu" as a MouseEvent, so clientX/clientY are silently
// dropped — event.clientX arrives as undefined in the page).
async function dispatchContextMenuAt(
  locator: Locator,
  clientX: number,
  clientY: number,
): Promise<void> {
  await locator.evaluate(
    (el, [clientX, clientY]) => {
      el.dispatchEvent(
        new MouseEvent("contextmenu", {
          clientX,
          clientY,
          bubbles: true,
          cancelable: true,
          button: 2,
        }),
      );
    },
    [clientX, clientY],
  );
}

async function rightClick(locator: Locator): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) throw new Error("element has no bounding box");
  await dispatchContextMenuAt(
    locator,
    box.x + box.width / 2,
    box.y + box.height / 2,
  );
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

  test("click selects an item; Ctrl+click adds/removes items from the selection", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();
    await page.getByRole("button", { name: "DI", exact: true }).click();

    const itemA = page.locator('[data-category="mic"]');
    const itemB = page.locator('[data-category="di"]');
    const selected = /stage-map__item--selected/;

    await itemA.dispatchEvent("pointerdown", { button: 0 });
    await page.mouse.up();
    await expect(itemA).toHaveClass(selected);
    await expect(itemB).not.toHaveClass(selected);

    await itemB.dispatchEvent("pointerdown", { button: 0, ctrlKey: true });
    await page.mouse.up();
    await expect(itemA).toHaveClass(selected);
    await expect(itemB).toHaveClass(selected);

    await itemA.dispatchEvent("pointerdown", { button: 0, ctrlKey: true });
    await page.mouse.up();
    await expect(itemA).not.toHaveClass(selected);
    await expect(itemB).toHaveClass(selected);
  });

  test("clicking outside the stage map clears the selection", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();

    const item = page.locator('[data-category="mic"]');
    const selected = /stage-map__item--selected/;

    await item.dispatchEvent("pointerdown", { button: 0 });
    await page.mouse.up();
    await expect(item).toHaveClass(selected);

    // The page's very top-left corner, outside the Stage Map section (and
    // its palette) entirely.
    await page.mouse.click(5, 5);

    await expect(item).not.toHaveClass(selected);
  });

  test("dragging a marquee over several items selects them; clicking empty canvas clears the selection", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();
    await page.getByRole("button", { name: "DI", exact: true }).click();

    const itemA = page.locator('[data-category="mic"]');
    const itemB = page.locator('[data-category="di"]');
    const selected = /stage-map__item--selected/;

    // Spread the two items apart — both spawn overlapping at the default
    // position, so a marquee couldn't otherwise be drawn around only one
    // of them to prove it's a rectangle test and not a click.
    const diBefore = await itemB.boundingBox();
    if (!diBefore) throw new Error("item has no bounding box");
    await page.mouse.move(
      diBefore.x + diBefore.width / 2,
      diBefore.y + diBefore.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      diBefore.x + diBefore.width / 2 - 120,
      diBefore.y + diBefore.height / 2 - 60,
    );
    await page.mouse.up();

    const canvasBox = await page.locator(".stage-map__canvas").boundingBox();
    const boxA = await itemA.boundingBox();
    const boxB = await itemB.boundingBox();
    if (!canvasBox || !boxA || !boxB) throw new Error("missing bounding box");

    // Drag a marquee from an empty top-left corner of the canvas across
    // both items.
    await page.mouse.move(canvasBox.x + 4, canvasBox.y + 4);
    await page.mouse.down();
    await page.mouse.move(
      Math.max(boxA.x + boxA.width, boxB.x + boxB.width) + 10,
      Math.max(boxA.y + boxA.height, boxB.y + boxB.height) + 10,
    );
    await page.mouse.up();

    await expect(itemA).toHaveClass(selected);
    await expect(itemB).toHaveClass(selected);

    // A plain click (no drag) on empty canvas clears the selection.
    await page.mouse.move(canvasBox.x + 4, canvasBox.y + canvasBox.height - 4);
    await page.mouse.down();
    await page.mouse.up();

    await expect(itemA).not.toHaveClass(selected);
    await expect(itemB).not.toHaveClass(selected);
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

  test("the depth handle is fully visible (not clipped) and large enough to tap", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();

    const handle = page.locator(".stage-map__depth-handle");
    const handleBox = await handle.boundingBox();
    const scrollBox = await page.locator(".stage-map__scroll").boundingBox();
    if (!handleBox || !scrollBox) throw new Error("missing bounding box");

    expect(handleBox.height).toBeCloseTo(18, 0);
    // Fully inside the scroll container's clipped area, not cut off by its
    // overflow-y: hidden.
    expect(handleBox.y + handleBox.height).toBeLessThanOrEqual(
      scrollBox.y + scrollBox.height + 1,
    );

    const before = await page.locator(".stage-map__canvas").boundingBox();
    if (!before) throw new Error("canvas has no bounding box");
    await handle.dispatchEvent("pointerdown", { button: 0 });
    await page.mouse.move(
      handleBox.x + handleBox.width / 2,
      handleBox.y + handleBox.height / 2 + 40,
    );
    await page.mouse.up();
    const after = await page.locator(".stage-map__canvas").boundingBox();
    if (!after) throw new Error("canvas has no bounding box after drag");
    expect(after.height).toBeGreaterThan(before.height);
  });

  test("Backspace deletes every selected item", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();
    await page.getByRole("button", { name: "DI", exact: true }).click();

    const itemA = page.locator('[data-category="mic"]');
    const itemB = page.locator('[data-category="di"]');

    await itemA.dispatchEvent("pointerdown", { button: 0 });
    await page.mouse.up();
    await itemB.dispatchEvent("pointerdown", { button: 0, ctrlKey: true });
    await page.mouse.up();

    await page.keyboard.press("Backspace");

    await expect(itemA).toHaveCount(0);
    await expect(itemB).toHaveCount(0);
  });

  test("Backspace while typing in a label edits its text instead of deleting the item", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();

    const item = page.locator('[data-category="mic"]');
    // Selecting the item first focuses the canvas, the same way a real user
    // would before noticing they'd rather edit the label instead.
    await item.dispatchEvent("pointerdown", { button: 0 });
    await page.mouse.up();

    const label = page.locator(".stage-map__label");
    await label.click();
    await expect(label).toHaveValue("Vox");
    await label.evaluate((el: HTMLTextAreaElement) => {
      el.setSelectionRange(el.value.length, el.value.length);
    });
    await label.press("Backspace");

    await expect(item).toHaveCount(1);
    await expect(label).toHaveValue("Vo");
  });

  test("Ctrl+C / Ctrl+V duplicates a selection with an offset and selects the pasted copies", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();

    const original = page.locator('[data-category="mic"]');
    await expect(original).toHaveCount(1);
    const before = await original.boundingBox();
    if (!before) throw new Error("item has no bounding box");

    await original.dispatchEvent("pointerdown", { button: 0 });
    await page.mouse.up();
    await page.keyboard.press("Control+c");
    await page.keyboard.press("Control+v");

    const items = page.locator('[data-category="mic"]');
    await expect(items).toHaveCount(2);

    // Paste replaces the selection with the pasted copies.
    const selected = /stage-map__item--selected/;
    await expect(items.nth(0)).not.toHaveClass(selected);
    await expect(items.nth(1)).toHaveClass(selected);

    const pastedBox = await items.nth(1).boundingBox();
    if (!pastedBox) throw new Error("pasted item has no bounding box");
    expect(pastedBox.x).toBeGreaterThan(before.x);
    expect(pastedBox.y).toBeGreaterThan(before.y);
  });

  test("copying in one Stage Map section pastes into a different Stage Map section", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "Add Section" }).last().click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();

    const canvases = page.locator(".stage-map__canvas");
    await expect(canvases).toHaveCount(2);
    const canvasA = canvases.nth(0);
    const canvasB = canvases.nth(1);

    await page
      .getByRole("button", { name: "MIC", exact: true })
      .first()
      .click();
    const itemInA = canvasA.locator('[data-category="mic"]');
    await expect(itemInA).toHaveCount(1);

    await itemInA.dispatchEvent("pointerdown", { button: 0 });
    await page.mouse.up();
    await page.keyboard.press("Control+c");

    await canvasB.click();
    await page.keyboard.press("Control+v");

    await expect(canvasA.locator('[data-category="mic"]')).toHaveCount(1);
    await expect(canvasB.locator('[data-category="mic"]')).toHaveCount(1);
  });

  test("right-click opens the context menu and Delete removes the selection", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();

    const item = page.locator('[data-category="mic"]');
    await rightClick(item);

    const menu = page.locator(".context-menu");
    await expect(menu).toBeVisible();
    await expect(item).toHaveClass(/stage-map__item--selected/);

    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(item).toHaveCount(0);
    await expect(menu).toBeHidden();
  });

  test("right-clicking an unselected item switches the selection to just that item", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();
    await page.getByRole("button", { name: "DI", exact: true }).click();

    const itemA = page.locator('[data-category="mic"]');
    const itemB = page.locator('[data-category="di"]');
    const selected = /stage-map__item--selected/;

    await itemA.dispatchEvent("pointerdown", { button: 0 });
    await page.mouse.up();
    await expect(itemA).toHaveClass(selected);

    await rightClick(itemB);
    await expect(page.locator(".context-menu")).toBeVisible();
    await expect(itemA).not.toHaveClass(selected);
    await expect(itemB).toHaveClass(selected);

    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(itemA).toHaveCount(1);
    await expect(itemB).toHaveCount(0);
  });

  test("right-clicking a member of a multi-selection leaves the whole group intact", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();
    await page.getByRole("button", { name: "DI", exact: true }).click();

    const itemA = page.locator('[data-category="mic"]');
    const itemB = page.locator('[data-category="di"]');
    const selected = /stage-map__item--selected/;

    await itemA.dispatchEvent("pointerdown", { button: 0 });
    await page.mouse.up();
    await itemB.dispatchEvent("pointerdown", { button: 0, ctrlKey: true });
    await page.mouse.up();
    await expect(itemA).toHaveClass(selected);
    await expect(itemB).toHaveClass(selected);

    await rightClick(itemB);
    await expect(itemA).toHaveClass(selected);
    await expect(itemB).toHaveClass(selected);

    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(itemA).toHaveCount(0);
    await expect(itemB).toHaveCount(0);
  });

  test("Copy then Paste via the context menu duplicates the selection at the paste location, not next to the original", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();

    const original = page.locator('[data-category="mic"]');
    await rightClick(original);
    await page.getByRole("menuitem", { name: "Copy" }).click();
    await expect(page.locator(".context-menu")).toBeHidden();

    // Paste somewhere else entirely on the canvas — the pasted copy should
    // land there, not offset next to the original.
    const canvas = page.locator(".stage-map__canvas");
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error("canvas has no bounding box");
    const targetX = canvasBox.x + canvasBox.width - 40;
    const targetY = canvasBox.y + 30;
    await dispatchContextMenuAt(canvas, targetX, targetY);
    await page.getByRole("menuitem", { name: "Paste" }).click();

    const items = page.locator('[data-category="mic"]');
    await expect(items).toHaveCount(2);
    const pastedBox = await items.nth(1).boundingBox();
    if (!pastedBox) throw new Error("pasted item has no bounding box");
    // A few px of slack for the percent<->pixel round-trip through storage
    // (StageItem.x/y are percentages), not a precise pixel match.
    expect(Math.abs(pastedBox.x + pastedBox.width / 2 - targetX)).toBeLessThan(
      3,
    );
    expect(Math.abs(pastedBox.y + pastedBox.height / 2 - targetY)).toBeLessThan(
      3,
    );
  });

  test("Cut removes the selection and makes it available to Paste", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();

    const item = page.locator('[data-category="mic"]');
    await rightClick(item);
    await page.getByRole("menuitem", { name: "Cut" }).click();
    await expect(item).toHaveCount(0);

    const canvas = page.locator(".stage-map__canvas");
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error("canvas has no bounding box");
    await dispatchContextMenuAt(
      canvas,
      canvasBox.x + canvasBox.width / 2,
      canvasBox.y + canvasBox.height / 2,
    );
    await page.getByRole("menuitem", { name: "Paste" }).click();
    await expect(page.locator('[data-category="mic"]')).toHaveCount(1);
  });

  test("right-clicking empty canvas opens a menu; Paste works there and Cut/Copy/Delete are disabled without a selection", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();

    const canvas = page.locator(".stage-map__canvas");
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error("canvas has no bounding box");
    const cornerX = canvasBox.x + canvasBox.width - 10;
    const cornerY = canvasBox.y + 10;

    // Nothing selected, clipboard empty — every action but opening the menu
    // itself is unavailable.
    await dispatchContextMenuAt(canvas, cornerX, cornerY);
    await expect(page.getByRole("menuitem", { name: "Cut" })).toBeDisabled();
    await expect(page.getByRole("menuitem", { name: "Copy" })).toBeDisabled();
    await expect(page.getByRole("menuitem", { name: "Paste" })).toBeDisabled();
    await expect(page.getByRole("menuitem", { name: "Delete" })).toBeDisabled();
    await page.keyboard.press("Escape");

    // Select and copy the item via keyboard, then deselect before reopening
    // the canvas's own menu — Paste should now work with nothing selected.
    const item = page.locator('[data-category="mic"]');
    await item.dispatchEvent("pointerdown", { button: 0 });
    await page.mouse.up();
    await page.keyboard.press("Control+c");
    await page.mouse.click(5, 5);

    await dispatchContextMenuAt(canvas, cornerX, cornerY);
    await expect(page.getByRole("menuitem", { name: "Cut" })).toBeDisabled();
    await expect(page.getByRole("menuitem", { name: "Paste" })).toBeEnabled();
    await page.getByRole("menuitem", { name: "Paste" }).click();

    await expect(page.locator('[data-category="mic"]')).toHaveCount(2);
  });

  test("Escape and an outside click both close the context menu", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();

    const item = page.locator('[data-category="mic"]');
    const menu = page.locator(".context-menu");

    await rightClick(item);
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();

    await rightClick(item);
    await expect(menu).toBeVisible();
    // Outside both the menu and the canvas entirely.
    await page.mouse.click(5, 5);
    await expect(menu).toBeHidden();
  });

  test("a simulated long-press opens the context menu", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();

    const item = page.locator('[data-category="mic"]');
    const box = await item.boundingBox();
    if (!box) throw new Error("item has no bounding box");
    const clientX = box.x + box.width / 2;
    const clientY = box.y + box.height / 2;

    await item.dispatchEvent("pointerdown", {
      button: 0,
      pointerType: "touch",
      isPrimary: true,
      clientX,
      clientY,
    });
    // Past the action's ~500ms long-press delay.
    await page.waitForTimeout(600);
    await expect(page.locator(".context-menu")).toBeVisible();

    await item.dispatchEvent("pointerup", {
      button: 0,
      pointerType: "touch",
      clientX,
      clientY,
    });
  });

  test("dragging one item of a multi-selection moves the whole group", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();
    await page.getByRole("button", { name: "DI", exact: true }).click();

    const itemA = page.locator('[data-category="mic"]');
    const itemB = page.locator('[data-category="di"]');

    await itemA.dispatchEvent("pointerdown", { button: 0 });
    await page.mouse.up();
    await itemB.dispatchEvent("pointerdown", { button: 0, ctrlKey: true });
    await page.mouse.up();

    const beforeA = await itemA.boundingBox();
    const beforeB = await itemB.boundingBox();
    if (!beforeA || !beforeB) throw new Error("missing bounding box");

    await page.mouse.move(
      beforeA.x + beforeA.width / 2,
      beforeA.y + beforeA.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      beforeA.x + beforeA.width / 2 + 80,
      beforeA.y + beforeA.height / 2 + 40,
    );
    await page.mouse.up();

    const afterA = await itemA.boundingBox();
    const afterB = await itemB.boundingBox();
    if (!afterA || !afterB) throw new Error("missing bounding box after drag");

    expect(afterA.x).toBeGreaterThan(beforeA.x + 40);
    expect(afterA.x - beforeA.x).toBeCloseTo(afterB.x - beforeB.x, 0);
    expect(afterA.y - beforeA.y).toBeCloseTo(afterB.y - beforeB.y, 0);
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
    await expect(page.locator(".stage-map__resize-handle")).toBeHidden();
    await expect(page.locator(".stage-map__depth-handle")).toBeHidden();
    await expect(page.locator(".stage-map__canvas")).toBeVisible();
    await expect(page.locator('[data-category="riser"]')).toBeVisible();

    // Item labels must stay visible in print — the direct regression test
    // for the bug where `.stage-map__label` carried `no-print` and labels
    // vanished from the printed output entirely, leaving only the
    // category abbreviation.
    await expect(page.locator(".stage-map__label")).toBeVisible();
  });

  test("item label text prints with a borderless, plain-text appearance", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();
    await page.locator(".stage-map__label").fill("Lead Vox");

    await page.emulateMedia({ media: "print" });

    await expect(page.locator(".stage-map__label")).toHaveValue("Lead Vox");
    const borderColor = await page
      .locator(".stage-map__label")
      .evaluate((el) => getComputedStyle(el).borderColor);
    expect(borderColor).toMatch(/^rgba\(0, 0, 0, 0\)$|transparent$/);
  });

  test("the power item is an outline like the other shapes, with legible text in print", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "PWR", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();

    await page.emulateMedia({ media: "print" });

    const power = page.locator('[data-category="power"]');
    await expect(power.locator(".stage-map__triangle-outline")).toBeVisible();

    // No background fill left to strip in print — only a stroke, which
    // always prints — and the abbreviation text is the same color as
    // every other shape's, not the pale color once reserved for
    // contrasting against a solid fill.
    const [triangleTextColor, circleTextColor] = await Promise.all([
      power
        .locator(".stage-map__abbr")
        .evaluate((el) => getComputedStyle(el).color),
      page
        .locator('[data-category="mic"] .stage-map__abbr')
        .evaluate((el) => getComputedStyle(el).color),
    ]);
    expect(triangleTextColor).toBe(circleTextColor);
  });

  test("the power item's label isn't clipped by its triangle shape", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "PWR", exact: true }).click();

    const item = page.locator('[data-category="power"]');
    await expect(item.locator(".stage-map__label")).toBeVisible();
    await item.locator(".stage-map__label").fill("Power");
    await expect(item.locator(".stage-map__label")).toHaveValue("Power");
  });

  test("XLR and DI items render as half-height rectangles, not squares", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "DI", exact: true }).click();
    await page.getByRole("button", { name: "XLR", exact: true }).click();

    for (const category of ["di", "xlr"]) {
      const box = await page
        .locator(`[data-category="${category}"]`)
        .boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeCloseTo(box!.width / 2, 0);
    }
  });

  test("Rack renders as a square like Amp; I/O renders as a half-height rectangle like XLR/DI", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "AMP", exact: true }).click();
    await page.getByRole("button", { name: "RACK", exact: true }).click();
    await page.getByRole("button", { name: "I/O", exact: true }).click();

    for (const category of ["amp", "rack"]) {
      const box = await page
        .locator(`[data-category="${category}"]`)
        .boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeCloseTo(box!.width, 0);
    }

    const ioBox = await page.locator('[data-category="io"]').boundingBox();
    expect(ioBox).not.toBeNull();
    expect(ioBox!.height).toBeCloseTo(ioBox!.width / 2, 0);
  });

  test("a Name marker's center text becomes editable on double-click and auto-shrinks to fit", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "NAME", exact: true }).click();

    const item = page.locator('[data-category="name"]');
    const nameInput = page.locator(".stage-map__name-input");
    await expect(nameInput).not.toBeVisible();

    await item.dblclick();
    await expect(nameInput).toBeVisible();
    const baseFontSize = await nameInput.evaluate(
      (el) => getComputedStyle(el).fontSize,
    );

    await nameInput.fill("A Very Long Band Member Name");
    await expect(nameInput).toHaveValue("A Very Long Band Member Name");
    const shrunkFontSize = await nameInput.evaluate(
      (el) => getComputedStyle(el).fontSize,
    );
    expect(parseFloat(shrunkFontSize)).toBeLessThan(parseFloat(baseFontSize));

    // Same editable label-below field every other marker has.
    await expect(item.locator(".stage-map__label")).toBeVisible();
  });

  test("a non-editing Name item is selectable and draggable like any other item", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "NAME", exact: true }).click();

    const item = page.locator('[data-category="name"]');
    const before = await item.boundingBox();
    if (!before) throw new Error("item has no bounding box");

    await item.dispatchEvent("pointerdown", { button: 0 });
    await page.mouse.up();
    await expect(item).toHaveClass(/stage-map__item--selected/);

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

    // The drag never entered edit mode.
    await expect(page.locator(".stage-map__name-input")).not.toBeVisible();
  });

  test("double-click enters Name edit mode; typing updates the name and Escape/blur exits without losing it", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "NAME", exact: true }).click();

    const item = page.locator('[data-category="name"]');
    const staticLabel = page.locator(".stage-map__abbr--name");
    const nameInput = page.locator(".stage-map__name-input");

    await expect(staticLabel).toHaveText("Name");

    await item.dblclick();
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeFocused();
    await nameInput.fill("Lead Vox");
    await expect(nameInput).toHaveValue("Lead Vox");

    await nameInput.press("Escape");
    await expect(nameInput).not.toBeVisible();
    await expect(staticLabel).toHaveText("Lead Vox");

    // Editing again and blurring by clicking elsewhere (not just Escape)
    // also exits edit mode and keeps the value.
    await item.dblclick();
    await expect(nameInput).toBeVisible();
    await nameInput.fill("Backing Vox");
    const canvas = page.locator(".stage-map__canvas");
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error("canvas has no bounding box");
    await page.mouse.click(canvasBox.x + 5, canvasBox.y + 5);
    await expect(nameInput).not.toBeVisible();
    await expect(staticLabel).toHaveText("Backing Vox");
  });

  test("Enter adds a line break in the label; Escape exits editing without losing the text", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();

    const label = page.locator(".stage-map__label");
    await label.fill("Vox");
    await label.press("Enter");
    await label.type("Lead");
    await expect(label).toHaveValue("Vox\nLead");

    await label.press("Escape");
    await expect(label).not.toBeFocused();
    await expect(label).toHaveValue("Vox\nLead");
  });

  test("clicking the label with a real pointer click focuses it for typing", async ({
    page,
  }) => {
    // Regression test: the item's drag handler lived on the whole item box
    // and called preventDefault() on every pointerdown, including ones that
    // bubbled up from the label — that silently blocks the browser from
    // focusing the label, so `.fill()` (which focuses programmatically
    // rather than via a real click) didn't catch it.
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();

    const label = page.locator(".stage-map__label");
    // Triple-click selects the item's pre-filled default label so typing
    // replaces it, matching how a real user would edit it.
    await label.click({ clickCount: 3 });
    await expect(label).toBeFocused();
    await page.keyboard.type("Lead Vox");
    await expect(label).toHaveValue("Lead Vox");
  });
});

test.describe("Stage Map section at a narrow viewport", () => {
  test.use({ viewport: { width: 360, height: 900 } });

  test("click-to-front ordering still works on the scaled-down canvas", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();

    // Below the mobile breakpoint the canvas renders scaled down (floored,
    // per StageMapSection.svelte) — confirm that's actually happening here,
    // not just that the interaction happens to still work unscaled.
    const scale = await page
      .locator(".stage-map__canvas")
      .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
    expect(scale).toBeLessThan(1);

    await page.getByRole("button", { name: "MIC", exact: true }).click();
    await page.getByRole("button", { name: "DI", exact: true }).click();

    const itemA = page.locator('[data-category="mic"]');
    const itemB = page.locator('[data-category="di"]');

    expect(await zIndexOf(itemB)).toBeGreaterThan(await zIndexOf(itemA));

    await itemA.dispatchEvent("pointerdown", { button: 0 });
    await page.mouse.up();

    expect(await zIndexOf(itemA)).toBeGreaterThan(await zIndexOf(itemB));

    // No canvas item should ever be unreachable — this narrow viewport's
    // horizontal scroll wrapper must actually contain everything.
    const overflow = await page.evaluate(
      () => document.body.scrollWidth - document.body.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("print always renders the canvas unscaled, regardless of the mobile viewport it was opened from", async ({
    page,
  }) => {
    // Regression test: the mobile scale is tracked in JS via a matchMedia
    // listener, and Chromium's print emulation updates `matchMedia(...)
    // .matches` without firing that listener's `change` event — confirmed
    // directly against this exact query — so nothing would have reset the
    // scale before printing without the dedicated print.css-style override
    // in StageMapSection.svelte.
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();

    const canvas = page.locator(".stage-map__canvas");
    const screenScale = await canvas.evaluate(
      (el) => new DOMMatrix(getComputedStyle(el).transform).a,
    );
    expect(screenScale).toBeLessThan(1);

    await page.emulateMedia({ media: "print" });
    const printTransform = await canvas.evaluate(
      (el) => getComputedStyle(el).transform,
    );
    expect(printTransform).toBe("none");
  });

  test("an item's z-index never climbs above the sticky top bar, however many times it's brought to front", async ({
    page,
  }) => {
    // Short enough that the page must scroll to bring the canvas's items
    // up under the sticky toolbar — the real-world scenario this bug
    // affects, where scrolled-past content passes underneath the toolbar.
    await page.setViewportSize({ width: 1280, height: 220 });
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();

    // Each add assigns the next order — 45 items pushes the last one's
    // z-index well past the toolbar's z-index: 40, without needing dozens
    // of individual bring-to-front clicks.
    const addMic = page.getByRole("button", { name: "MIC", exact: true });
    for (let i = 0; i < 45; i++) {
      await addMic.click();
    }

    const lastItem = page.locator('[data-category="mic"]').last();
    expect(await zIndexOf(lastItem)).toBeGreaterThan(40);

    // Repeatedly clicking a control below the fold can trigger the
    // browser's own scroll-into-view — reset to a known scroll position
    // before measuring, so the target computed below is accurate.
    await page.evaluate(() => window.scrollTo(0, 0));

    // All 45 items spawn stacked at the canvas's own center (50%, 50%).
    // Scroll the page so that point lands within the sticky toolbar's
    // fixed viewport band.
    const toolbarHeight = (await page.locator(".toolbar").boundingBox())!
      .height;
    const canvasBox = (await page.locator(".stage-map__canvas").boundingBox())!;
    const itemPageY = canvasBox.y + canvasBox.height / 2;
    await page.evaluate(
      (y) => window.scrollTo(0, y),
      itemPageY - toolbarHeight / 2,
    );

    const toolbarBox = (await page.locator(".toolbar").boundingBox())!;
    const topElement = await page.evaluate(
      ([x, y]) =>
        document.elementFromPoint(x, y)?.closest(".toolbar, .stage-map__item")
          ?.className,
      [
        toolbarBox.x + toolbarBox.width / 2,
        toolbarBox.y + toolbarBox.height / 2,
      ],
    );
    expect(topElement).toContain("toolbar");
  });

  test("the canvas wrapper only scrolls horizontally, never vertically", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "RISER", exact: true }).click();

    const overflow = await page
      .locator(".stage-map__scroll")
      .evaluate((el) => getComputedStyle(el).overflowY);
    expect(overflow).toBe("hidden");
  });

  // Playwright has no first-class multi-touch simulation API, so these
  // dispatch synthetic two-pointer PointerEvent sequences (as the existing
  // long-press test above already does for a single touch pointer) rather
  // than driving real touch hardware — this validates the component's own
  // multiTouchGesture/pan code path, not a real device. A manual pass on an
  // actual touch device is part of this story's sign-off.
  test("a two-finger drag pans the canvas", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();

    const canvas = page.locator(".stage-map__canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("canvas has no bounding box");
    const x1 = box.x + box.width * 0.3;
    const y1 = box.y + box.height * 0.5;
    const x2 = box.x + box.width * 0.7;
    const y2 = box.y + box.height * 0.5;

    const panBefore = await canvas.evaluate(
      (el) => new DOMMatrix(getComputedStyle(el).transform).e,
    );

    await canvas.dispatchEvent("pointerdown", {
      pointerId: 1,
      pointerType: "touch",
      button: 0,
      clientX: x1,
      clientY: y1,
    });
    await canvas.dispatchEvent("pointerdown", {
      pointerId: 2,
      pointerType: "touch",
      button: 0,
      clientX: x2,
      clientY: y2,
    });

    // Two ticks, moving each pointer in turn — moving both fingers together
    // in a single frame isn't expressible as two separate dispatchEvent
    // calls, so the gesture's own frame-to-frame midpoint tracking picks up
    // the combined movement across ticks instead of a single one.
    for (const dx of [20, 40]) {
      await canvas.dispatchEvent("pointermove", {
        pointerId: 1,
        pointerType: "touch",
        clientX: x1 + dx,
        clientY: y1,
      });
      await canvas.dispatchEvent("pointermove", {
        pointerId: 2,
        pointerType: "touch",
        clientX: x2 + dx,
        clientY: y2,
      });
    }

    await canvas.dispatchEvent("pointerup", {
      pointerId: 1,
      pointerType: "touch",
    });
    await canvas.dispatchEvent("pointerup", {
      pointerId: 2,
      pointerType: "touch",
    });

    const panAfter = await canvas.evaluate(
      (el) => new DOMMatrix(getComputedStyle(el).transform).e,
    );
    expect(panAfter).toBeGreaterThan(panBefore + 5);
  });

  test("a single-finger touch drag moves the item but never pans the canvas", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();

    const canvas = page.locator(".stage-map__canvas");
    const item = page.locator('[data-category="mic"]');
    const before = await item.boundingBox();
    if (!before) throw new Error("item has no bounding box");
    const startX = before.x + before.width / 2;
    const startY = before.y + before.height / 2;

    await item.dispatchEvent("pointerdown", {
      pointerId: 1,
      pointerType: "touch",
      button: 0,
      clientX: startX,
      clientY: startY,
    });
    await item.dispatchEvent("pointermove", {
      pointerId: 1,
      pointerType: "touch",
      clientX: startX + 80,
      clientY: startY + 40,
    });
    await item.dispatchEvent("pointerup", {
      pointerId: 1,
      pointerType: "touch",
    });

    const after = await item.boundingBox();
    if (!after) throw new Error("item has no bounding box after drag");
    expect(after.x).toBeGreaterThan(before.x + 40);

    const pan = await canvas.evaluate((el) => {
      const matrix = new DOMMatrix(getComputedStyle(el).transform);
      return { e: matrix.e, f: matrix.f };
    });
    expect(pan.e).toBeCloseTo(0, 0);
    expect(pan.f).toBeCloseTo(0, 0);
  });

  // Regression for a bug where multiTouchGesture never removed a lone
  // finger's pointerId once tracked, because its pointerup/pointercancel
  // listeners were only wired up once a *second* concurrent pointer showed
  // up. That stale id then made the next unrelated single-finger touch
  // spuriously register as two concurrent pointers, misfiring the pan
  // gesture (and cancelling the new drag) even though only one finger was
  // ever on screen at a time.
  test("a second single-finger touch drag after the first still never pans the canvas", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();

    const canvas = page.locator(".stage-map__canvas");
    const items = page.locator('[data-category="mic"]');

    for (const [pointerId, item] of [
      [1, items.nth(0)],
      [2, items.nth(1)],
    ] as const) {
      const before = await item.boundingBox();
      if (!before) throw new Error("item has no bounding box");
      const startX = before.x + before.width / 2;
      const startY = before.y + before.height / 2;

      await item.dispatchEvent("pointerdown", {
        pointerId,
        pointerType: "touch",
        button: 0,
        clientX: startX,
        clientY: startY,
      });
      // Two move ticks (not one) — a stale second pointer from a leaked
      // prior gesture only produces a pan delta once there are two
      // midpoints to diff between, same as the real two-finger test above.
      for (const dx of [30, 60]) {
        await item.dispatchEvent("pointermove", {
          pointerId,
          pointerType: "touch",
          clientX: startX + dx,
          clientY: startY,
        });
      }
      await item.dispatchEvent("pointerup", {
        pointerId,
        pointerType: "touch",
      });
    }

    const pan = await canvas.evaluate((el) => {
      const matrix = new DOMMatrix(getComputedStyle(el).transform);
      return { e: matrix.e, f: matrix.f };
    });
    expect(pan.e).toBeCloseTo(0, 0);
    expect(pan.f).toBeCloseTo(0, 0);
  });

  // Regression: .stage-map__scroll used to keep native touch-scroll enabled
  // (touch-action: auto) until a two-finger gesture had been used once for
  // that instance, so the very first single-finger swipe raced the browser's
  // own scroll (both horizontal and, since touch-action never restricted the
  // other axis either, the page's own vertical scroll) against marquee-select
  // and item-drag. touch-action: none now applies unconditionally, from the
  // very first render, so JS owns every touch interaction on the canvas from
  // the start.
  test("native touch scroll is disabled on the canvas wrapper from the start, before any two-finger gesture has happened", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();

    const touchAction = await page
      .locator(".stage-map__scroll")
      .evaluate((el) => getComputedStyle(el).touchAction);
    expect(touchAction).toBe("none");
  });

  // Regression: the second finger of a two-finger gesture used to fall
  // straight through to whatever it landed on, exactly like an ordinary
  // single-finger touch — starting that item's own drag/select and arming
  // its own long-press timer, right alongside the pan gesture the pair of
  // fingers was actually starting. Landing the second finger on a *second*
  // item makes this unambiguous: on the old code itemB's own long-press
  // fires (opening its context menu) and itemB steals the selection from
  // itemA, even though only a two-finger pan was intended.
  test("the second finger of a two-finger gesture never starts its own drag/select/long-press on whatever it lands on", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "MIC", exact: true }).click();
    await page.getByRole("button", { name: "DI", exact: true }).click();

    const itemA = page.locator('[data-category="mic"]');
    const itemB = page.locator('[data-category="di"]');
    const boxA = await itemA.boundingBox();
    if (!boxA) throw new Error("itemA has no bounding box");
    const x1 = boxA.x + boxA.width / 2;
    const y1 = boxA.y + boxA.height / 2;

    // itemB spawns overlapping itemA (both default to the canvas center) —
    // move it clear first via a plain mouse drag so the two fingers below
    // land on genuinely separate elements.
    await itemB.dispatchEvent("pointerdown", { button: 0 });
    await page.mouse.move(x1 + 150, y1 + 40, { steps: 5 });
    await page.mouse.up();

    const boxB = await itemB.boundingBox();
    if (!boxB) throw new Error("itemB has no bounding box");
    const x2 = boxB.x + boxB.width / 2;
    const y2 = boxB.y + boxB.height / 2;

    // First finger down on itemA — an ordinary single-finger item-drag/
    // select starts normally, arming itemA's own long-press timer too.
    await itemA.dispatchEvent("pointerdown", {
      pointerId: 1,
      pointerType: "touch",
      button: 0,
      clientX: x1,
      clientY: y1,
    });
    // Second finger down on itemB, completing the pair.
    await itemB.dispatchEvent("pointerdown", {
      pointerId: 2,
      pointerType: "touch",
      button: 0,
      clientX: x2,
      clientY: y2,
    });

    // Past the long-press action's ~500ms delay — itemB's own long-press
    // must never have started in the first place.
    await page.waitForTimeout(600);
    await expect(page.locator(".context-menu")).not.toBeVisible();
    await expect(itemA).toHaveClass(/stage-map__item--selected/);
    await expect(itemB).not.toHaveClass(/stage-map__item--selected/);

    await itemA.dispatchEvent("pointerup", {
      pointerId: 1,
      pointerType: "touch",
    });
    await itemB.dispatchEvent("pointerup", {
      pointerId: 2,
      pointerType: "touch",
    });
  });

  test("the two-finger-pan hint is hidden without a coarse (touch) pointer, even below the mobile breakpoint", async ({
    page,
  }) => {
    // No matchMedia stub here — real Chromium reports "(pointer: coarse)"
    // as non-matching regardless of viewport width, the same as a real
    // mouse-driven narrow desktop window or a mouse/trackpad-driven iPad
    // session. The width breakpoint alone (360px viewport, set above) must
    // not be enough to show the hint.
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();

    await expect(page.locator(".stage-map__gesture-hint")).not.toBeVisible();
  });

  test("the two-finger-pan hint shows when both the mobile breakpoint and a coarse pointer match", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const originalMatchMedia = window.matchMedia.bind(window);
      window.matchMedia = (query: string) => {
        if (query !== "(pointer: coarse)") return originalMatchMedia(query);
        return {
          matches: true,
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        } as unknown as MediaQueryList;
      };
    });
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();

    await expect(page.locator(".stage-map__gesture-hint")).toBeVisible();
  });
});
