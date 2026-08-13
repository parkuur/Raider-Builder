import { test, expect } from "@playwright/test";
import { pointerDragTo } from "./utils/pointer-drag";

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
      .getByRole("button", { name: "Remove item" })
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

  test("dragging an item's handle onto another item reorders within its list, not the other", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Equipment", exact: true }).click();

    const addButtons = page.getByRole("button", { name: "+ Add item" });
    await addButtons.nth(0).click();
    await addButtons.nth(0).click();
    await addButtons.nth(1).click();

    const lists = page.locator(".equipment-section__list");
    const bandItems = lists.nth(0).locator(".equipment-section__item");
    const venueItems = lists.nth(1).locator(".equipment-section__item");

    await bandItems.nth(0).locator(".equipment-section__item-name").fill("A");
    await bandItems.nth(1).locator(".equipment-section__item-name").fill("B");
    await venueItems
      .nth(0)
      .locator(".equipment-section__item-name")
      .fill("Backline");

    await pointerDragTo(
      page,
      bandItems.nth(1).locator(".drag-handle"),
      bandItems.nth(0),
    );

    await expect(
      bandItems.nth(0).locator(".equipment-section__item-name"),
    ).toHaveValue("B");
    await expect(
      bandItems.nth(1).locator(".equipment-section__item-name"),
    ).toHaveValue("A");
    await expect(
      venueItems.nth(0).locator(".equipment-section__item-name"),
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
      page.getByRole("button", { name: "Remove item" }).first(),
    ).toBeHidden();
    await expect(
      page.locator(".equipment-section__title").first(),
    ).toBeVisible();
    await expect(
      page.locator(".equipment-section__item-name").first(),
    ).toBeVisible();
  });

  test("printed items show a rule between rows but not below the last row", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Equipment", exact: true }).click();

    const addFirstListItem = page
      .getByRole("button", { name: "+ Add item" })
      .first();
    await addFirstListItem.click();
    await addFirstListItem.click();

    await page.emulateMedia({ media: "print" });

    const items = page
      .locator(".equipment-section__list")
      .first()
      .locator(".equipment-section__item");
    await expect(items).toHaveCount(2);

    const firstBorder = await items
      .nth(0)
      .evaluate((el) => getComputedStyle(el).borderBottomStyle);
    expect(firstBorder).toBe("solid");

    const lastBorder = await items
      .nth(1)
      .evaluate((el) => getComputedStyle(el).borderBottomStyle);
    expect(lastBorder).toBe("none");
  });
});
