import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { pointerDragTo } from "./utils/pointer-drag";
import { saveClearAndReload } from "./utils/save-load";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => path.join(__dirname, "fixtures", name);

async function addEquipment(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page
    .getByRole("button", { name: "Equipment (split)", exact: true })
    .click();
}

test.describe("Equipment section", () => {
  test("add, edit and remove items in its single list", async ({ page }) => {
    await addEquipment(page);

    await expect(page.locator(".equipment-section")).toHaveCount(1);
    await expect(page.locator(".section-frame__title")).toHaveValue(
      "Equipment",
    );

    const addItem = page.getByRole("button", { name: "+ Add item" });
    await addItem.click();
    await addItem.click();

    const items = page.locator(".equipment-section__item");
    await expect(items).toHaveCount(2);
    await items.nth(0).locator(".equipment-section__item-name").fill("PA");
    await items.nth(0).locator(".equipment-section__item-count").fill("1");
    await items.nth(1).locator(".equipment-section__item-name").fill("Amp");

    await items.nth(0).getByRole("button", { name: "Remove item" }).click();
    await expect(items).toHaveCount(1);
    await expect(
      items.nth(0).locator(".equipment-section__item-name"),
    ).toHaveValue("Amp");
  });

  test("dragging an item's handle onto another item reorders the list", async ({
    page,
  }) => {
    await addEquipment(page);
    const addItem = page.getByRole("button", { name: "+ Add item" });
    await addItem.click();
    await addItem.click();

    const items = page.locator(".equipment-section__item");
    await items.nth(0).locator(".equipment-section__item-name").fill("A");
    await items.nth(1).locator(".equipment-section__item-name").fill("B");

    await pointerDragTo(
      page,
      items.nth(1).locator(".drag-handle"),
      items.nth(0),
    );

    await expect(
      items.nth(0).locator(".equipment-section__item-name"),
    ).toHaveValue("B");
    await expect(
      items.nth(1).locator(".equipment-section__item-name"),
    ).toHaveValue("A");
  });

  test("two Equipment sections in a split layout recreate band/venue lists side by side", async ({
    page,
  }) => {
    await addEquipment(page);
    await page.locator(".section-frame__title").fill("Band Provides");
    await page.locator(".split-edge-slot__button").click();
    await page
      .getByRole("button", { name: "Equipment (split)", exact: true })
      .click();
    await page.locator(".section-frame__title").nth(1).fill("Venue Provides");

    const columns = page.locator(".row-view__column");
    await expect(columns).toHaveCount(2);
    await expect(columns.nth(0).locator(".equipment-section")).toHaveCount(1);
    await expect(columns.nth(1).locator(".equipment-section")).toHaveCount(1);

    await columns.nth(0).getByRole("button", { name: "+ Add item" }).click();
    await columns
      .nth(0)
      .locator(".equipment-section__item-name")
      .fill("Guitar amp");
    await expect(
      columns.nth(1).locator(".equipment-section__item"),
    ).toHaveCount(0);

    const [left, right] = await Promise.all([
      columns.nth(0).boundingBox(),
      columns.nth(1).boundingBox(),
    ]);
    expect(right!.x).toBeGreaterThan(left!.x + left!.width - 1);
  });

  test("items survive a save → load round trip", async ({ page }) => {
    await addEquipment(page);
    await page.getByRole("button", { name: "+ Add item" }).click();
    await page.locator(".equipment-section__item-name").fill("Snake");
    await page.locator(".equipment-section__item-count").fill("1");

    await saveClearAndReload(page);

    await expect(page.locator(".equipment-section__item-name")).toHaveValue(
      "Snake",
    );
    await expect(page.locator(".equipment-section__item-count")).toHaveValue(
      "1",
    );
  });

  test("editing controls are hidden in print, content stays visible", async ({
    page,
  }) => {
    await addEquipment(page);
    await page.getByRole("button", { name: "+ Add item" }).click();
    await page.locator(".equipment-section__item-name").fill("PA System");

    await page.emulateMedia({ media: "print" });

    await expect(page.getByRole("button", { name: "+ Add item" })).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Remove item" }),
    ).toBeHidden();
    await expect(page.locator(".equipment-section__item-name")).toBeVisible();
  });

  test("printed items show a rule between rows but not below the last row", async ({
    page,
  }) => {
    await addEquipment(page);
    const addItem = page.getByRole("button", { name: "+ Add item" });
    await addItem.click();
    await addItem.click();

    await page.emulateMedia({ media: "print" });

    const items = page.locator(".equipment-section__item");
    await expect(items).toHaveCount(2);
    expect(
      await items
        .nth(0)
        .evaluate((el) => getComputedStyle(el).borderBottomStyle),
    ).toBe("solid");
    expect(
      await items
        .nth(1)
        .evaluate((el) => getComputedStyle(el).borderBottomStyle),
    ).toBe("none");
  });
});

test.describe("legacy two-list Equipment files", () => {
  test("load as a split layout of two Equipment sections, with a save-again notice", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .locator(".save-load-controls__file-input")
      .setInputFiles(fixture("legacy-equipment-document.json"));

    const notice = page.getByRole("status").filter({
      hasText: "This file used an older format and was converted",
    });
    await expect(notice).toBeVisible();

    const columns = page.locator(".row-view__column");
    await expect(columns).toHaveCount(2);
    await expect(columns.nth(0).locator(".section-frame__title")).toHaveValue(
      "Band Provides",
    );
    await expect(
      columns.nth(0).locator(".equipment-section__item-name"),
    ).toHaveValue("Guitar amp");
    await expect(columns.nth(1).locator(".section-frame__title")).toHaveValue(
      "Venue Provides",
    );
    await expect(
      columns.nth(1).locator(".equipment-section__item-name"),
    ).toHaveValue("PA system");

    // Notice is screen-only and dismissible.
    await page.emulateMedia({ media: "print" });
    await expect(notice).toBeHidden();
    await page.emulateMedia({ media: "screen" });
    await notice.getByRole("button", { name: "Dismiss notice" }).click();
    await expect(notice).toHaveCount(0);
  });

  test("a converted autosave shows the notice after a reload", async ({
    page,
  }) => {
    await page.goto("/");
    const legacy = readFileSync(
      fixture("legacy-equipment-document.json"),
      "utf8",
    );
    await page.evaluate((json) => {
      localStorage.setItem("raiderbuilder:document", json);
    }, legacy);
    await page.reload();

    await expect(
      page.getByText("This file used an older format and was converted"),
    ).toBeVisible();
    await expect(page.locator(".row-view__column")).toHaveCount(2);
  });

  test("a current-format file shows no notice", async ({ page }) => {
    await addEquipment(page);
    await saveClearAndReload(page);
    await expect(page.locator(".equipment-section")).toHaveCount(1);
    await expect(
      page.getByText("This file used an older format and was converted"),
    ).toHaveCount(0);
  });
});
