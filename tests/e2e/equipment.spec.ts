import { test, expect } from "@playwright/test";

test.describe("Equipment section", () => {
  test("edit list titles and add/edit/remove items in each list independently", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Equipment", exact: true }).click();

    const titles = page.locator(".equipment-section__title");
    await expect(titles).toHaveCount(2);
    await expect(titles.nth(0)).toHaveValue("Band Provides");
    await expect(titles.nth(1)).toHaveValue("Venue Provides");
    await titles.nth(0).fill("Our Gear");

    const addButtons = page.getByRole("button", { name: "+ Add item" });
    await addButtons.nth(0).click();
    await addButtons.nth(0).click();
    await addButtons.nth(1).click();

    const lists = page.locator(".equipment-section__list");
    await expect(lists.nth(0).locator(".equipment-section__item")).toHaveCount(
      2,
    );
    await expect(lists.nth(1).locator(".equipment-section__item")).toHaveCount(
      1,
    );

    await lists
      .nth(0)
      .locator(".equipment-section__item-name")
      .nth(0)
      .fill("PA System");
    await lists
      .nth(0)
      .locator(".equipment-section__item-count")
      .nth(0)
      .fill("1");
    await lists
      .nth(1)
      .locator(".equipment-section__item-name")
      .nth(0)
      .fill("Backline");

    await lists
      .nth(0)
      .locator(".equipment-section__item-remove")
      .nth(1)
      .click();
    await expect(lists.nth(0).locator(".equipment-section__item")).toHaveCount(
      1,
    );
    await expect(
      lists.nth(0).locator(".equipment-section__item-name").nth(0),
    ).toHaveValue("PA System");
    await expect(
      lists.nth(1).locator(".equipment-section__item-name").nth(0),
    ).toHaveValue("Backline");
  });

  test("editing controls are hidden in print, content stays visible", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Equipment", exact: true }).click();
    await page.getByRole("button", { name: "+ Add item" }).first().click();
    await page
      .locator(".equipment-section__item-name")
      .first()
      .fill("PA System");

    await page.emulateMedia({ media: "print" });

    await expect(
      page.getByRole("button", { name: "+ Add item" }).first(),
    ).toBeHidden();
    await expect(
      page.locator(".equipment-section__item-remove").first(),
    ).toBeHidden();
    await expect(
      page.locator(".equipment-section__title").first(),
    ).toBeVisible();
    await expect(
      page.locator(".equipment-section__item-name").first(),
    ).toBeVisible();
  });
});
