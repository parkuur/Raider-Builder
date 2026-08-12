import { test, expect } from "@playwright/test";

test("dragging a row to a new position reorders the row stack", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page.getByRole("button", { name: "Section", exact: true }).click();

  for (let i = 0; i < 2; i += 1) {
    await page.getByRole("button", { name: "+ Add Section" }).last().click();
    await page.getByRole("button", { name: "Section", exact: true }).click();
  }

  const titles = page.locator(".section-frame__title");
  await expect(titles).toHaveCount(3);
  await titles.nth(0).fill("Row A");
  await titles.nth(1).fill("Row B");
  await titles.nth(2).fill("Row C");

  // Drag row A's handle to the trailing drop zone (after row C).
  await page
    .locator(".row-view__handle")
    .first()
    .dragTo(page.locator(".row-drop-zone").last());

  await expect(titles.nth(0)).toHaveValue("Row B");
  await expect(titles.nth(1)).toHaveValue("Row C");
  await expect(titles.nth(2)).toHaveValue("Row A");
});
