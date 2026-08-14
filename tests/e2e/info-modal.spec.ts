import { test, expect } from "@playwright/test";

test.describe("Info modal", () => {
  test("opens via the toolbar button and links to the GitHub repo", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator('button[aria-label="About this app"]').click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const repoLink = dialog.getByRole("link", { name: /github\.com/ });
    await expect(repoLink).toHaveAttribute(
      "href",
      "https://github.com/parkuur/Raider-Builder",
    );
    await expect(repoLink).toHaveAttribute("target", "_blank");
  });

  test("Escape closes the modal, even after focus has moved onto content inside it", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator('button[aria-label="About this app"]').click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Regression: focus a control inside the dialog (its own Close button)
    // before pressing Escape — a naive backdrop-only keydown handler never
    // sees this Escape, since the event bubbles through the dialog instead
    // of the backdrop once something inside it has focus.
    await dialog.getByRole("button", { name: "Close" }).focus();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("clicking the backdrop closes the modal", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[aria-label="About this app"]').click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Click outside the dialog panel itself, on the backdrop.
    await page.mouse.click(10, 10);
    await expect(dialog).toBeHidden();
  });
});
