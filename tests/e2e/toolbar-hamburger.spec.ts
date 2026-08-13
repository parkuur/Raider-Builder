import { test, expect } from "@playwright/test";

test.describe("toolbar hamburger menu on narrow viewports", () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test("actions are hidden behind a hamburger toggle and reachable through it", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("button", { name: "Save" })).not.toBeVisible();

    const toggle = page.getByRole("button", { name: "Menu" });
    await expect(toggle).toBeVisible();
    await toggle.click();

    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Load" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Clear" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Print / PDF" }),
    ).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save" }).click();
    await downloadPromise;

    await expect(page.getByRole("button", { name: "Save" })).not.toBeVisible();
  });

  test("clicking outside the open menu closes it", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();

    await page.mouse.click(10, 10);
    await expect(page.getByRole("button", { name: "Save" })).not.toBeVisible();
  });
});
