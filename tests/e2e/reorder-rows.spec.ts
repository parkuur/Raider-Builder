import { test, expect } from "@playwright/test";

test("lifting a row and placing it at a drop zone reorders the row stack", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page.getByRole("button", { name: "Requirements", exact: true }).click();

  for (let i = 0; i < 2; i += 1) {
    await page.getByRole("button", { name: "Add Section" }).last().click();
    await page
      .getByRole("button", { name: "Requirements", exact: true })
      .click();
  }

  const titles = page.locator(".section-frame__title");
  await expect(titles).toHaveCount(3);
  await titles.nth(0).fill("Row A");
  await titles.nth(1).fill("Row B");
  await titles.nth(2).fill("Row C");

  // Lift row A (via its section's move icon — a lone-section row's move
  // icon lifts the whole row), then place it at the trailing gap (after
  // row C). That gap sits below the fold with three populated Requirements
  // rows, so scroll it into view first.
  await page.getByRole("button", { name: "Move this section" }).first().click();
  const trailingGap = page.locator(".row-gap__button").last();
  await trailingGap.scrollIntoViewIfNeeded();
  await trailingGap.click();

  await expect(titles.nth(0)).toHaveValue("Row B");
  await expect(titles.nth(1)).toHaveValue("Row C");
  await expect(titles.nth(2)).toHaveValue("Row A");
});

test("lifting a row and tapping its move icon again cancels the move", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page.getByRole("button", { name: "Requirements", exact: true }).click();
  await page.getByRole("button", { name: "Add Section" }).last().click();
  await page.getByRole("button", { name: "Requirements", exact: true }).click();

  const titles = page.locator(".section-frame__title");
  await titles.nth(0).fill("Row A");
  await titles.nth(1).fill("Row B");

  const moveButton = page
    .getByRole("button", { name: "Move this section" })
    .first();
  await moveButton.click();
  await expect(moveButton).toHaveAttribute("aria-pressed", "true");
  await moveButton.click();
  await expect(moveButton).toHaveAttribute("aria-pressed", "false");

  await expect(titles.nth(0)).toHaveValue("Row A");
  await expect(titles.nth(1)).toHaveValue("Row B");
});

test("clicking outside the lift/place controls cancels an in-progress lift", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page.getByRole("button", { name: "Requirements", exact: true }).click();
  await page.getByRole("button", { name: "Add Section" }).last().click();
  await page.getByRole("button", { name: "Requirements", exact: true }).click();

  const titles = page.locator(".section-frame__title");
  await titles.nth(0).fill("Row A");
  await titles.nth(1).fill("Row B");

  const moveButton = page
    .getByRole("button", { name: "Move this section" })
    .first();
  await moveButton.click();
  await expect(moveButton).toHaveAttribute("aria-pressed", "true");

  await page.locator(".document-header__title").click();
  await expect(moveButton).toHaveAttribute("aria-pressed", "false");

  await expect(titles.nth(0)).toHaveValue("Row A");
  await expect(titles.nth(1)).toHaveValue("Row B");
});
