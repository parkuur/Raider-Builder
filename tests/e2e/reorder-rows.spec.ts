import { test, expect } from "@playwright/test";

test("lifting a row and placing it at a drop zone reorders the row stack", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page.getByRole("button", { name: "Requirements", exact: true }).click();

  for (let i = 0; i < 2; i += 1) {
    await page.getByRole("button", { name: "+ Add Section" }).last().click();
    await page
      .getByRole("button", { name: "Requirements", exact: true })
      .click();
  }

  const titles = page.locator(".section-frame__title");
  await expect(titles).toHaveCount(3);
  await titles.nth(0).fill("Row A");
  await titles.nth(1).fill("Row B");
  await titles.nth(2).fill("Row C");

  // Lift row A, then place it at the trailing drop zone (after row C). The
  // trailing drop zone sits below the fold with three populated
  // Requirements rows, so scroll it into view first.
  await page.locator(".row-view__handle").first().click();
  const trailingDropZone = page.locator(".row-drop-zone").last();
  await trailingDropZone.scrollIntoViewIfNeeded();
  await trailingDropZone.click();

  await expect(titles.nth(0)).toHaveValue("Row B");
  await expect(titles.nth(1)).toHaveValue("Row C");
  await expect(titles.nth(2)).toHaveValue("Row A");
});

test("lifting a row and tapping its handle again cancels the move", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page.getByRole("button", { name: "Requirements", exact: true }).click();
  await page.getByRole("button", { name: "+ Add Section" }).last().click();
  await page.getByRole("button", { name: "Requirements", exact: true }).click();

  const titles = page.locator(".section-frame__title");
  await titles.nth(0).fill("Row A");
  await titles.nth(1).fill("Row B");

  const handle = page.locator(".row-view__handle").first();
  await handle.click();
  await expect(handle).toHaveAttribute("aria-pressed", "true");
  await handle.click();
  await expect(handle).toHaveAttribute("aria-pressed", "false");

  await expect(titles.nth(0)).toHaveValue("Row A");
  await expect(titles.nth(1)).toHaveValue("Row B");
});

test("clicking outside the lift/place controls cancels an in-progress lift", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page.getByRole("button", { name: "Requirements", exact: true }).click();
  await page.getByRole("button", { name: "+ Add Section" }).last().click();
  await page.getByRole("button", { name: "Requirements", exact: true }).click();

  const titles = page.locator(".section-frame__title");
  await titles.nth(0).fill("Row A");
  await titles.nth(1).fill("Row B");

  const handle = page.locator(".row-view__handle").first();
  await handle.click();
  await expect(handle).toHaveAttribute("aria-pressed", "true");

  await page.locator(".document-header__title").click();
  await expect(handle).toHaveAttribute("aria-pressed", "false");

  await expect(titles.nth(0)).toHaveValue("Row A");
  await expect(titles.nth(1)).toHaveValue("Row B");
});
