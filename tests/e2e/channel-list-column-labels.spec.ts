import { test, expect } from "@playwright/test";

const STORAGE_KEY = "raiderbuilder:document";

test.describe("Channel List column labels", () => {
  test("headers are renameable and persist across reload", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Channel List", exact: true })
      .click();

    const phantomHeader = page.locator(
      ".channel-list thead th.channel-list__phantom input",
    );
    await expect(phantomHeader).toHaveValue("48V");
    await phantomHeader.fill("Phantom");

    // Wait for the debounced autosave to actually land in localStorage
    // before reloading, instead of sleeping a fixed amount of time.
    await page.waitForFunction(
      ([key, value]) => localStorage.getItem(key)?.includes(value),
      [STORAGE_KEY, "Phantom"],
    );

    await page.reload();
    await expect(
      page.locator(".channel-list thead th.channel-list__phantom input"),
    ).toHaveValue("Phantom");
  });

  test("Ch and 48V headers are center-aligned", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Channel List", exact: true })
      .click();

    const chHeader = page.locator(".channel-list thead th.channel-list__num");
    const phantomHeader = page.locator(
      ".channel-list thead th.channel-list__phantom",
    );
    await expect(chHeader).toHaveCSS("text-align", "center");
    await expect(phantomHeader).toHaveCSS("text-align", "center");
  });
});
