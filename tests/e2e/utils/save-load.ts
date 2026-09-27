import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Saves the current document, clears the auto-persisted copy, reloads to an
 * empty editor, then loads the saved file back — so assertions afterwards
 * prove the data survived the JSON file round trip, not localStorage.
 */
export async function saveClearAndReload(page: Page): Promise<void> {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save" }).click();
  const downloadPath = await (await downloadPromise).path();
  expect(downloadPath).toBeTruthy();

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(
    page.getByRole("button", { name: "+ Add your first section" }),
  ).toBeVisible();

  await page
    .locator(".save-load-controls__file-input")
    .setInputFiles(downloadPath as string);
}
