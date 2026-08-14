import { test, expect } from "@playwright/test";

test("save then load round-trips the document unchanged", async ({ page }) => {
  await page.goto("/");

  await page.locator(".document-header__title").fill("My Rider");
  await page.locator(".document-header__band").fill("The Test Band");
  await page.locator(".document-header__meta-input").nth(0).fill("2.1");
  await page.locator('input[type="date"]').fill("2026-05-01");

  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page.getByRole("button", { name: "Requirements", exact: true }).click();
  await page.locator(".section-frame__title").nth(0).fill("First Section");

  await page.getByRole("button", { name: "Add Section" }).last().click();
  await page.getByRole("button", { name: "Requirements", exact: true }).click();
  await page.locator(".section-frame__title").nth(1).fill("Second Section");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("the-test-band.json");

  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();

  // Clear localStorage so the reload proves the round trip goes through the
  // loaded file, not the auto-persisted copy of the document.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(
    page.getByRole("button", { name: "+ Add your first section" }),
  ).toBeVisible();
  await expect(page.locator(".document-header__title")).toHaveValue("");

  await page
    .locator(".save-load-controls__file-input")
    .setInputFiles(downloadPath as string);

  await expect(page.locator(".document-header__title")).toHaveValue("My Rider");
  await expect(page.locator(".document-header__band")).toHaveValue(
    "The Test Band",
  );
  await expect(page.locator(".document-header__meta-input").nth(0)).toHaveValue(
    "2.1",
  );
  await expect(page.locator('input[type="date"]')).toHaveValue("2026-05-01");
  await expect(page.locator(".section-frame__title").nth(0)).toHaveValue(
    "First Section",
  );
  await expect(page.locator(".section-frame__title").nth(1)).toHaveValue(
    "Second Section",
  );
});

test("save then load round-trips a split layout with a multi-item column unchanged", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page
    .getByRole("button", { name: "Contacts (split)", exact: true })
    .click();
  await page
    .locator(".row-view")
    .first()
    .locator(".split-edge-slot__button")
    .click();
  await page
    .getByRole("button", { name: "Quick Look (split)", exact: true })
    .click();

  const column0 = page.locator(".row-view__column").nth(0);
  await column0.locator(".row-gap__button").last().click();
  await page.getByRole("button", { name: "Text (split)", exact: true }).click();
  await page.locator(".text-section__body").fill("Stacked note");

  await expect(column0.locator(".section-frame")).toHaveCount(2);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save" }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(
    page.getByRole("button", { name: "+ Add your first section" }),
  ).toBeVisible();

  await page
    .locator(".save-load-controls__file-input")
    .setInputFiles(downloadPath as string);

  await expect(page.locator(".row-view")).toHaveCount(1);
  await expect(page.locator(".row-view__column")).toHaveCount(2);
  await expect(
    page.locator(".row-view__column").nth(0).locator(".section-frame"),
  ).toHaveCount(2);
  await expect(
    page.locator(".row-view__column").nth(1).locator(".section-frame"),
  ).toHaveCount(1);
  await expect(page.locator(".text-section__body")).toHaveValue("Stacked note");
});
