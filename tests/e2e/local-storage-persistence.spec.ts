import { test, expect } from "@playwright/test";

const STORAGE_KEY = "raiderbuilder:document";

test("document survives a reload via localStorage", async ({ page }) => {
  await page.goto("/");

  await page.locator(".document-header__title").fill("My Rider");
  await page.locator(".document-header__band").fill("The Test Band");

  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page.getByRole("button", { name: "Requirements", exact: true }).click();
  await page.locator(".section-frame__title").nth(0).fill("First Section");

  // Wait for the debounced autosave to actually land in localStorage before
  // reloading, instead of sleeping a fixed amount of time.
  await page.waitForFunction(
    (key) => localStorage.getItem(key) !== null,
    STORAGE_KEY,
  );

  await page.reload();

  await expect(page.locator(".document-header__title")).toHaveValue("My Rider");
  await expect(page.locator(".document-header__band")).toHaveValue(
    "The Test Band",
  );
  await expect(page.locator(".section-frame__title").nth(0)).toHaveValue(
    "First Section",
  );
});

test("Clear wipes both the document and the stored copy", async ({ page }) => {
  await page.goto("/");

  await page.locator(".document-header__title").fill("My Rider");
  await page.waitForFunction(
    (key) => localStorage.getItem(key) !== null,
    STORAGE_KEY,
  );

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Clear" }).click();

  await expect(page.locator(".document-header__title")).toHaveValue("");

  const stored = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEY,
  );
  expect(stored).toBeNull();

  await page.reload();

  await expect(page.locator(".document-header__title")).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "+ Add your first section" }),
  ).toBeVisible();
});
