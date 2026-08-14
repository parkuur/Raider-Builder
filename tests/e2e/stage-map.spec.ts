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
    await expect(
      page.getByRole("button", { name: "Remove item" }),
    ).toBeHidden();
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

  test("the power item's label and remove button aren't clipped by its triangle shape", async ({
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
    await expect(
      item.getByRole("button", { name: "Remove item" }),
    ).toBeVisible();
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

  test("a Name marker's center text is directly editable and auto-shrinks to fit", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Stage Map", exact: true }).click();
    await page.getByRole("button", { name: "NAME", exact: true }).click();

    const nameInput = page.locator(".stage-map__name-input");
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
    const item = page.locator('[data-category="name"]');
    await expect(item.locator(".stage-map__label")).toBeVisible();
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
});
