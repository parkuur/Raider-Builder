import { test, expect } from "@playwright/test";

test("scaffolded page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Technical Rider Editor");
  await expect(
    page.getByRole("heading", { name: "Technical Rider Editor" }),
  ).toBeVisible();
});
