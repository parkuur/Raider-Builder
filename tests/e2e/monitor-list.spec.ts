import { test, expect } from "@playwright/test";

test.describe("Monitor List section", () => {
  test("add, edit, toggle stereo, and remove monitor rows", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Monitor List", exact: true })
      .click();

    const addMonitor = page.getByRole("button", { name: "+ Add Monitor" });
    await addMonitor.click();
    await addMonitor.click();

    const players = page.locator(".monitor-list__player-input");
    await players.nth(0).fill("Drummer");
    await players.nth(1).fill("Vocalist");

    const numbers = page.locator(".monitor-list tbody .monitor-list__num");
    await expect(numbers).toHaveText(["1", "2"]);

    const rows = page.locator(".monitor-list tbody tr");
    // Toggling stereo on one row never combines its number with a
    // neighbor's, unlike Channel List's stereo rows.
    await rows
      .nth(0)
      .getByRole("button", { name: "Mono", exact: true })
      .click();
    await expect(numbers).toHaveText(["1", "2"]);

    await rows
      .nth(0)
      .getByRole("button", { name: "Stereo", exact: true })
      .click();
    await expect(numbers).toHaveText(["1", "2"]);

    await rows.nth(0).getByRole("button", { name: "Remove" }).click();
    await expect(players).toHaveCount(1);
    await expect(players.nth(0)).toHaveValue("Vocalist");
  });

  test("the mono/stereo mode label is print-only", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Monitor List", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Monitor" }).click();

    const modeCell = page.locator(".monitor-list__mode").last();
    await expect(modeCell).toBeHidden();

    await page.emulateMedia({ media: "print" });
    await expect(modeCell).toBeVisible();
    await expect(modeCell).toHaveText("Mono");

    await page.emulateMedia({ media: "screen" });
    await page.getByRole("button", { name: "Mono", exact: true }).click();
    await page.emulateMedia({ media: "print" });
    await expect(modeCell).toHaveText("Stereo");
  });

  test("editing controls are hidden in print, content stays visible", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Monitor List", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Monitor" }).click();
    await page.locator(".monitor-list__player-input").fill("Drummer");

    await page.emulateMedia({ media: "print" });

    await expect(
      page.getByRole("button", { name: "+ Add Monitor" }),
    ).toBeHidden();
    await expect(page.locator(".monitor-list__actions").first()).toBeHidden();
    await expect(page.locator(".monitor-list__player-input")).toBeVisible();
  });
});
