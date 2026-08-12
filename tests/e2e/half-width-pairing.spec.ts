import { test, expect } from "@playwright/test";

test.describe("half-width pairing UI", () => {
  test("a full-width section shows no Pair control", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Section", exact: true }).click();
    await expect(
      page
        .locator(".section-frame")
        .getByRole("button", { name: "Pair", exact: true }),
    ).toHaveCount(0);
  });

  test("pairing a Quick Look section onto a Contacts section renders them side-by-side, and unpairing splits them back", async ({
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
      .locator(".section-frame")
      .getByRole("button", { name: "Pair", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Add section" }),
    ).toBeVisible();
    // The menu is filtered to half-width types only.
    await expect(
      page.getByRole("button", { name: "Equipment", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Quick Look (half)", exact: true })
      .click();

    await expect(page.locator(".row-view")).toHaveCount(1);
    const frames = page.locator(".row-view").first().locator(".section-frame");
    await expect(frames).toHaveCount(2);

    await frames
      .nth(1)
      .getByRole("button", { name: "Unpair", exact: true })
      .click();
    await expect(page.locator(".row-view")).toHaveCount(2);
    await expect(
      page.locator(".row-view").nth(0).locator(".section-frame"),
    ).toHaveCount(1);
    await expect(
      page.locator(".row-view").nth(1).locator(".section-frame"),
    ).toHaveCount(1);
  });
});
