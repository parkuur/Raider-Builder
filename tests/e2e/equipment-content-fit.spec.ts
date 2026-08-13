import { test, expect } from "@playwright/test";

test.describe("Equipment content-fit columns", () => {
  test("Count widens to its longest value within a list; a long item name is absorbed by the stretch column", async ({
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

    const bandItems = page
      .locator(".equipment-section__list")
      .nth(0)
      .locator(".equipment-section__item");
    await bandItems
      .nth(0)
      .locator(".equipment-section__item-name")
      .fill("Snake");
    await bandItems.nth(0).locator(".equipment-section__item-count").fill("1");
    await bandItems
      .nth(1)
      .locator(".equipment-section__item-count")
      .fill("100 feet of XLR cable");

    const countCells = bandItems.locator(".equipment-section__item-count");
    const w0 = (await countCells.nth(0).boundingBox())!.width;
    const w1 = (await countCells.nth(1).boundingBox())!.width;
    expect(w0).toBeCloseTo(w1, 0);
    expect(w0).toBeGreaterThan(100);
  });

  test("a long Count value in one list does not affect the other list's Count width", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Equipment", exact: true }).click();

    const addButtons = page.getByRole("button", { name: "+ Add item" });
    await addButtons.nth(0).click();
    await addButtons.nth(1).click();

    const lists = page.locator(".equipment-section__list");
    await lists
      .nth(0)
      .locator(".equipment-section__item-count")
      .fill("a very long quantity description");
    await lists.nth(1).locator(".equipment-section__item-count").fill("2");

    const bandCountWidth = (await lists
      .nth(0)
      .locator(".equipment-section__item-count")
      .boundingBox())!.width;
    const venueCountWidth = (await lists
      .nth(1)
      .locator(".equipment-section__item-count")
      .boundingBox())!.width;
    expect(venueCountWidth).toBeLessThan(bandCountWidth);
  });
});
