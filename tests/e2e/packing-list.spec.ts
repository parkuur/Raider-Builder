import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { pointerDragTo } from "./utils/pointer-drag";
import { saveClearAndReload } from "./utils/save-load";

async function addPackingList(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page.getByRole("button", { name: "Packing List", exact: true }).click();
}

const table = (page: Page) => page.locator(".packing-list");
const rowBodies = (page: Page) =>
  table(page).locator("tbody.grouped-table__row");
const groupBodies = (page: Page) =>
  table(page).locator("tbody.grouped-table__group");
const groupTitles = (page: Page) =>
  page.getByRole("textbox", { name: "Group heading" });

/** Row/group structure in display order, e.g. ["a", "# Audio", "  b"]. */
async function structure(page: Page): Promise<string[]> {
  return table(page)
    .locator("tbody")
    .evaluateAll((bodies) =>
      bodies
        .filter((b) => !b.classList.contains("grouped-table__end"))
        .map((b) => {
          if (b.classList.contains("grouped-table__group")) {
            const title = b.querySelector("input") as HTMLInputElement;
            return `# ${title.value}`;
          }
          const item = b.querySelector(
            ".packing-list__item-input",
          ) as HTMLTextAreaElement;
          const indent = b.classList.contains("grouped-table__row--in-group")
            ? "  "
            : "";
          return `${indent}${item.value}`;
        }),
    );
}

/**
 * Builds: Loose, # Audio case [SM58, XLR], # Merch [Shirts].
 */
async function buildSample(page: Page) {
  await addPackingList(page);
  await page.getByRole("button", { name: "+ Add item" }).click();
  await page.locator(".packing-list__item-input").nth(0).fill("Loose");

  await page.getByRole("button", { name: "+ Add group" }).click();
  await groupTitles(page).nth(0).fill("Audio case");
  const addToGroup = page.getByRole("button", { name: "Add item to group" });
  await addToGroup.nth(0).click();
  await addToGroup.nth(0).click();
  await page.locator(".packing-list__item-input").nth(1).fill("SM58");
  await page.locator(".packing-list__item-input").nth(2).fill("XLR");

  await page.getByRole("button", { name: "+ Add group" }).click();
  await groupTitles(page).nth(1).fill("Merch");
  await addToGroup.nth(1).click();
  await page.locator(".packing-list__item-input").nth(3).fill("Shirts");

  await expect
    .poll(() => structure(page))
    .toEqual([
      "Loose",
      "# Audio case",
      "  SM58",
      "  XLR",
      "# Merch",
      "  Shirts",
    ]);
}

test.describe("Packing List section", () => {
  test("is listed under Planning in the Add Section menu", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await expect(
      page
        .getByRole("region", { name: "Planning" })
        .getByRole("button", { name: "Packing List", exact: true }),
    ).toBeVisible();
  });

  test("add groups and items, and edit every field", async ({ page }) => {
    await buildSample(page);
    const sm58 = rowBodies(page).nth(1);
    await sm58.locator(".packing-list__count-input").fill("4");
    await sm58.locator(".packing-list__source-input").fill("Band");
    await sm58.locator(".packing-list__notes-input").fill("Spare in case");
    await expect(sm58.locator(".packing-list__count-input")).toHaveValue("4");
    await expect(sm58.locator(".packing-list__source-input")).toHaveValue(
      "Band",
    );
  });

  test("drag an item into, between and out of groups", async ({ page }) => {
    await buildSample(page);

    // Loose → onto the Merch header: top of Merch.
    await pointerDragTo(
      page,
      rowBodies(page).nth(0).locator(".drag-handle"),
      groupBodies(page).nth(1),
    );
    await expect
      .poll(() => structure(page))
      .toEqual([
        "# Audio case",
        "  SM58",
        "  XLR",
        "# Merch",
        "  Loose",
        "  Shirts",
      ]);

    // XLR → onto Shirts: between groups, before Shirts.
    await pointerDragTo(
      page,
      rowBodies(page).nth(1).locator(".drag-handle"),
      rowBodies(page).nth(3),
    );
    await expect
      .poll(() => structure(page))
      .toEqual([
        "# Audio case",
        "  SM58",
        "# Merch",
        "  Loose",
        "  XLR",
        "  Shirts",
      ]);

    // SM58 → the end drop zone: out of every group.
    const handle = rowBodies(page).nth(0).locator(".drag-handle");
    const box = (await handle.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const endZone = table(page).locator("tbody.grouped-table__end");
    await expect(endZone).toBeVisible();
    const endBox = (await endZone.boundingBox())!;
    await page.mouse.move(box.x, (box.y + endBox.y) / 2);
    await page.mouse.move(endBox.x + endBox.width / 2, endBox.y + 5);
    await page.mouse.up();
    await expect(endZone).toHaveCount(0);
    await expect
      .poll(() => structure(page))
      .toEqual([
        "# Audio case",
        "# Merch",
        "  Loose",
        "  XLR",
        "  Shirts",
        "SM58",
      ]);
  });

  test("drag a whole group to a new position", async ({ page }) => {
    await buildSample(page);
    await pointerDragTo(
      page,
      groupBodies(page).nth(1).locator(".drag-handle"),
      rowBodies(page).nth(0),
    );
    await expect
      .poll(() => structure(page))
      .toEqual([
        "# Merch",
        "  Shirts",
        "Loose",
        "# Audio case",
        "  SM58",
        "  XLR",
      ]);
  });

  test("ungroup keeps the items; deleting a group asks first and removes its items", async ({
    page,
  }) => {
    await buildSample(page);
    await groupBodies(page)
      .nth(0)
      .getByRole("button", { name: "Ungroup" })
      .click();
    await expect
      .poll(() => structure(page))
      .toEqual(["Loose", "SM58", "XLR", "# Merch", "  Shirts"]);

    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("1 item");
      void dialog.dismiss();
    });
    await groupBodies(page)
      .nth(0)
      .getByRole("button", { name: "Delete group" })
      .click();
    await expect(groupBodies(page)).toHaveCount(1);

    page.once("dialog", (dialog) => void dialog.accept());
    await groupBodies(page)
      .nth(0)
      .getByRole("button", { name: "Delete group" })
      .click();
    await expect.poll(() => structure(page)).toEqual(["Loose", "SM58", "XLR"]);
  });

  test("hidden items and groups are dimmed on screen and left out of print", async ({
    page,
  }) => {
    await buildSample(page);
    await rowBodies(page)
      .nth(0)
      .getByRole("button", { name: "Hide item" })
      .click();
    await groupBodies(page)
      .nth(0)
      .getByRole("button", { name: "Hide group" })
      .click();

    await expect(rowBodies(page).nth(0)).toHaveClass(/data-table__row--hidden/);
    // Both items in the hidden group read as hidden, without their own
    // toggles flipping.
    await expect(rowBodies(page).nth(1)).toHaveClass(/data-table__row--hidden/);
    await expect(
      rowBodies(page).nth(1).getByRole("button", { name: "Hide item" }),
    ).toHaveAttribute("aria-pressed", "false");
    await expect(rowBodies(page).nth(3)).not.toHaveClass(
      /data-table__row--hidden/,
    );

    await page.emulateMedia({ media: "print" });
    await expect(rowBodies(page).nth(0)).toBeHidden();
    await expect(groupBodies(page).nth(0)).toBeHidden();
    await expect(rowBodies(page).nth(1)).toBeHidden();
    await expect(rowBodies(page).nth(2)).toBeHidden();
    await expect(groupBodies(page).nth(1)).toBeVisible();
    await expect(rowBodies(page).nth(3)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "+ Add group" }),
    ).toBeHidden();

    await page.emulateMedia({ media: "screen" });
    await groupBodies(page)
      .nth(0)
      .getByRole("button", { name: "Show group" })
      .click();
    await expect(rowBodies(page).nth(1)).not.toHaveClass(
      /data-table__row--hidden/,
    );
  });

  test("groups, items, hidden flags and column labels survive a save → load round trip", async ({
    page,
  }) => {
    await buildSample(page);
    await rowBodies(page)
      .nth(2)
      .getByRole("button", { name: "Hide item" })
      .click();
    await groupBodies(page)
      .nth(1)
      .getByRole("button", { name: "Hide group" })
      .click();
    const headers = table(page).locator("thead input");
    await expect(headers).toHaveCount(4);
    await expect(headers.nth(2)).toHaveValue("From");
    await headers.nth(2).fill("Owner");

    await saveClearAndReload(page);

    await expect
      .poll(() => structure(page))
      .toEqual([
        "Loose",
        "# Audio case",
        "  SM58",
        "  XLR",
        "# Merch",
        "  Shirts",
      ]);
    await expect(table(page).locator("thead input").nth(2)).toHaveValue(
      "Owner",
    );
    await expect(
      rowBodies(page).nth(2).getByRole("button", { name: "Show item" }),
    ).toBeVisible();
    await expect(
      groupBodies(page).nth(1).getByRole("button", { name: "Show group" }),
    ).toBeVisible();
    await expect(rowBodies(page).nth(1)).not.toHaveClass(
      /data-table__row--hidden/,
    );
  });
});
