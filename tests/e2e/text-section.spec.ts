import { test, expect } from "@playwright/test";

test.describe("Text section", () => {
  test("body text round-trips through JSON save/load", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Text (half)", exact: true })
      .click();
    await page
      .locator(".text-section__body")
      .fill("Backline provided by venue.");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save" }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page
      .locator(".save-load-controls__file-input")
      .setInputFiles(downloadPath as string);

    await expect(page.locator(".text-section__body")).toHaveValue(
      "Backline provided by venue.",
    );
  });

  test("pairs side-by-side with another half-width section", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Contacts (half)", exact: true })
      .click();
    await page
      .locator(".row-view")
      .filter({ has: page.locator(".contacts-section") })
      .getByRole("button", { name: "Add paired section" })
      .click();
    await page
      .getByRole("button", { name: "Text (half)", exact: true })
      .click();

    const row = page
      .locator(".row-view")
      .filter({ has: page.locator(".contacts-section") });
    await expect(row.locator(".section-frame")).toHaveCount(2);
    await expect(row.locator(".text-section__body")).toBeVisible();
  });

  test("an empty title is hidden in print; a filled-in title is not", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Text (half)", exact: true })
      .click();

    const title = page.locator(".section-frame__title");
    await title.fill("");
    await page.emulateMedia({ media: "print" });
    await expect(title).toBeHidden();

    await page.emulateMedia({ media: "screen" });
    await title.fill("Notes");
    await page.emulateMedia({ media: "print" });
    await expect(title).toBeVisible();
  });

  test("body text auto-grows to fit its content, on screen and in print", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Text (half)", exact: true })
      .click();

    const body = page.locator(".text-section__body");
    const emptyHeight = (await body.boundingBox())!.height;

    await body.fill(
      "Line one of a long note.\nLine two.\nLine three.\nLine four.\nLine five.",
    );

    const filledHeight = (await body.boundingBox())!.height;
    expect(filledHeight).toBeGreaterThan(emptyHeight);

    const noClipping = async () =>
      body.evaluate(
        (el: HTMLTextAreaElement) => el.scrollHeight <= el.clientHeight + 1,
      );
    expect(await noClipping()).toBe(true);

    await page.emulateMedia({ media: "print" });
    expect(await noClipping()).toBe(true);
  });
});
