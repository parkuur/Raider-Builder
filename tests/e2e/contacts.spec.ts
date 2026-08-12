import { test, expect } from "@playwright/test";

test.describe("Contacts section", () => {
  test("add, edit, and remove contact rows", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Contacts (half)", exact: true })
      .click();

    const addButton = page.getByRole("button", { name: "+ Add Contact" });
    await addButton.click();
    await addButton.click();

    const rows = page.locator(".contacts-section__row");
    await expect(rows).toHaveCount(2);

    await rows.nth(0).locator(".contacts-section__name").fill("Jamie Rivera");
    await rows.nth(0).locator(".contacts-section__role").fill("Tour Manager");
    await rows.nth(0).locator(".contacts-section__mobile").fill("555-0101");
    await rows
      .nth(0)
      .locator(".contacts-section__email")
      .fill("jamie@example.com");

    await rows.nth(1).locator(".contacts-section__name").fill("Sam Lee");

    await rows.nth(1).getByRole("button", { name: "Remove contact" }).click();
    await expect(rows).toHaveCount(1);
    await expect(rows.nth(0).locator(".contacts-section__name")).toHaveValue(
      "Jamie Rivera",
    );
  });

  test("editing controls are hidden in print, content stays visible", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Contacts (half)", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Contact" }).click();
    await page.locator(".contacts-section__name").fill("Jamie Rivera");

    await page.emulateMedia({ media: "print" });

    await expect(
      page.getByRole("button", { name: "+ Add Contact" }),
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Remove contact" }),
    ).toBeHidden();
    await expect(page.locator(".contacts-section__name")).toBeVisible();
  });
});
