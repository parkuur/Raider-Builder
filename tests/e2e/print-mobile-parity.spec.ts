import { test, expect } from "@playwright/test";

test.describe("layout that stacks on a mobile viewport still prints desktop-shaped", () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test("a split layout stacks on screen but prints side-by-side", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Contacts (split)", exact: true })
      .click();
    await page.locator(".row-view").locator(".split-edge-slot__button").click();
    await page
      .getByRole("button", { name: "Quick Look (split)", exact: true })
      .click();

    const sections = page.locator(".row-view__sections");
    await expect(sections).toHaveCSS("flex-direction", "column");

    await page.emulateMedia({ media: "print" });
    await expect(sections).toHaveCSS("flex-direction", "row");
  });
});
