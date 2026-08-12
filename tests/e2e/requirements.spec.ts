import { test, expect } from "@playwright/test";

test.describe("Requirements section", () => {
  test("add, edit, reorder, and remove requirement groups", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Requirements", exact: true })
      .click();

    const addItem = page.getByRole("button", { name: "+ Add Item" });
    await addItem.click();
    await addItem.click();

    const headings = page.locator(".requirements-section__heading");
    const texts = page.locator(".requirements-section__text");
    await expect(headings).toHaveCount(2);

    await headings.nth(0).fill("Power");
    await texts.nth(0).fill("Two dedicated 20A circuits.");
    await headings.nth(1).fill("Parking");
    await texts.nth(1).fill("One van space near load-in.");

    // Move the second group above the first.
    await page
      .locator(".requirements-section__group")
      .nth(1)
      .getByRole("button", { name: "Move up" })
      .click();
    await expect(headings.nth(0)).toHaveValue("Parking");
    await expect(headings.nth(1)).toHaveValue("Power");

    // Remove the (now first) group.
    await page
      .locator(".requirements-section__group")
      .nth(0)
      .getByRole("button", { name: "Remove" })
      .click();
    await expect(headings).toHaveCount(1);
    await expect(headings.nth(0)).toHaveValue("Power");
  });

  test("editing controls are hidden in print, content stays visible", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Requirements", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Item" }).click();
    await page.locator(".requirements-section__heading").fill("Power");
    await page.locator(".requirements-section__text").fill("Two 20A circuits.");

    await page.emulateMedia({ media: "print" });

    await expect(
      page.locator(".requirements-section__group-actions"),
    ).toBeHidden();
    await expect(page.getByRole("button", { name: "+ Add Item" })).toBeHidden();
    await expect(page.locator(".requirements-section__heading")).toBeVisible();
    await expect(page.locator(".requirements-section__text")).toBeVisible();
  });
});
