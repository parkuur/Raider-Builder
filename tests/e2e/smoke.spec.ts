import { test, expect } from "@playwright/test";

test("scaffolded app loads and shows the empty state", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Technical Rider Editor");
  await expect(
    page.getByRole("button", { name: "+ Add your first section" }),
  ).toBeVisible();
});
