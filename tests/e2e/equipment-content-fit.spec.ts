import { test, expect } from "@playwright/test";

test.describe("Equipment content-fit columns", () => {
  test("Count widens to its longest value; a long item name is absorbed by the stretch column", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Equipment (split)", exact: true })
      .click();

    const addItem = page.getByRole("button", { name: "+ Add item" });
    await addItem.click();
    await addItem.click();

    const items = page.locator(".equipment-section__item");
    await items.nth(0).locator(".equipment-section__item-name").fill("Snake");
    await items.nth(0).locator(".equipment-section__item-count").fill("1");
    await items
      .nth(1)
      .locator(".equipment-section__item-count")
      .fill("100 feet of XLR cable");

    const countCells = items.locator(".equipment-section__item-count");
    const w0 = (await countCells.nth(0).boundingBox())!.width;
    const w1 = (await countCells.nth(1).boundingBox())!.width;
    expect(w0).toBeCloseTo(w1, 0);
    expect(w0).toBeGreaterThan(100);
  });

  test("a long Count value in one Equipment section does not affect another's Count width", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Equipment (split)", exact: true })
      .click();
    await page.locator(".split-edge-slot__button").click();
    await page
      .getByRole("button", { name: "Equipment (split)", exact: true })
      .click();

    const sections = page.locator(".equipment-section");
    await sections.nth(0).getByRole("button", { name: "+ Add item" }).click();
    await sections.nth(1).getByRole("button", { name: "+ Add item" }).click();
    await sections
      .nth(0)
      .locator(".equipment-section__item-count")
      .fill("a very long quantity description");
    await sections.nth(1).locator(".equipment-section__item-count").fill("2");

    const first = (await sections
      .nth(0)
      .locator(".equipment-section__item-count")
      .boundingBox())!.width;
    const second = (await sections
      .nth(1)
      .locator(".equipment-section__item-count")
      .boundingBox())!.width;
    expect(second).toBeLessThan(first);
  });
});
