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
});
