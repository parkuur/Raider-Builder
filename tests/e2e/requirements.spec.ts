import { test, expect } from "@playwright/test";
import { pointerDragTo } from "./utils/pointer-drag";

test.describe("Requirements section", () => {
  test("add, edit, reorder, and remove requirement groups", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Requirements", exact: true })
      .click();

    const addItem = page.getByRole("button", { name: "+ Add Item" });
    await addItem.click();
    await addItem.click();

    const headings = page.locator(".requirements-section__heading");
    const texts = page.locator(".requirements-section__text");
    await expect(headings).toHaveCount(2);

    await headings.nth(0).fill("Power");
    await texts.nth(0).fill("Two dedicated 20A circuits.");
    await headings.nth(1).fill("Parking");
    await texts.nth(1).fill("One van space near load-in.");

    // Drag the second group above the first.
    const groups = page.locator(".requirements-section__group");
    await pointerDragTo(
      page,
      groups.nth(1).locator(".drag-handle"),
      groups.nth(0),
    );
    await expect(headings.nth(0)).toHaveValue("Parking");
    await expect(headings.nth(1)).toHaveValue("Power");

    // Remove the (now first) group.
    await page
      .locator(".requirements-section__group")
      .nth(0)
      .getByRole("button", { name: "Remove" })
      .click();
    await expect(headings).toHaveCount(1);
    await expect(headings.nth(0)).toHaveValue("Power");
  });

  test("editing controls are hidden in print, content stays visible", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Requirements", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Item" }).click();
    await page.locator(".requirements-section__heading").fill("Power");
    await page.locator(".requirements-section__text").fill("Two 20A circuits.");

    await page.emulateMedia({ media: "print" });

    await expect(
      page.locator(".requirements-section__group-actions"),
    ).toBeHidden();
    await expect(page.getByRole("button", { name: "+ Add Item" })).toBeHidden();
    await expect(page.locator(".requirements-section__heading")).toBeVisible();
    await expect(page.locator(".requirements-section__text")).toBeVisible();

    // Regression: the textarea's resize handle must not render in print,
    // even though it's resizable on screen.
    const resize = await page
      .locator(".requirements-section__text")
      .evaluate((el) => getComputedStyle(el).resize);
    expect(resize).toBe("none");
  });

  test("detail text auto-grows to fit its content, on screen and in print", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Requirements", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Item" }).click();

    const text = page.locator(".requirements-section__text");
    const emptyHeight = (await text.boundingBox())!.height;

    await text.fill(
      "Line one of a long requirement.\nLine two.\nLine three.\nLine four.\nLine five.",
    );

    const filledHeight = (await text.boundingBox())!.height;
    expect(filledHeight).toBeGreaterThan(emptyHeight);

    const noClipping = async () =>
      text.evaluate(
        (el: HTMLTextAreaElement) => el.scrollHeight <= el.clientHeight + 1,
      );
    expect(await noClipping()).toBe(true);

    await page.emulateMedia({ media: "print" });
    expect(await noClipping()).toBe(true);
  });

  test("detail text re-grows when its own width changes, not just on input", async ({
    page,
  }) => {
    // Regression: a height computed at one width (e.g. on input, at a wide
    // desktop viewport) previously went stale the moment the textarea's
    // width changed without new input — the same text wraps onto more
    // lines at a narrower width (or print's narrower page width), and the
    // old, shorter height clipped the newly-wrapped lines.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Requirements", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Item" }).click();

    const text = page.locator(".requirements-section__text");
    await text.fill(
      "This sentence wraps onto only a line or two at a wide desktop " +
        "viewport, but would need several more lines once the viewport " +
        "narrows down to a phone-sized width instead.",
    );
    const wideHeight = (await text.boundingBox())!.height;

    const noClipping = async () =>
      text.evaluate(
        (el: HTMLTextAreaElement) => el.scrollHeight <= el.clientHeight + 1,
      );

    await page.setViewportSize({ width: 380, height: 900 });
    await expect(async () => {
      expect((await text.boundingBox())!.height).toBeGreaterThan(wideHeight);
    }).toPass();
    expect(await noClipping()).toBe(true);
  });
});
