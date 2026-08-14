import { test, expect } from "@playwright/test";

const STORAGE_KEY = "raiderbuilder:document";

test.describe("Monitor List column labels", () => {
  test("headers are renameable and persist across reload", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Monitor List", exact: true })
      .click();

    const monHeader = page.locator(
      ".monitor-list thead th.monitor-list__num input",
    );
    await expect(monHeader).toHaveValue("Mon");
    await monHeader.fill("Wedge");

    // Wait for the debounced autosave to actually land in localStorage
    // before reloading, instead of sleeping a fixed amount of time.
    await page.waitForFunction(
      ([key, value]) => localStorage.getItem(key)?.includes(value),
      [STORAGE_KEY, "Wedge"],
    );

    await page.reload();
    await expect(
      page.locator(".monitor-list thead th.monitor-list__num input"),
    ).toHaveValue("Wedge");
  });

  test("Mon header is center-aligned", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Monitor List", exact: true })
      .click();

    const monHeader = page.locator(".monitor-list thead th.monitor-list__num");
    await expect(monHeader).toHaveCSS("text-align", "center");
  });
});
