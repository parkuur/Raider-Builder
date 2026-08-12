import { test, expect } from "@playwright/test";

test("save then load round-trips the document unchanged", async ({ page }) => {
  await page.goto("/");

  await page.locator(".document-header__title").fill("My Rider");
  await page.locator(".document-header__band").fill("The Test Band");
  await page.locator(".document-header__meta-input").nth(0).fill("2.1");
  await page.locator('input[type="date"]').fill("2026-05-01");

  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page.getByRole("button", { name: "Section", exact: true }).click();
  await page.locator(".section-frame__title").nth(0).fill("First Section");

  await page.getByRole("button", { name: "+ Add Section" }).last().click();
  await page.getByRole("button", { name: "Section", exact: true }).click();
  await page.locator(".section-frame__title").nth(1).fill("Second Section");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("the-test-band.json");

  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();

  // Reload to prove the round trip goes through the file, not hidden state.
  await page.reload();
  await expect(
    page.getByRole("button", { name: "+ Add your first section" }),
  ).toBeVisible();
  await expect(page.locator(".document-header__title")).toHaveValue("");

  await page
    .locator('input[type="file"]')
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
