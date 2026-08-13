import { test, expect } from "@playwright/test";
import { pointerDragTo } from "./utils/pointer-drag";

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

    const firstRowValues = rows
      .nth(0)
      .locator(".contacts-section__value input");
    await firstRowValues.nth(0).fill("555-0101");

    // Email starts collapsed behind an "Add email" button until opened.
    await expect(firstRowValues).toHaveCount(1);
    await rows.nth(0).getByRole("button", { name: "Add email" }).click();
    await expect(firstRowValues).toHaveCount(2);
    await firstRowValues.nth(1).fill("jamie@example.com");

    await rows.nth(1).locator(".contacts-section__name").fill("Sam Lee");

    await rows.nth(1).getByRole("button", { name: "Remove contact" }).click();
    await expect(rows).toHaveCount(1);
    await expect(rows.nth(0).locator(".contacts-section__name")).toHaveValue(
      "Jamie Rivera",
    );
    await expect(firstRowValues.nth(0)).toHaveValue("555-0101");
    await expect(firstRowValues.nth(1)).toHaveValue("jamie@example.com");
  });

  test("dragging a contact's handle onto another reorders them", async ({
    page,
  }) => {
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
    await addButton.click();

    const rows = page.locator(".contacts-section__row");
    await rows.nth(0).locator(".contacts-section__name").fill("A");
    await rows.nth(1).locator(".contacts-section__name").fill("B");
    await rows.nth(2).locator(".contacts-section__name").fill("C");

    await pointerDragTo(page, rows.nth(2).locator(".drag-handle"), rows.nth(0));

    const names = page.locator(".contacts-section__name");
    await expect(names.nth(0)).toHaveValue("C");
    await expect(names.nth(1)).toHaveValue("A");
    await expect(names.nth(2)).toHaveValue("B");
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
